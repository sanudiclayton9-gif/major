import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { callPaynow, getPaynow } from "@/lib/paynow";
import { OrderItem } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    items,
    customerPhone,
    customerName,
    measurements,
  }: {
    items: OrderItem[];
    customerPhone: string;
    customerName?: string;
    measurements?: string;
  } = body;

  if (!items?.length || !customerPhone) {
    return NextResponse.json(
      { error: "items and customerPhone are required" },
      { status: 400 }
    );
  }

  // 0. Re-price everything server-side. The client-supplied prices are never
  // trusted: we look every requested product up in the database and rebuild the
  // line items and total from the stored price, so a tampered payload cannot
  // create an order (or a Paynow payment) for an arbitrary amount.
  const requestedIds = [...new Set(items.map((i) => i.productId))];
  const { data: productRows, error: productsError } = await supabaseAdmin
    .from("products")
    .select("id,name,price")
    .in("id", requestedIds);

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }

  const priceById = new Map(
    (productRows ?? []).map((p: { id: string; price: number }) => [p.id, p.price])
  );
  const nameById = new Map(
    (productRows ?? []).map((p: { id: string; name: string }) => [p.id, p.name])
  );

  if (priceById.size !== requestedIds.length) {
    return NextResponse.json(
      { error: "One or more products in your cart are no longer available." },
      { status: 400 }
    );
  }

  const pricedItems: OrderItem[] = [];
  for (const item of items) {
    const price = priceById.get(item.productId);
    if (typeof price !== "number") {
      return NextResponse.json(
        { error: "One or more products in your cart are no longer available." },
        { status: 400 }
      );
    }
    pricedItems.push({
      productId: item.productId,
      name: nameById.get(item.productId) ?? item.name,
      price,
      size: item.size,
      qty: item.qty,
    });
  }

  const total = pricedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  if (total <= 0) {
    return NextResponse.json({ error: "Order total must be greater than zero" }, { status: 400 });
  }

  // 1. Create the order first, status pending.
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      items: pricedItems,
      total,
      status: "pending",
      customer_phone: customerPhone,
      customer_name: customerName ?? null,
      measurements: measurements ?? null,
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message ?? "Could not create order" },
      { status: 500 }
    );
  }

  // 2. Build the Paynow payment using the order id as the reference.
  let paynow: ReturnType<typeof getPaynow>;
  try {
    paynow = getPaynow(order.id);
  } catch (e: any) {
    await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
  // Normalize the phone to an international format Paynow expects. Strip
  // non-digits, convert leading 0 to 263 (Zimbabwe country code) where
  // appropriate. We keep the original for logging.
  const originalPhone = customerPhone;
  let normalizedPhone = String(customerPhone || "").replace(/[^0-9+]/g, "");
  if (normalizedPhone.startsWith("+")) normalizedPhone = normalizedPhone.slice(1);
  if (normalizedPhone.startsWith("0")) {
    // 0xxxx -> 263xxxx
    normalizedPhone = `263${normalizedPhone.slice(1)}`;
  }

  // Cancel the order and return a user-facing 502. Used by every payment
  // failure path so the order is never left dangling as "pending".
  const failOrder = async (message: string) => {
    await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    return NextResponse.json({ error: message }, { status: 502 });
  };

  const payment = paynow.createPayment(order.id, `${normalizedPhone}@wearchimsol.co.zw`);
  for (const item of pricedItems) {
    payment.add(`${item.name}${item.size ? ` (${item.size})` : ""}`, item.price * item.qty);
  }

  // Log helpful, non-secret diagnostics for troubleshooting signature/hash
  // problems. Do NOT log the integration key itself.
  try {
    // eslint-disable-next-line no-console
    console.log('[paynow] preparing payment', {
      orderId: order.id,
      customerPhone: originalPhone,
      normalizedPhone,
      items: pricedItems.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      total,
      resultUrl: paynow.resultUrl,
      returnUrl: paynow.returnUrl,
    });
  } catch (e) {
    // ignore logging errors
  }

  try {
    // callPaynow surfaces the error the SDK would otherwise swallow and turn
    // into `undefined`, so we can log and report the real reason.
    const response = await callPaynow("sendMobile", () =>
      paynow.sendMobile(payment, normalizedPhone, "ecocash")
    );

    if (!response) {
      console.error("[paynow] sendMobile returned no response", {
        orderId: order.id,
        customerPhone: originalPhone,
      });
      return await failOrder(
        "We couldn't start the payment. Please try again in a moment, or contact us on WhatsApp."
      );
    }

    if (!response.success) {
      console.error("[paynow] sendMobile rejected", { orderId: order.id, error: response.error });
      return await failOrder(response.error || "Payment could not be started");
    }

    await supabaseAdmin
      .from("orders")
      .update({ paynow_poll_url: response.pollUrl })
      .eq("id", order.id);

    return NextResponse.json({
      orderId: order.id,
      instructions: response.instructions,
    });
  } catch (e: any) {
    // The real reason (DNS failure, timeout, HTTP 4xx/5xx, "Hashes do not
    // match!") is in this message now that callPaynow surfaces it.
    console.error("[paynow] sendMobile threw", { orderId: order.id, error: e?.message ?? e });
    return await failOrder(
      "We couldn't reach Paynow. Please try again in a moment, or contact us on WhatsApp."
    );
  }
}
