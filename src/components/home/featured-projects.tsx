"use client";

import {
  useEffect,
  useState,
  type AnimationEvent,
  type CSSProperties,
} from "react";
import type { Project } from "@/types/projects";
import { MediaTile } from "@/src/components/media/media-tile";
import { getMediaTileDisplaySize } from "@/src/lib/media-tile-size";
import { useProjectsOverlay } from "@/src/components/work/projects-provider";

const STREAM_SLOTS = [
  {
    left: "3%",
    tabletLeft: "4%",
    mobileLeft: "4%",
    duration: 44,
    delay: -22,
    fadeDuration: 0.7,
    fadeDelay: 0.05,
  },
  {
    left: "16%",
    tabletLeft: "48%",
    mobileLeft: "48%",
    duration: 51,
    delay: -38,
    fadeDuration: 1.6,
    fadeDelay: 0.35,
  },
  {
    left: "28%",
    tabletLeft: "22%",
    mobileLeft: "8%",
    duration: 47,
    delay: -14,
    fadeDuration: 1.1,
    fadeDelay: 0.12,
  },
  {
    left: "48%",
    tabletLeft: "58%",
    mobileLeft: "52%",
    duration: 54,
    delay: -6,
    fadeDuration: 2.2,
    fadeDelay: 0.48,
  },
  {
    left: "61%",
    tabletLeft: "6%",
    mobileLeft: "2%",
    duration: 49,
    delay: -4,
    fadeDuration: 0.9,
    fadeDelay: 0.22,
  },
  {
    left: "70%",
    tabletLeft: "40%",
    mobileLeft: "46%",
    duration: 46,
    delay: -9,
    fadeDuration: 1.8,
    fadeDelay: 0.08,
  },
  {
    left: "10%",
    tabletLeft: "64%",
    mobileLeft: "10%",
    duration: 56,
    delay: -49,
    fadeDuration: 1.3,
    fadeDelay: 0.55,
  },
  {
    left: "54%",
    tabletLeft: "18%",
    mobileLeft: "54%",
    duration: 52,
    delay: -11,
    fadeDuration: 2.0,
    fadeDelay: 0.18,
  },
  {
    left: "22%",
    tabletLeft: "34%",
    mobileLeft: "6%",
    duration: 48,
    delay: -33,
    fadeDuration: 0.8,
    fadeDelay: 0.42,
  },
  {
    left: "42%",
    tabletLeft: "12%",
    mobileLeft: "50%",
    duration: 53,
    delay: -18,
    fadeDuration: 1.5,
    fadeDelay: 0.28,
  },
  {
    left: "58%",
    tabletLeft: "52%",
    mobileLeft: "12%",
    duration: 45,
    delay: -3,
    fadeDuration: 2.4,
    fadeDelay: 0.02,
  },
  {
    left: "66%",
    tabletLeft: "28%",
    mobileLeft: "44%",
    duration: 50,
    delay: -7,
    fadeDuration: 1.0,
    fadeDelay: 0.6,
  },
  {
    left: "6%",
    tabletLeft: "62%",
    mobileLeft: "16%",
    duration: 55,
    delay: -46,
    fadeDuration: 1.7,
    fadeDelay: 0.15,
  },
  {
    left: "34%",
    tabletLeft: "10%",
    mobileLeft: "56%",
    duration: 43,
    delay: -28,
    fadeDuration: 1.2,
    fadeDelay: 0.38,
  },
  {
    left: "52%",
    tabletLeft: "44%",
    mobileLeft: "0%",
    duration: 57,
    delay: -8,
    fadeDuration: 2.1,
    fadeDelay: 0.25,
  },
  {
    left: "64%",
    tabletLeft: "20%",
    mobileLeft: "42%",
    duration: 46,
    delay: -2,
    fadeDuration: 0.95,
    fadeDelay: 0.5,
  },
  {
    left: "72%",
    tabletLeft: "56%",
    mobileLeft: "14%",
    duration: 52,
    delay: -12,
    fadeDuration: 1.4,
    fadeDelay: 0.1,
  },
  {
    left: "46%",
    tabletLeft: "14%",
    mobileLeft: "58%",
    duration: 49,
    delay: -27,
    fadeDuration: 1.9,
    fadeDelay: 0.32,
  },
  {
    left: "18%",
    tabletLeft: "38%",
    mobileLeft: "24%",
    duration: 54,
    delay: -35,
    fadeDuration: 1.05,
    fadeDelay: 0.45,
  },
  {
    left: "38%",
    tabletLeft: "68%",
    mobileLeft: "36%",
    duration: 47,
    delay: -40,
    fadeDuration: 2.3,
    fadeDelay: 0.2,
  },
] as const;

type StreamSlot = {
  id: number;
  projectIndex: number;
  generation: number;
};

type StreamStyle = CSSProperties & {
  "--tile-left": string;
  "--tile-left-tablet": string;
  "--tile-left-mobile": string;
  "--tile-duration": string;
  "--tile-delay": string;
  "--fade-duration": string;
  "--fade-delay": string;
  "--tile-width": string;
};

type FeaturedProjectsProps = {
  projects: Project[];
};

function createInitialSlots(projectCount: number): StreamSlot[] {
  return STREAM_SLOTS.map((_, index) => ({
    id: index,
    projectIndex: projectCount === 0 ? 0 : index % projectCount,
    generation: 0,
  }));
}

export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  const { isOpen: projectsOverlayOpen } = useProjectsOverlay();
  const [slots, setSlots] = useState<StreamSlot[]>(() =>
    createInitialSlots(projects.length),
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const streamActive = !projectsOverlayOpen;
  const featuredClassName = `home-featured relative${projectsOverlayOpen ? " home-featured--suspended" : ""}`;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      setPrefersReducedMotion(mediaQuery.matches);
    }
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  if (projects.length === 0) {
    return null;
  }

  function recycleSlot(slotId: number) {
    setSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              projectIndex:
                (slot.projectIndex + STREAM_SLOTS.length) % projects.length,
              generation: slot.generation + 1,
            }
          : slot,
      ),
    );
  }

  function handleAnimationEnd(
    event: AnimationEvent<HTMLLIElement>,
    slotId: number,
  ) {
    if (
      !streamActive ||
      event.target !== event.currentTarget ||
      event.animationName !== "media-tile-rise"
    ) {
      return;
    }

    recycleSlot(slotId);
  }

  // Mount only one layout so media isn't decoded twice.
  if (prefersReducedMotion) {
    return (
      <div
        className={featuredClassName}
        aria-hidden={projectsOverlayOpen || undefined}
      >
        <ul className="relative z-30 grid h-full list-none grid-cols-1 gap-(--space-3) px-48 py-(--space-4) md:grid-cols-2 md:gap-(--space-4) lg:grid-cols-4">
          {projects.slice(0, STREAM_SLOTS.length).map((project, index) => {
            const config = STREAM_SLOTS[index];
            const style = {
              "--fade-duration": `${config.fadeDuration}s`,
              "--fade-delay": `${config.fadeDelay}s`,
            } as CSSProperties & {
              "--fade-duration": string;
              "--fade-delay": string;
            };

            return (
              <li key={project.id} className="media-tile-enter" style={style}>
                <MediaTile
                  project={project}
                  priority={index < 4}
                  eager
                  active={streamActive}
                />
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div
      className={featuredClassName}
      aria-hidden={projectsOverlayOpen || undefined}
    >
      <ul
        className="pointer-events-none absolute inset-y-0 left-48 right-48 z-30 list-none overflow-hidden"
        aria-label="Continuously scrolling featured projects"
      >
        {slots.map((slot) => {
          const config = STREAM_SLOTS[slot.id];
          const project = projects[slot.projectIndex];
          const displaySize = getMediaTileDisplaySize(
            project.cover.width,
            project.cover.height,
          );
          const style: StreamStyle = {
            "--tile-left": config.left,
            "--tile-left-tablet": config.tabletLeft,
            "--tile-left-mobile": config.mobileLeft,
            "--tile-duration": `${config.duration}s`,
            "--tile-delay": slot.generation === 0 ? `${config.delay}s` : "0s",
            "--fade-duration": `${config.fadeDuration}s`,
            "--fade-delay": `${config.fadeDelay}s`,
            "--tile-width": `${displaySize.width}px`,
          };

          return (
            <li
              key={`${slot.id}-${slot.generation}`}
              className={`media-stream-item absolute left-(--tile-left-mobile) w-[min(40vw,var(--tile-width))] md:left-(--tile-left-tablet) md:w-(--tile-width) lg:left-(--tile-left)${slot.generation === 0 ? " media-stream-item--enter" : ""}`}
              style={style}
              onAnimationEnd={(event) => handleAnimationEnd(event, slot.id)}
            >
              <MediaTile
                project={project}
                priority={slot.id < 4}
                eager
                active={streamActive}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
