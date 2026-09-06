import Link from "next/link";

interface CollectionTileProps {
  slug: string;
  name: string;
  description: string | null;
  heroImageUrl: string | null;
  productCount: number;
}

export function CollectionTile({
  slug,
  name,
  description,
  heroImageUrl,
  productCount,
}: CollectionTileProps) {
  return (
    <Link
      href={`/collections/${slug}`}
      className="group relative flex aspect-4/5 flex-col justify-end overflow-hidden bg-ink p-8 text-bone sm:aspect-video"
    >
      {heroImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroImageUrl}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      )}
      <div className="relative">
        <p className="text-[11px] uppercase tracking-editorial text-bone/60">
          {productCount} {productCount === 1 ? "piece" : "pieces"}
        </p>
        <h3 className="mt-2 font-display text-3xl uppercase tracking-editorial">
          {name}
        </h3>
        {description && (
          <p className="mt-2 max-w-[42ch] text-sm text-bone/70">{description}</p>
        )}
      </div>
      <span className="absolute right-8 top-8 text-xs uppercase tracking-editorial opacity-0 transition-opacity group-hover:opacity-100">
        Shop the edit →
      </span>
    </Link>
  );
}
