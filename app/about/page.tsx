import type { Metadata } from "next";
import { aboutContent } from "@/data/about";
import { AboutPageView } from "@/src/components/about/about-page-view";
import { JsonLd } from "@/src/components/seo/json-ld";
import { SiteHeader } from "@/src/components/layout/site-header";
import {
  buildPageMetadata,
  generateAboutSeo,
  personJsonLd,
  resolveSeoField,
} from "@/src/lib/seo";
import {
  getSiteSettings,
  resolveAboutPortrait,
} from "@/src/services/site/get-site-settings";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const generated = generateAboutSeo(aboutContent.bioParagraphs[0]);
  const portrait = resolveAboutPortrait(settings);

  return buildPageMetadata({
    title: resolveSeoField(settings?.about_seo_title, generated.title),
    description: resolveSeoField(
      settings?.about_seo_description,
      generated.description,
    ),
    path: "/about",
    images: portrait.src
      ? [{ url: portrait.src, alt: portrait.alt }]
      : undefined,
  });
}

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const portrait = resolveAboutPortrait(settings);

  return (
    <>
      <JsonLd json={personJsonLd({ portraitUrl: portrait.src })} />
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
