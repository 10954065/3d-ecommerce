import { ProductForm } from "@/components/admin/product-form";
import { getBrands, getAllCategories } from "@/lib/queries/admin-products";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([getBrands(), getAllCategories()]);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 font-display text-2xl">New product</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Colors, variants, media, and the 3D garment asset can be added once the product is created.
      </p>
      <ProductForm mode="create" brands={brands} categories={categories} />
    </div>
  );
}
