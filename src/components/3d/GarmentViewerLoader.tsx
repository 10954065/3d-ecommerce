"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

/**
 * Dynamically imports the Three.js/R3F viewer so it never lands in the main
 * JS bundle (section 31/37) — pages that show a garment import this loader,
 * never GarmentViewer directly.
 */
export const GarmentViewerLoader = dynamic(
  () => import("./GarmentViewer").then((mod) => mod.GarmentViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-4/5 w-full flex-col items-center justify-center gap-3 bg-[#F5F1EA] sm:aspect-3/4">
        <Loader2 className="h-6 w-6 animate-spin text-ink" strokeWidth={1.5} />
        <p className="text-xs uppercase tracking-editorial text-muted-foreground">
          Preparing your fitting experience
        </p>
      </div>
    ),
  },
);
