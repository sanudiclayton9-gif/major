import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPaynow } from "@/lib/paynow";
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

  const payment = paynow.createPayment(order.id, `${customerPhone}@wearchimsol.co.zw`);
  for (const item of items) {
    payment.add(`${item.name}${item.size ? ` (${item.size})` : ""}`, item.price * item.qty);
  }

  try {
    const response = await paynow.sendMobile(payment, customerPhone, "ecocash");

    // The SDK normalises failures into response.success / response.error. A falsy
    // response means the SDK itself could not process the request at all.
    if (!response) {
      console.error("[paynow] empty response from sendMobile", { orderId: order.id, customerPhone });
      await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      return NextResponse.json(
        { error: "Could not reach Paynow. Please try again in a moment." },
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
    await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
