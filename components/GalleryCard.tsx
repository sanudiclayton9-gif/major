"use client";

import Link from "next/link";
import { Product } from "@/lib/types";

export default function GalleryCard({ product }: { product: Product }) {
	const outOfStock = product.stock <= 0;

	return (
		<Link
			href={`/products/${product.id}`}
			className="group block rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow bg-white"
		>
			<div className="w-full aspect-[4/3] bg-gray-100 relative">
				{product.images?.[0] && (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={product.images[0]}
						alt={product.name}
						className="w-full h-full object-cover group-hover:scale-105 transition-transform"
						loading="lazy"
					/>
				)}
				{outOfStock && (
					<span className="absolute top-3 right-3 bg-ink/80 text-white text-xs font-semibold px-3 py-1 rounded-full">
						Out of stock
					</span>
				)}
			</div>
			<div className="p-4">
				<h3 className="font-display font-semibold text-lg mb-1">{product.name}</h3>
				<p className="text-ink-soft text-sm line-clamp-2">{product.description}</p>
				<div className="mt-3 flex items-center justify-between">
					<span className="font-display font-semibold text-wine">${product.price.toFixed(0)}</span>
				</div>
			</div>
		</Link>
	);
}
