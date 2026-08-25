"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import type { Project } from "@/types/projects";

const ProjectMuxVideo = dynamic(
  () =>
    import("@/src/components/media/project-mux-video").then(
      (mod) => mod.ProjectMuxVideo,
    ),
  { ssr: false },
);

type MediaTileProps = {
  project: Project;
  className?: string;
  priority?: boolean;
  /** Force eager fetch even without priority (e.g. home stream under boot overlay). */
  eager?: boolean;
  /** When false, pause/unmount video (e.g. projects overlay is open). */
  active?: boolean;
};

export function MediaTile({
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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const [labelVisible, setLabelVisible] = useState(false);

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
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "120px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const canPlayVideo =
    active &&
    !prefersReducedMotion &&
    inView &&
    Boolean(muxPlaybackId || videoSrc);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || muxPlaybackId) return;

    if (canPlayVideo) {
      const playAttempt = node.play();
      if (playAttempt !== undefined) {
        playAttempt.catch(() => {
          // Autoplay can be blocked; poster remains visible underneath.
        });
      }
      return;
    }

    node.pause();
  }, [canPlayVideo, muxPlaybackId]);

  function moveLabel(clientX: number, clientY: number) {
    const node = labelRef.current;
    if (!node) return;
    node.style.transform = `translate3d(${clientX + 14}px, ${clientY + 16}px, 0)`;
  }

  function onPointerEnter(event: ReactPointerEvent<HTMLAnchorElement>) {
    if (event.pointerType !== "mouse") return;
    setLabelVisible(true);
    const { clientX, clientY } = event;
    requestAnimationFrame(() => moveLabel(clientX, clientY));
  }

  function onPointerMove(event: ReactPointerEvent<HTMLAnchorElement>) {
    if (event.pointerType !== "mouse" || !labelVisible) return;
    moveLabel(event.clientX, event.clientY);
  }

  function onPointerLeave() {
    setLabelVisible(false);
  }

  return (
    <>
      <Link
        ref={rootRef}
        href={`/work/${slug}`}
        className={`media-tile group relative z-0 block w-full origin-center bg-media-placeholder shadow-none transition-[transform,box-shadow] duration-300 ease-out hover:z-30 hover:scale-[1.06] hover:shadow-[0_18px_48px_rgba(0,0,0,0.28)] focus-visible:z-30 focus-visible:scale-[1.06] focus-visible:shadow-[0_18px_48px_rgba(0,0,0,0.28)] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100 ${className}`}
        style={{ aspectRatio }}
        aria-label={`View project: ${title}`}
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
              sizes="160px"
              priority={priority}
              loading={priority || eager ? "eager" : "lazy"}
              quality={80}
              className="size-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[20px] font-normal text-foreground">
              media
            </span>
          )}

          {canPlayVideo && muxPlaybackId ? (
            <span className="pointer-events-none absolute inset-0" aria-hidden>
              <ProjectMuxVideo
                playbackId={muxPlaybackId}
                title={title}
                variant="tile"
                active={canPlayVideo}
              />
            </span>
          ) : null}

          {canPlayVideo && !muxPlaybackId && videoSrc ? (
            <video
              ref={videoRef}
              className="pointer-events-none absolute inset-0 size-full object-cover"
              src={videoSrc}
              muted
              loop
              playsInline
              preload="metadata"
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
