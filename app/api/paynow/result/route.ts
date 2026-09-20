import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Paynow } from "paynow";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    console.log("========== PAYNOW CALLBACK ==========");
    console.log(rawBody);
    console.log("=====================================");

    if (!rawBody) {
      return new NextResponse("Empty Paynow response.", {
        status: 400,
      });
    }

    const integrationId = process.env.PAYNOW_ID;
    const integrationKey = process.env.PAYNOW_KEY;
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (
      !integrationId ||
      !integrationKey ||
      !supabaseUrl ||
      !supabaseSecretKey
    ) {
      console.error(
        "Missing Paynow or Supabase configuration."
      );

      return new NextResponse(
        "Server configuration error.",
        { status: 500 }
      );
    }

    const paynow = new Paynow(
      integrationId,
      integrationKey
    );

    // Let Paynow's official Node SDK parse the
    // status-update message.
    const result = paynow.parseStatusUpdate(rawBody);

    console.log("Parsed Paynow result:", {
      reference: result.reference,
      status: result.status,
      paynowreference: result.paynowreference,
      pollurl: result.pollurl,
      error: result.error,
    });

    if (!result.reference) {
      console.error(
        "Paynow callback did not contain a reference."
      );

      return new NextResponse(
        "Missing payment reference.",
        { status: 400 }
      );
    }

    // Verify that the status update genuinely came
    // from Paynow.
    const values = paynow.parseQuery(rawBody);

    if (!paynow.verifyHash(values)) {
      console.error(
        "Paynow callback hash validation failed."
      );

      return new NextResponse(
        "Invalid Paynow callback.",
        { status: 400 }
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

    switch (result.status) {
      case "Paid":
        paymentStatus = "paid";
        break;

      case "Awaiting Delivery":
        paymentStatus = "paid";
        break;

      case "Cancelled":
        paymentStatus = "cancelled";
        break;

      case "Failed":
        paymentStatus = "failed";
        break;

      case "Refunded":
        paymentStatus = "refunded";
        break;

      case "Disputed":
        paymentStatus = "disputed";
        break;

      default:
        paymentStatus = "pending";
    }

    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
      })
      .eq("paynow_reference", result.reference);

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
      `Order ${result.reference} updated to ${paymentStatus}`
    );

    // Paynow does not require a special response body.
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