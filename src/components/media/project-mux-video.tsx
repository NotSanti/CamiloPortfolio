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
  /** Page custom controls: pause without unmounting. */
  paused?: boolean;
  /** Page custom controls: mute state. Tiles stay muted. */
  muted?: boolean;
  className?: string;
};

/**
 * Mux adaptive player.
 * Tile callers mount on hover and unmount when the pointer leaves.
 * Page variant may stay mounted for the project stage.
 */
type MuxMediaNode = HTMLElement & {
  play?: () => Promise<void>;
  pause?: () => void;
  muted?: boolean;
};

export function ProjectMuxVideo({
  playbackId,
  title,
  posterSrc,
  variant,
  active = true,
  paused = false,
  muted = true,
  className = "",
}: ProjectMuxVideoProps) {
  const playerRef = useRef<HTMLElement | null>(null);
  const poster =
    posterSrc ||
    getMuxPosterUrl(playbackId, {
      width: variant === "tile" ? 640 : 1280,
    });
  const shouldPlay = active && !paused;
  const isMuted = variant === "tile" ? true : muted;

  useEffect(() => {
    const node = playerRef.current as MuxMediaNode | null;
    if (node) {
      node.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    const node = playerRef.current as MuxMediaNode | null;
    if (!node) {
      return;
    }

    function tryPlay() {
      if (!shouldPlay || !node) {
        return;
      }
      const attempt = node.play?.();
      if (attempt) {
        attempt.catch(() => {
          // Autoplay may be blocked; poster remains.
        });
      }
    }

    if (shouldPlay) {
      node.addEventListener("loadeddata", tryPlay);
      node.addEventListener("canplay", tryPlay);
      tryPlay();
    } else {
      node.pause?.();
    }

    return () => {
      node.removeEventListener("loadeddata", tryPlay);
      node.removeEventListener("canplay", tryPlay);
      node.pause?.();
    };
  }, [playbackId, shouldPlay]);

  const disableTracking = variant === "tile";

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
      preload={variant === "tile" ? "metadata" : "metadata"}
      muted={isMuted}
      autoPlay={variant === "page" && shouldPlay ? "muted" : false}
      loop
      playsInline
      maxResolution={variant === "tile" ? "720p" : undefined}
      disableTracking={disableTracking}
      style={playerStyle}
      className={`project-mux-video size-full bg-black ${className}`}
      metadata={
        variant === "page"
          ? {
              video_title: title,
            }
          : undefined
      }
      aria-label={title}
    />
  );
}
