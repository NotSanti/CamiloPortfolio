import { cache } from "react";
import { aboutContent } from "@/data/about";
import { getMediaUrl } from "@/src/lib/media";
import { createPublicClient } from "@/src/lib/supabase/public";
import type { SiteSettingsRow } from "@/types/database";

export const SITE_SETTINGS_ID = "default";

export type AboutPortrait = {
  src: string;
  alt: string;
};

export const getSiteSettings = cache(async (): Promise<SiteSettingsRow | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "id, portrait_path, portrait_alt, portrait_width, portrait_height, updated_at",
    )
    .eq("id", SITE_SETTINGS_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load site settings: ${error.message}`);
  }

  return data;
});

export function resolveAboutPortrait(
  settings: SiteSettingsRow | null,
): AboutPortrait {
  const stored = getMediaUrl(settings?.portrait_path);
  return {
    src: stored || aboutContent.portraitSrc,
    alt: settings?.portrait_alt?.trim() || aboutContent.portraitAlt,
  };
}
