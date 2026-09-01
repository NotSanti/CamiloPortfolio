"use server";

import { aboutContent } from "@/data/about";
import { createClient } from "@/src/lib/supabase/server";
import {
  clipMetaText,
  generateAboutSeo,
  generateHomeSeo,
  generateProjectSeo,
  META_DESCRIPTION_MAX,
  META_TITLE_MAX,
} from "@/src/lib/seo";
import { getPublishedProjectSlugs } from "@/src/services/projects/get-published-projects";
import { revalidatePublicSeo } from "@/src/services/seo/revalidate";
import { SITE_SETTINGS_ID } from "@/src/services/site/get-site-settings";

async function requireAuthedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  return supabase;
}

export type SeoActionResult = { ok: true } | { ok: false; error: string };

export async function saveSiteSeoAction(input: {
  homeTitle: string;
  homeDescription: string;
  aboutTitle: string;
  aboutDescription: string;
}): Promise<SeoActionResult> {
  const supabase = await requireAuthedClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      home_seo_title: clipMetaText(input.homeTitle, META_TITLE_MAX) || null,
      home_seo_description:
        clipMetaText(input.homeDescription, META_DESCRIPTION_MAX) || null,
      about_seo_title: clipMetaText(input.aboutTitle, META_TITLE_MAX) || null,
      about_seo_description:
        clipMetaText(input.aboutDescription, META_DESCRIPTION_MAX) || null,
    })
    .eq("id", SITE_SETTINGS_ID);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePublicSeo();
  return { ok: true };
}

export async function generateSiteSeoAction(): Promise<SeoActionResult> {
  const home = generateHomeSeo();
  const about = generateAboutSeo(aboutContent.bioParagraphs[0]);
  return saveSiteSeoAction({
    homeTitle: home.title,
    homeDescription: home.description,
    aboutTitle: about.title,
    aboutDescription: about.description,
  });
}

export async function saveProjectSeoAction(input: {
  projectId: string;
  seoTitle: string;
  seoDescription: string;
}): Promise<SeoActionResult> {
  const supabase = await requireAuthedClient();
  const { data, error } = await supabase
    .from("projects")
    .update({
      seo_title: clipMetaText(input.seoTitle, META_TITLE_MAX) || null,
      seo_description:
        clipMetaText(input.seoDescription, META_DESCRIPTION_MAX) || null,
    })
    .eq("id", input.projectId)
    .select("slug")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Project not found." };
  }

  revalidatePublicSeo([data.slug]);
  return { ok: true };
}

export async function generateProjectSeoAction(input: {
  projectId: string;
}): Promise<SeoActionResult> {
  const supabase = await requireAuthedClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, kind, description, slug")
    .eq("id", input.projectId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Project not found." };
  }

  const generated = generateProjectSeo({
    title: data.title,
    kind: data.kind,
    description: data.description,
  });

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      seo_title: generated.title,
      seo_description: generated.description,
    })
    .eq("id", data.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePublicSeo([data.slug]);
  return { ok: true };
}

export async function generateAllProjectSeoAction(): Promise<SeoActionResult> {
  const supabase = await requireAuthedClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, kind, description, slug");

  if (error) {
    return { ok: false, error: error.message };
  }

  const projects = data ?? [];
  const results = await Promise.all(
    projects.map((project) => {
      const generated = generateProjectSeo({
        title: project.title,
        kind: project.kind,
        description: project.description,
      });
      return supabase
        .from("projects")
        .update({
          seo_title: generated.title,
          seo_description: generated.description,
        })
        .eq("id", project.id);
    }),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return { ok: false, error: failed.error.message };
  }

  revalidatePublicSeo(projects.map((project) => project.slug));
  return { ok: true };
}

export async function refreshSeoAction(): Promise<SeoActionResult> {
  await requireAuthedClient();
  const slugs = await getPublishedProjectSlugs();
  revalidatePublicSeo(slugs);
  return { ok: true };
}
