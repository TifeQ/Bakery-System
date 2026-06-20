import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-bakery.jpg";
import { ArrowRight, Wheat, Cake, Croissant } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Bakery — Freshly Baked Every Morning" },
      { name: "description", content: "Artisan breads, pastries, and custom cakes baked fresh every day." },
      { property: "og:title", content: "The Bakery" },
      { property: "og:description", content: "Artisan breads, pastries, and custom cakes baked fresh every day." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Fresh artisan bakery" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
        </div>

        <div className="relative mx-auto flex min-h-[85vh] max-w-6xl flex-col items-start justify-center px-4 py-20">
          <span className="mb-4 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-accent-foreground">
            Baked with love daily
          </span>
          <h1 className="max-w-3xl font-serif text-5xl font-bold leading-tight text-primary md:text-7xl">
            The Bakery
          </h1>
          <p className="mt-4 max-w-xl text-lg text-foreground/80 md:text-xl">
            Sourdough crusts, buttery croissants, and custom cakes — handcrafted from the finest ingredients.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-14 px-8 text-base shadow-lg">
              <Link to="/products">
                Order Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">What We Bake</h2>
          <p className="mt-2 text-muted-foreground">A taste for every craving</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Wheat, title: "Artisan Bread", desc: "Crusty sourdough, soft brioche, and rustic loaves." },
            { icon: Croissant, title: "Pastries", desc: "Flaky croissants, danishes, and sweet morning treats." },
            { icon: Cake, title: "Custom Cakes", desc: "Made-to-order cakes for birthdays and celebrations." },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-xl border border-border/60 bg-card p-8 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent-foreground">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/products">Browse the Menu</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-card/40 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} The Bakery. Made with warmth.
        </div>
      </footer>
    </main>
  );
}
