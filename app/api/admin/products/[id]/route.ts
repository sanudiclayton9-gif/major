import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Product } from "@/lib/types";

/**
 * Validate and narrow an untrusted request body down to the writable Product
 * columns. Anything not listed here (id, created_at, or unknown keys) is
 * dropped, so a caller cannot overwrite columns it does not own.
 */
function parseProductUpdate(
  body: unknown
): { ok: true; value: Partial<Omit<Product, "id" | "created_at">> } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const raw = body as Record<string, unknown>;
  const value: Partial<Omit<Product, "id" | "created_at">> = {};

  if (raw.name !== undefined) {
    if (typeof raw.name !== "string" || !raw.name.trim()) {
      return { ok: false, error: "name must be a non-empty string" };
    }
    value.name = raw.name.trim();
  }

  if (raw.price !== undefined) {
    if (typeof raw.price !== "number" || !Number.isFinite(raw.price) || raw.price < 0) {
      return { ok: false, error: "price must be a non-negative number" };
    }
    value.price = raw.price;
  }

  if (raw.stock !== undefined) {
    if (typeof raw.stock !== "number" || !Number.isInteger(raw.stock) || raw.stock < 0) {
      return { ok: false, error: "stock must be a non-negative integer" };
    }
    value.stock = raw.stock;
  }

  if (raw.sizes !== undefined) {
    if (!Array.isArray(raw.sizes) || raw.sizes.some((s) => typeof s !== "string")) {
      return { ok: false, error: "sizes must be an array of strings" };
    }
    value.sizes = raw.sizes as string[];
  }

  if (raw.images !== undefined) {
    if (!Array.isArray(raw.images) || raw.images.some((i) => typeof i !== "string")) {
      return { ok: false, error: "images must be an array of strings" };
    }
    value.images = raw.images as string[];
  }

  if (raw.description !== undefined) {
    if (typeof raw.description !== "string") {
      return { ok: false, error: "description must be a string" };
    }
    value.description = raw.description;
  }

  if (Object.keys(value).length === 0) {
    return { ok: false, error: "No updatable product fields were provided" };
  }

  return { ok: true, value };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseProductUpdate(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update(parsed.value)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabaseAdmin.from("products").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
