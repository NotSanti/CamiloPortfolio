import { createClient } from "@/src/lib/supabase/server";
import type {
  ProjectImageRow,
  ProjectRow,
  ProjectVideoRow,
} from "@/types/database";

const ADMIN_PROJECT_LIST_SELECT =
  "id, title, slug, description, kind, cover_image_path, cover_alt_text, cover_width, cover_height, is_published, is_featured, display_order, seo_title, seo_description, created_at, updated_at";

export type AdminProjectDetail = ProjectRow & {
  project_images: ProjectImageRow[];
  project_videos: ProjectVideoRow[];
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  return supabase;
}

/** All projects for the CMS, including drafts. Requires an authenticated session. */
export async function getAllProjects(): Promise<ProjectRow[]> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("projects")
    .select(ADMIN_PROJECT_LIST_SELECT)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load admin projects: ${error.message}`);
  }

  return data ?? [];
}

export async function getAdminProjectById(
  id: string,
): Promise<AdminProjectDetail | null> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      ${ADMIN_PROJECT_LIST_SELECT},
      project_images (
        id, project_id, storage_path, alt_text, caption, width, height, display_order, created_at
      ),
      project_videos (
        id, project_id, mux_asset_id, mux_playback_id, mux_upload_id, source_path, status, title, caption, display_order, created_at, updated_at
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load admin project: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const images = [...(data.project_images ?? [])].sort(
    (a, b) => a.display_order - b.display_order,
  );
  const videos = [...(data.project_videos ?? [])].sort(
    (a, b) => a.display_order - b.display_order,
  );

  return {
    ...data,
    project_images: images,
    project_videos: videos,
  };
}
