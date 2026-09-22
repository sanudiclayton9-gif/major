"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Product, Order, Review } from "@/lib/types";

type Tab = "products" | "orders" | "feedback";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("products");
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-stone">
      <div className="border-b border-black/10 px-6 py-4 flex justify-between items-center">
        <h1 className="font-display text-xl font-semibold">Wear Chimsol — owner dashboard</h1>
        <button
          onClick={handleLogout}
          className="text-sm font-semibold border border-black/10 rounded-lg px-3 py-1.5 bg-white/70"
        >
          Sign out
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6">
          {(["products", "orders", "feedback"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${
                tab === t ? "bg-wine text-white" : "bg-white/70 border border-black/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "products" && <ProductsTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "feedback" && <FeedbackTab />}
      </div>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sizes, setSizes] = useState("");
  const [images, setImages] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then(setProducts);
  }

  useEffect(load, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const imageList = images.split("\n").map((s) => s.trim()).filter(Boolean);
    const sizeList = sizes.split(",").map((s) => s.trim()).filter(Boolean);
    if (!name.trim() || !price || imageList.length === 0) {
      setError("Name, price, and at least one image link are required.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        price: Number(price),
        stock: Number(stock) || 0,
        sizes: sizeList,
        images: imageList,
        description: description.trim(),
      }),
    });
    if (res.ok) {
      setName("");
      setPrice("");
      setStock("");
      setSizes("");
      setImages("");
      setDescription("");
      load();
    } else {
      const data = await res.json();
      setError(data.error || "Could not save the design.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this design?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <form onSubmit={handleAdd} className="glass rounded-2xl p-6 mb-8 space-y-3">
        <h2 className="font-display font-semibold text-lg mb-1">Add a new design</h2>
        <input
          placeholder="Design name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg px-3 py-2 bg-white/70 border border-black/10"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg px-3 py-2 bg-white/70 border border-black/10"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Price (USD)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-lg px-3 py-2 bg-white/70 border border-black/10"
          />
          <input
            type="number"
            placeholder="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="rounded-lg px-3 py-2 bg-white/70 border border-black/10"
          />
        </div>
        <input
          placeholder="Sizes, comma separated (e.g. S, M, L)"
          value={sizes}
          onChange={(e) => setSizes(e.target.value)}
          className="w-full rounded-lg px-3 py-2 bg-white/70 border border-black/10"
        />
        <textarea
          placeholder={"Image links, one per line\n(upload photos somewhere like postimages.org first, paste the direct link here)"}
          value={images}
          onChange={(e) => setImages(e.target.value)}
          className="w-full rounded-lg px-3 py-2 bg-white/70 border border-black/10"
        />
        {error && <p className="text-wine text-sm">{error}</p>}
        <button
          disabled={saving}
          className="bg-wine text-white font-semibold px-5 py-2.5 rounded-full"
        >
          {saving ? "Adding..." : "Add design"}
        </button>
      </form>

      <h2 className="font-display font-semibold text-lg mb-3">
        Current designs ({products.length})
      </h2>
      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="glass rounded-xl p-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.images?.[0]}
              alt={p.name}
              className="w-14 h-16 object-cover rounded-lg bg-white/40"
            />
            <div className="flex-1">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-ink-soft">${p.price} · stock {p.stock}</p>
            </div>
            <button
              onClick={() => handleDelete(p.id)}
              className="text-sm font-semibold text-wine border border-wine rounded-lg px-3 py-1.5"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then(setOrders);
  }, []);

  const statusColor: Record<string, string> = {
    pending: "bg-gold/20 text-gold",
    paid: "bg-green-100 text-green-700",
    delivered: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <>
      <h2 className="font-display font-semibold text-lg mb-3">Orders ({orders.length})</h2>
      <div className="space-y-3">
        {orders.length === 0 && <p className="text-ink-soft">No orders yet.</p>}
        {orders.map((o) => (
          <div key={o.id} className="glass rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold">
                  {o.customer_name || "Customer"} — {o.customer_phone}
                </p>
                <p className="text-xs text-ink-soft">
                  {new Date(o.created_at).toLocaleString()}
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                  statusColor[o.status] || ""
                }`}
              >
                {o.status}
              </span>
            </div>
            <ul className="text-sm text-ink-soft mb-2">
              {o.items.map((item, i) => (
                <li key={i}>
                  {item.qty}× {item.name}
                  {item.size ? ` (${item.size})` : ""} — ${item.price * item.qty}
                </li>
              ))}
            </ul>
            {o.measurements && (
              <p className="text-sm">
                <b>Measurements:</b> {o.measurements}
              </p>
            )}
            <p className="font-display font-semibold mt-2">Total: ${o.total}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function FeedbackTab() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetch("/api/admin/reviews")
      .then((r) => r.json())
      .then(setReviews);
  }, []);

  return (
    <>
      <h2 className="font-display font-semibold text-lg mb-3">
        Customer feedback ({reviews.length})
      </h2>
      <div className="space-y-3">
        {reviews.length === 0 && <p className="text-ink-soft">No feedback yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="glass rounded-xl p-4">
            <p className="font-semibold">{r.name}</p>
            <p className="text-ink-soft text-sm">{r.message}</p>
          </div>
        ))}
      </div>
    </>
  );
}
