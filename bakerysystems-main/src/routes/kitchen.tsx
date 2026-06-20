import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/kitchen")({
  head: () => ({ meta: [{ title: "Kitchen Dashboard — The Bakery" }] }),
  component: KitchenDashboard,
});

type OrderStatus =
  | "Pending"
  | "Baking"
  | "Ready for Pickup"
  | "Out for Delivery"
  | "Completed";

type Order = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_type: string | null;
  scheduled_time: string | null;
  total_price: number | null;
  status: OrderStatus | string | null;
  created_at?: string;
};

const COLUMNS: { key: OrderStatus; accent: string; ring: string }[] = [
  { key: "Pending", accent: "bg-amber-500/15 border-amber-500/40 text-amber-300", ring: "ring-amber-500/40" },
  { key: "Baking", accent: "bg-orange-500/15 border-orange-500/40 text-orange-300", ring: "ring-orange-500/40" },
  { key: "Ready for Pickup", accent: "bg-sky-500/15 border-sky-500/40 text-sky-300", ring: "ring-sky-500/40" },
  { key: "Out for Delivery", accent: "bg-violet-500/15 border-violet-500/40 text-violet-300", ring: "ring-violet-500/40" },
  { key: "Completed", accent: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300", ring: "ring-emerald-500/40" },
];

const ALL_STATUSES: OrderStatus[] = COLUMNS.map((c) => c.key);

function formatNaira(kobo: number | null) {
  if (kobo == null) return "₦0";
  return `₦${(kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, customer_name, customer_phone, delivery_type, scheduled_time, total_price, status, created_at",
        )
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        toast.error("Failed to load orders");
      } else {
        setOrders((data ?? []) as Order[]);
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("orders-kitchen")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          setOrders((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Order;
              if (prev.some((o) => o.id === row.id)) return prev;
              return [row, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Order;
              return prev.map((o) => (o.id === row.id ? { ...o, ...row } : o));
            }
            if (payload.eventType === "DELETE") {
              const row = payload.old as Order;
              return prev.filter((o) => o.id !== row.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error("Failed to update status");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kitchen Dashboard</h1>
            <p className="text-sm text-neutral-400">
              Live order board · {orders.length} total
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-neutral-400">Loading orders…</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {COLUMNS.map((col) => {
              const colOrders = orders.filter((o) => (o.status ?? "Pending") === col.key);
              return (
                <div
                  key={col.key}
                  className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/60"
                >
                  <div className={`flex items-center justify-between rounded-t-xl border-b px-3 py-2 ${col.accent}`}>
                    <h2 className="text-sm font-semibold uppercase tracking-wide">{col.key}</h2>
                    <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs">
                      {colOrders.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 p-3">
                    {colOrders.length === 0 && (
                      <p className="py-6 text-center text-xs text-neutral-500">No orders</p>
                    )}
                    {colOrders.map((order) => (
                      <article
                        key={order.id}
                        className={`rounded-lg border border-neutral-800 bg-neutral-950 p-3 shadow-sm ring-1 ring-inset ${col.ring}`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-mono text-xs text-neutral-400">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-300">
                            {order.delivery_type ?? "—"}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold text-neutral-100">
                            {order.customer_name ?? "Unknown customer"}
                          </p>
                          <p className="text-neutral-400">{order.customer_phone ?? "—"}</p>
                          <p className="text-xs text-neutral-500">
                            {formatDateTime(order.scheduled_time)}
                          </p>
                          <p className="text-base font-bold text-neutral-100">
                            {formatNaira(order.total_price)}
                          </p>
                        </div>
                        <label className="mt-3 block text-[10px] uppercase tracking-wide text-neutral-500">
                          Update status
                        </label>
                        <select
                          value={(order.status as OrderStatus) ?? "Pending"}
                          onChange={(e) =>
                            updateStatus(order.id, e.target.value as OrderStatus)
                          }
                          className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
