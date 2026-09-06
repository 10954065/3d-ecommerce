import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { getTenantDb } from "@/lib/db";
import { getCartSummary } from "@/lib/cart";
import { computeCart } from "@/lib/checkout";
import { logAnalyticsEvent } from "@/lib/analytics";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout — Forme",
};

export default async function CheckoutPage() {
  const { cart } = await getCartSummary();
  const { items, subtotal, currency } = computeCart(cart);

  if (items.length === 0) {
    redirect("/cart");
  }

  await logAnalyticsEvent({ type: "CHECKOUT_STARTED" });

  const [session, db] = await Promise.all([auth(), getTenantDb()]);

  const [savedAddresses, shippingZones] = await Promise.all([
    session?.user?.id
      ? db.address.findMany({
          where: { userId: session.user.id },
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        })
      : Promise.resolve([]),
    db.shippingZone.findMany(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-10">
      <h1 className="font-display text-3xl uppercase tracking-editorial">
        Checkout
      </h1>

      <div className="mt-10">
        <CheckoutForm
          savedAddresses={savedAddresses}
          isSignedIn={Boolean(session?.user?.id)}
          userEmail={session?.user?.email}
          subtotal={subtotal}
          currency={currency}
          shippingZones={shippingZones.map((zone) => ({
            id: zone.id,
            name: zone.name,
            countries: zone.countries,
            flatRate: Number(zone.flatRate),
            currency: zone.currency,
          }))}
        />
      </div>
    </div>
  );
}
