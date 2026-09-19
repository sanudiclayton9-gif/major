import { supabase } from "./supabase";
import type { Product } from "./types";

export const demoProducts: Product[] = [
  {
    id: 1,
    name: "Classic Black Tee",
    price: 18,
    stock: 12,
    sizes: ["S", "M", "L", "XL"],
    images: ["/placeholder.svg"],
    description: "A clean everyday essential from Wear Chimsol.",
  },
  {
    id: 2,
    name: "Streetwear Hoodie",
    price: 35,
    stock: 7,
    sizes: ["M", "L", "XL"],
    images: ["/placeholder.svg"],
    description: "Comfortable heavyweight hoodie for a relaxed fit.",
  },
  {
    id: 3,
    name: "Everyday Cargo",
    price: 32,
    stock: 5,
    sizes: ["30", "32", "34", "36"],
    images: ["/placeholder.svg"],
    description: "Versatile cargo trousers built for everyday wear.",
  },
];

export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data?.length) {
      return demoProducts;
    }

    return data as Product[];
  } catch {
    return demoProducts;
  }
}