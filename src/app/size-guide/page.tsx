import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/content-page";
import { getTenantDb } from "@/lib/db";

export const metadata: Metadata = {
  title: "Size Guide",
  description: "Standardized body measurements behind every Forme size, for men and women.",
};

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export default async function SizeGuidePage() {
  const db = await getTenantDb();
  const mannequins = await db.mannequin.findMany({
    where: { bodyType: "standard" },
    orderBy: { heightCm: "asc" },
  });

  const men = mannequins
    .filter((m) => m.gender === "MEN")
    .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));
  const women = mannequins
    .filter((m) => m.gender === "WOMEN")
    .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));

  return (
    <ContentPage eyebrow="Size Guide" title="Every size, precisely measured.">
      <p>
        Every product on Forme is fitted against these seven standardized
        body profiles per gender — not a single idealized model. Open any
        product&apos;s 3D viewer and switch sizes to see the garment
        actually redrape on the corresponding profile.
      </p>
      {[
        { label: "Men", rows: men },
        { label: "Women", rows: women },
      ].map((section) => (
        <div key={section.label}>
          <h2>{section.label}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-editorial text-muted-foreground">
                  <th className="py-2 pr-4">Size</th>
                  <th className="py-2 pr-4">Height (cm)</th>
                  <th className="py-2 pr-4">Chest/Bust (cm)</th>
                  <th className="py-2 pr-4">Waist (cm)</th>
                  <th className="py-2">Hips (cm)</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 font-medium text-foreground">{row.size}</td>
                    <td className="py-2 pr-4">{row.heightCm}</td>
                    <td className="py-2 pr-4">{row.chestCm}</td>
                    <td className="py-2 pr-4">{row.waistCm}</td>
                    <td className="py-2">{row.hipsCm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </ContentPage>
  );
}
