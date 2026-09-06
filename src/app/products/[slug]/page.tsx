import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/products";
import { ProductExperience } from "@/components/product/product-experience";
import { ProductCard } from "@/components/product/product-card";
import { logAnalyticsEvent } from "@/lib/analytics";
import { parseModelSource } from "@/components/3d/types";
import type { GarmentArchetype } from "@/components/3d/types";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.media[0] ? [product.media[0].url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.garmentAsset) {
    notFound();
  }

  await logAnalyticsEvent({ type: "PRODUCT_VIEW", productId: product.id });

  const related = await getRelatedProducts(product.id, product.categoryId);
  const modelSource = parseModelSource(product.garmentAsset.baseModelUrl);
  const archetype: GarmentArchetype = modelSource.kind === "procedural" ? modelSource.archetype : "tshirt";

  const sizeOptions = product.garmentAsset.garmentSizes.map((gs) => ({
    size: gs.mannequin.size,
    measurements: {
      heightCm: gs.mannequin.heightCm,
      chestCm: gs.mannequin.chestCm,
      waistCm: gs.mannequin.waistCm,
      hipsCm: gs.mannequin.hipsCm,
      shoulderWidthCm: gs.mannequin.shoulderWidthCm,
      armLengthCm: gs.mannequin.armLengthCm,
      inseamCm: gs.mannequin.inseamCm,
      neckCm: gs.mannequin.neckCm,
      thighCm: gs.mannequin.thighCm,
    },
  }));

  const variants = product.variants.map((v) => ({
    id: v.id,
    colorId: v.colorId,
    size: v.size,
    stockQuantity: v.stockQuantity,
  }));

  const fabric = product.garmentAsset.fabricMaterial;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand.name },
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: product.basePrice.toString(),
      availability: variants.some((v) => v.stockQuantity > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <ProductExperience
        productId={product.id}
        productName={product.name}
        basePrice={Number(product.basePrice)}
        currency={product.currency}
        archetype={archetype}
        fit={product.fit}
        fabric={{
          massGsm: fabric.massGsm,
          friction: fabric.friction,
          stiffness: fabric.stiffness,
          bendingResistance: fabric.bendingResistance,
          stretchResistance: fabric.stretchResistance,
          damping: fabric.damping,
          elasticity: fabric.elasticity,
          drape: fabric.drape as "low" | "medium" | "high",
        }}
        fabricName={fabric.name}
        colors={product.colors.map((c) => ({ id: c.id, name: c.name, hexCode: c.hexCode }))}
        sizeOptions={sizeOptions}
        variants={variants}
        fallbackImages={product.media
          .filter((m) => m.type === "IMAGE")
          .map((m) => ({ url: m.url, alt: m.altText ?? product.name }))}
        description={product.description}
        materialSummary={product.materialSummary}
        careInstructions={product.careInstructions}
      />

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-xl uppercase tracking-editorial">
            You may also like
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
