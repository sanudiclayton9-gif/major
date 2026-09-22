"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { Product } from "@/lib/types";

export default function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [size, setSize] = useState(product.sizes?.[0] ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock <= 0;

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: size || undefined,
      qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  if (outOfStock) {
    return (
      <p className="text-ink-soft font-semibold">This design is currently out of stock.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {product.sizes?.length > 0 && (
        <div>
          <label className="block text-sm font-semibold mb-1">Size</label>
          <div className="flex gap-2 flex-wrap">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-4 py-2 rounded-lg text-sm border ${
                  size === s
                    ? "bg-wine text-white border-wine"
                    : "bg-white/70 border-black/10"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-1">Quantity</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-full bg-white/70 border border-black/10"
          >
            −
          </button>
          <span className="w-6 text-center">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-9 h-9 rounded-full bg-white/70 border border-black/10"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleAdd}
          className="bg-wine text-white font-semibold px-6 py-3 rounded-full"
        >
          {added ? "Added ✓" : "Add to cart"}
        </button>
        <button
          onClick={() => {
            handleAdd();
            router.push("/cart");
          }}
          className="bg-ink text-white font-semibold px-6 py-3 rounded-full"
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
