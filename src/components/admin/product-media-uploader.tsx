"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { uploadMediaAction, deleteMediaAction } from "@/app/admin/products/media-actions";
import type { ActionResult } from "@/app/admin/products/color-actions";

interface ProductMedia {
  id: string;
  url: string;
  altText: string | null;
  colorId: string | null;
}

interface ProductMediaUploaderProps {
  productId: string;
  media: ProductMedia[];
  colors: { id: string; name: string }[];
}

const INITIAL_STATE: ActionResult = { success: false };

export function ProductMediaUploader({ productId, media, colors }: ProductMediaUploaderProps) {
  const action = uploadMediaAction.bind(null, productId);
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Image uploaded.");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      {media.length === 0 ? (
        <p className="text-sm text-muted-foreground">No images yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {media.map((item) => (
            <MediaTile key={item.id} productId={productId} item={item} />
          ))}
        </div>
      )}

      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="media-file" className="text-xs font-medium">Image file</label>
          <input
            id="media-file"
            name="file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            className="text-sm file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-xs"
          />
        </div>
        {colors.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Color (optional)</label>
            <Select name="colorId">
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Any color">
                  {(v: string) => colors.find((c) => c.id === v)?.name ?? "Any color"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {colors.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Uploading..." : "Upload"}
        </Button>
      </form>
    </div>
  );
}

function MediaTile({ productId, item }: { productId: string; item: ProductMedia }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this image?")) return;
    startTransition(async () => {
      const result = await deleteMediaAction(productId, item.id);
      if (result.success) toast.success("Image deleted.");
      else toast.error(result.error);
    });
  }

  return (
    <div className="group relative aspect-4/5 overflow-hidden rounded-lg border border-border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt={item.altText ?? "Product image"} className="h-full w-full object-cover" />
      <Button
        size="icon-sm"
        variant="destructive"
        className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100"
        disabled={isPending}
        onClick={handleDelete}
        aria-label="Delete image"
      >
        <Trash2 />
      </Button>
    </div>
  );
}
