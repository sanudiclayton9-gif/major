"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export default function AddToCartButton({
  product,
}: {
  product: Product;
}) {
  const [size, setSize] = useState(product.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addToCart(product, quantity, size);
    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  }

  return (
    <div className="mt-8">
      {product.sizes?.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-bold">
            Select size
          </p>

          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  size === s
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() =>
            setQuantity((q) => Math.max(1, q - 1))
          }
          className="h-10 w-10 rounded-full border font-bold"
        >
          −
        </button>

        <span className="min-w-8 text-center font-bold">
          {quantity}
        </span>

        <button
          type="button"
          onClick={() =>
            setQuantity((q) =>
              Math.min(product.stock, q + 1)
            )
          }
          disabled={quantity >= product.stock}
          className="h-10 w-10 rounded-full border font-bold disabled:opacity-40"
        >
          +
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className="rounded-full bg-slate-950 px-6 py-3 font-bold text-white disabled:opacity-50"
        >
          {added ? "✓ Added to cart" : "Add to Cart"}
        </button>

        <a
          href="/cart"
          className="rounded-full border border-slate-300 px-6 py-3 font-bold"
        >
          View Cart
        </a>
      </div>
    </div>
  );
}