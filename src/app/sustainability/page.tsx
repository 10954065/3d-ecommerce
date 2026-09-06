import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/content-page";

export const metadata: Metadata = {
  title: "Sustainability",
  description: "How Forme approaches materials, production, and reducing returns through interactive 3D fitting.",
};

export default function SustainabilityPage() {
  return (
    <ContentPage eyebrow="Sustainability" title="Fewer returns, better materials.">
      <p>
        A meaningful share of the fashion industry&apos;s waste comes from
        returns driven by garments that don&apos;t look or fit as expected.
        Our interactive 3D fitting experience exists partly for that reason:
        the more accurately a customer can preview drape, fit, and movement
        before buying, the fewer garments travel back and forth unworn.
      </p>
      <h2>Materials</h2>
      <p>
        We favor natural, biodegradable fibers — cotton, wool, linen, and
        silk — sourced from mills that disclose their supply chain. Every
        product page lists its exact material composition and care
        instructions rather than a generic blend statement.
      </p>
      <h2>Production</h2>
      <p>
        Collections are produced in small, seasonal runs rather than
        continuous mass production, keeping unsold inventory low.
      </p>
    </ContentPage>
  );
}
