import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { StudioPreview } from "@/components/admin/studio-preview";
import { listGarmentAssets, listProductsWithGarmentAsset } from "@/lib/queries/admin-3d-studio";
import type { AssetStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<AssetStatus, "default" | "secondary" | "outline" | "destructive"> = {
  UPLOADED: "outline",
  PROCESSING: "secondary",
  READY: "default",
  FAILED: "destructive",
  ARCHIVED: "outline",
};

export default async function AdminThreeDStudioPage() {
  const [assets, previewCandidates] = await Promise.all([
    listGarmentAssets(),
    listProductsWithGarmentAsset(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">3D Asset Studio</h1>
          <p className="text-sm text-muted-foreground">
            Every garment asset in the catalog, its readiness, and a live preview before publishing.
          </p>
        </div>
        <Link href="/admin/3d-studio/mannequin-preview" className="whitespace-nowrap text-sm underline underline-offset-4 hover:no-underline">
          Mannequin engine preview (Phase 1 QA) &rarr;
        </Link>
      </div>

      <section className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Archetype</th>
              <th className="px-4 py-3 font-medium">Fabric</th>
              <th className="px-4 py-3 font-medium">Simulation quality</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">3D published</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No garment assets yet. Add one from a product&apos;s 3D Asset tab.
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-muted/50">
                  <td className="px-4 py-2">
                    <Link href={`/admin/products/${asset.product.id}`} className="font-medium hover:underline">
                      {asset.product.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {asset.baseModelUrl.replace("procedural:", "")}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{asset.fabricMaterial.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{asset.simulationQuality}</td>
                  <td className="px-4 py-2">
                    <Badge variant={STATUS_VARIANT[asset.status]}>{asset.status}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={asset.product.publish3D ? "default" : "outline"}>
                      {asset.product.publish3D ? "Published" : "Hidden"}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-3 font-medium">Live preview</h2>
        <StudioPreview products={previewCandidates} />
      </section>
    </div>
  );
}
