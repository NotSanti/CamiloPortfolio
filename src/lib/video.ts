const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);

/** Soft client limit — Mux handles the real ingest constraints. */
export const MAX_VIDEO_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

export function isAllowedVideoFile(file: File): boolean {
  if (ALLOWED_VIDEO_TYPES.has(file.type)) {
    return true;
  }
  // Some browsers omit type for .mov / .mp4 — fall back to extension.
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".mp4") ||
    name.endsWith(".mov") ||
    name.endsWith(".webm") ||
    name.endsWith(".m4v")
  );
}

export function validateVideoFile(file: File): string | null {
  if (!isAllowedVideoFile(file)) {
    return "Use an MP4, MOV, WebM, or M4V video.";
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return "Video must be 10 GB or smaller.";
  }
  if (file.size === 0) {
    return "Video file is empty.";
  }
  return null;
}

export const VIDEO_ACCEPT =
  "video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v";
