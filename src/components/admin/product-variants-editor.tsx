"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import {
  createVariantAction,
  deleteVariantAction,
  updateVariantAction,
} from "@/app/admin/products/variant-actions";
import type { ActionResult } from "@/app/admin/products/color-actions";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

interface ProductVariant {
  id: string;
  size: string;
  sku: string;
  stockQuantity: number;
  lowStockAt: number;
  isActive: boolean;
  color: { id: string; name: string; hexCode: string };
}

interface ProductVariantsEditorProps {
  productId: string;
  colors: { id: string; name: string }[];
  variants: ProductVariant[];
}

const INITIAL_STATE: ActionResult = { success: false };

export function ProductVariantsEditor({ productId, colors, variants }: ProductVariantsEditorProps) {
  const createAction = createVariantAction.bind(null, productId);
  const [state, formAction, isPending] = useActionState(createAction, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Variant added.");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  if (colors.length === 0) {
    return <p className="text-sm text-muted-foreground">Add a color first, then create size variants.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">No variants yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">Color</th>
                <th className="px-3 py-2 font-medium">Size</th>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Stock</th>
                <th className="px-3 py-2 font-medium">Low at</th>
                <th className="px-3 py-2 font-medium">Active</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {variants.map((variant) => (
                <VariantRow key={variant.id} productId={productId} variant={variant} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Color</Label>
          <Select name="colorId">
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Color">
                {(v: string) => colors.find((c) => c.id === v)?.name ?? "Color"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {colors.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Size</Label>
          <Select name="size">
            <SelectTrigger className="w-24"><SelectValue placeholder="Size" /></SelectTrigger>
            <SelectContent>
              {SIZES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Stock</Label>
          <Input name="stockQuantity" type="number" min="0" defaultValue={0} className="w-24" />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Low stock at</Label>
          <Input name="lowStockAt" type="number" min="0" defaultValue={5} className="w-28" />
        </div>
        <Button type="submit" size="sm" disabled={isPending}>Add variant</Button>
      </form>
    </div>
  );
}

function VariantRow({ productId, variant }: { productId: string; variant: ProductVariant }) {
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(variant.isActive);

  function handleSave(formData: FormData) {
    startTransition(async () => {
      const result = await updateVariantAction(productId, variant.id, formData);
      if (result.success) toast.success("Variant updated.");
      else toast.error(result.error);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete variant ${variant.sku}?`)) return;
    startTransition(async () => {
      const result = await deleteVariantAction(productId, variant.id);
      if (result.success) toast.success("Variant deleted.");
      else toast.error(result.error);
    });
  }

  return (
    <tr>
      <td className="px-3 py-2">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: variant.color.hexCode }} />
          {variant.color.name}
        </span>
      </td>
      <td className="px-3 py-2">{variant.size}</td>
      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{variant.sku}</td>
      <td colSpan={3} className="px-3 py-2">
        <form action={handleSave} className="flex items-center gap-2">
          <Input
            name="stockQuantity"
            type="number"
            min="0"
            defaultValue={variant.stockQuantity}
            className="w-20"
          />
          <Input name="lowStockAt" type="number" min="0" defaultValue={variant.lowStockAt} className="w-20" />
          <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
          <Button type="submit" size="sm" variant="outline" disabled={isPending}>Save</Button>
        </form>
      </td>
      <td className="px-3 py-2 text-right">
        <Button size="icon-sm" variant="ghost" disabled={isPending} onClick={handleDelete} aria-label={`Delete ${variant.sku}`}>
          <Trash2 className="text-destructive" />
        </Button>
      </td>
    </tr>
  );
}
