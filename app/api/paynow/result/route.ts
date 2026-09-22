import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { callPaynow, getPaynow } from "@/lib/paynow";

// Paynow calls this URL directly (server-to-server) once a payment resolves.
// Rather than trust the incoming form fields (which would require manually
// re-implementing Paynow's hash verification), we take the order reference
// from the payload and re-poll Paynow's API ourselves using our integration
// key - that round trip is what actually proves the payment status, since
// it's authenticated against Paynow's servers, not the incoming request.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const reference = form.get("reference")?.toString();

  if (!reference) {
    return new NextResponse("Missing reference", { status: 400 });
  }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", reference)
    .single();

  if (!order || !order.paynow_poll_url) {
    return new NextResponse("OK", { status: 200 });
  }

  if (order.status !== "pending") {
    return new NextResponse("OK", { status: 200 });
  }

  let pollResult;
  try {
    const paynow = getPaynow();
    pollResult = await callPaynow("pollTransaction (webhook)", () =>
      paynow.pollTransaction(order.paynow_poll_url)
    );
  } catch (e: any) {
    console.error("[paynow] webhook poll failed", { orderId: order.id, error: e?.message ?? e });
    // Return 200 so Paynow doesn't retry-storm us; the order stays pending.
    return new NextResponse("OK", { status: 200 });
  }

  if (pollResult.paid()) {
    await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", order.id);
  } else if (pollResult.status === "cancelled" || pollResult.status === "failed") {
    await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
  }

  return new NextResponse("OK", { status: 200 });
}
