"use client";

import dynamic from "next/dynamic";

export const MannequinEnginePreviewLoader = dynamic(
  () => import("./mannequin-engine-preview").then((mod) => mod.MannequinEnginePreview),
  { ssr: false, loading: () => <div className="aspect-4/5 w-full max-w-md rounded-lg border border-border bg-muted" /> },
);
