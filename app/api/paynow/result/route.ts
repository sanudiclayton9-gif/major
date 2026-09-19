import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const reference = formData.get("reference")?.toString();
    const status = formData.get("status")?.toString();
    const paynowReference = formData
      .get("paynowreference")
      ?.toString();

    if (!reference) {
      return new NextResponse("Missing payment reference.", {
        status: 400,
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error("Missing Supabase server configuration.");

      return new NextResponse(
        "Server configuration error.",
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseSecretKey
    );

    let paymentStatus = "pending";

    if (status === "Paid") {
      paymentStatus = "paid";
    } else if (status === "Failed") {
      paymentStatus = "failed";
    } else if (status === "Cancelled") {
      paymentStatus = "cancelled";
    }

    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        paynow_reference:
          paynowReference || reference,
      })
      .eq("paynow_reference", reference);

    if (error) {
      console.error("Order update error:", error);

      return new NextResponse(
        "Could not update order.",
        { status: 500 }
      );
    }

    return new NextResponse("OK", {
      status: 200,
    });
  } catch (error) {
    console.error("Paynow result error:", error);

    return NextResponse.json(
      {
        error: "Could not process Paynow result.",
      },
      { status: 500 }
    );
  }
}