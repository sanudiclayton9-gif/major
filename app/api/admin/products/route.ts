import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

async function verifyAdmin() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return user;
}

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Missing Supabase server configuration.");
  }

  return createAdminClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function GET() {
  try {
    const user = await verifyAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const supabase = getAdminSupabase();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      products: data || [],
    });
  } catch (error) {
    console.error("Admin products GET error:", error);

    return NextResponse.json(
      { error: "Could not load products." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifyAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      name,
      description,
      price,
      image_url,
      category,
      stock,
      sizes,
      images,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 }
      );
    }

    if (price === undefined || Number(price) < 0) {
      return NextResponse.json(
        { error: "A valid price is required." },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: String(name).trim(),
        description: description
          ? String(description).trim()
          : null,
        price: Number(price),
        image_url: image_url
          ? String(image_url).trim()
          : null,
        category: category
          ? String(category).trim()
          : null,
        stock: Number(stock) || 0,
        sizes: Array.isArray(sizes) ? sizes : [],
        images: Array.isArray(images) ? images : [],
      })
      .select()
      .single();

    if (error) {
      console.error("Product insert error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data,
    });
  } catch (error) {
    console.error("Admin products POST error:", error);

    return NextResponse.json(
      { error: "Could not create product." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await verifyAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      id,
      name,
      description,
      price,
      image_url,
      category,
      stock,
      sizes,
      images,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 }
      );
    }

    if (price === undefined || Number(price) < 0) {
      return NextResponse.json(
        { error: "A valid price is required." },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    const { data, error } = await supabase
      .from("products")
      .update({
        name: String(name).trim(),
        description: description
          ? String(description).trim()
          : null,
        price: Number(price),
        image_url: image_url
          ? String(image_url).trim()
          : null,
        category: category
          ? String(category).trim()
          : null,
        stock: Number(stock) || 0,
        sizes: Array.isArray(sizes) ? sizes : [],
        images: Array.isArray(images) ? images : [],
      })
      .eq("id", Number(id))
      .select()
      .single();

    if (error) {
      console.error("Product update error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data,
    });
  } catch (error) {
    console.error("Admin products PUT error:", error);

    return NextResponse.json(
      { error: "Could not update product." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await verifyAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Product delete error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Admin products DELETE error:", error);

    return NextResponse.json(
      { error: "Could not delete product." },
      { status: 500 }
    );
  }
}