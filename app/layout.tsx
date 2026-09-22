import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import ChatBubble from "@/components/ChatBubble";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-work-sans",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wear-chimsol.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Wear Chimsol | Tailor in Mabelreign, Harare — Custom Tailoring & Made-to-Order Designs",
  description:
    "Wear Chimsol is a tailor based at Mabelreign Shopping Centre, No.9 Eston Road, Harare, Zimbabwe. Browse our designs, order online, and pay instantly via EcoCash.",
  keywords: [
    "tailor in Harare",
    "tailor in Mabelreign",
    "tailor Zimbabwe",
    "custom tailoring Harare",
    "made to order clothing Zimbabwe",
    "dressmaker Mabelreign",
    "Wear Chimsol",
  ],
  applicationName: "Wear Chimsol",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    title: "Wear Chimsol | Tailor in Mabelreign, Harare",
    description:
      "Custom tailoring and made-to-order designs. Order online, pay via EcoCash, or consult on WhatsApp.",
    url: SITE_URL,
    siteName: "Wear Chimsol",
    type: "website",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wear Chimsol | Tailor in Mabelreign, Harare",
    description: "Custom tailoring and made-to-order designs, made in Harare.",
    images: ["/og-image.jpg"],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: "Wear Chimsol",
    image: `${SITE_URL}/logo.svg`,
    telephone: "+263775178065",
    address: {
      "@type": "PostalAddress",
      streetAddress: "No.9 Eston Road, Mabelreign Shopping Centre",
      addressLocality: "Harare",
      addressCountry: "ZW",
    },
    url: SITE_URL,
    priceRange: "$$",
    description:
      "Custom tailoring and made-to-order clothing designs in Mabelreign, Harare, Zimbabwe.",
  };

  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${workSans.variable} font-body`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CartProvider>
          {children}
          <ChatBubble />
          <WhatsAppFloat />
        </CartProvider>
      </body>
    </html>
  );
}
