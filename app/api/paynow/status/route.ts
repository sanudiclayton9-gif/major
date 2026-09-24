import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { callPaynow, getPaynow } from "@/lib/paynow";
import { OrderItem } from "@/lib/types";

/**
 * The shapes Paynow's SDKs have returned across versions: older ones expose a
 * `paid()` method, newer ones a plain `paid` boolean, and some attach a
 * `status` string.
 */
type PollResult = {
  paid?: boolean | (() => boolean);
  status?: string;
};

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

  let pollResult: PollResult | undefined;
  try {
    const paynow = getPaynow();
    pollResult = (await callPaynow("pollTransaction", () =>
      paynow.pollTransaction(order.paynow_poll_url)
    )) as PollResult;
  } catch (e: any) {
    // Transient Paynow/credential problem - leave the order pending so the
    // customer's next poll (or the Paynow webhook) can resolve it.
    console.error("[paynow] status poll failed", { orderId, error: e?.message ?? e });
    return NextResponse.json({ status: "pending" });
  }

  // Support multiple SDK return shapes: older SDKs return an object with
  // a `.paid()` method; newer ones may return a plain object with a
  // `paid` boolean or `status` string. Handle both safely.
  const paid =
    typeof pollResult?.paid === "function"
      ? pollResult.paid() === true
      : pollResult?.paid === true || pollResult?.status === "paid";
  const statusStr = typeof pollResult?.status === "string" ? pollResult.status : undefined;

  if (paid) {
    // Guard the paid transition: only the request that actually flips the order
    // from 'pending' to 'paid' may decrement stock. A concurrent or repeated
    // poll matches zero rows here and skips the decrement, so stock is never
    // reduced twice for the same order.
    const { data: transitioned, error: transitionError } = await supabaseAdmin
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId)
      .eq("status", "pending")
      .select("id");

    if (transitionError) {
      console.error("[paynow] could not mark order paid", { orderId, error: transitionError.message });
      return NextResponse.json({ status: "pending" });
    }

    const wonRace = Array.isArray(transitioned) && transitioned.length > 0;
    if (!wonRace) {
      // Someone else already resolved this order; report the real status.
      return NextResponse.json({ status: "paid" });
    }

    // Best-effort stock decrement - doesn't block the response if it fails.
    for (const item of order.items as OrderItem[]) {
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

  if (statusStr === "cancelled" || statusStr === "failed") {
    await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    return NextResponse.json({ status: "cancelled" });
  }

  return NextResponse.json({ status: "pending" });
}
