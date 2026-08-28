"use client";

import Image from "next/image";
import Link from "next/link";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useReducedMotion } from "motion/react";
import type { ProjectSummary } from "@/types/projects";
import {
  FRICTION,
  TAP_SLOP_PX,
  copyCount,
  pixelsPerItem,
  slotLayout,
  startOffset,
  wheelRadius,
  wheelDeltaItems,
  wrapIndex,
  wrapOffset,
} from "@/src/lib/kinetic-wheel";

type ProjectsWheelProps = {
  projects: ProjectSummary[];
};

type WheelTrackProps = {
  projects: ProjectSummary[];
  onFocusChange: (index: number) => void;
};

type WheelPreviewProps = {
  project: ProjectSummary;
};

const WHEEL_IDLE_MS = 90;
const SNAP_SPEED = 14;
const VELOCITY_REST = 0.45;

export function ProjectsWheel({ projects }: ProjectsWheelProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const onFocusChange = useCallback((index: number) => {
    setFocusedIndex((current) => (current === index ? current : index));
  }, []);

  const focused = projects[focusedIndex] ?? projects[0];

  if (projects.length === 0) {
    return (
      <p className="flex h-full items-center justify-center font-medium uppercase text-accent">
        No published projects
      </p>
    );
  }

  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-row overflow-hidden"
      aria-label="Curved scroll wheel"
    >
      <WheelTrack projects={projects} onFocusChange={onFocusChange} />
      {focused ? (
        <WheelPreview project={focused} />
      ) : null}
    </div>
  );
}

const WheelTrack = memo(function WheelTrack({
  projects,
  onFocusChange,
}: WheelTrackProps) {
  const reducedMotion = useReducedMotion() === true;
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const onFocusChangeRef = useRef(onFocusChange);
  const reducedMotionRef = useRef(reducedMotion);
  const count = projects.length;
  const copies = useMemo(() => copyCount(count), [count]);
  const a11yCopy = Math.floor(copies / 2);
  const slots = useMemo(
    () =>
      Array.from({ length: copies * count }, (_, slot) => ({
        slot,
        copy: Math.floor(slot / count),
        projectIndex: slot % count,
      })),
    [copies, count],
  );

  useEffect(() => {
    onFocusChangeRef.current = onFocusChange;
  }, [onFocusChange]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || count === 0) {
      return;
    }

    const offsetRef = { current: startOffset(count, copies) };
    const velocityRef = { current: 0 };
    const radiusRef = { current: wheelRadius(root.clientHeight, root.clientWidth) };
    const draggingRef = { current: false };
    const pointerDownRef = { current: false };
    const allowClickRef = { current: true };
    const lastInputRef = { current: 0 };
    const lastPointerRef = { current: { y: 0, t: 0 } };
    const tapOriginRef = { current: { y: 0 } };
    const focusedRef = { current: wrapIndex(offsetRef.current, count) };
    const writes: Array<{ transform: string; opacity: number; events: 0 | 1 }> =
      slots.map(() => ({ transform: "", opacity: -1, events: 0 }));

    onFocusChangeRef.current(focusedRef.current);

    function layout() {
      const offset = offsetRef.current;
      const radius = radiusRef.current;
      const reduce = reducedMotionRef.current;
      const nextFocus = wrapIndex(offset, count);

      if (nextFocus !== focusedRef.current) {
        focusedRef.current = nextFocus;
        onFocusChangeRef.current(nextFocus);
      }

      for (let i = 0; i < slots.length; i += 1) {
        const entry = slots[i];
        const el = itemRefs.current[i];
        const cache = writes[i];
        if (!entry || !el || !cache) {
          continue;
        }

        const pose = slotLayout(entry.slot, offset, radius, reduce);
        const transform = `translateY(calc(-50% + ${pose.y}px)) translateX(${pose.x}px) rotate(${pose.rotate}deg) scale(${pose.scale})`;
        const events: 0 | 1 = pose.visible ? 1 : 0;

        if (cache.transform !== transform) {
          el.style.transform = transform;
          cache.transform = transform;
        }
        if (cache.opacity !== pose.opacity) {
          el.style.opacity = String(pose.opacity);
          cache.opacity = pose.opacity;
        }
        if (cache.events !== events) {
          el.style.pointerEvents = events ? "auto" : "none";
          cache.events = events;
        }

        if (entry.copy === a11yCopy) {
          if (pose.focused) {
            el.setAttribute("aria-current", "true");
          } else {
            el.removeAttribute("aria-current");
          }
        }
      }
    }

    function settleOffset() {
      offsetRef.current = wrapOffset(offsetRef.current, count, copies);
    }

    const observer = new ResizeObserver(() => {
      radiusRef.current = wheelRadius(root.clientHeight, root.clientWidth);
      layout();
    });
    observer.observe(root);
    layout();

    let rafId = 0;
    let lastFrame = 0;

    function tick(now: number) {
      const dt = lastFrame ? Math.min(0.08, (now - lastFrame) / 1000) : 0;
      lastFrame = now;

      if (!draggingRef.current) {
        const idle = now - lastInputRef.current > WHEEL_IDLE_MS;
        const speed = velocityRef.current;

        if (!reducedMotionRef.current && Math.abs(speed) > VELOCITY_REST) {
          offsetRef.current += speed * dt;
          velocityRef.current *= Math.pow(FRICTION, dt * 60);
          settleOffset();
        } else if (idle) {
          velocityRef.current = 0;
          const target = Math.round(offsetRef.current);
          const diff = target - offsetRef.current;
          if (Math.abs(diff) < 0.001) {
            offsetRef.current = target;
          } else {
            offsetRef.current += diff * Math.min(1, SNAP_SPEED * dt);
          }
          settleOffset();
        }
      }

      layout();
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    function pxPerItem() {
      return pixelsPerItem(radiusRef.current, reducedMotionRef.current);
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      offsetRef.current += wheelDeltaItems(
        event.deltaY,
        event.deltaMode,
        pxPerItem(),
      );
      velocityRef.current = 0;
      lastInputRef.current = performance.now();
      settleOffset();
    }

    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0) {
        return;
      }

      pointerDownRef.current = true;
      draggingRef.current = false;
      allowClickRef.current = true;
      velocityRef.current = 0;
      tapOriginRef.current = { y: event.clientY };
      lastPointerRef.current = { y: event.clientY, t: performance.now() };
    }

    function onPointerMove(event: PointerEvent) {
      const node = rootRef.current;
      if (!node || !pointerDownRef.current) {
        return;
      }

      const travelled = Math.abs(event.clientY - tapOriginRef.current.y);
      if (!draggingRef.current && travelled >= TAP_SLOP_PX) {
        draggingRef.current = true;
        allowClickRef.current = false;
        try {
          node.setPointerCapture(event.pointerId);
        } catch {
          // Drag still works without capture.
        }
      }

      if (!draggingRef.current) {
        return;
      }

      const now = performance.now();
      const dy = event.clientY - lastPointerRef.current.y;
      const elapsed = Math.max(1, now - lastPointerRef.current.t) / 1000;
      const step = pxPerItem();
      offsetRef.current -= dy / step;
      velocityRef.current = -dy / step / elapsed;
      lastPointerRef.current = { y: event.clientY, t: now };
      lastInputRef.current = now;
      settleOffset();
    }

    function onPointerUp() {
      pointerDownRef.current = false;
      draggingRef.current = false;
      lastInputRef.current = performance.now();
    }

    function onClickCapture(event: MouseEvent) {
      if (allowClickRef.current) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      allowClickRef.current = true;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        offsetRef.current = Math.round(offsetRef.current) + 1;
        velocityRef.current = 0;
        lastInputRef.current = performance.now();
        settleOffset();
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        offsetRef.current = Math.round(offsetRef.current) - 1;
        velocityRef.current = 0;
        lastInputRef.current = performance.now();
        settleOffset();
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        const copy = Math.floor(offsetRef.current / count);
        offsetRef.current = copy * count;
        velocityRef.current = 0;
        lastInputRef.current = 0;
        settleOffset();
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        const copy = Math.floor(offsetRef.current / count);
        offsetRef.current = copy * count + count - 1;
        velocityRef.current = 0;
        lastInputRef.current = 0;
        settleOffset();
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        const focused = wrapIndex(offsetRef.current, count);
        const project = projects[focused];
        if (!project) {
          return;
        }
        event.preventDefault();
        const a11ySlot = a11yCopy * count + focused;
        itemRefs.current[a11ySlot]?.click();
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", onPointerUp);
    root.addEventListener("pointercancel", onPointerUp);
    root.addEventListener("click", onClickCapture, true);
    root.addEventListener("keydown", onKeyDown);
    root.focus({ preventScroll: true });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("wheel", onWheel);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", onPointerUp);
      root.removeEventListener("pointercancel", onPointerUp);
      root.removeEventListener("click", onClickCapture, true);
      root.removeEventListener("keydown", onKeyDown);
    };
  }, [a11yCopy, copies, count, projects, slots]);

  return (
    <div
      ref={rootRef}
      className="relative h-full min-h-0 w-full shrink-0 overflow-hidden pr-[calc(7rem+1.75rem)] outline-none select-none md:w-1/2 md:pr-0"
      role="group"
      aria-label="Projects"
      tabIndex={0}
      style={{ touchAction: "none", overscrollBehavior: "contain" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-[10%] z-3 h-0.75 w-6 -translate-y-1/2 bg-accent md:left-[37%] md:w-10"
      />
      <div className="absolute inset-0 z-2">
        {slots.map((entry, index) => {
          const project = projects[entry.projectIndex];
          if (!project) {
            return null;
          }

          const isA11yCopy = entry.copy === a11yCopy;

          return (
            <Link
              key={`${entry.copy}-${project.id}`}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              href={`/work/${project.slug}`}
              tabIndex={-1}
              aria-hidden={isA11yCopy ? undefined : true}
              draggable={false}
              className="absolute top-1/2 left-[12%] origin-left whitespace-nowrap text-lg font-medium uppercase leading-[1.1] text-accent md:left-[40%] md:text-2xl lg:text-[36px]"
              style={{ transform: "translateY(-50%)" }}
            >
              {project.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
});

const WheelPreview = memo(function WheelPreview({ project }: WheelPreviewProps) {
  const { cover } = project;
  const hasImage = Boolean(cover.src);

  return (
    <div
      className="absolute top-1/2 right-[15px] z-20 size-28 shrink-0 -translate-y-1/2 overflow-hidden md:relative md:top-auto md:right-auto md:z-auto md:h-full md:w-1/2 md:size-auto md:translate-y-0"
      aria-label="Preview"
    >
      <Link
        href={`/work/${project.slug}`}
        aria-label={`Open ${project.title}`}
        className="absolute inset-0"
      >
        {hasImage ? (
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            sizes="(min-width: 768px) 50vw, 7rem"
            quality={80}
            className="object-cover"
            draggable={false}
          />
        ) : (
          <span className="sr-only">{cover.alt}</span>
        )}
      </Link>
    </div>
  );
});
