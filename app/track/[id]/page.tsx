"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BUSINESS_NAME, waLink } from "@/lib/constants";

const STATUS_TEXT: Record<string, string> = {
  pending: "Waiting for your EcoCash confirmation...",
  paid: "Payment confirmed! We're preparing your order.",
  delivered: "Delivered. Thank you for ordering with us!",
  cancelled: "This payment was cancelled or failed.",
};

export default function TrackPage({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState("pending");
  const [checking, setChecking] = useState(true);
  const attemptsRef = React.useRef(0);
  const maxAttempts = 40;

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/paynow/status?orderId=${params.id}`);
        const data = await res.json();
        if (!active) return;
        if (data.status) setStatus(data.status);
        attemptsRef.current++;

        // continue polling only if the *latest* status is still pending
        if (active && data.status === "pending" && attemptsRef.current < maxAttempts) {
          setTimeout(poll, 4000);
          return;
        }
      } catch {
        // ignore transient errors, keep polling until attempts exhausted
        attemptsRef.current++;
        if (active && attemptsRef.current < maxAttempts) {
          setTimeout(poll, 4000);
          return;
        }
      }

      if (active) setChecking(false);
    }

    // reset attempts when order id changes
    attemptsRef.current = 0;
    poll();
    return () => {
      active = false;
    };
  }, [params.id]);

  // manual check function (also used by UI button)
  async function checkNow() {
    setChecking(true);
    try {
      const res = await fetch(`/api/paynow/status?orderId=${params.id}`);
      const data = await res.json();
      if (data.status) setStatus(data.status);
    } catch {
      // ignore
    }
    setChecking(false);
  }

  return (
    <>
      <header className="border-b border-black/5">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="font-display font-semibold text-lg">
            {BUSINESS_NAME}
          </Link>
        </nav>
      </header>

      <main className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="glass rounded-2xl p-8">
          <p className="text-sm text-ink-soft mb-2">Order #{params.id.slice(0, 8)}</p>
          <h1 className="font-display text-2xl font-semibold mb-4">
            {status === "paid" && "✅ Payment confirmed"}
            {status === "pending" && "⏳ Waiting for confirmation"}
            {status === "cancelled" && "❌ Payment not completed"}
            {status === "delivered" && "📦 Delivered"}
          </h1>
          <p className="text-ink-soft mb-6">{STATUS_TEXT[status] ?? "Checking status..."}</p>

          {status === "pending" && checking && (
            <div>
              <p className="text-sm text-ink-soft">
                Enter your EcoCash PIN on your phone if you haven't already.
                This page updates automatically.
              </p>
              <button
                onClick={() => checkNow()}
                className="mt-3 bg-wine text-white font-semibold px-4 py-2 rounded-full text-sm"
              >
                Check For Payment
              </button>
            </div>
          )}

          {status === "cancelled" && (
            <a
              href={waLink(
                `Hi ${BUSINESS_NAME}, my order #${params.id.slice(0, 8)} payment didn't go through. Can you help?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 bg-[#25d366] text-white font-semibold px-5 py-2 rounded-full text-sm"
            >
              Message us on WhatsApp
            </a>
          )}

          {status === "paid" && (
            <a
              href={waLink(
                `Hi ${BUSINESS_NAME}, I just paid for order #${params.id.slice(0, 8)}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 bg-[#25d366] text-white font-semibold px-5 py-2 rounded-full text-sm"
            >
              Confirm with us on WhatsApp
            </a>
          )}
        </div>
      </main>
    </>
  );
}
