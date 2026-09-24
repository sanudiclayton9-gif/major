import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, price, stock, sizes, images, description, category } = body;

  if (!name || !price || !images?.length) {
    return NextResponse.json(
      { error: "name, price, and at least one image are required" },
      { status: 400 }
    );
  }

  // Try inserting with `category` first. If the DB/schema doesn't have the
  // column yet (common during migrations), retry without it so admin can still
  // add products.
  const insertWithCategory = {
    name,
    price,
    stock: stock ?? 0,
    sizes: sizes ?? [],
    images,
    description: description ?? "",
    category: category ?? null,
  } as any;

  const res = await supabaseAdmin.from("products").insert(insertWithCategory).select().single();
  if (!res.error) return NextResponse.json(res.data);

  const errMsg = (res.error?.message || "").toLowerCase();
  if (errMsg.includes("category") || errMsg.includes("could not find") || errMsg.includes('column "category"')) {
    const insertNoCategory = {
      name,
      price,
      stock: stock ?? 0,
      sizes: sizes ?? [],
      images,
      description: description ?? "",
    } as any;

    const r2 = await supabaseAdmin.from("products").insert(insertNoCategory).select().single();
    if (r2.error) return NextResponse.json({ error: r2.error.message }, { status: 500 });
    return NextResponse.json(r2.data);
  }

  return NextResponse.json({ error: res.error.message }, { status: 500 });
}
