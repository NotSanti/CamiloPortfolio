import { createMuxClient } from "@/src/lib/mux/server";
import { createClient } from "@/src/lib/supabase/server";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Authentication required.", status: 401 };
  }

  const projectId = input.projectId.trim();
  if (!projectId) {
    return { ok: false, error: "projectId is required.", status: 400 };
  }

  const corsOrigin = input.corsOrigin.trim();
  if (!corsOrigin) {
    return {
      ok: false,
      error: "corsOrigin is required for browser uploads.",
      status: 400,
    };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    return { ok: false, error: projectError.message, status: 500 };
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
      error: insertError?.message ?? "Failed to create video record.",
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
      return { ok: false, error: updateError.message, status: 500 };
    }

    return {
      ok: true,
      videoId: video.id,
      uploadUrl: upload.url,
      muxUploadId: upload.id,
    };
  } catch (err) {
    await supabase.from("project_videos").delete().eq("id", video.id);

    const message =
      err instanceof Error ? err.message : "Failed to create Mux upload.";
    const missingCreds =
      message.includes("MUX_TOKEN_ID") || message.includes("MUX_TOKEN_SECRET");

    return {
      ok: false,
      error: message,
      status: missingCreds ? 503 : 502,
    };
  }
}
