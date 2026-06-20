import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/supabase";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function CartDrawer() {
  const { isOpen, setOpen, items, updateQuantity, removeItem, subtotal, closeCart } = useCart();
  const navigate = useNavigate();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60 p-6">
          <SheetTitle className="font-serif text-2xl">Your Cart</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <ShoppingBag className="h-12 w-12 opacity-40" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex gap-3 rounded-lg border border-border/60 bg-card p-3">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium leading-tight">{product.name}</h3>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatNaira(product.price)}</p>
                    <div className="mt-auto flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(product.id, quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(product.id, quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border/60 bg-card/50 p-6 space-y-4">
            <div className="flex items-center justify-between text-base">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-serif text-xl font-bold text-primary">{formatNaira(subtotal)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                closeCart();
                navigate({ to: "/checkout" });
              }}
            >
              Proceed to Checkout
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
