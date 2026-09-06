import Link from "next/link";
import type { Metadata } from "next";
import { getCartSummary } from "@/lib/cart";
import { computeCart } from "@/lib/checkout";
import { CartItems } from "@/components/cart/cart-items";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Your Bag — Forme",
};

export default async function CartPage() {
  const { cart, itemCount } = await getCartSummary();
  const { items, subtotal, currency } = computeCart(cart);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-10">
      <h1 className="font-display text-3xl uppercase tracking-editorial">
        Your Bag
      </h1>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">Your bag is empty.</p>
          <Button size="lg" className="uppercase tracking-editorial" render={<Link href="/women" />}>
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
          <CartItems items={items} currency={currency} />
          <OrderSummary subtotal={subtotal} currency={currency} itemCount={itemCount} />
        </div>
      )}
    </div>
  );
}
