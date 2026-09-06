"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { GarmentViewerLoader } from "@/components/3d/GarmentViewerLoader";
import type { GarmentArchetype, FitType, FabricPhysicalProps } from "@/components/3d/types";
import { formatMoney } from "@/lib/format";
import { addToCartAction } from "@/app/actions/cart-actions";
import { Button } from "@/components/ui/button";
import { SizeGuide } from "./size-guide";

interface VariantInfo {
  id: string;
  colorId: string;
  size: string;
  stockQuantity: number;
}

interface ProductExperienceProps {
  productId: string;
  productName: string;
  basePrice: number;
  currency: string;
  archetype: GarmentArchetype;
  fit: FitType;
  fabric: FabricPhysicalProps;
  fabricName: string;
  colors: { id: string; name: string; hexCode: string }[];
  sizeOptions: {
    size: string;
    measurements: {
      heightCm: number;
      chestCm: number;
      waistCm: number;
      hipsCm: number;
      shoulderWidthCm: number;
      armLengthCm: number;
      inseamCm: number;
      neckCm: number;
      thighCm: number;
    };
  }[];
  variants: VariantInfo[];
  fallbackImages: { url: string; alt: string }[];
  description: string;
  materialSummary: string | null;
  careInstructions: string | null;
}

export function ProductExperience({
  productId,
  productName,
  basePrice,
  currency,
  archetype,
  fit,
  fabric,
  fabricName,
  colors,
  sizeOptions,
  variants,
  fallbackImages,
  description,
  materialSummary,
  careInstructions,
}: ProductExperienceProps) {
  const [selection, setSelection] = useState({
    colorId: colors[0]?.id ?? "",
    size: sizeOptions.find((s) => s.size === "M")?.size ?? sizeOptions[0]?.size ?? "",
  });
  const [isPending, startTransition] = useTransition();

  const activeVariant = useMemo(
    () => variants.find((v) => v.colorId === selection.colorId && v.size === selection.size),
    [variants, selection],
  );

  function handleAddToCart() {
    if (!activeVariant) {
      toast.error("Select a size and color first.");
      return;
    }
    if (activeVariant.stockQuantity <= 0) {
      toast.error("This size is out of stock.");
      return;
    }
    startTransition(async () => {
      const result = await addToCartAction({ productVariantId: activeVariant.id, quantity: 1 });
      if (result.success) {
        toast.success(`Added ${productName} to your bag.`);
      } else {
        toast.error(result.error ?? "Could not add to bag.");
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
      <GarmentViewerLoader
        productId={productId}
        productName={productName}
        archetype={archetype}
        fit={fit}
        fabric={fabric}
        fabricName={fabricName}
        colors={colors}
        sizes={sizeOptions}
        fallbackImages={fallbackImages}
        onSelectionChange={setSelection}
      />

      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-editorial text-muted-foreground">{fit.toLowerCase()} fit</p>
          <h1 className="mt-1 font-display text-3xl">{productName}</h1>
          <p className="mt-2 text-lg">{formatMoney(basePrice, currency)}</p>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>

        <div className="flex flex-col gap-1 border-t border-border pt-4 text-sm">
          {materialSummary && (
            <p>
              <span className="text-muted-foreground">Material — </span>
              {materialSummary}
            </p>
          )}
          {careInstructions && (
            <p>
              <span className="text-muted-foreground">Care — </span>
              {careInstructions}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs">
            {activeVariant
              ? activeVariant.stockQuantity > 0
                ? `${activeVariant.stockQuantity} in stock`
                : "Out of stock"
              : "Select a size"}
          </p>
          <SizeGuide sizeOptions={sizeOptions} />
        </div>

        <Button
          size="lg"
          className="w-full uppercase tracking-editorial"
          onClick={handleAddToCart}
          disabled={isPending || !activeVariant || activeVariant.stockQuantity <= 0}
        >
          {isPending ? "Adding…" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
