import { MannequinEnginePreviewLoader } from "@/components/admin/mannequin-engine-preview-loader";

export const dynamic = "force-dynamic";

export default function MannequinEnginePreviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Mannequin Engine Preview</h1>
        <p className="text-sm text-muted-foreground">
          Internal QA view for the Phase 1 procedural mannequin engine (real skeleton, lofted
          geometry, no primitives) — not linked from any customer-facing page yet. See
          docs/MANNEQUIN_SYSTEM.md.
        </p>
      </div>
      <MannequinEnginePreviewLoader />
    </div>
  );
}
