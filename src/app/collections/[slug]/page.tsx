import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductsByCollection } from "@/lib/queries/products";
import { ProductCard } from "@/components/product/product-card";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getProductsByCollection(slug);
  if (!collection) return {};

  return {
    title: `${collection.name} | Forme`,
    description:
      collection.description ??
      `Shop the ${collection.name} collection from Forme, shown true to fabric in interactive 3D.`,
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await getProductsByCollection(slug);
  if (!collection) {
    notFound();
  }

  return (
    <div>
      <section className="relative flex aspect-21/9 items-end bg-ink px-4 py-10 text-bone sm:px-6 lg:px-10">
        {collection.heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={collection.heroImageUrl}
            alt={collection.name}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        )}
        <div className="relative mx-auto w-full max-w-[1600px]">
          <p className="text-[11px] uppercase tracking-editorial text-bone/60">
            Collection
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase tracking-editorial sm:text-5xl">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="mt-3 max-w-[50ch] text-sm text-bone/70">
              {collection.description}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-10">
        <p className="mb-6 text-xs uppercase tracking-editorial text-muted-foreground">
          {collection.products.length}{" "}
          {collection.products.length === 1 ? "piece" : "pieces"}
        </p>

        {collection.products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-border py-24 text-center">
            <p className="font-display text-xl">This collection is empty</p>
            <p className="max-w-[38ch] text-sm text-muted-foreground">
              New pieces are added to this edit regularly — check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {collection.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
