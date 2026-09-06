import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/content-page";

export const metadata: Metadata = {
  title: "About",
  description: "Forme is a fashion house built around one idea: you should be able to see and feel a garment before it arrives.",
};

export default function AboutPage() {
  return (
    <ContentPage eyebrow="About Forme" title="Fashion you can see before it arrives.">
      <p>
        Forme was built around a simple frustration: online, every garment
        looks the same — flat, static, and disconnected from how it will
        actually move on a body. We build our entire product experience
        around standardized 3D mannequins, real fabric behavior, and
        interactive fitting, so the question &quot;what will this actually
        look like on me?&quot; has a real answer before checkout.
      </p>
      <h2>What we make</h2>
      <p>
        Each collection is designed in-house and produced in small runs
        across natural fibers — cotton, silk, wool, linen, and leather —
        chosen deliberately because they behave differently, and our fitting
        experience is built to show that difference.
      </p>
      <h2>How we build the fitting experience</h2>
      <p>
        Every product on Forme is modeled against seven standardized body
        profiles per gender, each with real measurements rather than a
        single idealized figure. Garment drape and movement are simulated in
        real time based on each fabric&apos;s physical properties, so a silk
        slip dress genuinely moves differently than a wool coat.
      </p>
    </ContentPage>
  );
}
