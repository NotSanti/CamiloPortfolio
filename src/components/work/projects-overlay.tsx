"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type UIEvent,
} from "react";
import type { Project } from "@/types/projects";

/**
 * Funnel renderable region from Figma `Renderable List Borders` (19:86),
 * stretched to the top of the viewport and widened toward the bottom.
 *
 * Top (full width): 0%–100%
 * Bottom (wide taper): ≈22%–78%
 */
const FUNNEL = {
  topLeft: 0,
  topRight: 100,
  bottomLeft: 22,
  bottomRight: 78,
} as const;

const FUNNEL_CLIP = `polygon(${FUNNEL.topLeft}% 0%, ${FUNNEL.topRight}% 0%, ${FUNNEL.bottomRight}% 100%, ${FUNNEL.bottomLeft}% 100%)`;

type ProjectsOverlayProps = {
  projects: Project[];
  onClose: () => void;
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Deterministic PRNG so positions stay stable across re-renders. */
function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Scatter each title randomly inside the funnel.
 * Vertical slots stay stratified so the list still fills the scroll height.
 * Horizontal placement uses the full-bleed top width and reserves space for the
 * title string so each item can sit fully visible when scrolled to the top.
 */
function estimateTitleWidthPercent(title: string): number {
  // ~36px uppercase: roughly 1.1% of viewport width per character on desktop.
  return Math.min(52, Math.max(12, title.length * 1.1));
}

function getFunnelPosition(
  projectId: string,
  title: string,
  index: number,
  total: number,
): { left: string; top: string } {
  const rng = mulberry32(hashString(projectId) ^ Math.imul(index + 1, 0x9e3779b9));
  const count = Math.max(total, 1);
  const top = ((index + rng() * 0.9) / count) * 96 + 2;

  const pad = 1.5;
  const reserve = estimateTitleWidthPercent(title);
  const leftMin = FUNNEL.topLeft + pad;
  const leftMax = Math.max(leftMin + 2, FUNNEL.topRight - pad - reserve);
  const left = leftMin + rng() * (leftMax - leftMin);

  return {
    left: `${left}%`,
    top: `${top}%`,
  };
}

/** Hit-test against the funnel polygon (percentages of the viewport). */
function isInsideFunnel(clientX: number, clientY: number): boolean {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const t = clientY / h;
  const left =
    (FUNNEL.topLeft + t * (FUNNEL.bottomLeft - FUNNEL.topLeft)) * (w / 100);
  const right =
    (FUNNEL.topRight + t * (FUNNEL.bottomRight - FUNNEL.topRight)) * (w / 100);
  return clientX >= left && clientX <= right && clientY >= 0 && clientY <= h;
}

export function ProjectsOverlay({ projects, onClose }: ProjectsOverlayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const positions = useMemo(
    () =>
      projects.map((project, index) =>
        getFunnelPosition(project.id, project.title, index, projects.length),
      ),
    [projects],
  );
  const contentHeightVh = Math.max(220, projects.length * 12);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  /** Lock the page underneath so only the projects list scrollbar is visible. */
  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, []);

  /** Wheel over title links still scrolls the full-viewport scroller. */
  const onWheel = useCallback((event: WheelEvent) => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollTop += event.deltaY;
  }, []);

  useEffect(() => {
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    setScrollTop(event.currentTarget.scrollTop);
  }

  function handleDismissClick(event: ReactMouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a")) {
      return;
    }
    if (!isInsideFunnel(event.clientX, event.clientY)) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Projects"
      onClick={handleDismissClick}
    >
      {/*
        Full-viewport scroller (unclipped) so the native scrollbar works.
        Height spacer drives scroll range; title layer is synced below.
      */}
      <div
        ref={scrollRef}
        className="projects-overlay-scroll absolute inset-0 z-10 overflow-y-auto"
        onScroll={handleScroll}
      >
        <div
          aria-hidden
          className="pointer-events-none w-full"
          style={{ height: `${contentHeightVh}vh` }}
        />
      </div>

      {/*
        Fixed funnel mask: titles scroll through a viewport-locked clip
        that reaches the top of the page.
      */}
      <div
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
        style={{ clipPath: FUNNEL_CLIP }}
      >
        <ul
          className="relative w-full list-none"
          style={{
            height: `${contentHeightVh}vh`,
            transform: `translateY(-${scrollTop}px)`,
          }}
        >
          {projects.map((project, index) => {
            const position = positions[index];

            return (
              <li
                key={project.id}
                className="absolute"
                style={{
                  left: position.left,
                  top: position.top,
                }}
              >
                <Link
                  href={`/work/${project.slug}`}
                  className="pointer-events-auto block max-w-56 truncate whitespace-nowrap text-2xl font-medium uppercase text-accent transition-opacity hover:opacity-70 md:max-w-none md:text-[36px]"
                >
                  {project.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
