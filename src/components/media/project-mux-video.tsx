"use client";

import MuxPlayer from "@mux/mux-player-react";
import { useEffect, useRef } from "react";
import { getMuxPosterUrl } from "@/src/lib/mux/playback";

type ProjectMuxVideoProps = {
  playbackId: string;
  title: string;
  posterSrc?: string;
  /** `tile` = muted looping preview; `page` = full project stage. */
  variant: "tile" | "page";
  /** When false, pause playback (tile off-screen / overlay open). */
  active?: boolean;
  className?: string;
};

/**
 * Mux adaptive player. Mount only when needed (caller gates with in-view).
 * Does not autoplay when `active` is false.
 */
export function ProjectMuxVideo({
  playbackId,
  title,
  posterSrc,
  variant,
  active = true,
  className = "",
}: ProjectMuxVideoProps) {
  const playerRef = useRef<HTMLElement | null>(null);
  const poster =
    posterSrc ||
    getMuxPosterUrl(playbackId, {
      width: variant === "tile" ? 640 : 1280,
    });

  useEffect(() => {
    const node = playerRef.current as
      | (HTMLElement & { play?: () => Promise<void>; pause?: () => void })
      | null;
    if (!node) return;

    if (active) {
      const attempt = node.play?.();
      if (attempt) {
        attempt.catch(() => {
          // Autoplay may be blocked; poster remains.
        });
      }
      return;
    }

    node.pause?.();
  }, [active, playbackId]);

  const playerStyle = {
    "--controls": "none",
    "--media-object-fit": variant === "tile" ? "cover" : "contain",
  } as never;

  return (
    <MuxPlayer
      ref={playerRef as never}
      playbackId={playbackId}
      streamType="on-demand"
      poster={poster}
      preload="metadata"
      muted
      autoPlay={active ? "muted" : false}
      loop
      playsInline
      style={playerStyle}
      className={`project-mux-video size-full bg-black ${className}`}
      metadata={{
        video_title: title,
      }}
      aria-label={title}
    />
  );
}
