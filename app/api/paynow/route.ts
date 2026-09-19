import { NextResponse } from "next/server";
import { Paynow } from "paynow";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { amount, phone, reference, description } = body;

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

    const integrationId = process.env.PAYNOW_ID;
    const integrationKey = process.env.PAYNOW_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!integrationId || !integrationKey) {
      return NextResponse.json(
        {
          error:
            "Paynow is not configured yet. Add PAYNOW_ID and PAYNOW_KEY to .env.local.",
        },
        { status: 500 }
      );
    }

    if (!siteUrl) {
      return NextResponse.json(
        {
          error:
            "NEXT_PUBLIC_SITE_URL is missing from .env.local.",
        },
        { status: 500 }
      );
    }

    const paynow = new Paynow(
      integrationId,
      integrationKey
    );

    paynow.resultUrl = `${siteUrl}/api/paynow/result`;

    paynow.returnUrl = `${siteUrl}/track/${reference}`;

    const payment = paynow.createPayment(
      reference || `WC-${Date.now()}`
    );

    payment.add(
      description || "Wear Chimsol order",
      Number(amount)
    );

    const response = await paynow.send(payment);

    if (!response.success) {
      return NextResponse.json(
        {
          error: response.error || "Paynow could not create the payment.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      redirectUrl: response.redirectUrl,
      pollUrl: response.pollUrl,
      reference,
      phone,
    });
  } catch (error) {
    console.error("Paynow error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while creating the Paynow payment.",
      },
      { status: 500 }
    );
  }
}