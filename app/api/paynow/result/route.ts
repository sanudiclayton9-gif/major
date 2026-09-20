import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const reference = formData.get("reference")?.toString();
    const status = formData.get("status")?.toString();
    const paynowReference = formData
      .get("paynowreference")
      ?.toString();

    console.log("========== PAYNOW CALLBACK ==========");
    console.log({
      reference,
      status,
      paynowReference,
    });
    console.log("=====================================");

    if (!reference) {
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

    if (status === "Paid") {
      paymentStatus = "paid";
    } else if (status === "Failed") {
      paymentStatus = "failed";
    } else if (status === "Cancelled") {
      paymentStatus = "cancelled";
    } else if (status === "Refunded") {
      paymentStatus = "refunded";
    }

    const { data: updatedOrder, error } =
      await supabase
        .from("orders")
        .update({
          payment_status: paymentStatus,
        })
        .eq("paynow_reference", reference)
        .select("id, paynow_reference, payment_status")
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
      "Updated order:",
      updatedOrder
    );

    return new NextResponse("OK", {
      status: 200,
    });
  } catch (error) {
    console.error(
      "Paynow result error:",
      error
    );

    return new NextResponse(
      "Could not process Paynow result.",
      { status: 500 }
    );
  }
}