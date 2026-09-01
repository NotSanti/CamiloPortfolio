import { getResizedStorageUrl } from "@/src/lib/media";
import {
  getMuxAnimatedUrl,
  getMuxPosterUrl,
} from "@/src/lib/mux/playback";
import type { Project } from "@/types/projects";

/** 2× a 110×138 tile, plus a little headroom for sphere scale. */
export const GLOBE_STILL_WIDTH = 256;
export const GLOBE_STILL_HEIGHT = 320;
/** Animated overlays only load on facing tiles; keep the file small. */
export const GLOBE_ANIMATED_WIDTH = 160;

function getVideoPlaybackId(project: Project): string | undefined {
  if (project.kind !== "video") {
    return undefined;
  }
  return project.media.find((item) => item.type === "video")?.muxPlaybackId;
}

export function getGlobeStillSrc(project: Project): string {
  const playbackId = getVideoPlaybackId(project);
  if (playbackId) {
    return getMuxPosterUrl(playbackId, {
      width: GLOBE_STILL_WIDTH,
    });
  }
  if (project.kind === "video") {
    const video = project.media.find((item) => item.type === "video");
    const poster = video?.posterSrc || project.cover.src;
    return getResizedStorageUrl(poster, {
      width: GLOBE_STILL_WIDTH,
      height: GLOBE_STILL_HEIGHT,
    });
  }
  return getResizedStorageUrl(project.cover.src, {
    width: GLOBE_STILL_WIDTH,
    height: GLOBE_STILL_HEIGHT,
  });
}

export function getGlobeAnimatedSrc(project: Project): string | undefined {
  const playbackId = getVideoPlaybackId(project);
  if (!playbackId) {
    return undefined;
  }
  return getMuxAnimatedUrl(playbackId, {
    width: GLOBE_ANIMATED_WIDTH,
    fps: 8,
    end: 3,
  });
}
