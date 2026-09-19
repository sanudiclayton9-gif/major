"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OrderItem = {
  productId?: number;
  name?: string;
  quantity?: number;
  price?: number;
  size?: string | null;
};

type Order = {
  id: number;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  items: OrderItem[];
  total: number;
  payment_status: string;
  paynow_reference: string | null;
  created_at: string;
};

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/orders"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not load orders."
        );
      }

      setOrders(data.orders || []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  const paidOrders = orders.filter(
    (order) => order.payment_status === "paid"
  );

  const pendingOrders = orders.filter(
    (order) => order.payment_status === "pending"
  );

  const failedOrders = orders.filter(
    (order) =>
      order.payment_status === "failed" ||
      order.payment_status === "cancelled"
  );

  const totalSales = paidOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  function getStatusClass(status: string) {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      {/* Header */}

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
            Orders
          </h1>

          <p className="mt-2 text-slate-600">
            View and manage customer orders and payments.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="rounded-full bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Orders"}
        </button>
      </div>

      {/* Error */}

      {error && (
        <div className="mt-8 rounded-2xl bg-red-50 p-5 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Statistics */}

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-sm opacity-70">
            Total sales
          </p>

          <p className="mt-2 text-3xl font-black">
            ${totalSales.toFixed(2)}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">
            Total orders
          </p>

          <p className="mt-2 text-3xl font-black">
            {orders.length}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">
            Pending
          </p>

          <p className="mt-2 text-3xl font-black">
            {pendingOrders.length}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">
            Failed / cancelled
          </p>

          <p className="mt-2 text-3xl font-black">
            {failedOrders.length}
          </p>
        </div>
      </div>

      {/* Orders */}

      <section className="mt-10 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">
              Customer orders
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Click an order to view its full details.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-2xl bg-slate-100 p-8 text-center">
            <p className="font-semibold">
              Loading orders...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-slate-100 p-8 text-center">
            <div className="text-4xl">🛍️</div>

            <p className="mt-3 font-semibold">
              No orders yet.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Customer orders will appear here after
              checkout.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b text-sm text-slate-500">
                  <th className="pb-3">
                    Customer
                  </th>

                  <th className="pb-3">
                    Phone
                  </th>

                  <th className="pb-3">
                    Items
                  </th>

                  <th className="pb-3">
                    Total
                  </th>

                  <th className="pb-3">
                    Status
                  </th>

                  <th className="pb-3">
                    Date
                  </th>

                  <th className="pb-3">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0"
                  >
                    <td className="py-4">
                      <p className="font-bold">
                        {order.customer_name}
                      </p>

                      {order.customer_email && (
                        <p className="mt-1 text-xs text-slate-500">
                          {order.customer_email}
                        </p>
                      )}
                    </td>

                    <td className="py-4">
                      {order.customer_phone}
                    </td>

                    <td className="py-4">
                      {Array.isArray(order.items)
                        ? order.items.reduce(
                            (sum, item) =>
                              sum +
                              Number(
                                item.quantity || 0
                              ),
                            0
                          )
                        : 0}
                    </td>

                    <td className="py-4 font-bold">
                      $
                      {Number(order.total).toFixed(
                        2
                      )}
                    </td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClass(
                          order.payment_status
                        )}`}
                      >
                        {order.payment_status}
                      </span>
                    </td>

                    <td className="py-4 text-sm text-slate-500">
                      {new Date(
                        order.created_at
                      ).toLocaleDateString()}
                    </td>

                    <td className="py-4">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedOrder(order)
                        }
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Order Details Modal */}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
                  Order details
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  Order #
                  {selectedOrder.id}
                </h2>

                {selectedOrder.paynow_reference && (
                  <p className="mt-1 text-sm text-slate-500">
                    Reference:{" "}
                    {selectedOrder.paynow_reference}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(null)
                }
                className="h-10 w-10 rounded-full border font-bold"
              >
                ×
              </button>
            </div>

            {/* Payment */}

            <div className="mt-6 rounded-2xl bg-slate-100 p-5">
              <div className="flex items-center justify-between">
                <p className="font-bold">
                  Payment status
                </p>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClass(
                    selectedOrder.payment_status
                  )}`}
                >
                  {selectedOrder.payment_status}
                </span>
              </div>
            </div>

            {/* Customer */}

            <div className="mt-6">
              <h3 className="text-xl font-black">
                Customer
              </h3>

              <div className="mt-3 rounded-2xl border p-5">
                <p>
                  <strong>Name:</strong>{" "}
                  {selectedOrder.customer_name}
                </p>

                {selectedOrder.customer_email && (
                  <p className="mt-2">
                    <strong>Email:</strong>{" "}
                    {selectedOrder.customer_email}
                  </p>
                )}

                <p className="mt-2">
                  <strong>Phone:</strong>{" "}
                  {selectedOrder.customer_phone}
                </p>
              </div>
            </div>

            {/* Items */}

            <div className="mt-6">
              <h3 className="text-xl font-black">
                Items
              </h3>

              <div className="mt-3 space-y-3">
                {Array.isArray(
                  selectedOrder.items
                ) &&
                  selectedOrder.items.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4 rounded-2xl border p-4"
                      >
                        <div>
                          <p className="font-bold">
                            {item.name ||
                              "Product"}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Quantity:{" "}
                            {item.quantity || 0}

                            {item.size &&
                              ` • Size: ${item.size}`}
                          </p>
                        </div>

                        <p className="font-bold">
                          $
                          {(
                            Number(
                              item.price || 0
                            ) *
                            Number(
                              item.quantity || 0
                            )
                          ).toFixed(2)}
                        </p>
                      </div>
                    )
                  )}
              </div>
            </div>

            {/* Total */}

            <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex justify-between text-lg">
                <span>Total</span>

                <strong>
                  $
                  {Number(
                    selectedOrder.total
                  ).toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Date */}

            <p className="mt-5 text-sm text-slate-500">
              Order placed:{" "}
              {new Date(
                selectedOrder.created_at
              ).toLocaleString()}
            </p>

            {/* Track order */}

            {selectedOrder.paynow_reference && (
              <button
                type="button"
                onClick={() => {
                  router.push(
                    `/track/${selectedOrder.paynow_reference}`
                  );
                }}
                className="mt-6 w-full rounded-full border border-slate-300 px-5 py-3 font-bold"
              >
                Open Customer Tracking Page
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}