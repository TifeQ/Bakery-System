import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, formatNaira, type Product } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const CATEGORIES = ["All", "Bread", "Pastries", "Custom Cakes"] as const;
type Category = (typeof CATEGORIES)[number];

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Shop — The Bakery" },
      { name: "description", content: "Browse our fresh breads, pastries, and custom cakes." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>("All");
  const { addItem, openCart } = useCart();

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("name");
      if (!active) return;
      if (error) {
        toast.error("Could not load products");
        console.error(error);
      } else {
        setProducts((data as Product[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = category === "All" ? products : products.filter((p) => p.category === category);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-4xl font-bold text-primary md:text-5xl">Our Selection</h1>
        <p className="mt-2 text-muted-foreground">Baked fresh every morning</p>
      </div>

      <Tabs value={category} onValueChange={(v) => setCategory(v as Category)} className="mb-8">
        <TabsList className="mx-auto flex w-full max-w-xl flex-wrap justify-center bg-secondary/60">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c} className="flex-1">
              {c}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No products available in this category.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
                )}
              </div>
              <div className="space-y-3 p-5">
                <div>
                  <h3 className="font-serif text-xl font-semibold">{p.name}</h3>
                  {p.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-serif text-lg font-bold text-primary">{formatNaira(p.price)}</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      addItem(p);
                      openCart();
                      toast.success(`${p.name} added to cart`);
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add to Cart
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
