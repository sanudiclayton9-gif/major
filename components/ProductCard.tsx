import Link from "next/link";
import { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="glass rounded-2xl overflow-hidden flex flex-col hover:shadow-xl transition-shadow"
    >
      <div className="aspect-[4/5] bg-white/40 relative">
        {product.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        {outOfStock && (
          <span className="absolute top-3 right-3 bg-ink/80 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Out of stock
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1">
        <h3 className="font-display font-semibold text-lg">{product.name}</h3>
        <p className="text-ink-soft text-sm line-clamp-2">{product.description}</p>
        <span className="font-display font-semibold text-wine mt-1">
          ${product.price.toFixed(0)}
        </span>
      </div>
    </Link>
  );
}
