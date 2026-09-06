import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listOrders } from "@/lib/queries/admin-orders";
import { formatMoney } from "@/lib/format";
import type { OrderStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  PROCESSING: "secondary",
  SHIPPED: "secondary",
  DELIVERED: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

interface OrdersPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const { status, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const validStatus = STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;
  const { orders, total, pageCount } = await listOrders({ status: validStatus, page: currentPage });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Orders</h1>
        <p className="text-sm text-muted-foreground">{total} total</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={!validStatus ? "default" : "outline"} render={<Link href="/admin/orders" />}>
          All
        </Button>
        {STATUSES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={validStatus === s ? "default" : "outline"}
            render={<Link href={`/admin/orders?status=${s}`} />}
          >
            {s}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Order #</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/50">
                  <td className="px-4 py-2">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <div>{order.customerName ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
                  </td>
                  <td className="px-4 py-2">{formatMoney(order.grandTotal, order.currency)}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {order.createdAt.toLocaleDateString()}
                  </td>
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
              render={
                <Link href={`/admin/orders?${validStatus ? `status=${validStatus}&` : ""}page=${n}`} />
              }
            >
              {n}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
