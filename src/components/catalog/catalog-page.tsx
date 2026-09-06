import { SizeLabel, type Gender } from "@/generated/prisma/client";
import {
  getCategoriesForGender,
  getColorsForGender,
  getProductsByGender,
  type ProductSort,
} from "@/lib/queries/products";
import { ProductCard } from "@/components/product/product-card";
import { CatalogFilters } from "./catalog-filters";
import { EmptyState } from "./empty-state";
import type { CatalogSearchParams } from "./types";

const VALID_SIZES: readonly string[] = Object.values(SizeLabel);
const VALID_SORTS: readonly string[] = ["newest", "price-asc", "price-desc"];

function toSize(value: string | undefined): SizeLabel | undefined {
  return value && VALID_SIZES.includes(value) ? (value as SizeLabel) : undefined;
}

function toSort(value: string | undefined): ProductSort | undefined {
  return value && VALID_SORTS.includes(value) ? (value as ProductSort) : undefined;
}

interface CatalogPageProps {
  gender: Gender;
  basePath: string;
  title: string;
  description: string;
  searchParams: CatalogSearchParams;
}

export async function CatalogPage({
  gender,
  basePath,
  title,
  description,
  searchParams,
}: CatalogPageProps) {
  const [categories, colors, products] = await Promise.all([
    getCategoriesForGender(gender),
    getColorsForGender(gender),
    getProductsByGender(gender, {
      categorySlug: searchParams.category,
      size: toSize(searchParams.size),
      color: searchParams.color,
      sort: toSort(searchParams.sort),
    }),
  ]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-10">
      <header className="max-w-[60ch] border-b border-border pb-8">
        <h1 className="font-display text-3xl uppercase tracking-editorial sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-12">
        <CatalogFilters
          basePath={basePath}
          categories={categories}
          colors={colors}
          current={searchParams}
        />

        <div>
          <p className="mb-6 text-xs uppercase tracking-editorial text-muted-foreground">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>

          {products.length === 0 ? (
            <EmptyState clearHref={basePath} />
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
