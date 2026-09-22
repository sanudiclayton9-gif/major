import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wear-chimsol.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { id: string; created_at: string }[] = [];
  try {
    products = await getProducts();
  } catch {
    products = [];
  }

  return [
    { url: SITE_URL, lastModified: new Date() },
    ...products.map((p) => ({
      url: `${SITE_URL}/products/${p.id}`,
      lastModified: new Date(p.created_at),
    })),
  ];
}
