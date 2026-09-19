import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

export default async function TrackPage({
  params,
}: {
  params: { id: string };
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error("Supabase server configuration is missing.");
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("paynow_reference", params.id)
    .maybeSingle();

  if (error) {
    console.error("Tracking order lookup error:", error);

    throw new Error(
      "There was a problem loading this order."
    );
  }

  if (!order) {
    notFound();
  }

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <div className="glass rounded-3xl p-8">
        <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
          Order tracking
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Order {order.paynow_reference}
        </h1>

        <div className="mt-8 rounded-2xl bg-slate-100 p-5">
          <p className="font-bold">
            Payment status
          </p>

          <p className="mt-2 text-lg font-semibold capitalize">
            {order.payment_status}
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-black">
            Customer
          </h2>

          <div className="mt-3 rounded-2xl border bg-white p-5">
            <p>
              <strong>Name:</strong>{" "}
              {order.customer_name}
            </p>

            {order.customer_email && (
              <p className="mt-2">
                <strong>Email:</strong>{" "}
                {order.customer_email}
              </p>
            )}

            <p className="mt-2">
              <strong>Phone:</strong>{" "}
              {order.customer_phone}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-black">
            Items
          </h2>

          <div className="mt-3 space-y-3">
            {items.map(
              (
                item: {
                  name?: string;
                  quantity?: number;
                  price?: number;
                  size?: string | null;
                },
                index: number
              ) => (
                <div
                  key={index}
                  className="flex justify-between rounded-2xl border bg-white p-4"
                >
                  <div>
                    <p className="font-bold">
                      {item.name}
                    </p>

                    <p className="text-sm text-slate-500">
                      Quantity: {item.quantity}
                      {item.size &&
                        ` • Size: ${item.size}`}
                    </p>
                  </div>

                  <p className="font-bold">
                    $
                    {(
                      Number(item.price || 0) *
                      Number(item.quantity || 0)
                    ).toFixed(2)}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
          <div className="flex justify-between text-lg">
            <span>Total</span>

            <strong>
              ${Number(order.total).toFixed(2)}
            </strong>
          </div>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Order placed:{" "}
          {new Date(
            order.created_at
          ).toLocaleString()}
        </p>
      </div>
    </main>
  );
}