import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { supabase, formatNaira } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.startsWith("+234")) return cleaned;
  if (cleaned.startsWith("0")) return "+234" + cleaned.slice(1);
  return cleaned;
}

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Checkout — The Bakery" }],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    delivery_type: "Pickup" as "Pickup" | "Delivery",
    address: "",
    scheduled_time: "",
    notes: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!form.full_name || !form.email || !form.phone || !form.scheduled_time) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.delivery_type === "Delivery" && !form.address) {
      toast.error("Please provide a delivery address");
      return;
    }

    setSubmitting(true);
    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_name: form.full_name,
          customer_email: form.email,
          customer_phone: formatPhone(form.phone),
          delivery_type: form.delivery_type,
          delivery_address: form.delivery_type === "Delivery" ? form.address : null,
          scheduled_time: form.scheduled_time,
          notes: form.notes || null,
          total_price: subtotal,
          payment_status: "Paid",
          status: "Pending",
        })
        .select()
        .single();

      if (orderErr || !order) throw orderErr ?? new Error("Failed to create order");

      const { error: itemsErr } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.product.price,
        })),
      );

      if (itemsErr) throw itemsErr;

      toast.success("Your order has been placed! We'll notify you on WhatsApp.");
      clear();
      navigate({ to: "/" });
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 font-serif text-4xl font-bold text-primary">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border/60 bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name *</Label>
              <Input id="name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone number *</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
          </div>

          <div className="space-y-3">
            <Label>Delivery type *</Label>
            <RadioGroup
              value={form.delivery_type}
              onValueChange={(v) => set("delivery_type", v as "Pickup" | "Delivery")}
              className="flex gap-6"
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="Pickup" id="pickup" />
                <span>Pickup</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="Delivery" id="delivery" />
                <span>Delivery</span>
              </label>
            </RadioGroup>
          </div>

          {form.delivery_type === "Delivery" && (
            <div className="space-y-2">
              <Label htmlFor="address">Delivery address *</Label>
              <Textarea id="address" rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} required />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="time">Scheduled {form.delivery_type.toLowerCase()} time *</Label>
            <Input
              id="time"
              type="datetime-local"
              value={form.scheduled_time}
              onChange={(e) => set("scheduled_time", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Order notes</Label>
            <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any special requests?" />
          </div>

          <Button
            type="submit"
            disabled={submitting || items.length === 0}
            className="h-14 w-full bg-accent text-accent-foreground hover:bg-accent/90 text-base font-bold shadow-lg"
          >
            {submitting ? "Processing..." : "Simulate Successful Payment"}
          </Button>
        </form>

        <aside className="h-fit rounded-xl border border-border/60 bg-card p-6">
          <h2 className="mb-4 font-serif text-xl font-semibold">Order Summary</h2>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {items.map(({ product, quantity }) => (
                  <li key={product.id} className="flex justify-between gap-2 text-sm">
                    <span className="flex-1">
                      {product.name} <span className="text-muted-foreground">× {quantity}</span>
                    </span>
                    <span className="font-medium">{formatNaira(product.price * quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
                <span className="text-muted-foreground">Total</span>
                <span className="font-serif text-2xl font-bold text-primary">{formatNaira(subtotal)}</span>
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
