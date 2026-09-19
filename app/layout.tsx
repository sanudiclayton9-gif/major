import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wear Chimsol | Fashion in Harare",
  description: "Shop Wear Chimsol online. Fashion, easy checkout and WhatsApp support in Harare, Zimbabwe.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://major-five-xi.vercel.app/"),
  openGraph: { title: "Wear Chimsol", description: "Shop Wear Chimsol online.", type: "website" },
  twitter: { card: "summary_large_image", title: "Wear Chimsol", description: "Shop Wear Chimsol online." },
  verification: { google: "" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="text-xl font-black tracking-tight">WEAR <span className="text-violet-600">CHIMSOL</span></Link>
        <nav className="flex items-center gap-5 text-sm font-semibold"><Link href="/">Shop</Link><Link href="/cart">Cart</Link><Link href="/admin">Admin</Link></nav>
      </div>
    </header>
    {children}
    <footer className="mt-20 border-t bg-white"><div className="mx-auto max-w-6xl px-5 py-8 text-sm text-slate-500">
      <strong className="text-slate-900">Wear Chimsol</strong> · No.9 Eston Road, Mabelreign Shopping Centre, Harare · WhatsApp 0775178065
    </div></footer>
  </body></html>;
}