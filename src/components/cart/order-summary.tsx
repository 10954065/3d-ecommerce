import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";

interface OrderSummaryProps {
  subtotal: number;
  currency: string;
  itemCount: number;
  checkoutHref?: string;
}

export function OrderSummary({
  subtotal,
  currency,
  itemCount,
  checkoutHref = "/checkout",
}: OrderSummaryProps) {
  return (
    <div className="h-fit border border-border p-6">
      <h2 className="font-display text-lg uppercase tracking-editorial">
        Order Summary
      </h2>
      <dl className="mt-6 flex flex-col gap-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </dt>
          <dd>{formatMoney(subtotal, currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="text-muted-foreground">Calculated at checkout</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Tax</dt>
          <dd className="text-muted-foreground">Calculated at checkout</dd>
        </div>
      </dl>
      <div className="mt-6 flex justify-between border-t border-border pt-4 text-sm font-medium">
        <span>Estimated total</span>
        <span>{formatMoney(subtotal, currency)}</span>
      </div>
      <Button
        size="lg"
        className="mt-6 w-full uppercase tracking-editorial"
        render={<Link href={checkoutHref} />}
      >
        Proceed to Checkout
      </Button>
    </div>
  );
}
