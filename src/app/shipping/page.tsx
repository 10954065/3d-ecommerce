import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/content-page";
import { getTenantDb } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Shipping rates and return policy for Forme orders.",
};

export default async function ShippingPage() {
  const db = await getTenantDb();
  const zones = await db.shippingZone.findMany({ orderBy: { name: "asc" } });

  return (
    <ContentPage eyebrow="Shipping & Returns" title="Getting your order to you.">
      <h2>Shipping rates</h2>
      {zones.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {zones.map((zone) => (
            <li key={zone.id} className="flex justify-between border-b border-border py-2 text-sm">
              <span>{zone.name}</span>
              <span className="text-muted-foreground">
                {formatMoney(zone.flatRate, zone.currency)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>Shipping rates are calculated at checkout based on your address.</p>
      )}
      <h2>Delivery times</h2>
      <p>
        Domestic orders typically arrive within 2–4 business days.
        International orders typically arrive within 7–14 business days.
      </p>
      <h2>Returns</h2>
      <p>
        Unworn items in original condition may be returned within 14 days of
        delivery. Contact{" "}
        <a href="mailto:support@forme.example">support@forme.example</a> to
        start a return.
      </p>
    </ContentPage>
  );
}
