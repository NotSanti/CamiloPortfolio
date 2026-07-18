"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/types/projects";

type MediaTileProps = {
  project: Project;
  className?: string;
  priority?: boolean;
};

type CursorLabel = {
  x: number;
  y: number;
  visible: boolean;
};

export function MediaTile({ project, className = "", priority = false }: MediaTileProps) {
  const { cover, slug, title } = project;
  const hasImage = Boolean(cover.src);
  const aspectRatio =
    cover.width > 0 && cover.height > 0
      ? `${cover.width} / ${cover.height}`
      : "8 / 11";

  const [label, setLabel] = useState<CursorLabel>({
    x: 0,
    y: 0,
    visible: false,
  });

  function onPointerEnter(event: ReactPointerEvent<HTMLAnchorElement>) {
    if (event.pointerType !== "mouse") return;
    setLabel({
      x: event.clientX,
      y: event.clientY,
      visible: true,
    });
  }

  function onPointerMove(event: ReactPointerEvent<HTMLAnchorElement>) {
    if (event.pointerType !== "mouse") return;
    setLabel({
      x: event.clientX,
      y: event.clientY,
      visible: true,
    });
  }

  function onPointerLeave() {
    setLabel((current) => ({ ...current, visible: false }));
  }

  return (
    <>
      <Link
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
              src={cover.src}
              alt={cover.alt}
              width={cover.width}
              height={cover.height}
              sizes="(max-width: 768px) 40vw, 280px"
              priority={priority}
              className="size-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[20px] font-normal text-foreground">
              media
            </span>
          )}
        </span>
      </Link>

      {label.visible
        ? createPortal(
            <span
              aria-hidden
              className="pointer-events-none fixed z-[100] whitespace-nowrap text-xs font-medium uppercase tracking-wide text-accent md:text-sm"
              style={{
                left: label.x + 14,
                top: label.y + 16,
              }}
            >
              Open project
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
