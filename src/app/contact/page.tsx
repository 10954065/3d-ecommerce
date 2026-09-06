import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/content-page";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Forme team.",
};

export default function ContactPage() {
  return (
    <ContentPage eyebrow="Contact" title="We're here to help.">
      <p>
        For order questions, sizing advice, or anything else, reach us at{" "}
        <a href="mailto:support@forme.example">support@forme.example</a>. We
        typically respond within one business day.
      </p>
      <h2>Customer service</h2>
      <p>Monday – Friday, 9:00 – 18:00 GMT.</p>
      <h2>Press</h2>
      <p>
        For press inquiries, contact{" "}
        <a href="mailto:press@forme.example">press@forme.example</a>.
      </p>
    </ContentPage>
  );
}
