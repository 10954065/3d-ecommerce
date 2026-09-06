import Link from "next/link";
import { DollarSign, ShoppingCart, Users, Package, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { formatMoney } from "@/lib/format";
import {
  getDashboardStats,
  getLowStockVariants,
  getMostViewedProducts,
  getMost3DSimulatedProducts,
  getSalesByCategory,
} from "@/lib/queries/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, lowStock, mostViewed, most3D, salesByCategory] = await Promise.all([
    getDashboardStats(),
    getLowStockVariants(),
    getMostViewedProducts(),
    getMost3DSimulatedProducts(),
    getSalesByCategory(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live figures from Postgres — no mock data.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatMoney(stats.revenue, stats.currency)}
          icon={DollarSign}
          hint="Excludes cancelled & refunded orders"
        />
        <StatCard label="Orders" value={String(stats.orderCount)} icon={ShoppingCart} />
        <StatCard label="Customers" value={String(stats.customerCount)} icon={Users} />
        <StatCard label="Products" value={String(stats.productCount)} icon={Package} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" strokeWidth={1.75} />
            <h2 className="font-medium">Low stock</h2>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">No variants are low on stock.</p>
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/admin/products/${v.productId}`} className="hover:underline">
                    {v.productName} — {v.colorName} / {v.size}
                  </Link>
                  <Badge variant={v.stockQuantity === 0 ? "destructive" : "outline"}>
                    {v.stockQuantity} left
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 font-medium">Most viewed products</h2>
          {mostViewed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No product views recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {mostViewed.map((p) => (
                <li key={p.productId} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/admin/products/${p.productId}`} className="hover:underline">
                    {p.productName}
                  </Link>
                  <span className="text-muted-foreground">{p.count} views</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 font-medium">Most 3D-simulated products</h2>
          {most3D.length === 0 ? (
            <p className="text-sm text-muted-foreground">No 3D viewer interactions recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {most3D.map((p) => (
                <li key={p.productId} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/admin/products/${p.productId}`} className="hover:underline">
                    {p.productName}
                  </Link>
                  <span className="text-muted-foreground">{p.count} interactions</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 font-medium">Sales by category</h2>
          {salesByCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {salesByCategory.map((c) => (
                <li key={c.categoryName} className="flex items-center justify-between py-2 text-sm">
                  <span>{c.categoryName}</span>
                  <span className="text-muted-foreground">
                    {formatMoney(c.revenue, stats.currency)} · {c.unitsSold} units
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
