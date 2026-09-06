import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/catalog-page";
import type { CatalogSearchParams } from "@/components/catalog/types";

export const metadata: Metadata = {
  title: "Menswear | Forme",
  description:
    "Shop Forme menswear — tailoring, denim, knitwear and outerwear, shown true to fabric in interactive 3D.",
};

interface MenPageProps {
  searchParams: Promise<CatalogSearchParams>;
}

export default async function MenPage({ searchParams }: MenPageProps) {
  const params = await searchParams;

  return (
    <CatalogPage
      gender="MEN"
      basePath="/men"
      title="Menswear"
      description="Tailoring, denim, knitwear and outerwear — cut for movement and shown true to fabric on standardized mannequins."
      searchParams={params}
    />
  );
}
