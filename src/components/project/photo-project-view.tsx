"use client";

import Image from "next/image";
import {
  Fragment,
  startTransition,
  useEffect,
  useId,
  useState,
  ViewTransition,
} from "react";
import type { MediaItem } from "@/types/projects";
import {
  getCarouselDisplaySize,
  getFilmstripDisplaySize,
} from "@/src/lib/media-tile-size";

type PhotoProjectViewProps = {
  title: string;
  media: MediaItem[];
};

function photoTransitionName(photoId: string) {
  return `caloid-photo-${photoId}`;
}

export function PhotoProjectView({ title, media }: PhotoProjectViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const labelId = useId();
  const photos = media.filter((item) => item.type === "image");
  const selected = photos.find((item) => item.id === selectedId) ?? null;

  function selectPhoto(photoId: string) {
    // Within expanded view, swap instantly — named ViewTransitions on the hero
    // + filmstrip were colliding. Use a transition only when opening from carousel.
    if (selectedId !== null) {
      setSelectedId(photoId);
      return;
    }

    startTransition(() => {
      setSelectedId(photoId);
    });
  }

  function closeExpanded() {
    startTransition(() => {
      setSelectedId(null);
    });
  }

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        startTransition(() => {
          setSelectedId(null);
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  if (photos.length === 0) {
    return null;
  }

  if (selected) {
    const others = photos.filter((photo) => photo.id !== selected.id);

    return (
      <div className="photo-expanded relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-background">
        <div className="photo-expanded-stage grid min-h-0 flex-1 place-items-center">
          <ViewTransition
            key={selected.id}
            name={photoTransitionName(selected.id)}
            share="photo-morph"
          >
            <button
              type="button"
              className="photo-expanded-frame relative h-full w-full overflow-hidden bg-background"
              onClick={closeExpanded}
              aria-label={`Close expanded view of ${selected.alt}`}
            >
              <Image
                src={selected.src}
                alt={selected.alt}
                fill
                className="object-contain"
                priority
                sizes="100vw"
                quality={90}
              />
            </button>
          </ViewTransition>
        </div>

        {others.length > 0 ? (
          <div className="photo-filmstrip absolute bottom-4 left-[15px] z-30 w-max md:bottom-6 md:left-6 lg:bottom-0">
            <ul
              className="flex list-none gap-3 overflow-x-auto"
              aria-label={`${title} other photos`}
            >
              {others.map((photo) => {
                const size = getFilmstripDisplaySize(photo.width, photo.height);

                return (
                  <li key={photo.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => selectPhoto(photo.id)}
                      className="block overflow-hidden bg-media-placeholder opacity-80 transition-opacity hover:opacity-100"
                      style={{ width: size.width, height: size.height }}
                      aria-label={`View ${photo.alt}`}
                    >
                      <Image
                        src={photo.src}
                        alt=""
                        width={photo.width}
                        height={photo.height}
                        sizes="120px"
                        className="size-full object-cover"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
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
            const tile = (
              <button
                type="button"
                className="relative shrink-0 overflow-hidden bg-media-placeholder shadow-none transition-shadow duration-300 hover:z-10 hover:shadow-[0_18px_48px_rgba(0,0,0,0.22)] focus-visible:z-10 focus-visible:shadow-[0_18px_48px_rgba(0,0,0,0.22)]"
                style={{ width: size.width, height: size.height }}
                onClick={() => selectPhoto(photo.id)}
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
                  priority={index < 2}
                  quality={85}
                />
              </button>
            );

            // Only the live (non-clone) tile owns the shared name.
            if (isClone) {
              return (
                <Fragment key={`${photo.id}-${index}`}>{tile}</Fragment>
              );
            }

            return (
              <ViewTransition
                key={photo.id}
                name={photoTransitionName(photo.id)}
                share="photo-morph"
              >
                {tile}
              </ViewTransition>
            );
          })}
        </div>
      </div>
    </div>
  );
}
