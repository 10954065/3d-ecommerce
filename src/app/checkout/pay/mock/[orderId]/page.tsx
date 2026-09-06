import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { simulateMockPaymentAction } from "@/app/actions/checkout-actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Complete Payment — Forme",
};

interface MockPayPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function MockPayPage({ params }: MockPayPageProps) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });

  if (!order || !order.payment) {
    notFound();
  }

  if (order.payment.provider !== "mock") {
    notFound();
  }

  if (order.payment.status === "PAID") {
    redirect(`/checkout/confirmation/${orderId}`);
  }
  if (order.payment.status === "FAILED") {
    redirect(`/checkout/failed/${orderId}`);
  }

  const simulateSuccess = simulateMockPaymentAction.bind(null, orderId, "success");
  const simulateFailure = simulateMockPaymentAction.bind(null, orderId, "failure");

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-editorial text-muted-foreground">
        Mock Payment · Dev Mode
      </p>
      <h1 className="mt-2 font-display text-2xl uppercase tracking-editorial">
        Complete Payment
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        No real payment gateway is configured. As the developer, choose an
        outcome below to simulate what a gateway webhook would report for
        order <strong className="text-foreground">{order.orderNumber}</strong>.
      </p>

      <div className="mt-8 border border-border p-6">
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
        <div className="mt-4 flex justify-between border-t border-border pt-4 text-sm font-medium">
          <span>Total due</span>
          <span>{formatMoney(order.payment.amount.toString(), order.payment.currency)}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <form action={simulateSuccess}>
          <Button type="submit" size="lg" className="w-full uppercase tracking-editorial">
            Simulate Successful Payment
          </Button>
        </form>
        <form action={simulateFailure}>
          <Button
            type="submit"
            size="lg"
            variant="outline"
            className="w-full uppercase tracking-editorial"
          >
            Simulate Failed Payment
          </Button>
        </form>
      </div>
    </div>
  );
}
