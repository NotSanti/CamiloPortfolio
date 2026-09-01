import type { Metadata } from "next";
import { aboutContent } from "@/data/about";
import { AboutPageView } from "@/src/components/about/about-page-view";
import { SiteHeader } from "@/src/components/layout/site-header";
import {
  getSiteSettings,
  resolveAboutPortrait,
} from "@/src/services/site/get-site-settings";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About · Caloid",
  description:
    "Born in Bogotá and based in Montreal, Camilo Luna (CALOID) works across photography and filmmaking.",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const portrait = resolveAboutPortrait(settings);

  return (
    <>
      <SiteHeader mode="about" />
      <main className="flex-1">
        <AboutPageView
          content={{
            ...aboutContent,
            portraitSrc: portrait.src,
            portraitAlt: portrait.alt,
          }}
        />
      </main>
    </>
  );
}
