import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/catalog-page";
import type { CatalogSearchParams } from "@/components/catalog/types";

export const metadata: Metadata = {
  title: "Womenswear | Forme",
  description:
    "Shop Forme womenswear — dresses, tailoring, knitwear and outerwear, shown true to fabric in interactive 3D.",
};

interface WomenPageProps {
  searchParams: Promise<CatalogSearchParams>;
}

export default async function WomenPage({ searchParams }: WomenPageProps) {
  const params = await searchParams;

  return (
    <CatalogPage
      gender="WOMEN"
      basePath="/women"
      title="Womenswear"
      description="Dresses, tailoring and knitwear — draped, animated and shown true to fabric on standardized mannequins."
      searchParams={params}
    />
  );
}
