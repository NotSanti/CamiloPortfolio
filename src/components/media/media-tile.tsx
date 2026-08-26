"use client";

import Image from "next/image";
import Link from "next/link";
import {
  memo,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/types/projects";
import { ProjectMuxVideo } from "@/src/components/media/project-mux-video";

type MediaTileProps = {
  project: Project;
  className?: string;
  priority?: boolean;
  /** Force eager fetch even without priority (e.g. home stream under boot overlay). */
  eager?: boolean;
  /** When false, pause/unmount video (e.g. projects overlay is open). */
  active?: boolean;
};

function MediaTileComponent({
  project,
  className = "",
  priority = false,
  eager = false,
  active = true,
}: MediaTileProps) {
  const { cover, slug, title, kind, media } = project;
  const video =
    kind === "video" ? media.find((item) => item.type === "video") : undefined;
  const muxPlaybackId = video?.muxPlaybackId;
  const videoSrc = video?.src;
  const poster = video?.posterSrc ?? cover.src;
  const stillSrc = kind === "video" ? poster || cover.src : cover.src;
  const hasImage = Boolean(stillSrc);
  const aspectRatio =
    cover.width > 0 && cover.height > 0
      ? `${cover.width} / ${cover.height}`
      : "8 / 11";

  const rootRef = useRef<HTMLAnchorElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const hoverLeaveTimerRef = useRef<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [labelVisible, setLabelVisible] = useState(false);

  const isVideoProject =
    kind === "video" && Boolean(muxPlaybackId || videoSrc);

  const canPlayMux =
    active && !prefersReducedMotion && isHovered && Boolean(muxPlaybackId);
  const canPlayNativeVideo =
    active &&
    !prefersReducedMotion &&
    isHovered &&
    !muxPlaybackId &&
    Boolean(videoSrc);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      setPrefersReducedMotion(mediaQuery.matches);
    }
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    if (canPlayNativeVideo) {
      const playAttempt = node.play();
      if (playAttempt !== undefined) {
        playAttempt.catch(() => {
          // Autoplay can be blocked; poster remains visible underneath.
        });
      }
      return;
    }

    node.pause();
  }, [canPlayNativeVideo]);

  useEffect(
    () => () => {
      if (hoverLeaveTimerRef.current !== null) {
        window.clearTimeout(hoverLeaveTimerRef.current);
      }
    },
    [],
  );

  function setHovered(next: boolean) {
    if (hoverLeaveTimerRef.current !== null) {
      window.clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }

    if (next) {
      setIsHovered(true);
      return;
    }

    // Stream tiles move under the cursor; confirm the pointer really left.
    hoverLeaveTimerRef.current = window.setTimeout(() => {
      hoverLeaveTimerRef.current = null;
      if (rootRef.current?.matches(":hover")) {
        return;
      }
      setIsHovered(false);
    }, 48);
  }

  function moveLabel(clientX: number, clientY: number) {
    const node = labelRef.current;
    if (!node) return;
    node.style.transform = `translate3d(${clientX + 14}px, ${clientY + 16}px, 0)`;
  }

  function onMouseEnter(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (isVideoProject) {
      setHovered(true);
    }
    setLabelVisible(true);
    requestAnimationFrame(() => moveLabel(event.clientX, event.clientY));
  }

  function onMouseLeave() {
    if (isVideoProject) {
      setHovered(false);
    }
    setLabelVisible(false);
  }

  function onPointerEnter(event: ReactPointerEvent<HTMLAnchorElement>) {
    if (event.pointerType !== "mouse") return;
    setLabelVisible(true);
    if (isVideoProject) {
      setHovered(true);
    }
    requestAnimationFrame(() => moveLabel(event.clientX, event.clientY));
  }

  function onPointerMove(event: ReactPointerEvent<HTMLAnchorElement>) {
    if (event.pointerType !== "mouse" || !labelVisible) return;
    moveLabel(event.clientX, event.clientY);
  }

  function onPointerLeave() {
    setLabelVisible(false);
    if (isVideoProject) {
      setHovered(false);
    }
  }

  return (
    <>
      <Link
        ref={rootRef}
        href={`/work/${slug}`}
        className={`media-tile group relative z-0 block w-full origin-center bg-media-placeholder shadow-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-30 hover:scale-[1.06] focus-visible:z-30 focus-visible:scale-[1.06] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100 ${className}`}
        style={{ aspectRatio }}
        aria-label={`View project: ${title}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <span className="relative block size-full overflow-hidden">
          {hasImage ? (
            <Image
              src={stillSrc}
              alt={cover.alt}
              width={cover.width}
              height={cover.height}
              sizes="384px"
              priority={priority}
              loading={priority || eager ? "eager" : "lazy"}
              quality={priority ? 75 : 60}
              className="size-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[20px] font-normal text-foreground">
              media
            </span>
          )}

          {canPlayMux && muxPlaybackId ? (
            <span className="pointer-events-none absolute inset-0" aria-hidden>
              <ProjectMuxVideo
                playbackId={muxPlaybackId}
                title={title}
                posterSrc={poster || undefined}
                variant="tile"
                active
              />
            </span>
          ) : null}

          {canPlayNativeVideo && videoSrc ? (
            <video
              ref={videoRef}
              className="pointer-events-none absolute inset-0 size-full object-cover"
              src={videoSrc}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden
              tabIndex={-1}
            />
          ) : null}
        </span>
      </Link>

      {labelVisible
        ? createPortal(
            <span
              ref={labelRef}
              aria-hidden
              className="pointer-events-none fixed top-0 left-0 z-[100] whitespace-nowrap text-xs font-medium uppercase tracking-wide text-accent will-change-transform md:text-sm"
            >
              Open project
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

export const MediaTile = memo(MediaTileComponent);
