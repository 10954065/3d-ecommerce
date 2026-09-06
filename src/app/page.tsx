import Link from "next/link";
import { getFeaturedProducts } from "@/lib/queries/products";
import { ProductCard } from "@/components/product/product-card";
import { HeroMannequinLoader } from "@/components/3d/HeroMannequinLoader";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-[1600px] items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-4 lg:px-10 lg:py-0">
          <div className="order-2 flex flex-col items-start gap-6 lg:order-1">
            <p className="text-xs uppercase tracking-editorial text-muted-foreground">
              Interactive 3D Fitting
            </p>
            <h1 className="font-display text-5xl leading-[1.05] text-balance sm:text-6xl lg:text-7xl">
              See it. Feel it.
              <br />
              Wear it.
            </h1>
            <p className="max-w-[42ch] text-sm text-muted-foreground sm:text-base">
              Explore fashion in motion through our interactive 3D fitting
              experience — realistic draping, movement, and fabric on
              standardized mannequins, before you ever add to cart.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="uppercase tracking-editorial" render={<Link href="/women" />}>
                Explore Collection
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="uppercase tracking-editorial"
                render={<Link href="/studio" />}
              >
                Enter 3D Studio
              </Button>
            </div>
          </div>
          <div className="order-1 h-105 w-full lg:order-2 lg:h-155">
            <HeroMannequinLoader />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl uppercase tracking-editorial">
            New Arrivals
          </h2>
          <Link href="/women" className="text-xs uppercase tracking-editorial underline underline-offset-4">
            View all
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
        {[
          { href: "/men", label: "Menswear", sub: "Tailoring, denim & outerwear" },
          { href: "/women", label: "Womenswear", sub: "Dresses, tailoring & knitwear" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group relative flex aspect-16/10 items-end bg-ink p-8 text-bone sm:aspect-video"
          >
            <div>
              <p className="font-display text-3xl uppercase tracking-editorial">
                {item.label}
              </p>
              <p className="mt-2 text-sm text-bone/70">{item.sub}</p>
            </div>
            <span className="absolute right-8 top-8 text-xs uppercase tracking-editorial opacity-0 transition-opacity group-hover:opacity-100">
              Shop now →
            </span>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-20 sm:px-6 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-3">
          {[
            {
              title: "Standardized Mannequins",
              body: "Every garment is shown on precise, measured body profiles across seven sizes — not a single idealized model.",
            },
            {
              title: "Real Fabric Behavior",
              body: "Silk drapes, denim holds structure, wool sits with weight — each material moves according to its own physical properties.",
            },
            {
              title: "See It Move",
              body: "Trigger a runway walk or a slow turn and watch folds, wrinkles, and drape respond to motion in real time.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="font-display text-lg">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40 py-20">
        <div className="mx-auto max-w-xl px-4 text-center">
          <h2 className="font-display text-2xl uppercase tracking-editorial">
            Join the studio
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            New arrivals, editorial stories, and early access to seasonal
            collections — delivered occasionally, never spam.
          </p>
          <form className="mt-6 flex gap-2">
            <input
              type="email"
              required
              placeholder="you@email.com"
              className="h-11 flex-1 border border-border bg-background px-4 text-sm"
            />
            <Button type="submit" className="h-11 uppercase tracking-editorial">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
