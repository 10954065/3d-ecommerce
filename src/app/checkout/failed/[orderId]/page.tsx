import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTenantDb } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment Failed — Forme",
};

interface FailedPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderFailedPage({ params }: FailedPageProps) {
  const { orderId } = await params;

  const db = await getTenantDb();
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });

  if (!order || !order.payment) {
    notFound();
  }

  if (order.payment.status === "PAID") {
    redirect(`/checkout/confirmation/${orderId}`);
  }
  if (order.payment.status === "PENDING" && order.payment.provider === "mock") {
    redirect(`/checkout/pay/mock/${orderId}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <p className="text-xs uppercase tracking-editorial text-muted-foreground">
        Payment Failed
      </p>
      <h1 className="mt-2 font-display text-3xl uppercase tracking-editorial">
        Something Went Wrong
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        We couldn&apos;t process payment for order{" "}
        <strong className="text-foreground">{order.orderNumber}</strong>. No
        charge was completed — your cart items have not been billed.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Button
          size="lg"
          className="uppercase tracking-editorial"
          render={<Link href="/cart" />}
        >
          Return to Cart
        </Button>
        <Button variant="ghost" render={<Link href="/women" />}>
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
