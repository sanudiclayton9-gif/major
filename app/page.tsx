import Link from "next/link";
import { getProducts } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import ChatBubble from "@/components/ChatBubble";

export default async function Home() {
  const products = await getProducts();
  return <main className="grid-bg min-h-screen">
    <section className="relative overflow-hidden px-5 py-24">
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-purple-200/70 blur-[120px]" />
      <div className="absolute right-0 top-10 h-96 w-96 rounded-full bg-blue-200/60 blur-[120px]" />
      <div className="relative mx-auto max-w-6xl">
        <p className="mb-4 text-sm font-bold uppercase tracking-[.25em] text-violet-600">Harare fashion</p>
        <h1 className="max-w-3xl text-5xl font-black tracking-tight sm:text-7xl">Wear what feels like <span className="text-violet-600">you.</span></h1>
        <p className="mt-6 max-w-xl text-lg text-slate-600">Discover pieces from Wear Chimsol and order directly online, with WhatsApp support when you need it.</p>
        <a href="#shop" className="mt-8 inline-flex rounded-full bg-slate-950 px-6 py-3 font-bold text-white">Shop collection</a>
      </div>
    </section>
    <section id="shop" className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8 flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-widest text-violet-600">Collection</p><h2 className="text-3xl font-black">Latest pieces</h2></div></div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map(p => <Link key={p.id} href={`/products/${p.id}`} className="glass group rounded-3xl p-4 transition hover:-translate-y-1">
          <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100"><img src={p.images?.[0] || "/placeholder.svg"} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" /></div>
          <div className="p-3"><h3 className="mt-2 text-lg font-bold">{p.name}</h3><p className="mt-1 text-slate-500">{p.description}</p><p className="mt-4 font-black">{formatPrice(p.price)}</p></div>
        </Link>)}
      </div>
    </section>
    <ChatBubble />
  </main>;
}