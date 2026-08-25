/**
 * Client-safe Mux playback helpers (no API secrets).
 */

export function getMuxPosterUrl(
  playbackId: string,
  options?: { width?: number; time?: number },
): string {
  const params = new URLSearchParams();
  if (options?.width) {
    params.set("width", String(options.width));
  }
  if (options?.time != null) {
    params.set("time", String(options.time));
  }
  const query = params.toString();
  return `https://image.mux.com/${playbackId}/thumbnail.webp${query ? `?${query}` : ""}`;
}
