import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/products";
import AddToCart from "@/components/AddToCart";
import ProductComments from "@/components/ProductComments";
import { BUSINESS_NAME, waLink } from "@/lib/constants";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) return {};
  return {
    title: `${product.name} | ${BUSINESS_NAME}`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images?.[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-black/5">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="font-display font-semibold text-lg">
            {BUSINESS_NAME}
          </Link>
          <Link href="/cart" className="text-sm font-semibold">
            Cart
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10">
        <div className="glass rounded-2xl overflow-hidden aspect-[4/5]">
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold mb-2">{product.name}</h1>
          <p className="font-display text-2xl text-wine font-semibold mb-4">
            ${product.price.toFixed(0)}
          </p>
          <p className="text-ink-soft mb-6">{product.description}</p>

          <AddToCart product={product} />

          <a
            href={waLink(
              `Hi ${BUSINESS_NAME}, I'd like to ask about "${product.name}" ($${product.price}).`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-semibold text-[#25d366]"
          >
            Or ask about it on WhatsApp →
          </a>

          <ProductComments productId={product.id} />
        </div>
      </main>
    </>
  );
}
