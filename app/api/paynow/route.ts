import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Paynow } from "paynow";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const reference = formData.get("reference")?.toString();
    const status = formData.get("status")?.toString();
    const paynowReference = formData
      .get("paynowreference")
      ?.toString();
    const pollUrl = formData.get("pollurl")?.toString();

    console.log("========== PAYNOW CALLBACK ==========");
    console.log({
      reference,
      status,
      paynowReference,
      pollUrl,
    });
    console.log("=====================================");

    if (!reference) {
      console.error("Paynow callback missing reference.");

      return new NextResponse(
        "Missing payment reference.",
        { status: 400 }
      );
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

    /*
     * Paynow recommends validating the hash on every
     * status update. We first read all fields from the
     * callback and verify that the message is genuine.
     */
    const callbackData: Record<string, string> = {};

    formData.forEach((value, key) => {
      callbackData[key] = value.toString();
    });

    const paynow = new Paynow(
      integrationId,
      integrationKey
    );

    try {
      const validHash = paynow.verifyHash(
        callbackData
      );

      if (!validHash) {
        console.error(
          "Paynow callback hash validation failed."
        );

        return new NextResponse(
          "Invalid Paynow callback.",
          { status: 400 }
        );
      }
    } catch (hashError) {
      console.error(
        "Paynow callback hash verification error:",
        hashError
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

    switch (status) {
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
      .eq("paynow_reference", reference);

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
      `Order ${reference} updated to ${paymentStatus}`
    );

    return new NextResponse("OK", {
      status: 200,
    });
  } catch (error) {
    console.error(
      "Paynow result error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not process Paynow result.",
      },
      { status: 500 }
    );
  }
}