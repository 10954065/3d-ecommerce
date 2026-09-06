"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getTenantDb } from "@/lib/db";
import { getTenantId } from "@/lib/tenant/context";
import { requireAdminSession, UNAUTHORIZED_ERROR } from "@/lib/admin-guard";
import { slugify } from "@/lib/slugify";

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200),
  description: z.string().min(1, "Description is required"),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]),
  fit: z.enum(["SLIM", "REGULAR", "RELAXED", "OVERSIZED"]),
  basePrice: z.coerce.number().positive("Base price must be greater than 0"),
  compareAtPrice: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
  currency: z.string().min(3).max(3),
  sku: z.string().min(1, "SKU is required").max(64),
  brandId: z.string().min(1, "Brand is required"),
  categoryId: z.string().min(1, "Category is required"),
  materialSummary: z.string().optional(),
  careInstructions: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  publish3D: z.coerce.boolean(),
});

export interface ProductFormState {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || slugify(String(formData.get("name") ?? "")),
    description: formData.get("description"),
    gender: formData.get("gender"),
    fit: formData.get("fit"),
    basePrice: formData.get("basePrice"),
    compareAtPrice: formData.get("compareAtPrice") ?? "",
    currency: formData.get("currency") || "GHS",
    sku: formData.get("sku"),
    brandId: formData.get("brandId"),
    categoryId: formData.get("categoryId"),
    materialSummary: formData.get("materialSummary") || undefined,
    careInstructions: formData.get("careInstructions") || undefined,
    status: formData.get("status"),
    publish3D: formData.get("publish3D") === "on" || formData.get("publish3D") === "true",
  });
}

function flattenFieldErrors(error: z.ZodError): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !flat[key]) flat[key] = issue.message;
  }
  return flat;
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: UNAUTHORIZED_ERROR };

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields.", fieldErrors: flattenFieldErrors(parsed.error) };
  }

  let createdId: string;
  try {
    const [db, tenantId] = await Promise.all([getTenantDb(), getTenantId()]);
    const created = await db.product.create({
      data: {
        tenantId,
        ...parsed.data,
        compareAtPrice: parsed.data.compareAtPrice ?? null,
      },
    });
    createdId = created.id;
  } catch (error) {
    return { success: false, error: describeUniqueConstraintError(error) };
  }

  revalidatePath("/admin/products");
  redirect(`/admin/products/${createdId}`);
}

export async function updateProductAction(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: UNAUTHORIZED_ERROR };

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields.", fieldErrors: flattenFieldErrors(parsed.error) };
  }

  try {
    const db = await getTenantDb();
    await db.product.update({
      where: { id: productId },
      data: {
        ...parsed.data,
        compareAtPrice: parsed.data.compareAtPrice ?? null,
      },
    });
  } catch (error) {
    return { success: false, error: describeUniqueConstraintError(error) };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

function describeUniqueConstraintError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  ) {
    return "That slug or SKU is already in use by another product.";
  }
  return error instanceof Error ? error.message : "Something went wrong saving the product.";
}
