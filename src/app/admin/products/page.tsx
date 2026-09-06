import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listProducts } from "@/lib/queries/admin-products";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  ARCHIVED: "outline",
};

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const { products, total, pageCount } = await listProducts({ search: q, page: currentPage });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Products</h1>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
        <Button render={<Link href="/admin/products/new" />}>
          <Plus /> New product
        </Button>
      </div>

      <form className="flex max-w-sm items-center gap-2" action="/admin/products">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q ?? ""} placeholder="Search by name or SKU" className="pl-8" />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Image</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-muted/50">
                  <td className="px-4 py-2">
                    <Link href={`/admin/products/${p.id}`}>
                      {p.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.thumbnail.url}
                          alt={p.thumbnail.altText ?? p.name}
                          className="h-12 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-12 w-10 rounded-md bg-muted" />
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{p.brandName}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.categoryName}</td>
                  <td className="px-4 py-2">
                    <Badge variant={STATUS_VARIANT[p.status] ?? "outline"}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-2">{formatMoney(p.basePrice, p.currency)}</td>
                  <td className="px-4 py-2">{p.totalStock}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              size="sm"
              variant={n === currentPage ? "default" : "outline"}
              render={<Link href={`/admin/products?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${n}`} />}
            >
              {n}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
