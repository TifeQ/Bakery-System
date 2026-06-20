import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, formatNaira } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

type Order = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  delivery_type: string | null;
  total_price: number;
  payment_status: string | null;
  status: string | null;
  scheduled_time: string | null;
  created_at: string;
};

type InventoryItem = {
  id: string;
  ingredient_name: string;
  unit: string;
  current_stock: number;
  safety_threshold: number;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  is_available: boolean;
};

const statusColor: Record<string, string> = {
  Pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  Baking: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  "Ready for Pickup": "bg-sky-500/15 text-sky-700 border-sky-500/30",
  "Out for Delivery": "bg-violet-500/15 text-violet-700 border-violet-500/30",
  Completed: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
};

const paymentColor: Record<string, string> = {
  Paid: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  Failed: "bg-red-500/15 text-red-700 border-red-500/30",
  Pending: "bg-neutral-500/15 text-neutral-700 border-neutral-500/30",
};

function fmtDate(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString();
}

function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrdersStats, setAllOrdersStats] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortKey, setSortKey] = useState<keyof Order>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});

  async function loadAll() {
    const [oRes, statsRes, iRes, pRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("orders").select("id,total_price,payment_status,status"),
      supabase.from("inventory").select("*").order("ingredient_name"),
      supabase.from("products").select("*").order("name"),
    ]);
    if (oRes.data) setOrders(oRes.data as Order[]);
    if (statsRes.data) setAllOrdersStats(statsRes.data as Order[]);
    if (iRes.data) setInventory(iRes.data as InventoryItem[]);
    if (pRes.data) setProducts(pRes.data as Product[]);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const stats = useMemo(() => {
    const total = allOrdersStats.length;
    const revenue = allOrdersStats.reduce((s, o) => s + (o.total_price || 0), 0) / 100;
    const paid = allOrdersStats.filter((o) => o.payment_status === "Paid").length;
    const pending = allOrdersStats.filter((o) => o.status === "Pending").length;
    const completed = allOrdersStats.filter((o) => o.status === "Completed").length;
    return { total, revenue, paid, pending, completed };
  }, [allOrdersStats]);

  const sortedOrders = useMemo(() => {
    const arr = [...orders];
    arr.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [orders, sortKey, sortDir]);

  function toggleSort(k: keyof Order) {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  }

  async function saveStock(item: InventoryItem) {
    const newVal = stockEdits[item.id];
    if (newVal === undefined || newVal === item.current_stock) return;
    const { error } = await supabase
      .from("inventory")
      .update({ current_stock: newVal })
      .eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Stock updated");
    setInventory((arr) => arr.map((i) => (i.id === item.id ? { ...i, current_stock: newVal } : i)));
    setStockEdits((s) => { const n = { ...s }; delete n[item.id]; return n; });
  }

  async function toggleAvailable(p: Product, val: boolean) {
    const { error } = await supabase.from("products").update({ is_available: val }).eq("id", p.id);
    if (error) return toast.error(error.message);
    setProducts((arr) => arr.map((x) => (x.id === p.id ? { ...x, is_available: val } : x)));
  }

  async function saveProduct() {
    if (!editingProduct) return;
    const { id, name, category, description, price } = editingProduct;
    const { error } = await supabase
      .from("products")
      .update({ name, category, description, price })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Product updated");
    setProducts((arr) => arr.map((x) => (x.id === id ? editingProduct : x)));
    setEditingProduct(null);
  }

  const SortHead = ({ k, label }: { k: keyof Order; label: string }) => (
    <TableHead>
      <button onClick={() => toggleSort(k)} className="font-semibold hover:text-primary">
        {label} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
      </button>
    </TableHead>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Admin Portal</h1>
        <p className="text-muted-foreground">Sales, inventory & product management</p>
      </div>

      {/* SALES OVERVIEW */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Sales Overview</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: "Total Orders", value: stats.total },
            { label: "Total Revenue", value: `₦${stats.revenue.toLocaleString("en-NG")}` },
            { label: "Paid Orders", value: stats.paid },
            { label: "Pending", value: stats.pending },
            { label: "Completed", value: stats.completed },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-bold text-primary">{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT ORDERS */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent Orders</h2>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead k="id" label="Order" />
                <SortHead k="customer_name" label="Customer" />
                <SortHead k="customer_phone" label="Phone" />
                <SortHead k="delivery_type" label="Delivery" />
                <SortHead k="total_price" label="Total" />
                <SortHead k="payment_status" label="Payment" />
                <SortHead k="status" label="Status" />
                <SortHead k="scheduled_time" label="Scheduled" />
                <SortHead k="created_at" label="Created" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                  <TableCell>{o.customer_name || "—"}</TableCell>
                  <TableCell>{o.customer_phone || "—"}</TableCell>
                  <TableCell>{o.delivery_type || "—"}</TableCell>
                  <TableCell>{formatNaira(o.total_price)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={paymentColor[o.payment_status ?? ""] ?? ""}>
                      {o.payment_status ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor[o.status ?? ""] ?? ""}>
                      {o.status ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{fmtDate(o.scheduled_time)}</TableCell>
                  <TableCell className="text-xs">{fmtDate(o.created_at)}</TableCell>
                </TableRow>
              ))}
              {sortedOrders.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-6">No orders yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* INVENTORY */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Inventory</h2>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Safety Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((i) => {
                const low = i.current_stock <= i.safety_threshold;
                const editVal = stockEdits[i.id] ?? i.current_stock;
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.ingredient_name}</TableCell>
                    <TableCell>{i.unit}</TableCell>
                    <TableCell>{i.current_stock}</TableCell>
                    <TableCell>{i.safety_threshold}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={low
                        ? "bg-red-500/15 text-red-700 border-red-500/30"
                        : "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"}>
                        {low ? "Low Stock" : "OK"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          className="w-24"
                          value={editVal}
                          onChange={(e) =>
                            setStockEdits((s) => ({ ...s, [i.id]: Number(e.target.value) }))
                          }
                        />
                        <Button size="sm" onClick={() => saveStock(i)}>Save</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {inventory.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No inventory items</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* PRODUCTS */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Product Management</h2>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Available</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>{formatNaira(p.price)}</TableCell>
                  <TableCell>
                    <Switch checked={p.is_available} onCheckedChange={(v) => toggleAvailable(p, v)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditingProduct({ ...p })}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No products</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={!!editingProduct} onOpenChange={(o) => !o && setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
          {editingProduct && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingProduct.description ?? ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price (in kobo)</label>
                <Input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
            <Button onClick={saveProduct}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
