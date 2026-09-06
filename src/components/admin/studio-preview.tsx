"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GarmentViewerLoader } from "@/components/3d/GarmentViewerLoader";
import { getGarmentPreviewAction } from "@/app/admin/3d-studio/actions";
import type { getGarmentPreviewProps } from "@/lib/queries/admin-3d-studio";

type PreviewData = Awaited<ReturnType<typeof getGarmentPreviewProps>>;

interface StudioPreviewProps {
  products: { id: string; name: string }[];
}

export function StudioPreview({ products }: StudioPreviewProps) {
  const [preview, setPreview] = useState<PreviewData>(null);
  const [notReady, setNotReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSelect(productId: string) {
    setNotReady(false);
    startTransition(async () => {
      const data = await getGarmentPreviewAction(productId);
      if (!data) {
        setPreview(null);
        setNotReady(true);
        return;
      }
      setPreview(data);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Select onValueChange={(v) => handleSelect(v as string)}>
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue placeholder="Select a product to preview">
            {(v: string) => products.find((p) => p.id === v)?.name ?? "Select a product to preview"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {products.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isPending && (
        <div className="flex aspect-4/5 w-full max-w-md items-center justify-center rounded-lg border border-border bg-muted">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && notReady && (
        <p className="text-sm text-muted-foreground">
          This product&apos;s garment asset is not ready for preview yet — it needs at least one
          color and one size mapped to a mannequin. Save it from the product&apos;s 3D Asset tab.
        </p>
      )}

      {!isPending && preview && (
        <div className="max-w-md">
          <GarmentViewerLoader {...preview} />
        </div>
      )}
    </div>
  );
}
