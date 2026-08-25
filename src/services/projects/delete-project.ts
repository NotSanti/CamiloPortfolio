import { createMuxClient } from "@/src/lib/mux/server";
import {
  isManagedStoragePath,
  PORTFOLIO_MEDIA_BUCKET,
} from "@/src/lib/media";
import { createClient } from "@/src/lib/supabase/server";

export type DeleteProjectCleanupResult =
  | { ok: true; slug: string; notes: string[] }
  | { ok: false; error: string; notes: string[] };

/**
 * Delete a project after cleaning managed Storage objects and unshared Mux assets.
 * Does not delete the DB row if external cleanup fails.
 */
export async function deleteProjectWithMediaCleanup(
  projectId: string,
): Promise<DeleteProjectCleanupResult> {
  const notes: string[] = [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Authentication required.", notes };
  }

  const { data: project, error: loadError } = await supabase
    .from("projects")
    .select(
      `
      id,
      slug,
      title,
      cover_image_path,
      project_images ( id, storage_path ),
      project_videos ( id, mux_asset_id, mux_playback_id )
    `,
    )
    .eq("id", projectId)
    .maybeSingle();

  if (loadError) {
    return { ok: false, error: loadError.message, notes };
  }
  if (!project) {
    return { ok: false, error: "Project not found.", notes };
  }

  const storagePaths = new Set<string>();
  if (
    project.cover_image_path &&
    isManagedStoragePath(project.cover_image_path)
  ) {
    storagePaths.add(project.cover_image_path);
  }
  for (const image of project.project_images ?? []) {
    if (image.storage_path && isManagedStoragePath(image.storage_path)) {
      storagePaths.add(image.storage_path);
    }
  }

  // Also remove any other objects under this project's gallery folder.
  const { data: listed, error: listError } = await supabase.storage
    .from(PORTFOLIO_MEDIA_BUCKET)
    .list(`projects/${projectId}/gallery`, { limit: 1000 });

  if (listError) {
    notes.push(`Storage list warning: ${listError.message}`);
  } else {
    for (const file of listed ?? []) {
      if (file.name) {
        storagePaths.add(`projects/${projectId}/gallery/${file.name}`);
      }
    }
  }

  const assetIds = [
    ...new Set(
      (project.project_videos ?? [])
        .map((video) => video.mux_asset_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const assetsToDelete: string[] = [];
  for (const assetId of assetIds) {
    const { count, error: countError } = await supabase
      .from("project_videos")
      .select("id", { count: "exact", head: true })
      .eq("mux_asset_id", assetId)
      .neq("project_id", projectId);

    if (countError) {
      return {
        ok: false,
        error: `Could not check Mux asset usage (${assetId}): ${countError.message}`,
        notes,
      };
    }

    if ((count ?? 0) > 0) {
      notes.push(
        `Skipped Mux asset ${assetId} — still referenced by ${count} video(s) on other projects.`,
      );
      continue;
    }

    assetsToDelete.push(assetId);
  }

  if (storagePaths.size > 0) {
    const paths = [...storagePaths];
    const { error: removeError } = await supabase.storage
      .from(PORTFOLIO_MEDIA_BUCKET)
      .remove(paths);

    if (removeError) {
      return {
        ok: false,
        error: `Storage cleanup failed: ${removeError.message}. Project was not deleted.`,
        notes,
      };
    }
    notes.push(`Removed ${paths.length} Storage object(s).`);
  }

  if (assetsToDelete.length > 0) {
    let mux;
    try {
      mux = createMuxClient();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Mux credentials missing.";
      return {
        ok: false,
        error: `${message} Project was not deleted because Mux assets need cleanup.`,
        notes,
      };
    }

    for (const assetId of assetsToDelete) {
      try {
        await mux.video.assets.delete(assetId);
        notes.push(`Deleted Mux asset ${assetId}.`);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown Mux delete error.";
        // 404 = already gone — treat as cleaned.
        if (/404|not_found|not found/i.test(message)) {
          notes.push(`Mux asset ${assetId} already absent.`);
          continue;
        }
        return {
          ok: false,
          error: `Mux cleanup failed for ${assetId}: ${message}. Project was not deleted.`,
          notes,
        };
      }
    }
  }

  const { error: deleteError } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (deleteError) {
    return {
      ok: false,
      error: `External media was cleaned, but DB delete failed: ${deleteError.message}`,
      notes,
    };
  }

  notes.push(`Deleted project “${project.title}”.`);
  return { ok: true, slug: project.slug, notes };
}
