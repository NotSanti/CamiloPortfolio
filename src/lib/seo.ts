import type { Metadata } from "next";
import { aboutContent } from "@/data/about";
import type { ProjectKind } from "@/types/projects";

export const SITE_NAME = "Caloid";
export const PERSON_NAME = "Camilo Luna";
export const DEFAULT_HOME_TITLE = "Caloid";
export const DEFAULT_HOME_DESCRIPTION =
  "Montreal-based photographer and cinematographer Camilo Luna.";
export const DEFAULT_ABOUT_TITLE = "About";
export const DEFAULT_ABOUT_DESCRIPTION =
  "Born in Bogotá and based in Montreal, Camilo Luna (CALOID) works across photography and filmmaking.";

export const META_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 160;

export type SeoFields = {
  title: string;
  description: string;
};

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) {
    return explicit;
  }
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(
    /^https?:\/\//,
    "",
  );
  if (vercelHost) {
    return `https://${vercelHost}`;
  }
  return "http://localhost:3000";
}

export function clipMetaText(value: string, max: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) {
    return normalized;
  }
  const sliced = normalized.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  const clipped = (lastSpace > max * 0.6 ? sliced.slice(0, lastSpace) : sliced)
    .replace(/[.,;:]+$/, "")
    .trim();
  return `${clipped}…`;
}

export function generateHomeSeo(): SeoFields {
  return {
    title: DEFAULT_HOME_TITLE,
    description: clipMetaText(DEFAULT_HOME_DESCRIPTION, META_DESCRIPTION_MAX),
  };
}

export function generateAboutSeo(bioParagraph?: string): SeoFields {
  const description = clipMetaText(
    bioParagraph?.trim() || DEFAULT_ABOUT_DESCRIPTION,
    META_DESCRIPTION_MAX,
  );
  return {
    title: DEFAULT_ABOUT_TITLE,
    description,
  };
}

export function generateProjectSeo(input: {
  title: string;
  kind: ProjectKind;
  description?: string | null;
}): SeoFields {
  const kindLabel = input.kind === "video" ? "film" : "photography";
  const fallback = `${input.title} — ${kindLabel} by ${PERSON_NAME} (CALOID).`;
  return {
    title: clipMetaText(input.title, META_TITLE_MAX),
    description: clipMetaText(
      input.description?.trim() || fallback,
      META_DESCRIPTION_MAX,
    ),
  };
}

export function resolveSeoField(
  stored: string | null | undefined,
  generated: string,
): string {
  const trimmed = stored?.trim();
  return trimmed || generated;
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const base = getSiteUrl();
  if (!path || path === "/") {
    return base;
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  images?: Array<{ url: string; alt?: string }>;
  absoluteTitle?: boolean;
}): Metadata {
  const url = absoluteUrl(input.path);
  const displayTitle = input.absoluteTitle
    ? input.title
    : `${input.title} · ${SITE_NAME}`;
  const images = input.images
    ?.filter((image) => Boolean(image.url))
    .map((image) => ({
      url: absoluteUrl(image.url),
      alt: image.alt,
    }));

  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      type: input.path.startsWith("/work/") ? "article" : "website",
      locale: "en_CA",
      url,
      siteName: SITE_NAME,
      title: displayTitle,
      description: input.description,
      ...(images && images.length > 0 ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description: input.description,
      ...(images && images.length > 0
        ? { images: images.map((image) => image.url) }
        : {}),
    },
  };
}

export function personJsonLd(input: {
  portraitUrl?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PERSON_NAME,
    alternateName: ["CALOID", SITE_NAME],
    jobTitle: "Photographer and cinematographer",
    url: getSiteUrl(),
    image: input.portraitUrl ? absoluteUrl(input.portraitUrl) : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Montreal",
      addressCountry: "CA",
    },
    email: aboutContent.contactEmail,
    sameAs: [
      aboutContent.contactInstagramUrl,
      aboutContent.contactLinkedInUrl,
    ],
  };
}

export function projectJsonLd(input: {
  title: string;
  description: string;
  path: string;
  imageUrl?: string;
  datePublished?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    image: input.imageUrl ? absoluteUrl(input.imageUrl) : undefined,
    datePublished: input.datePublished,
    creator: {
      "@type": "Person",
      name: PERSON_NAME,
      alternateName: SITE_NAME,
    },
  };
}
