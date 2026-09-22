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

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  // 1. Create the order first, status pending.
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      items,
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

  const payment = paynow.createPayment(order.id, `${originalPhone}@wearchimsol.co.zw`);
  for (const item of items) {
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
      items: items.map((i: any) => ({ name: i.name, qty: i.qty, price: i.price })),
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
      paynow.sendMobile(payment, customerPhone, "ecocash")
    );

    if (!response) {
      console.error("[paynow] sendMobile returned no response", {
        orderId: order.id,
        customerPhone,
      });
      await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      return NextResponse.json(
        {
          error:
            "We couldn't start the payment. Please try again in a moment, or contact us on WhatsApp.",
        },
        { status: 502 }
      );
    }

    if (!response.success) {
      console.error("[paynow] sendMobile rejected", { orderId: order.id, error: response.error });
      await supabaseAdmin
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.id);
      return NextResponse.json(
        { error: response.error || "Payment could not be started" },
        { status: 502 }
      );
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
    await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id);
    return NextResponse.json(
      {
        error:
          "We couldn't reach Paynow. Please try again in a moment, or contact us on WhatsApp.",
      },
      { status: 502 }
    );
  }
}
