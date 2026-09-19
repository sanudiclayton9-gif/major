"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Order = {
  id: number;
  customer_name: string;
  customer_phone: string;
  total: number;
  payment_status: string;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const { data: ordersData } = await supabase
      .from("orders")
      .select(
        "id, customer_name, customer_phone, total, payment_status, created_at"
      )
      .order("created_at", { ascending: false });

    const { count } = await supabase
      .from("products")
      .select("*", {
        count: "exact",
        head: true,
      });

    setOrders(ordersData || []);
    setProductCount(count || 0);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const paidOrders = orders.filter(
    (order) => order.payment_status === "paid"
  );

  const sales = paidOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  const pending = orders.filter(
    (order) => order.payment_status === "pending"
  ).length;

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
            Owner dashboard
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Wear Chimsol Admin
          </h1>

          <p className="mt-2 text-slate-600">
            Manage your store from one place.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-full border border-slate-300 px-5 py-3 font-bold"
        >
          Sign out
        </button>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-sm opacity-70">
            Total sales
          </p>

          <p className="mt-2 text-3xl font-black">
            ${sales.toFixed(2)}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">
            Orders
          </p>

          <p className="mt-2 text-3xl font-black">
            {orders.length}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">
            Products
          </p>

          <p className="mt-2 text-3xl font-black">
            {productCount}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">
            Pending payments
          </p>

          <p className="mt-2 text-3xl font-black">
            {pending}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <button
          onClick={() => router.push("/admin/products")}
          className="rounded-3xl bg-white p-7 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1"
        >
          <div className="text-3xl">📦</div>

          <h2 className="mt-4 text-2xl font-black">
            Products
          </h2>

          <p className="mt-2 text-slate-600">
            Add products, update prices, manage stock,
            sizes and images.
          </p>
        </button>

        <button
          onClick={() => router.push("/admin/orders")}
          className="rounded-3xl bg-white p-7 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1"
        >
          <div className="text-3xl">🛍️</div>

          <h2 className="mt-4 text-2xl font-black">
            Orders
          </h2>

          <p className="mt-2 text-slate-600">
            View customers, orders, totals and payment
            statuses.
          </p>
        </button>

        <button
          onClick={() => router.push("/admin/ai")}
          className="rounded-3xl bg-white p-7 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1"
        >
          <div className="text-3xl">🤖</div>

          <h2 className="mt-4 text-2xl font-black">
            AI Assistant
          </h2>

          <p className="mt-2 text-slate-600">
            Get help creating products, descriptions and
            store insights.
          </p>
        </button>
      </div>

      <section className="mt-10 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">
              Recent orders
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your latest customer activity.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="rounded-full border px-4 py-2 text-sm font-bold"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="mt-8 text-slate-500">
            Loading orders...
          </p>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-slate-100 p-8 text-center">
            <p className="font-semibold">
              No orders yet.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr className="border-b text-sm text-slate-500">
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {orders.slice(0, 10).map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0"
                  >
                    <td className="py-4 font-bold">
                      {order.customer_name}
                    </td>

                    <td className="py-4">
                      {order.customer_phone}
                    </td>

                    <td className="py-4 font-bold">
                      ${Number(order.total).toFixed(2)}
                    </td>

                    <td className="py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize">
                        {order.payment_status}
                      </span>
                    </td>

                    <td className="py-4 text-sm text-slate-500">
                      {new Date(
                        order.created_at
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}