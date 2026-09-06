import Link from "next/link";
import type { Metadata } from "next";
import { getFeaturedProducts } from "@/lib/queries/products";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "3D Studio | Forme",
  description:
    "Step into the Forme 3D Studio — try garments on standardized mannequins, watch real fabric behavior, and see silhouettes move before you buy.",
};

const PILLARS = [
  {
    title: "Standardized Mannequins",
    body: "Every garment is fitted to precise, measured body profiles across seven sizes — XS through XXXL — so what you see on screen reflects how the piece actually sits, not a single idealized model.",
  },
  {
    title: "Real Fabric Behavior",
    body: "Each material in our library carries its own weight, stiffness, and stretch. Silk drapes, denim holds structure, wool sits with density — simulated fabric physics, not a static render.",
  },
  {
    title: "See It Move",
    body: "Trigger a slow turn or a runway walk and watch folds, wrinkles, and drape respond to motion in real time — the closest thing to trying it on before it arrives.",
  },
];

export default async function StudioPage() {
  const featured = await getFeaturedProducts(6);

  return (
    <div>
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
          <p className="text-xs uppercase tracking-editorial text-muted-foreground">
            The Forme 3D Studio
          </p>
          <h1 className="mt-4 max-w-[20ch] font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Try it on, before it&apos;s ever shipped.
          </h1>
          <p className="mt-6 max-w-[56ch] text-sm text-muted-foreground sm:text-base">
            Every garment on Forme is rebuilt in three dimensions — simulated
            fabric draped over a measured mannequin in your size, animated so
            you can watch it move. It&apos;s the fitting room, rebuilt for the
            web.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="uppercase tracking-editorial" render={<Link href="/men" />}>
              Shop Menswear
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="uppercase tracking-editorial"
              render={<Link href="/women" />}
            >
              Shop Womenswear
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div key={pillar.title}>
              <h2 className="font-display text-lg">{pillar.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40 py-16">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-editorial text-muted-foreground">
                How it works
              </p>
              <h2 className="mt-3 font-display text-2xl uppercase tracking-editorial sm:text-3xl">
                Pick a piece, pick your size
              </h2>
              <p className="mt-4 max-w-[48ch] text-sm text-muted-foreground">
                Open any product page and choose your size and color — the
                viewer swaps to your exact mannequin profile and re-drapes the
                garment on the spot. Rotate it, walk it, and check the fit
                from every angle before it reaches your cart.
              </p>
            </div>
            <ol className="grid gap-4 text-sm sm:grid-cols-3">
              {[
                { step: "01", label: "Choose a garment", body: "Browse Menswear or Womenswear and open any product." },
                { step: "02", label: "Select your size", body: "The mannequin and drape update to your exact measurements." },
                { step: "03", label: "Watch it move", body: "Trigger the walk or turn animation to see the fabric respond." },
              ].map((item) => (
                <li key={item.step} className="border border-border bg-background p-5">
                  <p className="text-xs text-muted-foreground">{item.step}</p>
                  <p className="mt-2 font-display text-base">{item.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl uppercase tracking-editorial">
            Start in the Studio
          </h2>
          <Link
            href="/women"
            className="text-xs uppercase tracking-editorial underline underline-offset-4"
          >
            View all
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
