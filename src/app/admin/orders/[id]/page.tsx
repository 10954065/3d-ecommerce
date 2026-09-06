import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { getOrderById } from "@/lib/queries/admin-orders";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/admin/orders" className="text-xs text-muted-foreground hover:underline">
          &larr; All orders
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="font-display text-2xl">{order.orderNumber}</h1>
          <Badge>{order.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Placed {order.createdAt.toLocaleString()} by{" "}
          {order.user?.name ?? order.user?.email ?? order.guestEmail ?? "Unknown customer"}
          {!order.user && order.guestEmail ? " (guest)" : ""}
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 font-medium">Update status</h2>
        <OrderStatusForm orderId={order.id} currentStatus={order.status} />
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 font-medium">Line items</h2>
        <ul className="divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <Link href={`/products/${item.product.slug}`} className="font-medium hover:underline">
                  {item.productName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {item.variantLabel} × {item.quantity}
                </p>
              </div>
              <span>{formatMoney(Number(item.unitPrice) * item.quantity, order.currency)}</span>
            </li>
          ))}
        </ul>
        <Separator className="my-3" />
        <dl className="ml-auto flex w-full max-w-xs flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatMoney(Number(order.subtotal), order.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{formatMoney(Number(order.shippingTotal), order.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tax</dt>
            <dd>{formatMoney(Number(order.taxTotal), order.currency)}</dd>
          </div>
          {Number(order.discountTotal) > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Discount</dt>
              <dd>-{formatMoney(Number(order.discountTotal), order.currency)}</dd>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <dt>Total</dt>
            <dd>{formatMoney(Number(order.grandTotal), order.currency)}</dd>
          </div>
        </dl>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 font-medium">Shipping address</h2>
          <p className="text-sm">{order.address.fullName}</p>
          <p className="text-sm text-muted-foreground">{order.address.phone}</p>
          <p className="text-sm text-muted-foreground">
            {order.address.line1}
            {order.address.line2 ? `, ${order.address.line2}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {order.address.city}
            {order.address.state ? `, ${order.address.state}` : ""} {order.address.postalCode}
          </p>
          <p className="text-sm text-muted-foreground">{order.address.country}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 font-medium">Payment</h2>
          {order.payment ? (
            <>
              <p className="text-sm">
                Provider: <span className="text-muted-foreground">{order.payment.provider}</span>
              </p>
              <p className="text-sm">
                Status: <Badge variant="outline">{order.payment.status}</Badge>
              </p>
              <p className="text-sm text-muted-foreground">
                {formatMoney(Number(order.payment.amount), order.payment.currency)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No payment record.</p>
          )}
        </div>
      </section>
    </div>
  );
}
