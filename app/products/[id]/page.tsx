import { getProducts } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { notFound } from "next/navigation";
import AddToCartButton from "./AddToCartButton";

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const products = await getProducts();

  const p = products.find(
    (x) => x.id === Number(params.id)
  );

  if (!p) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.images,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: p.price,
      availability:
        p.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2">
      <div className="rounded-3xl bg-slate-100 p-4">
        <img
          src={p.images?.[0] || "/placeholder.svg"}
          alt={p.name}
          className="aspect-square w-full rounded-2xl object-cover"
        />
      </div>

      <div className="py-6">
        <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
          Wear Chimsol
        </p>

        <h1 className="mt-2 text-4xl font-black">
          {p.name}
        </h1>

        <p className="mt-4 text-2xl font-black">
          {formatPrice(p.price)}
        </p>

        <p className="mt-5 leading-7 text-slate-600">
          {p.description}
        </p>

        <p className="mt-5 font-semibold">
          {p.stock > 0
            ? `${p.stock} in stock`
            : "Out of stock"}
        </p>

        <AddToCartButton product={p} />

        <div className="mt-6">
          <a
            href={`https://wa.me/263775178065?text=${encodeURIComponent(
              `Hi Wear Chimsol, I'm interested in ${p.name}.`
            )}`}
            className="rounded-full border border-slate-300 px-6 py-3 font-bold"
          >
            WhatsApp
          </a>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
    </main>
  );
}