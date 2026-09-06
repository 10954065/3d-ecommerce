"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertGarmentAssetAction } from "@/app/admin/products/garment-actions";
import type { ActionResult } from "@/app/admin/products/color-actions";

const ARCHETYPES = ["tshirt", "shirt", "trousers", "jacket", "coat", "dress", "skirt", "jumpsuit"] as const;

interface FabricMaterial {
  id: string;
  name: string;
}

interface GarmentAssetEditorProps {
  productId: string;
  fabricMaterials: FabricMaterial[];
  garmentAsset: {
    fabricMaterialId: string;
    baseModelUrl: string;
    simulationQuality: "PERFORMANCE" | "ENHANCED" | "CINEMATIC";
    status: string;
    garmentSizes: { mannequin: { size: string } }[];
  } | null;
  hasVariants: boolean;
}

const INITIAL_STATE: ActionResult = { success: false };

// Base UI's <Select.Value> displays the raw stored value unless given a
// render function, so the enum select needs an explicit label lookup.
const SIMULATION_QUALITY_LABELS: Record<string, string> = {
  PERFORMANCE: "Performance",
  ENHANCED: "Enhanced",
  CINEMATIC: "Cinematic",
};

function archetypeFromUrl(url: string | undefined): string {
  if (!url) return ARCHETYPES[0];
  return url.startsWith("procedural:") ? url.replace("procedural:", "") : ARCHETYPES[0];
}

export function GarmentAssetEditor({ productId, fabricMaterials, garmentAsset, hasVariants }: GarmentAssetEditorProps) {
  const action = upsertGarmentAssetAction.bind(null, productId);
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  useEffect(() => {
    if (state.success) toast.success("Garment asset saved.");
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      {garmentAsset && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Status:</span>
          <Badge variant={garmentAsset.status === "READY" ? "default" : "outline"}>{garmentAsset.status}</Badge>
          <span className="text-muted-foreground">
            {garmentAsset.garmentSizes.length} size(s) mapped to mannequins
          </span>
        </div>
      )}

      {!hasVariants && (
        <p className="text-xs text-muted-foreground">
          Add at least one color and size variant first — GarmentSize rows are generated from the
          product&apos;s current variant sizes.
        </p>
      )}

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Fabric material</Label>
          <Select name="fabricMaterialId" defaultValue={garmentAsset?.fabricMaterialId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select fabric">
                {(v: string) => fabricMaterials.find((f) => f.id === v)?.name ?? "Select fabric"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {fabricMaterials.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Garment archetype</Label>
          <Select name="archetype" defaultValue={archetypeFromUrl(garmentAsset?.baseModelUrl)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ARCHETYPES.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Simulation quality</Label>
          <Select name="simulationQuality" defaultValue={garmentAsset?.simulationQuality ?? "PERFORMANCE"}>
            <SelectTrigger className="w-40">
              <SelectValue>{(v: string) => SIMULATION_QUALITY_LABELS[v] ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERFORMANCE">Performance</SelectItem>
              <SelectItem value="ENHANCED">Enhanced</SelectItem>
              <SelectItem value="CINEMATIC">Cinematic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : garmentAsset ? "Update garment asset" : "Create garment asset"}
        </Button>
      </form>
    </div>
  );
}
