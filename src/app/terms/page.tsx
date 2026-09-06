import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/content-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of Forme and purchases made on it.",
};

export default function TermsPage() {
  return (
    <ContentPage eyebrow="Legal" title="Terms of Service">
      <p>Last updated: 2026.</p>
      <h2>Orders</h2>
      <p>
        All orders are subject to product availability. Prices are shown in
        the currency displayed at checkout and include no hidden fees beyond
        shipping, which is calculated before payment.
      </p>
      <h2>3D fitting experience</h2>
      <p>
        Garment visualizations use standardized body profiles and simulated
        fabric behavior to approximate real-world fit and drape. They are a
        fitting aid, not a guarantee of exact appearance on every body.
      </p>
      <h2>Returns</h2>
      <p>See our <a href="/shipping">Shipping &amp; Returns</a> page for details.</p>
      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent to{" "}
        <a href="mailto:legal@forme.example">legal@forme.example</a>.
      </p>
    </ContentPage>
  );
}
