"use client";

import Link from "next/link";
import { memo } from "react";
import { useReducedMotion } from "motion/react";
import type { Project } from "@/types/projects";
import {
  GLOBE_ANIMATED_WIDTH,
  GLOBE_STILL_HEIGHT,
  GLOBE_STILL_WIDTH,
  getGlobeAnimatedSrc,
  getGlobeStillSrc,
} from "@/src/lib/globe-media";

type FeaturedGlobeTileProps = {
  project: Project;
  priority?: boolean;
};

function FeaturedGlobeTileComponent({
  project,
  priority = false,
}: FeaturedGlobeTileProps) {
  const reducedMotion = useReducedMotion();
  const stillSrc = getGlobeStillSrc(project);
  const animatedSrc =
    reducedMotion === true ? undefined : getGlobeAnimatedSrc(project);
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
          height={GLOBE_STILL_HEIGHT}
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          draggable={false}
          className="size-full rounded-none object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[20px] font-normal text-foreground">
          media
        </span>
      )}
      {animatedSrc ? (
        // Native img so Mux animated.webp keeps playing. `src` is assigned
        // when the tile faces the camera — hidden back-face tiles must not
        // compete with stills on first paint.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          data-src={animatedSrc}
          alt=""
          width={GLOBE_ANIMATED_WIDTH}
          height={Math.round((GLOBE_ANIMATED_WIDTH * GLOBE_STILL_HEIGHT) / GLOBE_STILL_WIDTH)}
          decoding="async"
          draggable={false}
          aria-hidden
          className="globe-cover--animated pointer-events-none absolute inset-0 size-full rounded-none object-cover"
        />
      ) : null}
    </Link>
  );
}

export const FeaturedGlobeTile = memo(FeaturedGlobeTileComponent);
