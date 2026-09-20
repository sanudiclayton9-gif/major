import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function parsePaynowBody(body: string) {
  const params = new URLSearchParams(body);

  return {
    reference: params.get("reference"),
    amount: params.get("amount"),
    paynowreference: params.get("paynowreference"),
    pollurl: params.get("pollurl"),
    status: params.get("status"),
    hash: params.get("hash"),
  };
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    console.log("========== PAYNOW CALLBACK ==========");
    console.log("Content-Type:", request.headers.get("content-type"));
    console.log("Raw body:", rawBody);
    console.log("=====================================");

    if (!rawBody) {
      return new NextResponse(
        "Empty Paynow response.",
        { status: 400 }
      );
    }

    const result = parsePaynowBody(rawBody);

    console.log("Parsed Paynow result:", {
      reference: result.reference,
      amount: result.amount,
      paynowreference: result.paynowreference,
      status: result.status,
      pollurl: result.pollurl,
      hasHash: Boolean(result.hash),
    });

    if (!result.reference) {
      console.error(
        "Paynow callback is missing reference."
      );

      return new NextResponse(
        "Missing payment reference.",
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error(
        "Missing Supabase server configuration."
      );

      return new NextResponse(
        "Server configuration error.",
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    let paymentStatus = "pending";

    if (result.status === "Paid") {
      paymentStatus = "paid";
    } else if (result.status === "Failed") {
      paymentStatus = "failed";
    } else if (result.status === "Cancelled") {
      paymentStatus = "cancelled";
    } else if (result.status === "Refunded") {
      paymentStatus = "refunded";
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
      })
      .eq("paynow_reference", result.reference)
      .select(
        "id, paynow_reference, payment_status"
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Supabase order update error:",
        error
      );

      return new NextResponse(
        "Could not update order.",
        { status: 500 }
      );
    }

    console.log(
      "Order successfully updated:",
      data
    );

    return new NextResponse("OK", {
      status: 200,
    });
  } catch (error) {
    console.error(
      "========== PAYNOW RESULT ERROR =========="
    );
    console.error(error);
    console.error(
      error instanceof Error
        ? error.stack
        : "Unknown error"
    );
    console.error(
      "=========================================="
    );

    return new NextResponse(
      "Could not process Paynow result.",
      { status: 500 }
    );
  }
}