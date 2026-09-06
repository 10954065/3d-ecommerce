import Link from "next/link";

interface EmptyStateProps {
  clearHref: string;
}

export function EmptyState({ clearHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-border py-24 text-center">
      <p className="font-display text-xl">No products match these filters</p>
      <p className="max-w-[38ch] text-sm text-muted-foreground">
        Try a different size, color, or category — or clear your filters to
        see the full range.
      </p>
      <Link
        href={clearHref}
        className="mt-2 text-xs uppercase tracking-editorial underline underline-offset-4"
      >
        Clear filters
      </Link>
    </div>
  );
}
