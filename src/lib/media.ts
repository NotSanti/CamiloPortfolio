export const PORTFOLIO_MEDIA_BUCKET = "portfolio-media";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** 50 MB — matches storage bucket file_size_limit. */
export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

export function isAllowedImageFile(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.has(file.type);
}

export function validateImageFile(file: File): string | null {
  if (!isAllowedImageFile(file)) {
    return "Use a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be 50 MB or smaller.";
  }
  return null;
}

/**
 * Build a browser-usable URL from a stored media reference.
 * - Absolute URLs and `/public` paths pass through (legacy Phase 2 seed).
 * - Storage object keys resolve to the public portfolio-media URL.
 */
export function getMediaUrl(path: string | null | undefined): string {
  if (!path) {
    return "";
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("/")
  ) {
    return path;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    return path;
  }

  return `${base}/storage/v1/object/public/${PORTFOLIO_MEDIA_BUCKET}/${path}`;
}

export function isManagedStoragePath(path: string | null | undefined): boolean {
  if (!path) {
    return false;
  }
  return !path.startsWith("http://") && !path.startsWith("https://") && !path.startsWith("/");
}

export function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
