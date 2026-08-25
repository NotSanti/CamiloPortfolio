"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import type { ProjectVideoStatus } from "@/types/database";

const UPDATABLE_STATUSES: ReadonlySet<ProjectVideoStatus> = new Set([
  "waiting",
  "uploading",
  "processing",
  "ready",
  "errored",
]);

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

function revalidateProjectVideos(projectId: string, slug?: string | null) {
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/", "layout");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/work/${slug}`);
  }
}

export type UpdateVideoStatusResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateVideoStatusAction(input: {
  videoId: string;
  status: ProjectVideoStatus;
}): Promise<UpdateVideoStatusResult> {
  if (!UPDATABLE_STATUSES.has(input.status)) {
    return { ok: false, error: "Invalid video status." };
  }

  // Clients must not mark ready — that comes from Mux webhooks (Phase 11).
  if (input.status === "ready") {
    return {
      ok: false,
      error: "Ready status is set by Mux after processing completes.",
    };
  }

  const supabase = await requireAuthedClient();

  const { data: video, error: loadError } = await supabase
    .from("project_videos")
    .select("id, project_id, projects(slug)")
    .eq("id", input.videoId)
    .maybeSingle();

  if (loadError || !video) {
    return { ok: false, error: loadError?.message ?? "Video not found." };
  }

  const projectRelation = video.projects as
    | { slug: string }
    | { slug: string }[]
    | null;
  const project = Array.isArray(projectRelation)
    ? projectRelation[0]
    : projectRelation;

  const { error: updateError } = await supabase
    .from("project_videos")
    .update({ status: input.status })
    .eq("id", input.videoId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidateProjectVideos(video.project_id, project?.slug);
  return { ok: true };
}

export type DeleteProjectVideoResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteProjectVideoAction(
  videoId: string,
): Promise<DeleteProjectVideoResult> {
  const supabase = await requireAuthedClient();

  const { data: video, error: loadError } = await supabase
    .from("project_videos")
    .select("id, project_id, mux_asset_id, projects(slug)")
    .eq("id", videoId)
    .maybeSingle();

  if (loadError || !video) {
    return { ok: false, error: loadError?.message ?? "Video not found." };
  }

  const projectRelation = video.projects as
    | { slug: string }
    | { slug: string }[]
    | null;
  const project = Array.isArray(projectRelation)
    ? projectRelation[0]
    : projectRelation;

  if (video.mux_asset_id) {
    const { count, error: countError } = await supabase
      .from("project_videos")
      .select("id", { count: "exact", head: true })
      .eq("mux_asset_id", video.mux_asset_id)
      .neq("id", videoId);

    if (countError) {
      return {
        ok: false,
        error: `Could not check Mux asset usage: ${countError.message}`,
      };
    }

    if ((count ?? 0) === 0) {
      try {
        const { createMuxClient } = await import("@/src/lib/mux/server");
        const mux = createMuxClient();
        await mux.video.assets.delete(video.mux_asset_id);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Mux delete failed.";
        if (!/404|not_found|not found/i.test(message)) {
          return {
            ok: false,
            error: `Mux cleanup failed: ${message}. Video was not deleted.`,
          };
        }
      }
    }
  }

  const { error: deleteError } = await supabase
    .from("project_videos")
    .delete()
    .eq("id", videoId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  revalidateProjectVideos(video.project_id, project?.slug);
  return { ok: true };
}
