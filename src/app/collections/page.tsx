import type { Metadata } from "next";
import { getCollections } from "@/lib/queries/products";
import { CollectionTile } from "@/components/catalog/collection-tile";

export const metadata: Metadata = {
  title: "Collections | Forme",
  description:
    "Explore Forme's curated collections — seasonal edits and wardrobe essentials, each shown true to fabric in interactive 3D.",
};

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-10">
      <header className="max-w-[60ch] border-b border-border pb-8">
        <h1 className="font-display text-3xl uppercase tracking-editorial sm:text-4xl">
          Collections
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Curated edits built around a single idea — a fabric, a season, a
          silhouette. Each piece is shown true to material, draped and
          animated on standardized mannequins.
        </p>
      </header>

      {collections.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          No collections are live yet — check back soon.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {collections.map((collection) => (
            <CollectionTile
              key={collection.id}
              slug={collection.slug}
              name={collection.name}
              description={collection.description}
              heroImageUrl={collection.heroImageUrl}
              productCount={collection._count.products}
            />
          ))}
        </div>
      )}
    </div>
  );
}
