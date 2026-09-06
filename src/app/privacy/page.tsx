import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/content-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Forme collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <ContentPage eyebrow="Legal" title="Privacy Policy">
      <p>Last updated: 2026.</p>
      <h2>What we collect</h2>
      <p>
        Account details (name, email), order and shipping information, and
        interaction data with our 3D fitting tools (selected sizes, colors,
        and viewing sessions) used to improve product recommendations and
        catalog quality.
      </p>
      <h2>How we use it</h2>
      <p>
        To fulfill orders, operate your account, and understand which
        products and fits customers engage with most, so we can make better
        buying and design decisions.
      </p>
      <h2>What we don&apos;t do</h2>
      <p>We do not sell customer data to third parties.</p>
      <h2>Your rights</h2>
      <p>
        You may request a copy or deletion of your data at any time via{" "}
        <a href="mailto:privacy@forme.example">privacy@forme.example</a>.
      </p>
    </ContentPage>
  );
}
