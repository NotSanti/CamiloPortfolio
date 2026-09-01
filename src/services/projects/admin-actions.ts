"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { generateProjectSeo } from "@/src/lib/seo";
import { slugifyTitle } from "@/src/services/projects/slugify";
import { revalidatePublicSeo } from "@/src/services/seo/revalidate";
import type { ProjectKind } from "@/types/database";

export type ProjectEditorValues = {
  title: string;
  slug: string;
  description: string;
  kind: ProjectKind;
  isPublished: boolean;
  isFeatured: boolean;
};

export type UpdateProjectState = {
  error: string | null;
  success: string | null;
  values: ProjectEditorValues;
};

function revalidatePublicPortfolio(slug?: string, previousSlug?: string) {
  const slugs = [slug, previousSlug].filter(
    (value): value is string => Boolean(value),
  );
  revalidatePublicSeo(slugs);
}

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

export async function setProjectPublishedAction(
  projectId: string,
  isPublished: boolean,
) {
  const supabase = await requireAuthedClient();

  const { data, error } = await supabase
    .from("projects")
    .update({ is_published: isPublished })
    .eq("id", projectId)
    .select("slug")
    .single();

  if (error) {
    throw new Error(`Failed to update publish state: ${error.message}`);
  }

  revalidatePublicPortfolio(data.slug);
}

export async function setProjectFeaturedAction(
  projectId: string,
  isFeatured: boolean,
) {
  const supabase = await requireAuthedClient();

  const { data, error } = await supabase
    .from("projects")
    .update({ is_featured: isFeatured })
    .eq("id", projectId)
    .select("slug")
    .single();

  if (error) {
    throw new Error(`Failed to update featured state: ${error.message}`);
  }

  revalidatePublicPortfolio(data.slug);
}

/**
 * Destructive delete: cleans Storage + unshared Mux assets, then removes the
 * project (cascades project_images / project_videos). Fails closed if cleanup fails.
 */
export type DeleteProjectResult =
  | { ok: true }
  | { ok: false; error: string; notes?: string[] };

export async function deleteProjectAction(
  projectId: string,
): Promise<DeleteProjectResult> {
  const { deleteProjectWithMediaCleanup } = await import(
    "@/src/services/projects/delete-project"
  );

  const result = await deleteProjectWithMediaCleanup(projectId);

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      notes: result.notes,
    };
  }

  revalidatePublicPortfolio(result.slug);
  redirect("/admin/projects");
}

function readEditorValues(formData: FormData): ProjectEditorValues {
  const kindRaw = String(formData.get("kind") ?? "photo");
  return {
    title: String(formData.get("title") ?? "").trim(),
    slug: slugifyTitle(String(formData.get("slug") ?? "")),
    description: String(formData.get("description") ?? "").trim(),
    kind: kindRaw === "video" ? "video" : "photo",
    isPublished: formData.get("isPublished") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  };
}

export async function updateProjectAction(
  projectId: string,
  prev: UpdateProjectState,
  formData: FormData,
): Promise<UpdateProjectState> {
  const values = readEditorValues(formData);

  if (!values.title) {
    return {
      error: "Title is required.",
      success: null,
      values: { ...values, slug: values.slug || prev.values.slug },
    };
  }

  if (!values.slug) {
    return {
      error: "Slug is required.",
      success: null,
      values: {
        ...values,
        slug: slugifyTitle(values.title) || prev.values.slug,
      },
    };
  }

  const supabase = await requireAuthedClient();

  const { data: current, error: currentError } = await supabase
    .from("projects")
    .select("slug")
    .eq("id", projectId)
    .maybeSingle();

  if (currentError || !current) {
    return {
      error: currentError?.message ?? "Project not found.",
      success: null,
      values,
    };
  }

  const { data: slugConflict } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", values.slug)
    .neq("id", projectId)
    .maybeSingle();

  if (slugConflict) {
    return {
      error: `Slug “${values.slug}” is already used by another project.`,
      success: null,
      values,
    };
  }

  const { error } = await supabase
    .from("projects")
    .update({
      title: values.title,
      slug: values.slug,
      description: values.description || null,
      kind: values.kind,
      is_published: values.isPublished,
      is_featured: values.isFeatured,
    })
    .eq("id", projectId);

  if (error) {
    return {
      error: error.message || "Failed to save project.",
      success: null,
      values,
    };
  }

  revalidatePublicPortfolio(values.slug, current.slug);
  revalidatePath(`/admin/projects/${projectId}`);

  return {
    error: null,
    success: "Changes saved.",
    values,
  };
}

/** Full create form (Phase 5) — title, slug, description, kind, flags. */
export async function createProjectFromEditorAction(
  _prev: UpdateProjectState,
  formData: FormData,
): Promise<UpdateProjectState> {
  const values = readEditorValues(formData);
  const fallbackSlug = slugifyTitle(values.title) || "untitled-project";
  const slug = values.slug || fallbackSlug;

  if (!values.title) {
    return {
      error: "Title is required.",
      success: null,
      values: { ...values, slug },
    };
  }

  const supabase = await requireAuthedClient();

  const { data: existing } = await supabase
    .from("projects")
    .select("display_order, slug")
    .order("display_order", { ascending: false });

  const maxOrder = existing?.[0]?.display_order ?? -1;
  const usedSlugs = new Set((existing ?? []).map((row) => row.slug));

  if (usedSlugs.has(slug)) {
    return {
      error: `Slug “${slug}” is already used by another project.`,
      success: null,
      values: { ...values, slug },
    };
  }

  const generated = generateProjectSeo({
    title: values.title,
    kind: values.kind,
    description: values.description,
  });

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title: values.title,
      slug,
      kind: values.kind,
      description: values.description || null,
      is_published: values.isPublished,
      is_featured: values.isFeatured,
      display_order: maxOrder + 1,
      seo_title: generated.title,
      seo_description: generated.description,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: error?.message ?? "Failed to create project.",
      success: null,
      values: { ...values, slug },
    };
  }

  revalidatePublicPortfolio(slug);
  redirect(`/admin/projects/${data.id}`);
}

export type ReorderProjectsResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Persist portfolio order. `orderedProjectIds` must list every project exactly
 * once; display_order is rewritten 0..n-1.
 */
export async function reorderProjectsAction(input: {
  orderedProjectIds: string[];
}): Promise<ReorderProjectsResult> {
  if (input.orderedProjectIds.length === 0) {
    return { ok: true };
  }

  const supabase = await requireAuthedClient();

  const { data: existing, error: listError } = await supabase
    .from("projects")
    .select("id");

  if (listError) {
    return { ok: false, error: listError.message };
  }

  const existingIds = new Set((existing ?? []).map((row) => row.id));
  if (
    existingIds.size !== input.orderedProjectIds.length ||
    input.orderedProjectIds.some((id) => !existingIds.has(id))
  ) {
    return {
      ok: false,
      error: "Project list is out of date. Refresh and try again.",
    };
  }

  const results = await Promise.all(
    input.orderedProjectIds.map((projectId, index) =>
      supabase
        .from("projects")
        .update({ display_order: index })
        .eq("id", projectId),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return { ok: false, error: failed.error.message };
  }

  revalidatePublicPortfolio();
  return { ok: true };
}
