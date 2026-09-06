import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/content-page";

export const metadata: Metadata = {
  title: "Careers",
  description: "Open roles at Forme, across design, engineering, and operations.",
};

export default function CareersPage() {
  return (
    <ContentPage eyebrow="Careers" title="Build the future of fitting.">
      <p>
        We&apos;re a small team working at the intersection of fashion and
        real-time 3D graphics — garment technologists, 3D engineers, and
        designers who believe online shopping can do better than a flat
        photo grid.
      </p>
      <h2>Open roles</h2>
      <p>
        We don&apos;t have open roles listed at the moment. If you&apos;d
        like to introduce yourself anyway, reach out via{" "}
        <a href="mailto:careers@forme.example">careers@forme.example</a>.
      </p>
    </ContentPage>
  );
}
