import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPaynow } from "@/lib/paynow";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Already resolved - no need to poll Paynow again.
  if (order.status !== "pending") {
    return NextResponse.json({ status: order.status });
  }

  if (!order.paynow_poll_url) {
    return NextResponse.json({ status: order.status });
  }

  const paynow = getPaynow();
  const pollResult = await paynow.pollTransaction(order.paynow_poll_url);

  if (pollResult.paid()) {
    await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", orderId);

    // Best-effort stock decrement - doesn't block the response if it fails.
    for (const item of order.items as any[]) {
      const { data: product } = await supabaseAdmin
        .from("products")
        .select("stock")
        .eq("id", item.productId)
        .single();
      if (product) {
        await supabaseAdmin
          .from("products")
          .update({ stock: Math.max(0, product.stock - item.qty) })
          .eq("id", item.productId);
      }
    }

    return NextResponse.json({ status: "paid" });
  }

  if (pollResult.status === "cancelled" || pollResult.status === "failed") {
    await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    return NextResponse.json({ status: "cancelled" });
  }

  return NextResponse.json({ status: "pending" });
}
