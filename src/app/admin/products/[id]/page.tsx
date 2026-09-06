import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { ProductColorsEditor } from "@/components/admin/product-colors-editor";
import { ProductVariantsEditor } from "@/components/admin/product-variants-editor";
import { ProductMediaUploader } from "@/components/admin/product-media-uploader";
import { GarmentAssetEditor } from "@/components/admin/garment-asset-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getProductForEdit,
  getBrands,
  getAllCategories,
  getFabricMaterials,
} from "@/lib/queries/admin-products";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, brands, categories, fabricMaterials] = await Promise.all([
    getProductForEdit(id),
    getBrands(),
    getAllCategories(),
    getFabricMaterials(),
  ]);

  if (!product) notFound();

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <Link href="/admin/products" className="text-xs text-muted-foreground hover:underline">
          &larr; All products
        </Link>
        <h1 className="mt-1 font-display text-2xl">{product.name}</h1>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="colors">Colors &amp; Variants</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="3d">3D Asset</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="pt-4">
          <ProductForm
            mode="edit"
            brands={brands}
            categories={categories}
            initialValues={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              description: product.description,
              gender: product.gender,
              fit: product.fit,
              basePrice: Number(product.basePrice),
              compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
              currency: product.currency,
              sku: product.sku,
              brandId: product.brandId,
              categoryId: product.categoryId,
              materialSummary: product.materialSummary ?? "",
              careInstructions: product.careInstructions ?? "",
              status: product.status,
              publish3D: product.publish3D,
            }}
          />
        </TabsContent>

        <TabsContent value="colors" className="flex flex-col gap-8 pt-4">
          <section>
            <h2 className="mb-3 font-medium">Colors</h2>
            <ProductColorsEditor productId={product.id} colors={product.colors} />
          </section>
          <section>
            <h2 className="mb-3 font-medium">Variants</h2>
            <ProductVariantsEditor
              productId={product.id}
              colors={product.colors}
              variants={product.variants}
            />
          </section>
        </TabsContent>

        <TabsContent value="media" className="pt-4">
          <ProductMediaUploader productId={product.id} media={product.media} colors={product.colors} />
        </TabsContent>

        <TabsContent value="3d" className="pt-4">
          <GarmentAssetEditor
            productId={product.id}
            fabricMaterials={fabricMaterials}
            garmentAsset={product.garmentAsset}
            hasVariants={product.variants.length > 0}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
