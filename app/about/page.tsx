import type { Metadata } from "next";
import { aboutContent } from "@/data/about";
import { AboutPageView } from "@/src/components/about/about-page-view";
import { SiteHeader } from "@/src/components/layout/site-header";

export const metadata: Metadata = {
  title: "About · Caloid",
  description:
    "Born in Bogotá and based in Montreal, Camilo Luna (CALOID) works across photography and filmmaking.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader mode="about" />
      <main className="flex-1">
        <AboutPageView content={aboutContent} />
      </main>
    </>
  );
}
