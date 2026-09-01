import type { Metadata } from "next";
import { HomeShell } from "@/src/components/home/home-shell";
import { JsonLd } from "@/src/components/seo/json-ld";
import {
  buildPageMetadata,
  generateHomeSeo,
  personJsonLd,
  resolveSeoField,
} from "@/src/lib/seo";
import { getPublishedFeaturedProjects } from "@/src/services/projects/get-published-projects";
import {
  getSiteSettings,
  resolveAboutPortrait,
} from "@/src/services/site/get-site-settings";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const generated = generateHomeSeo();
  const portrait = resolveAboutPortrait(settings);

  return buildPageMetadata({
    title: resolveSeoField(settings?.home_seo_title, generated.title),
    description: resolveSeoField(
      settings?.home_seo_description,
      generated.description,
    ),
    path: "/",
    absoluteTitle: true,
    images: portrait.src
      ? [{ url: portrait.src, alt: portrait.alt }]
      : undefined,
  });
}

export default async function Home() {
  const [featuredProjects, settings] = await Promise.all([
    getPublishedFeaturedProjects(),
    getSiteSettings(),
  ]);
  const portrait = resolveAboutPortrait(settings);

  return (
    <>
      <JsonLd json={personJsonLd({ portraitUrl: portrait.src })} />
      <HomeShell projects={featuredProjects} />
    </>
  );
}
