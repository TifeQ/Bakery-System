import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { count, openCart } = useCart();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-serif text-xl font-bold tracking-tight text-primary">
          The Bakery
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-foreground/80 md:flex">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <Link to="/products" className="hover:text-primary transition-colors">Shop</Link>
          <Link to="/kitchen" className="hover:text-primary transition-colors">Kitchen</Link>
          <Link to="/admin" className="hover:text-primary transition-colors">Admin</Link>
        </nav>
        <Button
          variant="ghost"
          size="sm"
          onClick={openCart}
          className="relative gap-2"
          aria-label="Open cart"
        >
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              {count}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
