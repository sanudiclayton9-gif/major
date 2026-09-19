import { NextResponse } from "next/server";
import { Paynow } from "paynow";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      amount,
      phone,
      reference,
      description,
      customerName,
      customerEmail,
      items,
    } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Customer phone number is required." },
        { status: 400 }
      );
    }

    if (!customerName) {
      return NextResponse.json(
        { error: "Customer name is required." },
        { status: 400 }
      );
    }

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order items are required." },
        { status: 400 }
      );
    }

    const integrationId = process.env.PAYNOW_ID;
    const integrationKey = process.env.PAYNOW_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!integrationId || !integrationKey) {
      return NextResponse.json(
        { error: "Paynow is not configured." },
        { status: 500 }
      );
    }

    if (!siteUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_SITE_URL is missing." },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseSecretKey) {
      return NextResponse.json(
        { error: "Supabase server configuration is missing." },
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

    // Create the order BEFORE sending the customer to Paynow.
    const { error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: phone,
        items,
        total: Number(amount),
        payment_status: "pending",
        paynow_reference: reference,
      });

    if (orderError) {
      console.error("Order creation error:", orderError);

      return NextResponse.json(
        {
          error:
            "Could not create your order. Please try again.",
        },
        { status: 500 }
      );
    }

    const paynow = new Paynow(
      integrationId,
      integrationKey
    );

    paynow.resultUrl = `${siteUrl}/api/paynow/result`;

    // Keep the SAME Wear Chimsol reference for tracking.
    paynow.returnUrl = `${siteUrl}/track/${reference}`;

    const payment = paynow.createPayment(reference);

    payment.add(
      description || "Wear Chimsol order",
      Number(amount)
    );

    const response = await paynow.send(payment);

    if (!response.success) {
      console.error(
        "Paynow payment creation failed:",
        response.error
      );

      // Mark the order as failed if Paynow could not start.
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
        })
        .eq("paynow_reference", reference);

      return NextResponse.json(
        {
          error:
            response.error ||
            "Paynow could not create the payment.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      redirectUrl: response.redirectUrl,
      pollUrl: response.pollUrl,
      reference,
    });
  } catch (error) {
    console.error("Paynow error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the Paynow payment.",
      },
      { status: 500 }
    );
  }
}