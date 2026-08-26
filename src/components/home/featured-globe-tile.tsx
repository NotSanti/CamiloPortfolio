"use client";

import Link from "next/link";
import { memo } from "react";
import type { Project } from "@/types/projects";
import { getMuxPosterUrl } from "@/src/lib/mux/playback";

/** Small enough for sphere tiles; avoids Next.js image-optimizer workers. */
const GLOBE_STILL_WIDTH = 384;

type FeaturedGlobeTileProps = {
  project: Project;
  priority?: boolean;
};

function getGlobeStillSrc(project: Project): string {
  const { cover, kind, media } = project;
  if (kind === "video") {
    const video = media.find((item) => item.type === "video");
    if (video?.muxPlaybackId) {
      return getMuxPosterUrl(video.muxPlaybackId, {
        width: GLOBE_STILL_WIDTH,
      });
    }
    return video?.posterSrc || cover.src;
  }
  return cover.src;
}

function FeaturedGlobeTileComponent({
  project,
  priority = false,
}: FeaturedGlobeTileProps) {
  const stillSrc = getGlobeStillSrc(project);
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
    </Link>
  );
}

export const FeaturedGlobeTile = memo(FeaturedGlobeTileComponent);
