/**
 * Client-safe Mux playback helpers (no API secrets).
 */

const MUX_ANIMATED_MAX_WIDTH = 640;
const MUX_ANIMATED_MAX_FPS = 30;

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

/**
 * Short looping WebP from a Mux asset. Do not pass through `next/image` —
 * the optimizer freezes animation.
 *
 * Mux caps: width 640, fps 30, duration 10s (default 5s from `start`).
 */
export function getMuxAnimatedUrl(
  playbackId: string,
  options?: { width?: number; fps?: number; start?: number; end?: number },
): string {
  const params = new URLSearchParams();
  if (options?.width) {
    params.set(
      "width",
      String(
        Math.min(
          MUX_ANIMATED_MAX_WIDTH,
          Math.max(1, Math.round(options.width)),
        ),
      ),
    );
  }
  if (options?.fps) {
    params.set(
      "fps",
      String(
        Math.min(MUX_ANIMATED_MAX_FPS, Math.max(1, Math.round(options.fps))),
      ),
    );
  }
  if (options?.start != null) {
    params.set("start", String(options.start));
  }
  if (options?.end != null) {
    params.set("end", String(options.end));
  }
  const query = params.toString();
  return `https://image.mux.com/${playbackId}/animated.webp${query ? `?${query}` : ""}`;
}
