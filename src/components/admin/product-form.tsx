"use client";

import { useActionState, useEffect, useState } from "react";
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
import { slugify } from "@/lib/slugify";
import { createProductAction, updateProductAction, type ProductFormState } from "@/app/admin/products/actions";

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  gender: "MEN" | "WOMEN" | "UNISEX";
}

interface ProductFormValues {
  id?: string;
  name: string;
  slug: string;
  description: string;
  gender: "MEN" | "WOMEN" | "UNISEX";
  fit: "SLIM" | "REGULAR" | "RELAXED" | "OVERSIZED";
  basePrice: number;
  compareAtPrice: number | null;
  currency: string;
  sku: string;
  brandId: string;
  categoryId: string;
  materialSummary: string;
  careInstructions: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publish3D: boolean;
}

interface ProductFormProps {
  mode: "create" | "edit";
  brands: Brand[];
  categories: Category[];
  initialValues?: ProductFormValues;
}

const EMPTY_VALUES: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  gender: "UNISEX",
  fit: "REGULAR",
  basePrice: 0,
  compareAtPrice: null,
  currency: "GHS",
  sku: "",
  brandId: "",
  categoryId: "",
  materialSummary: "",
  careInstructions: "",
  status: "DRAFT",
  publish3D: false,
};

const INITIAL_STATE: ProductFormState = { success: false };

// Base UI's <Select.Value> displays the raw stored value unless given a
// render function, so every enum select needs an explicit label lookup.
const GENDER_LABELS: Record<string, string> = { MEN: "Men", WOMEN: "Women", UNISEX: "Unisex" };
const FIT_LABELS: Record<string, string> = {
  SLIM: "Slim",
  REGULAR: "Regular",
  RELAXED: "Relaxed",
  OVERSIZED: "Oversized",
};
const STATUS_LABELS: Record<string, string> = { DRAFT: "Draft", PUBLISHED: "Published", ARCHIVED: "Archived" };

export function ProductForm({ mode, brands, categories, initialValues }: ProductFormProps) {
  const values = initialValues ?? EMPTY_VALUES;
  const action =
    mode === "create" ? createProductAction : updateProductAction.bind(null, values.id ?? "");
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  const [name, setName] = useState(values.name);
  const [slug, setSlug] = useState(values.slug);
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [gender, setGender] = useState(values.gender);

  useEffect(() => {
    if (state.success) {
      toast.success("Product saved.");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const filteredCategories = categories.filter((c) => c.gender === gender);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugEdited) setSlug(slugify(e.target.value));
            }}
            required
          />
          {state.fieldErrors?.name && <p className="text-xs text-destructive">{state.fieldErrors.name}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            required
          />
          {state.fieldErrors?.slug && <p className="text-xs text-destructive">{state.fieldErrors.slug}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={values.description}
          required
          rows={4}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {state.fieldErrors?.description && (
          <p className="text-xs text-destructive">{state.fieldErrors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Gender</Label>
          <Select name="gender" value={gender} onValueChange={(v) => setGender(v as typeof gender)}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string) => GENDER_LABELS[v] ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MEN">Men</SelectItem>
              <SelectItem value="WOMEN">Women</SelectItem>
              <SelectItem value="UNISEX">Unisex</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Fit</Label>
          <Select name="fit" defaultValue={values.fit}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string) => FIT_LABELS[v] ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SLIM">Slim</SelectItem>
              <SelectItem value="REGULAR">Regular</SelectItem>
              <SelectItem value="RELAXED">Relaxed</SelectItem>
              <SelectItem value="OVERSIZED">Oversized</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select name="categoryId" defaultValue={values.categoryId} key={gender}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category">
                {(v: string) => categories.find((c) => c.id === v)?.name ?? "Select category"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.categoryId && (
            <p className="text-xs text-destructive">{state.fieldErrors.categoryId}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basePrice">Base price</Label>
          <Input id="basePrice" name="basePrice" type="number" step="0.01" min="0" defaultValue={values.basePrice} required />
          {state.fieldErrors?.basePrice && <p className="text-xs text-destructive">{state.fieldErrors.basePrice}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="compareAtPrice">Compare-at price</Label>
          <Input
            id="compareAtPrice"
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={values.compareAtPrice ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" name="currency" maxLength={3} defaultValue={values.currency} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" defaultValue={values.sku} required />
          {state.fieldErrors?.sku && <p className="text-xs text-destructive">{state.fieldErrors.sku}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brandId">Brand</Label>
        <Select name="brandId" defaultValue={values.brandId}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select brand">
              {(v: string) => brands.find((b) => b.id === v)?.name ?? "Select brand"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.brandId && <p className="text-xs text-destructive">{state.fieldErrors.brandId}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="materialSummary">Material summary</Label>
          <Input id="materialSummary" name="materialSummary" defaultValue={values.materialSummary} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="careInstructions">Care instructions</Label>
          <textarea
            id="careInstructions"
            name="careInstructions"
            defaultValue={values.careInstructions}
            rows={2}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select name="status" defaultValue={values.status}>
            <SelectTrigger className="w-40">
              <SelectValue>{(v: string) => STATUS_LABELS[v] ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <label className="flex items-center gap-2 pt-5 text-sm">
          <input type="checkbox" name="publish3D" defaultChecked={values.publish3D} className="h-4 w-4 rounded border-input" />
          Publish 3D Experience
        </label>
      </div>
      <p className="-mt-4 max-w-xl text-xs text-muted-foreground">
        Controls whether the storefront 3D viewer is enabled for this product. Requires a ready
        garment asset (fabric, archetype, and sizes) below.
      </p>

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : mode === "create" ? "Create product" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
