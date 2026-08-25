"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import {
  isManagedStoragePath,
  PORTFOLIO_MEDIA_BUCKET,
} from "@/src/lib/media";

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

function revalidateProjectMedia(projectId: string, slug?: string | null) {
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/", "layout");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/work/${slug}`);
  }
}

export type SaveCoverResult = { ok: true } | { ok: false; error: string };

/** Set project cover from an existing gallery image (same storage object). */
export async function setCoverFromGalleryImageAction(input: {
  projectId: string;
  imageId: string;
}): Promise<SaveCoverResult> {
  const supabase = await requireAuthedClient();

  const { data: image, error: imageError } = await supabase
    .from("project_images")
    .select("id, project_id, storage_path, alt_text, width, height")
    .eq("id", input.imageId)
    .eq("project_id", input.projectId)
    .maybeSingle();

  if (imageError || !image) {
    return {
      ok: false,
      error: imageError?.message ?? "Gallery image not found for this project.",
    };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("slug")
    .eq("id", input.projectId)
    .maybeSingle();

  if (projectError || !project) {
    return { ok: false, error: projectError?.message ?? "Project not found." };
  }

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      cover_image_path: image.storage_path,
      cover_alt_text: image.alt_text,
      cover_width: image.width,
      cover_height: image.height,
    })
    .eq("id", input.projectId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidateProjectMedia(input.projectId, project.slug);
  return { ok: true };
}

export type SaveGalleryImageResult =
  | { ok: true; imageId: string; setAsCover: boolean }
  | { ok: false; error: string };

export async function saveGalleryImageAction(input: {
  projectId: string;
  storagePath: string;
  altText?: string;
  width?: number | null;
  height?: number | null;
  /** When true, also set this image as the project cover. */
  setAsCover?: boolean;
}): Promise<SaveGalleryImageResult> {
  const supabase = await requireAuthedClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("slug, cover_image_path")
    .eq("id", input.projectId)
    .maybeSingle();

  if (projectError || !project) {
    return { ok: false, error: projectError?.message ?? "Project not found." };
  }

  const { data: existing } = await supabase
    .from("project_images")
    .select("display_order")
    .eq("project_id", input.projectId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;
  const shouldSetCover = Boolean(input.setAsCover || !project.cover_image_path);

  const { data, error } = await supabase
    .from("project_images")
    .insert({
      project_id: input.projectId,
      storage_path: input.storagePath,
      alt_text: input.altText?.trim() || null,
      width: input.width ?? null,
      height: input.height ?? null,
      display_order: nextOrder,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to save gallery image.",
    };
  }

  if (shouldSetCover) {
    const { error: coverError } = await supabase
      .from("projects")
      .update({
        cover_image_path: input.storagePath,
        cover_alt_text: input.altText?.trim() || null,
        cover_width: input.width ?? null,
        cover_height: input.height ?? null,
      })
      .eq("id", input.projectId);

    if (coverError) {
      return { ok: false, error: coverError.message };
    }
  }

  revalidateProjectMedia(input.projectId, project.slug);
  return { ok: true, imageId: data.id, setAsCover: shouldSetCover };
}

export type DeleteGalleryImageResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteGalleryImageAction(
  imageId: string,
): Promise<DeleteGalleryImageResult> {
  const supabase = await requireAuthedClient();

  const { data: image, error: loadError } = await supabase
    .from("project_images")
    .select("id, storage_path, project_id, projects(slug, cover_image_path)")
    .eq("id", imageId)
    .maybeSingle();

  if (loadError || !image) {
    return { ok: false, error: loadError?.message ?? "Image not found." };
  }

  const projectRelation = image.projects as
    | { slug: string; cover_image_path: string | null }
    | { slug: string; cover_image_path: string | null }[]
    | null;
  const project = Array.isArray(projectRelation)
    ? projectRelation[0]
    : projectRelation;
  const wasCover = project?.cover_image_path === image.storage_path;

  const { error: deleteError } = await supabase
    .from("project_images")
    .delete()
    .eq("id", imageId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  if (isManagedStoragePath(image.storage_path)) {
    await supabase.storage
      .from(PORTFOLIO_MEDIA_BUCKET)
      .remove([image.storage_path]);
  }

  if (wasCover) {
    const { data: fallback } = await supabase
      .from("project_images")
      .select("storage_path, alt_text, width, height")
      .eq("project_id", image.project_id)
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    await supabase
      .from("projects")
      .update(
        fallback
          ? {
              cover_image_path: fallback.storage_path,
              cover_alt_text: fallback.alt_text,
              cover_width: fallback.width,
              cover_height: fallback.height,
            }
          : {
              cover_image_path: null,
              cover_alt_text: null,
              cover_width: null,
              cover_height: null,
            },
      )
      .eq("id", image.project_id);
  }

  revalidateProjectMedia(image.project_id, project?.slug);
  return { ok: true };
}

export type UpdateGalleryImageMetaResult =
  | { ok: true }
  | { ok: false; error: string };

/** Update alt text and/or caption for a gallery image. Syncs cover alt when needed. */
export async function updateGalleryImageMetaAction(input: {
  projectId: string;
  imageId: string;
  altText: string;
  caption: string;
}): Promise<UpdateGalleryImageMetaResult> {
  const supabase = await requireAuthedClient();

  const altText = input.altText.trim() || null;
  const caption = input.caption.trim() || null;

  const { data: image, error: loadError } = await supabase
    .from("project_images")
    .select("id, storage_path, project_id")
    .eq("id", input.imageId)
    .eq("project_id", input.projectId)
    .maybeSingle();

  if (loadError || !image) {
    return {
      ok: false,
      error: loadError?.message ?? "Gallery image not found.",
    };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("slug, cover_image_path")
    .eq("id", input.projectId)
    .maybeSingle();

  if (projectError || !project) {
    return { ok: false, error: projectError?.message ?? "Project not found." };
  }

  const { error: updateError } = await supabase
    .from("project_images")
    .update({ alt_text: altText, caption })
    .eq("id", input.imageId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  if (project.cover_image_path === image.storage_path) {
    const { error: coverError } = await supabase
      .from("projects")
      .update({ cover_alt_text: altText })
      .eq("id", input.projectId);

    if (coverError) {
      return { ok: false, error: coverError.message };
    }
  }

  revalidateProjectMedia(input.projectId, project.slug);
  return { ok: true };
}

export type ReorderGalleryImagesResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Persist gallery order. `orderedImageIds` must list every image for the
 * project exactly once; display_order is rewritten 0..n-1.
 */
export async function reorderGalleryImagesAction(input: {
  projectId: string;
  orderedImageIds: string[];
}): Promise<ReorderGalleryImagesResult> {
  const supabase = await requireAuthedClient();

  if (input.orderedImageIds.length === 0) {
    return { ok: true };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("slug")
    .eq("id", input.projectId)
    .maybeSingle();

  if (projectError || !project) {
    return { ok: false, error: projectError?.message ?? "Project not found." };
  }

  const { data: existing, error: listError } = await supabase
    .from("project_images")
    .select("id")
    .eq("project_id", input.projectId);

  if (listError) {
    return { ok: false, error: listError.message };
  }

  const existingIds = new Set((existing ?? []).map((row) => row.id));
  if (
    existingIds.size !== input.orderedImageIds.length ||
    input.orderedImageIds.some((id) => !existingIds.has(id))
  ) {
    return {
      ok: false,
      error: "Gallery order is out of date. Refresh and try again.",
    };
  }

  const updates = input.orderedImageIds.map((imageId, index) =>
    supabase
      .from("project_images")
      .update({ display_order: index })
      .eq("id", imageId)
      .eq("project_id", input.projectId),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return { ok: false, error: failed.error.message };
  }

  revalidateProjectMedia(input.projectId, project.slug);
  return { ok: true };
}
