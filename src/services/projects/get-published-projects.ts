import { cache } from "react";
import { createPublicClient } from "@/src/lib/supabase/public";
import {
  mapProjectRowToProject,
  mapProjectRowToSummary,
} from "@/src/services/projects/map-project";
import type { Project, ProjectSummary } from "@/types/projects";

const PROJECT_LIST_SELECT =
  "id, title, slug, description, kind, cover_image_path, cover_alt_text, cover_width, cover_height, is_published, is_featured, display_order, seo_title, seo_description, created_at, updated_at";

const PROJECT_SUMMARY_SELECT = `
  id, slug, title, kind, cover_image_path, cover_alt_text, cover_width, cover_height, display_order, is_published,
  project_videos (
    mux_playback_id, status, display_order
  )
`;

/** Home stream: cover + slim videos only (no gallery images). */
const PROJECT_HOME_SELECT = `
  ${PROJECT_LIST_SELECT},
  project_videos (
    id, project_id, mux_playback_id, source_path, status, title, display_order
  )
`;

const PROJECT_DETAIL_SELECT = `
  ${PROJECT_LIST_SELECT},
  project_images (
    id, project_id, storage_path, alt_text, caption, width, height, display_order, created_at
  ),
  project_videos (
    id, project_id, mux_asset_id, mux_playback_id, mux_upload_id, source_path, status, title, caption, display_order, created_at, updated_at
  )
`;

/**
 * Published projects for public lists (lean media for tiles).
 */
export async function getPublishedProjects(): Promise<Project[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_HOME_SELECT)
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load published projects: ${error.message}`);
  }

  return (data ?? []).map(mapProjectRowToProject);
}

/** Featured subset of published projects (home media stream). */
export async function getPublishedFeaturedProjects(): Promise<Project[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_HOME_SELECT)
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load featured published projects: ${error.message}`,
    );
  }

  return (data ?? []).map(mapProjectRowToProject);
}

/** Thin published list for the projects overlay (cover + Mux playback id). */
export async function getPublishedProjectSummaries(): Promise<
  ProjectSummary[]
> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SUMMARY_SELECT)
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load published project summaries: ${error.message}`,
    );
  }

  return (data ?? []).map(mapProjectRowToSummary);
}

/** Deduped within a single request (metadata + page share one DB round-trip). */
export const getPublishedProjectBySlug = cache(
  async (slug: string): Promise<Project | null> => {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_DETAIL_SELECT)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to load published project "${slug}": ${error.message}`,
      );
    }

    if (!data) {
      return null;
    }

    return mapProjectRowToProject(data);
  },
);

export async function getPublishedProjectSlugs(): Promise<string[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("projects")
    .select("slug")
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load published project slugs: ${error.message}`);
  }

  return (data ?? []).map((row) => row.slug);
}

export async function getPublishedSitemapEntries(): Promise<
  Array<{ slug: string; updatedAt: string }>
> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("projects")
    .select("slug, updated_at")
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load published sitemap entries: ${error.message}`,
    );
  }

  return (data ?? []).map((row) => ({
    slug: row.slug,
    updatedAt: row.updated_at,
  }));
}
