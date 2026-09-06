"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import {
  createColorAction,
  deleteColorAction,
  updateColorAction,
  type ActionResult,
} from "@/app/admin/products/color-actions";

interface ProductColor {
  id: string;
  name: string;
  hexCode: string;
}

interface ProductColorsEditorProps {
  productId: string;
  colors: ProductColor[];
}

const INITIAL_STATE: ActionResult = { success: false };

export function ProductColorsEditor({ productId, colors }: ProductColorsEditorProps) {
  const createAction = createColorAction.bind(null, productId);
  const [state, formAction, isPending] = useActionState(createAction, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Color added.");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {colors.length === 0 && <p className="text-sm text-muted-foreground">No colors yet.</p>}
        {colors.map((color) => (
          <ColorRow key={color.id} productId={productId} color={color} />
        ))}
      </ul>

      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="new-color-name" className="text-xs">Name</Label>
          <Input id="new-color-name" name="name" placeholder="e.g. Midnight Black" className="w-40" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="new-color-hex" className="text-xs">Hex</Label>
          <Input id="new-color-hex" name="hexCode" type="color" defaultValue="#1a1a1a" className="h-8 w-16 p-1" required />
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          Add color
        </Button>
      </form>
    </div>
  );
}

function ColorRow({ productId, color }: { productId: string; color: ProductColor }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete color "${color.name}"? This also removes its variants.`)) return;
    startTransition(async () => {
      const result = await deleteColorAction(productId, color.id);
      if (result.success) toast.success("Color deleted.");
      else toast.error(result.error);
    });
  }

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateColorAction(productId, color.id, formData);
      if (result.success) {
        toast.success("Color updated.");
        setEditing(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (editing) {
    return (
      <li className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-2">
        <form action={handleUpdate} className="flex flex-wrap items-end gap-2">
          <Input name="name" defaultValue={color.name} className="w-40" required />
          <Input name="hexCode" type="color" defaultValue={color.hexCode} className="h-8 w-16 p-1" required />
          <Button type="submit" size="sm" disabled={isPending}>Save</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-border p-2">
      <div className="flex items-center gap-2">
        <span className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: color.hexCode }} />
        <button type="button" className="text-sm hover:underline" onClick={() => setEditing(true)}>
          {color.name}
        </button>
        <span className="text-xs text-muted-foreground">{color.hexCode}</span>
      </div>
      <Button size="icon-sm" variant="ghost" disabled={isPending} onClick={handleDelete} aria-label={`Delete ${color.name}`}>
        <Trash2 className="text-destructive" />
      </Button>
    </li>
  );
}
