import { MannequinEnginePreviewLoader } from "@/components/admin/mannequin-engine-preview-loader";

export const dynamic = "force-dynamic";

export default function MannequinEnginePreviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Mannequin Engine Preview</h1>
        <p className="text-sm text-muted-foreground">
          Internal QA view for the mannequin + garment engine (real skeleton, lofted geometry, no
          primitives) that now also powers the live product page. See docs/MANNEQUIN_SYSTEM.md.
        </p>
      </div>
      <MannequinEnginePreviewLoader />
    </div>
  );
}
