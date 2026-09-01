"use server";

import { revalidatePath } from "next/cache";
import { createMuxClient } from "@/src/lib/mux/server";
import { createClient } from "@/src/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LIBRARY_PAGE_SIZE = 12;

export type MuxLibraryAsset = {
  assetId: string;
  playbackId: string | null;
  status: "preparing" | "ready" | "errored";
  duration: number | null;
  createdAt: string | null;
  aspectRatio: string | null;
  title: string;
  usedByProjectIds: string[];
  usedByProjectTitles: string[];
  alreadyOnThisProject: boolean;
};

export type ListMuxLibraryResult =
  | { ok: true; assets: MuxLibraryAsset[]; nextCursor: string | null }
  | { ok: false; error: string };

export type AttachMuxAssetResult =
  | { ok: true }
  | { ok: false; error: string };

export type HardDeleteMuxAssetResult =
  | { ok: true; removedRows: number }
  | { ok: false; error: string };

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

function muxErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function firstPublicPlaybackId(
  playbackIds:
    | Array<{ id: string; policy?: string | null }>
    | null
    | undefined,
): string | null {
  if (!playbackIds?.length) {
    return null;
  }
  const publicId = playbackIds.find((item) => item.policy === "public");
  return publicId?.id ?? playbackIds[0]?.id ?? null;
}

function assetTitle(asset: {
  id: string;
  passthrough?: string | null;
  meta?: { title?: string | null } | null;
}): string {
  const metaTitle = asset.meta?.title?.trim();
  if (metaTitle) {
    return metaTitle;
  }

  const passthrough = asset.passthrough?.trim();
  if (passthrough && !UUID_RE.test(passthrough)) {
    return passthrough;
  }

  return `Mux ${asset.id.slice(0, 8)}`;
}

function revalidateProjectVideos(projectId: string, slug?: string | null) {
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/", "layout");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/work/${slug}`);
  }
}

/**
 * List Mux Video assets for the CMS library browser.
 */
export async function listMuxLibraryAction(input: {
  projectId: string;
  cursor?: string | null;
}): Promise<ListMuxLibraryResult> {
  try {
    await requireAuthedClient();
  } catch {
    return { ok: false, error: "Authentication required." };
  }

  const projectId = input.projectId.trim();
  if (!projectId) {
    return { ok: false, error: "projectId is required." };
  }

  let mux;
  try {
    mux = createMuxClient();
  } catch (err) {
    return { ok: false, error: muxErrorMessage(err, "Mux is not configured.") };
  }

  try {
    const page = await mux.video.assets.list({
      limit: LIBRARY_PAGE_SIZE,
      ...(input.cursor ? { cursor: input.cursor } : {}),
    });

    const rawAssets = page.data.filter((asset) => asset.test !== true);
    const assetIds = rawAssets.map((asset) => asset.id);

    const usageByAsset = new Map<
      string,
      { projectIds: string[]; titles: string[] }
    >();

    if (assetIds.length > 0) {
      const supabase = await requireAuthedClient();
      const { data: rows, error } = await supabase
        .from("project_videos")
        .select("mux_asset_id, project_id, projects(id, title)")
        .in("mux_asset_id", assetIds);

      if (error) {
        return { ok: false, error: error.message };
      }

      for (const row of rows ?? []) {
        if (!row.mux_asset_id) {
          continue;
        }
        const relation = row.projects as
          | { id: string; title: string }
          | { id: string; title: string }[]
          | null;
        const project = Array.isArray(relation) ? relation[0] : relation;
        const current = usageByAsset.get(row.mux_asset_id) ?? {
          projectIds: [],
          titles: [],
        };
        if (project && !current.projectIds.includes(project.id)) {
          current.projectIds.push(project.id);
          current.titles.push(project.title);
        } else if (!project && !current.projectIds.includes(row.project_id)) {
          current.projectIds.push(row.project_id);
        }
        usageByAsset.set(row.mux_asset_id, current);
      }
    }

    const assets: MuxLibraryAsset[] = rawAssets.map((asset) => {
      const usage = usageByAsset.get(asset.id);
      return {
        assetId: asset.id,
        playbackId: firstPublicPlaybackId(asset.playback_ids),
        status: asset.status,
        duration: asset.duration ?? null,
        createdAt: asset.created_at ?? null,
        aspectRatio: asset.aspect_ratio ?? null,
        title: assetTitle(asset),
        usedByProjectIds: usage?.projectIds ?? [],
        usedByProjectTitles: usage?.titles ?? [],
        alreadyOnThisProject: Boolean(
          usage?.projectIds.includes(projectId),
        ),
      };
    });

    const nextCursor =
      page.hasNextPage() && page.next_cursor ? page.next_cursor : null;

    return { ok: true, assets, nextCursor };
  } catch (err) {
    return {
      ok: false,
      error: muxErrorMessage(err, "Failed to list Mux assets."),
    };
  }
}

/**
 * Attach an existing Mux asset to a project without re-uploading.
 */
export async function attachMuxAssetAction(input: {
  projectId: string;
  assetId: string;
}): Promise<AttachMuxAssetResult> {
  let supabase;
  try {
    supabase = await requireAuthedClient();
  } catch {
    return { ok: false, error: "Authentication required." };
  }

  const projectId = input.projectId.trim();
  const assetId = input.assetId.trim();
  if (!projectId || !assetId) {
    return { ok: false, error: "projectId and assetId are required." };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    return { ok: false, error: projectError.message };
  }
  if (!project) {
    return { ok: false, error: "Project not found." };
  }

  const { data: already } = await supabase
    .from("project_videos")
    .select("id")
    .eq("project_id", projectId)
    .eq("mux_asset_id", assetId)
    .maybeSingle();

  if (already) {
    return { ok: false, error: "That Mux video is already on this project." };
  }

  let mux;
  try {
    mux = createMuxClient();
  } catch (err) {
    return { ok: false, error: muxErrorMessage(err, "Mux is not configured.") };
  }

  let asset;
  try {
    asset = await mux.video.assets.retrieve(assetId);
  } catch (err) {
    return {
      ok: false,
      error: muxErrorMessage(err, "Could not load that Mux asset."),
    };
  }

  if (asset.status === "errored") {
    return { ok: false, error: "That Mux asset failed processing." };
  }

  let playbackId = firstPublicPlaybackId(asset.playback_ids);
  if (!playbackId && asset.status === "ready") {
    try {
      const created = await mux.video.assets.createPlaybackId(assetId, {
        policy: "public",
      });
      playbackId = created.id;
    } catch (err) {
      return {
        ok: false,
        error: muxErrorMessage(err, "Could not create a public playback ID."),
      };
    }
  }

  if (asset.status === "ready" && !playbackId) {
    return { ok: false, error: "That Mux asset has no playback ID." };
  }

  const { data: existing } = await supabase
    .from("project_videos")
    .select("display_order")
    .eq("project_id", projectId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;
  const status = asset.status === "ready" ? "ready" : "processing";

  const { error: insertError } = await supabase.from("project_videos").insert({
    project_id: projectId,
    mux_asset_id: assetId,
    mux_playback_id: playbackId,
    status,
    title: assetTitle(asset),
    display_order: nextOrder,
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  revalidateProjectVideos(projectId, project.slug);
  return { ok: true };
}

/**
 * Permanently delete a Mux asset and every project_videos row that points at it.
 */
export async function hardDeleteMuxAssetAction(input: {
  assetId: string;
}): Promise<HardDeleteMuxAssetResult> {
  let supabase;
  try {
    supabase = await requireAuthedClient();
  } catch {
    return { ok: false, error: "Authentication required." };
  }

  const assetId = input.assetId.trim();
  if (!assetId) {
    return { ok: false, error: "assetId is required." };
  }

  const { data: rows, error: loadError } = await supabase
    .from("project_videos")
    .select("id, project_id, projects(slug)")
    .eq("mux_asset_id", assetId);

  if (loadError) {
    return { ok: false, error: loadError.message };
  }

  let mux;
  try {
    mux = createMuxClient();
  } catch (err) {
    return { ok: false, error: muxErrorMessage(err, "Mux is not configured.") };
  }

  try {
    await mux.video.assets.delete(assetId);
  } catch (err) {
    const message = muxErrorMessage(err, "Mux delete failed.");
    if (!/404|not_found|not found/i.test(message)) {
      return { ok: false, error: `Mux delete failed: ${message}` };
    }
  }

  const ids = (rows ?? []).map((row) => row.id);
  if (ids.length > 0) {
    const { error: deleteError } = await supabase
      .from("project_videos")
      .delete()
      .in("id", ids);

    if (deleteError) {
      return {
        ok: false,
        error: `Mux asset was deleted, but database cleanup failed: ${deleteError.message}`,
      };
    }
  }

  const seenProjects = new Set<string>();
  for (const row of rows ?? []) {
    if (seenProjects.has(row.project_id)) {
      continue;
    }
    seenProjects.add(row.project_id);
    const relation = row.projects as
      | { slug: string }
      | { slug: string }[]
      | null;
    const project = Array.isArray(relation) ? relation[0] : relation;
    revalidateProjectVideos(row.project_id, project?.slug);
  }

  return { ok: true, removedRows: ids.length };
}
