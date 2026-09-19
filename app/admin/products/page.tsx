"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  stock: number;
  sizes: string[];
  images: string[];
};

type FormData = {
  name: string;
  description: string;
  price: string;
  image_url: string;
  category: string;
  stock: string;
  sizes: string;
  images: string;
};

const emptyForm: FormData = {
  name: "",
  description: "",
  price: "",
  image_url: "",
  category: "",
  stock: "0",
  sizes: "",
  images: "",
};

export default function AdminProductsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormData>(emptyForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/products"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not load products."
        );
      }

      setProducts(data.products || []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load products."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateForm(
    field: keyof FormData,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setMessage("");
  }

  function startEdit(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price),
      image_url: product.image_url || "",
      category: product.category || "",
      stock: String(product.stock),
      sizes: Array.isArray(product.sizes)
        ? product.sizes.join(", ")
        : "",
      images: Array.isArray(product.images)
        ? product.images.join("\n")
        : "",
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const fileExtension =
        file.name.split(".").pop() || "jpg";

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExtension}`;

      const filePath = `products/${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("product-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      setForm((current) => ({
        ...current,
        image_url: publicUrl,
        images: current.images
          ? `${current.images}\n${publicUrl}`
          : publicUrl,
      }));

      setMessage("Image uploaded successfully.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not upload image."
      );
    } finally {
      setUploading(false);

      event.target.value = "";
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    const sizes = form.sizes
      .split(",")
      .map((size) => size.trim())
      .filter(Boolean);

    const images = form.images
      .split("\n")
      .map((image) => image.trim())
      .filter(Boolean);

    const payload = {
      ...(editingId !== null
        ? { id: editingId }
        : {}),
      name: form.name,
      description: form.description,
      price: Number(form.price),
      image_url: form.image_url,
      category: form.category,
      stock: Number(form.stock),
      sizes,
      images,
    };

    try {
      const response = await fetch(
        "/api/admin/products",
        {
          method:
            editingId !== null ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not save the product."
        );
      }

      setMessage(
        editingId !== null
          ? "Product updated successfully."
          : "Product added successfully."
      );

      resetForm();

      await loadProducts();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not save the product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/products",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not delete the product."
        );
      }

      setMessage("Product deleted successfully.");

      await loadProducts();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not delete the product."
      );
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="mb-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-bold"
          >
            ← Back to Dashboard
          </button>

          <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
            Store management
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Products
          </h1>

          <p className="mt-2 text-slate-600">
            Add, edit and manage your store products.
          </p>
        </div>
      </div>

      <section className="mt-10 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">
              {editingId !== null
                ? "Edit product"
                : "Add a product"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Fill in the details below.
            </p>
          </div>

          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold"
            >
              Cancel
            </button>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-5 md:grid-cols-2"
        >
          <div>
            <label className="text-sm font-bold">
              Product name
            </label>

            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                updateForm("name", e.target.value)
              }
              placeholder="Classic Black Tee"
              required
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Category
            </label>

            <input
              type="text"
              value={form.category}
              onChange={(e) =>
                updateForm("category", e.target.value)
              }
              placeholder="T-Shirts"
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Price
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) =>
                updateForm("price", e.target.value)
              }
              placeholder="18"
              required
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Stock
            </label>

            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) =>
                updateForm("stock", e.target.value)
              }
              placeholder="10"
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-bold">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(e) =>
                updateForm(
                  "description",
                  e.target.value
                )
              }
              placeholder="Describe the product..."
              rows={4}
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-bold">
              Product image
            </label>

            <div className="mt-2 rounded-2xl border-2 border-dashed border-slate-300 p-6">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="block w-full text-sm"
              />

              {uploading && (
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Uploading image...
                </p>
              )}

              {form.image_url && (
                <div className="mt-5">
                  <p className="mb-3 text-sm font-bold">
                    Image preview
                  </p>

                  <img
                    src={form.image_url}
                    alt="Product preview"
                    className="h-48 w-48 rounded-2xl object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold">
              Sizes
            </label>

            <input
              type="text"
              value={form.sizes}
              onChange={(e) =>
                updateForm("sizes", e.target.value)
              }
              placeholder="S, M, L, XL"
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
            />

            <p className="mt-1 text-xs text-slate-500">
              Separate sizes with commas.
            </p>
          </div>

          <div>
            <label className="text-sm font-bold">
              Image URLs
            </label>

            <textarea
              value={form.images}
              onChange={(e) =>
                updateForm("images", e.target.value)
              }
              placeholder="Uploaded image URLs will appear here."
              rows={3}
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {error && (
            <div className="md:col-span-2 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="md:col-span-2 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700">
              {message}
            </div>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full rounded-full bg-slate-950 px-6 py-3 font-bold text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId !== null
                ? "Update Product"
                : "Add Product"}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">
              Your products
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {products.length} product
              {products.length === 1 ? "" : "s"} in
              your store.
            </p>
          </div>

          <button
            type="button"
            onClick={loadProducts}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="font-semibold">
              No products found.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
              >
                <div className="aspect-square bg-slate-100">
                  <img
                    src={
                      product.image_url ||
                      product.images?.[0] ||
                      "/placeholder.svg"
                    }
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">
                        {product.name}
                      </h3>

                      {product.category && (
                        <p className="mt-1 text-sm text-slate-500">
                          {product.category}
                        </p>
                      )}
                    </div>

                    <p className="text-lg font-black">
                      $
                      {Number(product.price).toFixed(
                        2
                      )}
                    </p>
                  </div>

                  <p className="mt-4 text-sm text-slate-600">
                    {product.description ||
                      "No description."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Stock: {product.stock}
                    </span>

                    {product.sizes?.length > 0 && (
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        Sizes:{" "}
                        {product.sizes.join(", ")}
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        startEdit(product)
                      }
                      className="flex-1 rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(product.id)
                      }
                      className="rounded-full border border-red-200 px-4 py-3 text-sm font-bold text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}