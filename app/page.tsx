import Link from "next/link";
import { getProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import ReviewForm from "@/components/ReviewForm";
import { ADDRESS, BUSINESS_NAME, waLink } from "@/lib/constants";

export const revalidate = 0;

export default async function Home() {
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    products = await getProducts();
  } catch {
    products = [];
  }

  return (
    <>
      <header className="border-b border-black/5">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt={BUSINESS_NAME} className="h-11" />
          <div className="flex items-center gap-4">
            <Link href="/cart" className="text-sm font-semibold text-ink hover:text-wine">
              Cart
            </Link>
            <a
              href={waLink("Hi Wear Chimsol, I'd like to consult about a design.")}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25d366] text-white text-sm font-semibold px-4 py-2 rounded-full"
            >
              Chat on WhatsApp
            </a>
          </div>
        </nav>
      </header>

      <main>
        <section className="aurora-hero bg-grid py-24 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-wine font-semibold text-sm tracking-wide mb-4">
              — Tailored to you —
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-semibold mb-5">
              Made-to-order designs, cut for your shape.
            </h1>
            <p className="text-ink-soft text-lg mb-8">
              {BUSINESS_NAME} designs and sews custom pieces at{" "}
              {ADDRESS.line2}, {ADDRESS.line1}, {ADDRESS.city}. Browse below,
              order online, and pay instantly via EcoCash.
            </p>
            <a
              href="#designs"
              className="inline-block bg-wine text-white font-semibold px-8 py-3 rounded-full"
            >
              View designs
            </a>
          </div>
        </section>

        <section id="designs" className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-semibold mb-2">
              Our designs
            </h2>
            <p className="text-ink-soft">Order directly online, or ask our assistant a question first.</p>
          </div>

          {products.length === 0 ? (
            <p className="text-center text-ink-soft py-16">
              No designs yet — check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((p) => (
                <ProductCard product={p} key={p.id} />
              ))}
            </div>
          )}
        </section>

        <section className="text-center py-16 px-6 border-t border-black/5">
          <div className="max-w-xl mx-auto">
            <p className="text-wine font-semibold text-sm mb-3">— — — —</p>
            <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">
              Your style deserves a perfect fit.
            </h2>
            <p className="text-ink-soft">
              Off-the-rack was never made for everyone. When you work with us,
              you're getting a piece built around you — from the fabric to
              the final stitch.
            </p>
          </div>
        </section>

        <section className="py-16 px-6 border-t border-black/5">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-semibold mb-2">
              Tell us what you think
            </h2>
            <p className="text-ink-soft">Your feedback goes straight to us.</p>
          </div>
          <ReviewForm />
        </section>
      </main>

      <footer className="border-t border-black/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-2 text-sm text-ink-soft">
          <span>© {new Date().getFullYear()} {BUSINESS_NAME}</span>
          <span>{ADDRESS.line2}, {ADDRESS.line1}, {ADDRESS.city}, {ADDRESS.country}</span>
        </div>
      </footer>
    </>
  );
}
