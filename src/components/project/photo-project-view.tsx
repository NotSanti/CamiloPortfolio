"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import type { MediaItem } from "@/types/projects";
import {
  getCarouselDisplaySize,
  getFilmstripDisplaySize,
} from "@/src/lib/media-tile-size";

type PhotoProjectViewProps = {
  title: string;
  media: MediaItem[];
};

export function PhotoProjectView({ title, media }: PhotoProjectViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const labelId = useId();
  const photos = media.filter((item) => item.type === "image");
  const selected = photos.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedId(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  if (photos.length === 0) {
    return null;
  }

  if (selected) {
    return (
      <div className="relative flex min-h-screen flex-col bg-background px-8 pb-36 pt-[74px] lg:pb-40">
        <button
          type="button"
          className="relative mx-auto aspect-[1310/796] w-full max-w-[1310px] overflow-hidden bg-media-placeholder"
          onClick={() => setSelectedId(null)}
          aria-label={`Close expanded view of ${selected.alt}`}
        >
          <Image
            src={selected.src}
            alt={selected.alt}
            width={selected.width}
            height={selected.height}
            className="size-full object-cover"
            priority
          />
        </button>

        <ul
          className="absolute bottom-4 left-8 flex max-w-[min(440px,calc(100%-4rem))] list-none gap-3 overflow-x-auto md:bottom-6"
          aria-label={`${title} photo filmstrip`}
        >
          {photos.map((photo) => {
            const size = getFilmstripDisplaySize(photo.width, photo.height);
            const isActive = photo.id === selected.id;

            return (
              <li key={photo.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedId(photo.id)}
                  className={`block overflow-hidden bg-media-placeholder transition-opacity ${isActive ? "opacity-100 ring-2 ring-accent" : "opacity-70 hover:opacity-100"}`}
                  style={{ width: size.width, height: size.height }}
                  aria-label={`View ${photo.alt}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <Image
                    src={photo.src}
                    alt=""
                    width={photo.width}
                    height={photo.height}
                    className="size-full object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const track = [...photos, ...photos];

  return (
    <div className="relative flex min-h-screen items-center overflow-hidden bg-background">
      <div className="w-full overflow-hidden py-8" aria-labelledby={labelId}>
        <p id={labelId} className="sr-only">
          {title} photo carousel
        </p>
        <div className="photo-carousel-track flex w-max items-center gap-[61px] will-change-transform">
          {track.map((photo, index) => {
            const size = getCarouselDisplaySize(photo.width, photo.height);
            const isClone = index >= photos.length;

            return (
              <button
                key={`${photo.id}-${index}`}
                type="button"
                className="relative shrink-0 overflow-hidden bg-media-placeholder shadow-none transition-shadow duration-300 hover:z-10 hover:shadow-[0_18px_48px_rgba(0,0,0,0.22)] focus-visible:z-10 focus-visible:shadow-[0_18px_48px_rgba(0,0,0,0.22)]"
                style={{ width: size.width, height: size.height }}
                onClick={() => setSelectedId(photo.id)}
                aria-label={`Expand ${photo.alt}`}
                tabIndex={isClone ? -1 : 0}
                aria-hidden={isClone || undefined}
              >
                <Image
                  src={photo.src}
                  alt={isClone ? "" : photo.alt}
                  width={photo.width}
                  height={photo.height}
                  className="size-full object-cover"
                  sizes="(max-width: 768px) 70vw, 400px"
                  priority={index < 3}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
