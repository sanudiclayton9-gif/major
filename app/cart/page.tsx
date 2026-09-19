"use client";

import { useEffect, useState } from "react";
import {
  getCart,
  removeFromCart,
  updateCartQuantity,
  getCartTotal,
  type CartItem,
} from "@/lib/cart";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCart(getCart());
  }, []);

  const total = getCartTotal(cart);

  function handleRemove(productId: number, size?: string) {
    setCart(removeFromCart(productId, size));
  }

  function handleQuantityChange(
    productId: number,
    quantity: number,
    size?: string
  ) {
    setCart(
      updateCartQuantity(productId, quantity, size)
    );
  }

  async function handlePaynow() {
    setError("");

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!customerName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    setLoading(true);

    try {
      const reference = "WC-" + Date.now();

      const items = cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        size: item.size || null,
      }));

      const response = await fetch("/api/paynow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: total,
          phone,
          reference,
          description: "Wear Chimsol order",
          customerName,
          customerEmail,
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to start Paynow payment."
        );
      }

      if (!data.redirectUrl) {
        throw new Error(
          "Paynow did not return a payment URL."
        );
      }

      window.location.href = data.redirectUrl;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong.");
      }

      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-16">
      <div className="glass rounded-3xl p-8">
        <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
          Shopping Cart
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Your cart
        </h1>

        {cart.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-slate-100 p-8 text-center">
            <p className="text-lg font-semibold">
              Your cart is empty.
            </p>

            <a
              href="/"
              className="mt-5 inline-block rounded-full bg-slate-950 px-6 py-3 font-bold text-white"
            >
              Continue Shopping
            </a>
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              {cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className="flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        item.product.images?.[0] ||
                        "/placeholder.svg"
                      }
                      alt={item.product.name}
                      className="h-20 w-20 rounded-xl object-cover"
                    />

                    <div>
                      <h2 className="font-bold">
                        {item.product.name}
                      </h2>

                      <p className="text-sm text-slate-500">
                        ${item.product.price.toFixed(2)}
                      </p>

                      {item.size && (
                        <p className="text-sm text-slate-500">
                          Size: {item.size}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityChange(
                          item.product.id,
                          item.quantity - 1,
                          item.size
                        )
                      }
                      className="h-9 w-9 rounded-full border font-bold"
                    >
                      −
                    </button>

                    <span className="min-w-6 text-center font-bold">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityChange(
                          item.product.id,
                          Math.min(
                            item.product.stock,
                            item.quantity + 1
                          ),
                          item.size
                        )
                      }
                      disabled={
                        item.quantity >= item.product.stock
                      }
                      className="h-9 w-9 rounded-full border font-bold disabled:opacity-40"
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemove(
                          item.product.id,
                          item.size
                        )
                      }
                      className="ml-3 text-sm font-semibold text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-slate-100 p-5">
              <div className="flex justify-between text-lg">
                <span>Order total</span>

                <strong>
                  ${total.toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-black">
                Checkout
              </h2>

              <div className="mt-5">
                <label className="text-sm font-bold">
                  Customer name
                </label>

                <input
                  type="text"
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none"
                  placeholder="Your name"
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-bold">
                  Customer email
                </label>

                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) =>
                    setCustomerEmail(e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-bold">
                  Customer phone
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none"
                  placeholder="077..."
                />
              </div>

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                onClick={handlePaynow}
                disabled={loading}
                className="mt-6 w-full rounded-full bg-slate-950 px-6 py-3 font-bold text-white disabled:opacity-50"
              >
                {loading
                  ? "Connecting to Paynow..."
                  : `Proceed to Paynow — $${total.toFixed(2)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}