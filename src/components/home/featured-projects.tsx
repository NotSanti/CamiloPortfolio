"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import type { Project } from "@/types/projects";
import { FeaturedGlobeTile } from "@/src/components/home/featured-globe-tile";
import { useProjectsOverlay } from "@/src/components/work/projects-provider";
import {
  DEG,
  FIT_REFERENCE,
  fibonacciSpherePoints,
  identity,
  multiply,
  orthonormalize,
  projectBillboardTile,
  rotationX,
  rotationY,
  transform,
  sphereFitScale,
  type Mat3,
  type SpherePoint,
  type SphereTileLayout,
  type Vec3,
} from "@/src/lib/sphere-orbit";

const TILE_COUNT = 48;
const TILE_WIDTH = 110;
const TILE_HEIGHT = 138;
const RADIUS = 280;
const DISTANCE = 730;
const AUTO_ROTATE_SPEED_DEG = 4;
const FRICTION = 0.94;
const DEPTH_FADE = 0.8;
const CLICK_OPACITY_MIN = 0.35;
const INTRO_DELAY_MS = 80;
const INTRO_STAGGER_MS = 70;
const INTRO_DURATION_MS = 180;
const TAP_SLOP_PX = 6;
const ORTHONORMALIZE_EVERY = 240;
const KEY_STEP_DEG = 8;
const KEY_STEP_SHIFT_DEG = 24;

type FeaturedProjectsProps = {
  projects: Project[];
};

type HoverLabelState = {
  visible: boolean;
  x: number;
  y: number;
};

function isFrontTile(el: HTMLElement): boolean {
  return Number.parseFloat(el.style.opacity || "0") >= CLICK_OPACITY_MIN;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function introAmount(elapsedMs: number, index: number): number {
  const t = (elapsedMs - INTRO_DELAY_MS - index * INTRO_STAGGER_MS) / INTRO_DURATION_MS;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return easeOutCubic(t);
}

function introDurationMs(count: number): number {
  return INTRO_DELAY_MS + Math.max(0, count - 1) * INTRO_STAGGER_MS + INTRO_DURATION_MS;
}

/** Rank 0 is closest to camera (higher z). */
function frontToBackRanks(
  points: SpherePoint[],
  matrix: Mat3,
  scratch: Vec3,
): number[] {
  const scored: Array<{ index: number; z: number }> = [];
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    if (!point) continue;
    transform(matrix, point.ux, point.uy, point.uz, scratch);
    scored.push({ index: i, z: scratch.z });
  }
  scored.sort((a, b) => b.z - a.z);
  const ranks = new Array<number>(points.length);
  for (let order = 0; order < scored.length; order += 1) {
    const item = scored[order];
    if (!item) continue;
    ranks[item.index] = order;
  }
  return ranks;
}

function subscribeNever(): () => void {
  return () => {};
}

type TileWriteCache = {
  tx: number;
  ty: number;
  scale: number;
  opacity: number;
  zIndex: number;
  events: 0 | 1;
  width: number;
  height: number;
};

function makeTileCache(): TileWriteCache {
  return {
    tx: Number.NaN,
    ty: Number.NaN,
    scale: Number.NaN,
    opacity: Number.NaN,
    zIndex: Number.NaN,
    events: 0,
    width: 0,
    height: 0,
  };
}

function quantize(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  const { isOpen: projectsOverlayOpen } = useProjectsOverlay();
  const reducedMotion = useReducedMotion();
  const prefersReducedMotion = reducedMotion === true;

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const matrixRef = useRef<Mat3>(identity());
  const velRef = useRef({ yaw: 0, pitch: 0 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const pointsRef = useRef<SpherePoint[]>([]);
  const scratchRef = useRef<Vec3>({ x: 0, y: 0, z: 0 });
  const frontElRef = useRef<HTMLLIElement | null>(null);
  const draggingRef = useRef(false);
  const allowClickRef = useRef(true);
  const pointerDownRef = useRef(false);
  const tapOriginRef = useRef({ x: 0, y: 0 });
  const lastPointerRef = useRef({ x: 0, y: 0, t: 0 });
  const reducedMotionRef = useRef(prefersReducedMotion);
  const overlayOpenRef = useRef(projectsOverlayOpen);
  const introElapsedRef = useRef(0);
  const introDoneRef = useRef(false);
  const introRankRef = useRef<number[] | null>(null);
  const motionKnownRef = useRef(false);
  const labelNodeRef = useRef<HTMLSpanElement>(null);
  const isClient = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [hoverLabel, setHoverLabel] = useState<HoverLabelState>({
    visible: false,
    x: 0,
    y: 0,
  });

  const tileCount = prefersReducedMotion
    ? Math.max(projects.length, 0)
    : TILE_COUNT;
  const points = useMemo(
    () => fibonacciSpherePoints(tileCount),
    [tileCount],
  );

  const featuredClassName = `home-featured relative${projectsOverlayOpen ? " home-featured--suspended" : ""}`;

  useEffect(() => {
    reducedMotionRef.current = prefersReducedMotion;
    if (reducedMotion !== null) {
      motionKnownRef.current = true;
      if (prefersReducedMotion) {
        introDoneRef.current = true;
      }
    }
  }, [prefersReducedMotion, reducedMotion]);

  useEffect(() => {
    overlayOpenRef.current = projectsOverlayOpen;
  }, [projectsOverlayOpen]);

  useEffect(() => {
    pointsRef.current = points;
    introRankRef.current = null;
  }, [points]);

  useEffect(() => {
    const listNode = listRef.current;
    if (!listNode || projects.length === 0) {
      return;
    }
    const globe: HTMLUListElement = listNode;

    const scratch = scratchRef.current;
    const projected: SphereTileLayout = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      scale: 1,
      opacity: 0,
      zIndex: 0,
      front: 0,
    };
    const params = {
      cx: 0,
      cy: 0,
      radius: 0,
      tileWidth: 0,
      tileHeight: 0,
      distance: 0,
      depthFade: DEPTH_FADE,
    };
    const tiles: Array<HTMLLIElement | undefined> = [];
    const writes: TileWriteCache[] = [];
    for (let i = 0; i < tileCount; i += 1) {
      tiles[i] = itemRefs.current.get(i);
      writes[i] = makeTileCache();
    }
    let sizedW = 0;
    let sizedH = 0;

    function layout() {
      const { w, h } = sizeRef.current;
      if (w <= 0 || h <= 0) return;

      if (w !== sizedW || h !== sizedH) {
        sizedW = w;
        sizedH = h;
        const fit = sphereFitScale(w, h, FIT_REFERENCE);
        params.cx = w / 2;
        params.cy = h / 2;
        params.radius = RADIUS * fit;
        params.tileWidth = TILE_WIDTH * fit;
        params.tileHeight = TILE_HEIGHT * fit;
        params.distance = Math.max(DISTANCE * fit, params.radius * 1.05);
      }

      let bestFront = -Infinity;
      let bestEl: HTMLLIElement | null = null;
      const spherePoints = pointsRef.current;
      const skipIntro = reducedMotionRef.current || introDoneRef.current;
      if (
        !skipIntro &&
        (!introRankRef.current || introRankRef.current.length !== spherePoints.length)
      ) {
        introRankRef.current = frontToBackRanks(
          spherePoints,
          matrixRef.current,
          scratch,
        );
      }
      const ranks = introRankRef.current;
      const { tileWidth, tileHeight } = params;

      for (let i = 0; i < spherePoints.length; i += 1) {
        const el = tiles[i];
        const point = spherePoints[i];
        const cache = writes[i];
        if (!el || !point || !cache) continue;

        const amount = skipIntro
          ? 1
          : introAmount(introElapsedRef.current, ranks?.[i] ?? i);

        if (amount <= 0) {
          if (cache.opacity !== 0) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            cache.opacity = 0;
            cache.events = 0;
          }
          continue;
        }

        projectBillboardTile(
          point,
          matrixRef.current,
          params,
          scratch,
          projected,
        );
        const opacity = quantize(projected.opacity * amount, 0.01);
        const events: 0 | 1 =
          amount < 1 || opacity < CLICK_OPACITY_MIN ? 0 : 1;

        if (cache.width !== tileWidth || cache.height !== tileHeight) {
          el.style.width = `${tileWidth}px`;
          el.style.height = `${tileHeight}px`;
          cache.width = tileWidth;
          cache.height = tileHeight;
        }

        const tx = quantize(
          projected.x + (projected.width - tileWidth) / 2,
          0.1,
        );
        const ty = quantize(
          projected.y + (projected.height - tileHeight) / 2,
          0.1,
        );
        const scale = quantize(projected.scale, 0.001);

        if (cache.tx !== tx || cache.ty !== ty || cache.scale !== scale) {
          el.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
          cache.tx = tx;
          cache.ty = ty;
          cache.scale = scale;
        }
        if (cache.opacity !== opacity) {
          el.style.opacity = String(opacity);
          cache.opacity = opacity;
        }
        if (cache.zIndex !== projected.zIndex) {
          el.style.zIndex = String(projected.zIndex);
          cache.zIndex = projected.zIndex;
        }
        if (cache.events !== events) {
          el.style.pointerEvents = events ? "auto" : "none";
          cache.events = events;
        }

        if (projected.front > bestFront) {
          bestFront = projected.front;
          bestEl = el;
        }
      }

      if (bestEl !== frontElRef.current) {
        frontElRef.current?.classList.remove("featured-globe-tile--front");
        bestEl?.classList.add("featured-globe-tile--front");
        frontElRef.current = bestEl;
      }
    }

    function syncSize() {
      sizeRef.current = { w: globe.clientWidth, h: globe.clientHeight };
      layout();
    }

    const observer = new ResizeObserver(() => {
      syncSize();
    });
    observer.observe(globe);
    syncSize();

    if (projectsOverlayOpen) {
      return () => observer.disconnect();
    }

    let rafId = 0;
    let lastFrame = 0;
    let spun = 0;

    function tick(now: number) {
      const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1e3) : 0;
      lastFrame = now;

      if (reducedMotionRef.current) {
        introDoneRef.current = true;
      } else if (motionKnownRef.current && !introDoneRef.current) {
        introElapsedRef.current += dt * 1e3;
        const total = introDurationMs(pointsRef.current.length);
        if (introElapsedRef.current >= total) {
          introElapsedRef.current = total;
          introDoneRef.current = true;
        }
      }

      if (!draggingRef.current) {
        if (!reducedMotionRef.current) {
          const angle = AUTO_ROTATE_SPEED_DEG * DEG * dt;
          matrixRef.current = multiply(matrixRef.current, rotationY(angle));
        }

        const { yaw, pitch } = velRef.current;
        if (yaw || pitch) {
          if (reducedMotionRef.current) {
            velRef.current.yaw = 0;
            velRef.current.pitch = 0;
          } else {
            matrixRef.current = multiply(
              multiply(rotationY(yaw * dt), rotationX(pitch * dt)),
              matrixRef.current,
            );
            const decay = Math.pow(FRICTION, dt * 60);
            velRef.current.yaw *= decay;
            velRef.current.pitch *= decay;
            if (Math.abs(velRef.current.yaw) < 5e-4) velRef.current.yaw = 0;
            if (Math.abs(velRef.current.pitch) < 5e-4) velRef.current.pitch = 0;
          }
        }

        spun += 1;
        if (spun % ORTHONORMALIZE_EVERY === 0) {
          matrixRef.current = orthonormalize(matrixRef.current);
        }
      }

      layout();
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
        rafId = 0;
        lastFrame = 0;
        return;
      }
      if (rafId === 0) {
        rafId = requestAnimationFrame(tick);
      }
    }

    function hideLabel() {
      setHoverLabel((current) =>
        current.visible ? { ...current, visible: false } : current,
      );
    }

    function onPointerDown(event: PointerEvent) {
      if (overlayOpenRef.current) return;
      pointerDownRef.current = true;
      allowClickRef.current = true;
      draggingRef.current = false;
      tapOriginRef.current = { x: event.clientX, y: event.clientY };
      lastPointerRef.current = {
        x: event.clientX,
        y: event.clientY,
        t: performance.now(),
      };
      velRef.current.yaw = 0;
      velRef.current.pitch = 0;
    }

    function onPointerMove(event: PointerEvent) {
      if (!pointerDownRef.current) return;

      const origin = tapOriginRef.current;
      const travelled = Math.hypot(
        event.clientX - origin.x,
        event.clientY - origin.y,
      );

      if (!draggingRef.current && travelled >= TAP_SLOP_PX) {
        draggingRef.current = true;
        allowClickRef.current = false;
        hideLabel();
        globe.classList.add("featured-globe--dragging");
        try {
          globe.setPointerCapture(event.pointerId);
        } catch {
          // Drag still works without capture inside the element.
        }
      }

      if (!draggingRef.current) return;

      const last = lastPointerRef.current;
      const now = performance.now();
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      const dt = Math.max(1, now - last.t) / 1e3;
      const perPx = Math.PI / Math.max(1, sizeRef.current.w);
      const yaw = dx * perPx;
      const pitch = dy * perPx;
      matrixRef.current = multiply(
        multiply(rotationY(yaw), rotationX(pitch)),
        matrixRef.current,
      );

      if (!reducedMotionRef.current) {
        velRef.current.yaw = yaw / dt;
        velRef.current.pitch = pitch / dt;
      }

      lastPointerRef.current = { x: event.clientX, y: event.clientY, t: now };
    }

    function onPointerUp() {
      pointerDownRef.current = false;
      if (draggingRef.current) {
        draggingRef.current = false;
        globe.classList.remove("featured-globe--dragging");
      }
    }

    function onClickCapture(event: MouseEvent) {
      if (!allowClickRef.current) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function onWheel(event: WheelEvent) {
      if (overlayOpenRef.current) return;
      event.preventDefault();
      const perPx = Math.PI / Math.max(1, sizeRef.current.w);
      matrixRef.current = multiply(
        multiply(
          rotationY(event.deltaY * perPx),
          rotationX(event.deltaX * perPx),
        ),
        matrixRef.current,
      );
      velRef.current.yaw = 0;
      velRef.current.pitch = 0;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (overlayOpenRef.current) return;
      const step =
        (event.shiftKey ? KEY_STEP_SHIFT_DEG : KEY_STEP_DEG) * DEG;
      switch (event.key) {
        case "ArrowLeft":
          matrixRef.current = multiply(rotationY(-step), matrixRef.current);
          break;
        case "ArrowRight":
          matrixRef.current = multiply(rotationY(step), matrixRef.current);
          break;
        case "ArrowUp":
          matrixRef.current = multiply(rotationX(-step), matrixRef.current);
          break;
        case "ArrowDown":
          matrixRef.current = multiply(rotationX(step), matrixRef.current);
          break;
        case "Enter":
        case " ": {
          event.preventDefault();
          const link = frontElRef.current?.querySelector("a");
          link?.click();
          return;
        }
        default:
          return;
      }
      event.preventDefault();
      velRef.current.yaw = 0;
      velRef.current.pitch = 0;
    }

    globe.addEventListener("pointerdown", onPointerDown);
    globe.addEventListener("pointermove", onPointerMove);
    globe.addEventListener("pointerup", onPointerUp);
    globe.addEventListener("pointercancel", onPointerUp);
    globe.addEventListener("click", onClickCapture, true);
    globe.addEventListener("keydown", onKeyDown);
    globe.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      globe.classList.remove("featured-globe--dragging");
      globe.removeEventListener("pointerdown", onPointerDown);
      globe.removeEventListener("pointermove", onPointerMove);
      globe.removeEventListener("pointerup", onPointerUp);
      globe.removeEventListener("pointercancel", onPointerUp);
      globe.removeEventListener("click", onClickCapture, true);
      globe.removeEventListener("keydown", onKeyDown);
      globe.removeEventListener("wheel", onWheel);
    };
  }, [projects.length, projectsOverlayOpen, tileCount]);

  function moveLabel(clientX: number, clientY: number) {
    const node = labelNodeRef.current;
    if (!node) return;
    node.style.transform = `translate3d(${clientX + 14}px, ${clientY + 16}px, 0)`;
  }

  function onListPointerMove(event: ReactPointerEvent<HTMLUListElement>) {
    if (event.pointerType !== "mouse" || draggingRef.current) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const tile = target.closest(".featured-globe-tile");
    if (!(tile instanceof HTMLElement) || !isFrontTile(tile)) {
      setHoverLabel((current) =>
        current.visible ? { ...current, visible: false } : current,
      );
      return;
    }
    if (!hoverLabel.visible) return;
    moveLabel(event.clientX, event.clientY);
  }

  function onListPointerOver(event: ReactPointerEvent<HTMLUListElement>) {
    if (event.pointerType !== "mouse" || draggingRef.current) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const tile = target.closest(".featured-globe-tile");
    if (!(tile instanceof HTMLElement) || !isFrontTile(tile)) {
      return;
    }
    setHoverLabel({ visible: true, x: event.clientX, y: event.clientY });
    requestAnimationFrame(() => moveLabel(event.clientX, event.clientY));
  }

  function onListPointerOut(event: ReactPointerEvent<HTMLUListElement>) {
    const related = event.relatedTarget;
    if (related instanceof Node && event.currentTarget.contains(related)) {
      return;
    }
    setHoverLabel((current) =>
      current.visible ? { ...current, visible: false } : current,
    );
  }

  if (projects.length === 0) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className={featuredClassName}
      aria-hidden={projectsOverlayOpen || undefined}
    >
      <ul
        ref={listRef}
        className="featured-globe"
        tabIndex={0}
        role="group"
        aria-roledescription="rotatable image sphere"
        aria-label={
          prefersReducedMotion
            ? "Featured projects. Drag or use arrow keys to rotate. Enter opens the front project."
            : "Rotating featured projects. Drag or use arrow keys to rotate. Enter opens the front project."
        }
        onPointerMove={onListPointerMove}
        onPointerOver={onListPointerOver}
        onPointerOut={onListPointerOut}
      >
        {points.map((_, index) => {
          const project = projects[index % projects.length];
          if (!project) return null;
          return (
            <li
              key={index}
              ref={(node) => {
                if (node) {
                  itemRefs.current.set(index, node);
                } else {
                  itemRefs.current.delete(index);
                }
              }}
              className="featured-globe-tile rounded-none"
            >
              <FeaturedGlobeTile
                project={project}
                priority={index < Math.min(4, projects.length)}
              />
            </li>
          );
        })}
      </ul>
      {isClient
        ? createPortal(
            <AnimatePresence>
              {hoverLabel.visible ? (
                <motion.span
                  key="globe-open-label"
                  ref={labelNodeRef}
                  aria-hidden
                  className="pointer-events-none fixed top-0 left-0 z-[100] whitespace-nowrap text-xs font-medium uppercase tracking-wide text-accent will-change-transform md:text-sm"
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                  style={{
                    transform: `translate3d(${hoverLabel.x + 14}px, ${hoverLabel.y + 16}px, 0)`,
                  }}
                >
                  Open project
                </motion.span>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
