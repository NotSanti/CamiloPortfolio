import { revalidatePath } from "next/cache";
import type Mux from "@mux/mux-node";
import { createServiceClient } from "@/src/lib/supabase/admin";

type MuxWebhookEvent = Mux.Webhooks.UnwrapWebhookEvent;

function firstPublicPlaybackId(
  playbackIds: Array<{ id: string; policy?: string }> | null | undefined,
): string | null {
  if (!playbackIds?.length) return null;
  const publicId = playbackIds.find((item) => item.policy === "public");
  return publicId?.id ?? playbackIds[0]?.id ?? null;
}

function revalidateVideoPaths(slug: string | null | undefined) {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin/projects");
  if (slug) {
    revalidatePath(`/work/${slug}`);
  }
}

async function loadVideoById(videoId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("project_videos")
    .select("id, project_id, status, mux_asset_id, mux_playback_id, mux_upload_id, projects(slug)")
    .eq("id", videoId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function loadVideoByUploadId(uploadId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("project_videos")
    .select("id, project_id, status, mux_asset_id, mux_playback_id, mux_upload_id, projects(slug)")
    .eq("mux_upload_id", uploadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function loadVideoByAssetId(assetId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("project_videos")
    .select("id, project_id, status, mux_asset_id, mux_playback_id, mux_upload_id, projects(slug)")
    .eq("mux_asset_id", assetId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

function projectSlug(
  projects:
    | { slug: string }
    | { slug: string }[]
    | null
    | undefined,
): string | null {
  if (!projects) return null;
  return Array.isArray(projects) ? (projects[0]?.slug ?? null) : projects.slug;
}

/**
 * Apply a verified Mux webhook event to `project_videos`.
 * Idempotent for repeated ready/error deliveries.
 */
export async function handleMuxWebhookEvent(
  event: MuxWebhookEvent,
): Promise<{ handled: boolean; detail: string }> {
  switch (event.type) {
    case "video.upload.asset_created": {
      const uploadId = event.data.id;
      const assetId = event.data.asset_id;
      if (!uploadId || !assetId) {
        return { handled: false, detail: "upload.asset_created missing ids" };
      }

      const video = await loadVideoByUploadId(uploadId);
      if (!video) {
        return {
          handled: false,
          detail: `No project_videos row for upload ${uploadId}`,
        };
      }

      if (video.mux_asset_id === assetId && video.status === "processing") {
        return { handled: true, detail: "idempotent upload.asset_created" };
      }

      const supabase = createServiceClient();
      const { error } = await supabase
        .from("project_videos")
        .update({
          mux_asset_id: assetId,
          status: video.status === "ready" ? "ready" : "processing",
        })
        .eq("id", video.id);

      if (error) throw new Error(error.message);
      revalidateVideoPaths(projectSlug(video.projects));
      return { handled: true, detail: `asset ${assetId} linked` };
    }

    case "video.asset.ready": {
      const assetId = event.data.id;
      const passthrough =
        typeof event.data.passthrough === "string"
          ? event.data.passthrough
          : null;
      const playbackId = firstPublicPlaybackId(event.data.playback_ids);

      if (!assetId || !playbackId) {
        return {
          handled: false,
          detail: "asset.ready missing asset or playback id",
        };
      }

      const video =
        (passthrough ? await loadVideoById(passthrough) : null) ??
        (await loadVideoByAssetId(assetId));

      if (!video) {
        return {
          handled: false,
          detail: `No project_videos row for asset ${assetId}`,
        };
      }

      if (
        video.status === "ready" &&
        video.mux_asset_id === assetId &&
        video.mux_playback_id === playbackId
      ) {
        return { handled: true, detail: "idempotent asset.ready" };
      }

      const supabase = createServiceClient();
      const { error } = await supabase
        .from("project_videos")
        .update({
          mux_asset_id: assetId,
          mux_playback_id: playbackId,
          status: "ready",
        })
        .eq("id", video.id);

      if (error) throw new Error(error.message);
      revalidateVideoPaths(projectSlug(video.projects));
      return { handled: true, detail: `video ${video.id} ready` };
    }

    case "video.asset.errored": {
      const assetId = event.data.id;
      const passthrough =
        typeof event.data.passthrough === "string"
          ? event.data.passthrough
          : null;

      const video =
        (passthrough ? await loadVideoById(passthrough) : null) ??
        (assetId ? await loadVideoByAssetId(assetId) : null);

      if (!video) {
        return {
          handled: false,
          detail: `No project_videos row for errored asset ${assetId ?? "?"}`,
        };
      }

      if (video.status === "errored") {
        return { handled: true, detail: "idempotent asset.errored" };
      }

      // Do not demote an already-ready video on a late/duplicate error event.
      if (video.status === "ready") {
        return { handled: true, detail: "skip error; already ready" };
      }

      const supabase = createServiceClient();
      const { error } = await supabase
        .from("project_videos")
        .update({
          status: "errored",
          ...(assetId ? { mux_asset_id: assetId } : {}),
        })
        .eq("id", video.id);

      if (error) throw new Error(error.message);
      revalidateVideoPaths(projectSlug(video.projects));
      return { handled: true, detail: `video ${video.id} errored` };
    }

    case "video.upload.errored":
    case "video.upload.cancelled": {
      const uploadId = event.data.id;
      if (!uploadId) {
        return { handled: false, detail: "upload event missing id" };
      }

      const video = await loadVideoByUploadId(uploadId);
      if (!video) {
        return {
          handled: false,
          detail: `No project_videos row for upload ${uploadId}`,
        };
      }

      if (video.status === "ready") {
        return { handled: true, detail: "skip upload error; already ready" };
      }
      if (video.status === "errored") {
        return { handled: true, detail: "idempotent upload error" };
      }

      const supabase = createServiceClient();
      const { error } = await supabase
        .from("project_videos")
        .update({ status: "errored" })
        .eq("id", video.id);

      if (error) throw new Error(error.message);
      revalidateVideoPaths(projectSlug(video.projects));
      return {
        handled: true,
        detail: `video ${video.id} ${event.type}`,
      };
    }

    default:
      return { handled: false, detail: `ignored ${event.type}` };
  }
}
