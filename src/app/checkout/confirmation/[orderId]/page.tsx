import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Order Confirmed — Forme",
};

interface ConfirmationPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderConfirmationPage({ params }: ConfirmationPageProps) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true, address: true },
  });

  if (!order) {
    notFound();
  }

  // A registered order belongs to its owner (or staff) only — a guest order
  // has no account to check against, so its unguessable cuid is the access
  // control for that case.
  if (order.userId) {
    const session = await auth();
    const isOwner = session?.user?.id === order.userId;
    const isStaff = session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
    if (!isOwner && !isStaff) {
      notFound();
    }
  }

  // The confirmation page is only reachable once payment is actually
  // confirmed — never trust the URL alone. Route pending/failed orders back
  // to where they can be resolved instead of rendering a false success page.
  if (!order.payment || order.payment.status !== "PAID") {
    if (order.payment?.status === "FAILED") {
      redirect(`/checkout/failed/${orderId}`);
    }
    if (order.payment?.provider === "mock") {
      redirect(`/checkout/pay/mock/${orderId}`);
    }
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <p className="text-xs uppercase tracking-editorial text-muted-foreground">
        Order Confirmed
      </p>
      <h1 className="mt-2 font-display text-3xl uppercase tracking-editorial">
        Thank You
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Your order <strong className="text-foreground">{order.orderNumber}</strong> has
        been placed. A confirmation has been sent to your email.
      </p>

      <div className="mt-8 border border-border p-6 text-left">
        <ul className="flex flex-col gap-2 divide-y divide-border text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 pt-2 first:pt-0">
              <span>
                {item.productName}{" "}
                <span className="text-muted-foreground">
                  ({item.variantLabel}) × {item.quantity}
                </span>
              </span>
              <span>{formatMoney(Number(item.unitPrice) * item.quantity, order.currency)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatMoney(order.subtotal.toString(), order.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{formatMoney(order.shippingTotal.toString(), order.currency)}</dd>
          </div>
          <div className="flex justify-between font-medium">
            <dt>Total paid</dt>
            <dd>{formatMoney(order.grandTotal.toString(), order.currency)}</dd>
          </div>
        </dl>
        <div className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{order.address.fullName}</p>
          <p>
            {order.address.line1}
            {order.address.line2 ? `, ${order.address.line2}` : ""}
          </p>
          <p>
            {[order.address.city, order.address.state, order.address.postalCode]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p>{order.address.country}</p>
        </div>
      </div>

      <Button
        size="lg"
        className="mt-8 uppercase tracking-editorial"
        render={<Link href="/women" />}
      >
        Continue Shopping
      </Button>
    </div>
  );
}
