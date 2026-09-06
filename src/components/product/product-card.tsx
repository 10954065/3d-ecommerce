import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { ProductCardData } from "@/lib/queries/products";

interface ProductCardProps {
  product: ProductCardData;
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.media[0];
  const sizeCount = product.variants.length;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-4/5 overflow-hidden bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.altText ?? product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        <span className="absolute bottom-3 left-3 bg-background/90 px-2.5 py-1 text-[10px] uppercase tracking-editorial opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          View in 3D
        </span>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-editorial text-muted-foreground">
            {product.brand.name}
          </p>
          <h3 className="mt-1 text-sm">{product.name}</h3>
        </div>
        <p className="whitespace-nowrap text-sm">
          {formatMoney(product.basePrice, product.currency)}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex gap-1">
          {product.colors.slice(0, 5).map((color) => (
            <span
              key={color.id}
              className="h-3 w-3 rounded-full border border-border"
              style={{ backgroundColor: color.hexCode }}
              title={color.name}
            />
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground">
          {sizeCount} sizes
        </span>
      </div>
    </Link>
  );
}
