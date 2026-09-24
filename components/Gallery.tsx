"use client";

import { useMemo, useState } from "react";
import GalleryCard from "@/components/GalleryCard";
import { Product } from "@/lib/types";

const CATEGORIES = ["Menswear", "Traditional attire", "Corporate suits", "Evening dress"];

function categorize(p: Product) {
  const name = (p.name || "").toLowerCase();
  // prefer explicit category if provided
  if (p.category) return p.category;
  if (name.includes("suit") || name.includes("corporate")) return "Corporate suits";
  if (name.includes("evening") || name.includes("gown") || name.includes("dress")) return "Evening dress";
  if (name.includes("traditional") || name.includes("chitenge") || name.includes("shweshwe")) return "Traditional attire";
  return "Menswear";
}

export default function Gallery({ products }: { products: Product[] }) {
  const [tab, setTab] = useState(CATEGORIES[0]);

  const grouped = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const c of CATEGORIES) map[c] = [];
    for (const p of products) {
      const cat = categorize(p);
      map[cat] = map[cat] || [];
      map[cat].push(p);
    }
    return map;
  }, [products]);

  return (
    <div>
      <div className="flex justify-center gap-2 mb-6">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setTab(c)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${tab === c ? "bg-wine text-white" : "bg-white/70 border border-black/10"}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {grouped[tab].length === 0 ? (
          <p className="text-center text-ink-soft py-10">No designs in this category yet.</p>
        ) : (
          grouped[tab].map((p) => <GalleryCard key={p.id} product={p} />)
        )}
      </div>
    </div>
  );
}
