import { createClient } from "@/src/lib/supabase/server";
import { SITE_SETTINGS_ID, SITE_SETTINGS_SELECT } from "@/src/services/site/get-site-settings";
import type { SiteSettingsRow } from "@/types/database";

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

export async function getAdminSiteSettings(): Promise<SiteSettingsRow> {
  const supabase = await requireUser();
  const { data, error } = await supabase
    .from("site_settings")
    .select(SITE_SETTINGS_SELECT)
    .eq("id", SITE_SETTINGS_ID)
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      error?.message ?? "Site settings are missing. Run the latest migration.",
    );
  }

  return data;
}
