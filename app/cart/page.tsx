"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { BUSINESS_NAME } from "@/lib/constants";

export default function CartPage() {
  const { items, removeItem, total, clear } = useCart();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [measurements, setMeasurements] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [instructions, setInstructions] = useState("");

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone.trim()) {
      setError("Enter the EcoCash number to charge.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/paynow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerPhone: phone.trim(),
          customerName: name.trim() || undefined,
          measurements: measurements.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong starting the payment.");
        setSubmitting(false);
        return;
      }
      setInstructions(data.instructions || "Check your phone to confirm the EcoCash payment.");
      clear();
      setTimeout(() => router.push(`/track/${data.orderId}`), 2500);
    } catch {
      setError("Could not reach the server. Try again.");
      setSubmitting(false);
    }
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

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display text-2xl font-semibold mb-6">Your cart</h1>

        {instructions ? (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="font-semibold mb-2">Almost done!</p>
            <p className="text-ink-soft">{instructions}</p>
            <p className="text-ink-soft text-sm mt-3">Taking you to your order status...</p>
          </div>
        ) : items.length === 0 ? (
          <p className="text-ink-soft">
            Your cart is empty. <Link href="/" className="text-wine font-semibold">Browse designs →</Link>
          </p>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {items.map((item, i) => (
                <div key={i} className="glass rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-ink-soft">
                      {item.size ? `${item.size} · ` : ""}Qty {item.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-semibold">
                      ${(item.price * item.qty).toFixed(0)}
                    </span>
                    <button
                      onClick={() => removeItem(i)}
                      className="text-ink-soft text-sm"
                      aria-label={`Remove ${item.name}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-display text-xl font-semibold border-t border-black/10 pt-4 mb-6">
              <span>Total</span>
              <span>${total.toFixed(0)}</span>
            </div>

            <form onSubmit={handleCheckout} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  EcoCash number to charge
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full rounded-lg px-3 py-2 bg-white/70 border border-black/10"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Your name (optional)</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 bg-white/70 border border-black/10"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Measurements (optional)
                </label>
                <textarea
                  value={measurements}
                  onChange={(e) => setMeasurements(e.target.value)}
                  placeholder="e.g. Bust 34in, Waist 28in, Hips 38in"
                  className="w-full rounded-lg px-3 py-2 bg-white/70 border border-black/10"
                />
              </div>

              {error && <p className="text-wine text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-wine text-white font-semibold py-3 rounded-full"
              >
                {submitting ? "Starting payment..." : `Pay $${total.toFixed(0)} with EcoCash`}
              </button>
            </form>
          </>
        )}
      </main>
    </>
  );
}
