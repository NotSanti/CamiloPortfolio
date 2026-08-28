"use client";

import Link from "next/link";
import { memo } from "react";
import type { Project } from "@/types/projects";
import {
  getMuxAnimatedUrl,
  getMuxPosterUrl,
} from "@/src/lib/mux/playback";

/** Small enough for sphere tiles; avoids Next.js image-optimizer workers. */
const GLOBE_STILL_WIDTH = 384;
/** Mux animated max is 640; tiles are ~110×138 so 320 is enough. */
const GLOBE_ANIMATED_WIDTH = 320;

type FeaturedGlobeTileProps = {
  project: Project;
  priority?: boolean;
};

function getVideoPlaybackId(project: Project): string | undefined {
  if (project.kind !== "video") {
    return undefined;
  }
  return project.media.find((item) => item.type === "video")?.muxPlaybackId;
}

function getGlobeStillSrc(project: Project): string {
  const { cover, media } = project;
  const playbackId = getVideoPlaybackId(project);
  if (playbackId) {
    return getMuxPosterUrl(playbackId, {
      width: GLOBE_STILL_WIDTH,
    });
  }
  if (project.kind === "video") {
    const video = media.find((item) => item.type === "video");
    return video?.posterSrc || cover.src;
  }
  return cover.src;
}

function getGlobeAnimatedSrc(project: Project): string | undefined {
  const playbackId = getVideoPlaybackId(project);
  if (!playbackId) {
    return undefined;
  }
  return getMuxAnimatedUrl(playbackId, {
    width: GLOBE_ANIMATED_WIDTH,
    fps: 12,
    end: 4,
  });
}

function FeaturedGlobeTileComponent({
  project,
  priority = false,
}: FeaturedGlobeTileProps) {
  const stillSrc = getGlobeStillSrc(project);
  const animatedSrc = getGlobeAnimatedSrc(project);
  const hasImage = Boolean(stillSrc);

  return (
    <Link
      href={`/work/${project.slug}`}
      tabIndex={-1}
      draggable={false}
      className="relative block size-full rounded-none bg-media-placeholder"
      aria-label={`View project: ${project.title}`}
    >
      {hasImage ? (
        // Native img: next/image would hit /_next/image every time a tile's
        // CSS size changes, spawning unbounded optimizer workers in `next dev`.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stillSrc}
          alt={project.cover.alt}
          width={GLOBE_STILL_WIDTH}
          height={Math.round((GLOBE_STILL_WIDTH * 94) / 75)}
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          draggable={false}
          className="size-full rounded-none object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[20px] font-normal text-foreground">
          media
        </span>
      )}
      {animatedSrc ? (
        // Native img so Mux animated.webp keeps playing. Shown on front-facing
        // tiles via CSS; display:none on the back avoids decoding hidden loops.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={animatedSrc}
          alt=""
          width={GLOBE_ANIMATED_WIDTH}
          height={Math.round((GLOBE_ANIMATED_WIDTH * 94) / 75)}
          decoding="async"
          loading="lazy"
          draggable={false}
          aria-hidden
          className="globe-cover--animated pointer-events-none absolute inset-0 size-full rounded-none object-cover"
        />
      ) : null}
    </Link>
  );
}

export const FeaturedGlobeTile = memo(FeaturedGlobeTileComponent);
