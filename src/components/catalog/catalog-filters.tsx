import Link from "next/link";
import { SizeLabel } from "@/generated/prisma/client";
import type { CatalogSearchParams } from "./types";

const ALL_SIZES = Object.values(SizeLabel);

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

interface CategoryOption {
  slug: string;
  name: string;
}

interface ColorOption {
  name: string;
  hexCode: string;
}

interface CatalogFiltersProps {
  basePath: string;
  categories: CategoryOption[];
  colors: ColorOption[];
  current: CatalogSearchParams;
}

function buildHref(
  basePath: string,
  current: CatalogSearchParams,
  key: keyof CatalogSearchParams,
  value: string,
): string {
  const next: CatalogSearchParams = { ...current };
  next[key] = current[key] === value ? undefined : value;

  const params = new URLSearchParams();
  for (const [paramKey, paramValue] of Object.entries(next)) {
    if (paramValue) params.set(paramKey, paramValue);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function CatalogFilters({ basePath, categories, colors, current }: CatalogFiltersProps) {
  const hasActiveFilters = Boolean(
    current.category || current.size || current.color || current.sort,
  );

  return (
    <aside className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-editorial text-muted-foreground">
          Filter
        </h2>
        {hasActiveFilters && (
          <Link
            href={basePath}
            className="text-[11px] uppercase tracking-editorial underline underline-offset-4 text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Link>
        )}
      </div>

      <div>
        <h3 className="text-[11px] uppercase tracking-editorial text-muted-foreground">
          Category
        </h3>
        <ul className="mt-3 flex flex-col gap-2">
          {categories.map((category) => {
            const isActive = current.category === category.slug;
            return (
              <li key={category.slug}>
                <Link
                  href={buildHref(basePath, current, "category", category.slug)}
                  className={
                    isActive
                      ? "text-sm font-medium text-foreground underline underline-offset-4"
                      : "text-sm text-muted-foreground hover:text-foreground"
                  }
                >
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="text-[11px] uppercase tracking-editorial text-muted-foreground">
          Size
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_SIZES.map((size) => {
            const isActive = current.size === size;
            return (
              <Link
                key={size}
                href={buildHref(basePath, current, "size", size)}
                className={
                  isActive
                    ? "flex h-9 min-w-9 items-center justify-center border border-foreground bg-foreground px-2 text-xs text-background"
                    : "flex h-9 min-w-9 items-center justify-center border border-border px-2 text-xs hover:border-foreground"
                }
              >
                {size}
              </Link>
            );
          })}
        </div>
      </div>

      {colors.length > 0 && (
        <div>
          <h3 className="text-[11px] uppercase tracking-editorial text-muted-foreground">
            Color
          </h3>
          <div className="mt-3 flex flex-wrap gap-3">
            {colors.map((color) => {
              const isActive = current.color === color.name;
              return (
                <Link
                  key={color.name}
                  href={buildHref(basePath, current, "color", color.name)}
                  title={color.name}
                  aria-label={color.name}
                  className={
                    isActive
                      ? "h-7 w-7 rounded-full ring-2 ring-offset-2 ring-foreground ring-offset-background"
                      : "h-7 w-7 rounded-full border border-border"
                  }
                  style={{ backgroundColor: color.hexCode }}
                />
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-[11px] uppercase tracking-editorial text-muted-foreground">
          Sort by
        </h3>
        <ul className="mt-3 flex flex-col gap-2">
          {SORT_OPTIONS.map((option) => {
            const isActive = (current.sort ?? "newest") === option.value;
            return (
              <li key={option.value}>
                <Link
                  href={buildHref(basePath, current, "sort", option.value)}
                  className={
                    isActive
                      ? "text-sm font-medium text-foreground underline underline-offset-4"
                      : "text-sm text-muted-foreground hover:text-foreground"
                  }
                >
                  {option.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
