"use server";

import { revalidatePath } from "next/cache";
import {
  isManagedStoragePath,
  PORTFOLIO_MEDIA_BUCKET,
} from "@/src/lib/media";
import { createClient } from "@/src/lib/supabase/server";
import { SITE_SETTINGS_ID } from "@/src/services/site/get-site-settings";

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

function revalidateAbout() {
  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export type SavePortraitResult = { ok: true } | { ok: false; error: string };

export async function savePortraitAction(input: {
  storagePath: string;
  width: number | null;
  height: number | null;
}): Promise<SavePortraitResult> {
  if (!isManagedStoragePath(input.storagePath)) {
    return { ok: false, error: "Invalid portrait storage path." };
  }

  const supabase = await requireAuthedClient();

  const { data: current, error: loadError } = await supabase
    .from("site_settings")
    .select("portrait_path")
    .eq("id", SITE_SETTINGS_ID)
    .maybeSingle();

  if (loadError || !current) {
    return {
      ok: false,
      error: loadError?.message ?? "Site settings not found.",
    };
  }

  const previousPath = current.portrait_path;

  const { error: updateError } = await supabase
    .from("site_settings")
    .update({
      portrait_path: input.storagePath,
      portrait_width: input.width,
      portrait_height: input.height,
    })
    .eq("id", SITE_SETTINGS_ID);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  if (
    previousPath &&
    previousPath !== input.storagePath &&
    isManagedStoragePath(previousPath)
  ) {
    await supabase.storage.from(PORTFOLIO_MEDIA_BUCKET).remove([previousPath]);
  }

  revalidateAbout();
  return { ok: true };
}

export type UpdatePortraitAltResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updatePortraitAltAction(input: {
  altText: string;
}): Promise<UpdatePortraitAltResult> {
  const supabase = await requireAuthedClient();
  const altText = input.altText.trim() || null;

  const { error } = await supabase
    .from("site_settings")
    .update({ portrait_alt: altText })
    .eq("id", SITE_SETTINGS_ID);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateAbout();
  return { ok: true };
}
