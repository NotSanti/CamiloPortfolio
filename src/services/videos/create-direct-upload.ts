import { AdminAuthError, requireAdminClient } from "@/src/lib/auth/require-admin";
import { createMuxClient } from "@/src/lib/mux/server";
import {
  isAllowedMuxCorsOrigin,
  isUuid,
  publicErrorMessage,
} from "@/src/lib/security/mux-upload";

export type CreateDirectUploadInput = {
  projectId: string;
  /** Browser Origin header value — required for Mux CORS on the signed URL. */
  corsOrigin: string;
  title?: string | null;
};

export type CreateDirectUploadResult =
  | {
      ok: true;
      videoId: string;
      uploadUrl: string;
      muxUploadId: string;
    }
  | { ok: false; error: string; status: number };

/**
 * Create a `project_videos` row and a Mux direct-upload URL for that project.
 * Mux credentials stay on the server; the client only receives the signed URL.
 */
export async function createProjectVideoDirectUpload(
  input: CreateDirectUploadInput,
): Promise<CreateDirectUploadResult> {
  let supabase;
  try {
    ({ supabase } = await requireAdminClient());
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    throw err;
  }

  const projectId = input.projectId.trim();
  if (!isUuid(projectId)) {
    return { ok: false, error: "Invalid project ID.", status: 400 };
  }

  const corsOrigin = input.corsOrigin.trim();
  if (!isAllowedMuxCorsOrigin(corsOrigin)) {
    return { ok: false, error: "Origin is not allowed.", status: 400 };
  }

  const windowStart = new Date(Date.now() - 60_000).toISOString();
  const { count: recentCount, error: rateError } = await supabase
    .from("project_videos")
    .select("id", { count: "exact", head: true })
    .gte("created_at", windowStart);

  if (rateError) {
    return { ok: false, error: "Unable to create upload.", status: 500 };
  }
  if ((recentCount ?? 0) >= 8) {
    return {
      ok: false,
      error: "Too many upload requests. Try again shortly.",
      status: 429,
    };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    return { ok: false, error: "Unable to load project.", status: 500 };
  }
  if (!project) {
    return { ok: false, error: "Project not found.", status: 404 };
  }

  const { data: existing } = await supabase
    .from("project_videos")
    .select("display_order")
    .eq("project_id", projectId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;
  const title = input.title?.trim() || null;

  const { data: video, error: insertError } = await supabase
    .from("project_videos")
    .insert({
      project_id: projectId,
      status: "waiting",
      title,
      display_order: nextOrder,
    })
    .select("id")
    .single();

  if (insertError || !video) {
    return {
      ok: false,
      error: "Failed to create video record.",
      status: 500,
    };
  }

  try {
    const mux = createMuxClient();
    const upload = await mux.video.uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        playback_policies: ["public"],
        // Correlate asset.ready webhooks (Phase 11) back to this row.
        passthrough: video.id,
      },
      // Keep URL valid long enough for large portfolio files.
      timeout: 3600,
    });

    if (!upload.url) {
      await supabase.from("project_videos").delete().eq("id", video.id);
      return {
        ok: false,
        error: "Mux did not return an upload URL.",
        status: 502,
      };
    }

    const { error: updateError } = await supabase
      .from("project_videos")
      .update({
        mux_upload_id: upload.id,
        status: "waiting",
      })
      .eq("id", video.id);

    if (updateError) {
      return { ok: false, error: "Failed to save upload.", status: 500 };
    }

    return {
      ok: true,
      videoId: video.id,
      uploadUrl: upload.url,
      muxUploadId: upload.id,
    };
  } catch (err) {
    await supabase.from("project_videos").delete().eq("id", video.id);

    const { message, missingMuxCreds } = publicErrorMessage(
      err,
      "Failed to create Mux upload.",
    );

    return {
      ok: false,
      error: message,
      status: missingMuxCreds ? 503 : 502,
    };
  }
}
