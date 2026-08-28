"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  buildCreditLines,
  copyHeightOf,
  flattenCreditWords,
  placeCreditWords,
  type CreditLine,
  type LayoutMetrics,
} from "@/src/components/about/credits-layout";

const PX_PER_SECOND = 24;
const RESUME_MS = 1600;
const INERTIA_DECEL = 0.998;
const INERTIA_MIN_VELOCITY = 0.04;
const INERTIA_MAX_VELOCITY = 6;
const VELOCITY_SAMPLE_MS = 80;
const DEFAULT_FRAME_MS = 1000 / 60;
const MAX_FRAME_MS = 32;
const PAGE_PAD = 32;
const CONTENT_MAX = 768;
const LOOP_GAP = 48;
const PARAGRAPH_GAP = 40;
const CIRCLE_PAD = 24;
const COPIES = 2;

const CREDITS_TEXT_CLASS =
  "whitespace-nowrap text-xl font-bold leading-snug text-accent md:text-2xl lg:text-3xl";

type CreditsScrollProps = {
  paragraphs: string[];
  endLabel: string;
};

function wordKey(copyIndex: number, tokenIndex: number) {
  return `${copyIndex}-${tokenIndex}`;
}

export function CreditsScroll({ paragraphs, endLabel }: CreditsScrollProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const wordRefs = useRef(new Map<string, HTMLSpanElement>());
  const linesRef = useRef<CreditLine[]>([]);
  const copyHeightRef = useRef(0);
  const offsetRef = useRef(0);
  const interactingRef = useRef(false);
  const resumeTimerRef = useRef(0);
  const metricsRef = useRef<LayoutMetrics | null>(null);
  const circleRef = useRef({ x: 0, y: 0, radius: 120 });
  const words = useMemo(
    () => flattenCreditWords(paragraphs, endLabel),
    [paragraphs, endLabel],
  );

  useEffect(() => {
    const root = rootRef.current;
    const probe = probeRef.current;
    if (!root || !probe) {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canvas = document.createElement("canvas");

    function prefersReducedMotion() {
      return motionQuery.matches;
    }

    function readFont() {
      const probeNode = probeRef.current;
      const rootNode = rootRef.current;
      const ctx = canvas.getContext("2d");
      if (!probeNode || !rootNode || !ctx) {
        return;
      }

      const styles = window.getComputedStyle(probeNode);
      ctx.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
      let lineHeight = Number.parseFloat(styles.lineHeight);
      const fontSize = Number.parseFloat(styles.fontSize);
      if (Number.isNaN(lineHeight)) {
        lineHeight = fontSize * 1.35;
      }

      const viewportWidth = rootNode.clientWidth;
      const contentWidth = Math.min(
        CONTENT_MAX,
        Math.max(160, viewportWidth - PAGE_PAD * 2),
      );
      const spaceWidth = ctx.measureText(" ").width;
      metricsRef.current = {
        viewportWidth,
        viewportHeight: rootNode.clientHeight,
        contentWidth,
        pagePad: PAGE_PAD,
        lineHeight,
        spaceWidth,
        loopGap: LOOP_GAP,
        allowSideOverflow: viewportWidth < 1024,
      };

      linesRef.current = buildCreditLines(
        paragraphs,
        endLabel,
        (text) => ctx.measureText(text).width,
        contentWidth,
        lineHeight,
        spaceWidth,
        PARAGRAPH_GAP,
      );
      copyHeightRef.current = copyHeightOf(
        linesRef.current,
        lineHeight,
        LOOP_GAP,
      );
    }

    function readCircle() {
      const rootNode = rootRef.current;
      if (!rootNode) {
        return;
      }

      const portrait = document.querySelector("[data-about-portrait]");
      if (!(portrait instanceof HTMLElement)) {
        circleRef.current = {
          x: rootNode.clientWidth / 2,
          y: rootNode.clientHeight / 2,
          radius: 120,
        };
        return;
      }

      const rect = portrait.getBoundingClientRect();
      const rootRect = rootNode.getBoundingClientRect();
      circleRef.current = {
        x: rect.left - rootRect.left + rect.width / 2,
        y: rect.top - rootRect.top + rect.height / 2,
        radius: Math.hypot(rect.width / 2, rect.height / 2) + CIRCLE_PAD,
      };
    }

    function wrapOffset() {
      const height = copyHeightRef.current;
      if (height <= 0) {
        return;
      }

      while (offsetRef.current >= height) {
        offsetRef.current -= height;
      }
      while (offsetRef.current < 0) {
        offsetRef.current += height;
      }
    }

    const visibleWordKeys = new Set<string>();
    const nextVisibleKeys = new Set<string>();

    function applyLayout() {
      const metrics = metricsRef.current;
      if (!metrics) {
        return;
      }

      const placed = placeCreditWords(
        linesRef.current,
        offsetRef.current,
        COPIES,
        circleRef.current,
        metrics,
      );
      nextVisibleKeys.clear();

      for (const word of placed) {
        const key = wordKey(word.copyIndex, word.tokenIndex);
        nextVisibleKeys.add(key);
        const node = wordRefs.current.get(key);
        if (!node) {
          continue;
        }

        node.style.transform = `translate3d(${word.x}px, ${word.y}px, 0)`;
        if (!visibleWordKeys.has(key)) {
          node.style.opacity = "1";
        }
      }

      for (const key of visibleWordKeys) {
        if (nextVisibleKeys.has(key)) {
          continue;
        }
        const node = wordRefs.current.get(key);
        if (node) {
          node.style.opacity = "0";
        }
      }

      visibleWordKeys.clear();
      for (const key of nextVisibleKeys) {
        visibleWordKeys.add(key);
      }
    }

    let inertiaVelocity = 0;
    let needsLayout = true;
    let rafId = 0;
    let lastFrameTime = 0;
    const touchSamples: { t: number; y: number }[] = [];
    const touchState = { y: 0, active: false };

    function scheduleResume() {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = window.setTimeout(() => {
        interactingRef.current = false;
      }, RESUME_MS);
    }

    function pauseAuto() {
      inertiaVelocity = 0;
      interactingRef.current = true;
      scheduleResume();
    }

    function frame(timestamp: number) {
      const now = performance.now() || timestamp || lastFrameTime + DEFAULT_FRAME_MS;
      let dt = lastFrameTime ? now - lastFrameTime : DEFAULT_FRAME_MS;
      lastFrameTime = now;
      if (dt <= 0) {
        dt = DEFAULT_FRAME_MS;
      } else if (dt > MAX_FRAME_MS) {
        dt = MAX_FRAME_MS;
      }

      if (Math.abs(inertiaVelocity) > INERTIA_MIN_VELOCITY) {
        offsetRef.current += inertiaVelocity * dt;
        inertiaVelocity *= Math.pow(INERTIA_DECEL, dt);
        wrapOffset();
        if (Math.abs(inertiaVelocity) <= INERTIA_MIN_VELOCITY) {
          inertiaVelocity = 0;
          scheduleResume();
        }
        needsLayout = true;
      } else if (
        !touchState.active &&
        !prefersReducedMotion() &&
        !interactingRef.current
      ) {
        offsetRef.current += PX_PER_SECOND * (dt / 1000);
        wrapOffset();
        needsLayout = true;
      }

      if (needsLayout) {
        applyLayout();
        needsLayout = false;
      }

      rafId = window.requestAnimationFrame(frame);
    }

    function onWheel(event: WheelEvent) {
      pauseAuto();
      event.preventDefault();
      offsetRef.current += event.deltaY;
      wrapOffset();
      needsLayout = true;
    }

    function pruneTouchSamples(now: number) {
      while (
        touchSamples.length > 1 &&
        now - touchSamples[0].t > VELOCITY_SAMPLE_MS
      ) {
        touchSamples.shift();
      }
    }

    function velocityFromTouchSamples() {
      if (touchSamples.length < 2) {
        return 0;
      }

      const first = touchSamples[0];
      const last = touchSamples[touchSamples.length - 1];
      const elapsed = last.t - first.t;
      if (elapsed < 8) {
        return 0;
      }

      const velocity = (first.y - last.y) / elapsed;
      return Math.max(
        -INERTIA_MAX_VELOCITY,
        Math.min(INERTIA_MAX_VELOCITY, velocity),
      );
    }

    function onTouchStart(event: TouchEvent) {
      const y = event.touches[0]?.clientY ?? 0;
      const now = performance.now();
      inertiaVelocity = 0;
      interactingRef.current = true;
      window.clearTimeout(resumeTimerRef.current);
      touchState.y = y;
      touchState.active = true;
      lastFrameTime = now;
      touchSamples.length = 0;
      touchSamples.push({ t: now, y });
    }

    function onTouchMove(event: TouchEvent) {
      if (!touchState.active) {
        return;
      }

      const currentY = event.touches[0]?.clientY ?? touchState.y;
      const now = performance.now();
      offsetRef.current += touchState.y - currentY;
      touchState.y = currentY;
      touchSamples.push({ t: now, y: currentY });
      pruneTouchSamples(now);
      wrapOffset();
      needsLayout = true;
      event.preventDefault();
    }

    function onTouchEnd() {
      if (!touchState.active) {
        return;
      }

      touchState.active = false;
      lastFrameTime = performance.now();
      const lastSample = touchSamples[touchSamples.length - 1];
      const idle = lastSample ? lastFrameTime - lastSample.t : Infinity;
      const velocity =
        idle > VELOCITY_SAMPLE_MS ? 0 : velocityFromTouchSamples();
      touchSamples.length = 0;

      if (Math.abs(velocity) > INERTIA_MIN_VELOCITY) {
        inertiaVelocity = velocity;
        return;
      }

      scheduleResume();
    }

    function onKeyDown(event: KeyboardEvent) {
      const rootNode = rootRef.current;
      if (!rootNode) {
        return;
      }

      const height = rootNode.clientHeight;
      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        event.key === " "
      ) {
        event.preventDefault();
        pauseAuto();
        offsetRef.current += event.key === "PageDown" ? height * 0.8 : 48;
        wrapOffset();
        needsLayout = true;
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        pauseAuto();
        offsetRef.current -= event.key === "PageUp" ? height * 0.8 : 48;
        wrapOffset();
        needsLayout = true;
      }
    }

    function readClipTop() {
      const rootNode = rootRef.current;
      const shellNode = rootNode?.closest("[data-about-shell]");
      const contact = document.querySelector("[data-about-contact]");
      if (!(shellNode instanceof HTMLElement)) {
        return;
      }

      const isMobile = window.matchMedia("(max-width: 1023px)").matches;
      if (!isMobile || !(contact instanceof HTMLElement) || !rootNode) {
        shellNode.style.removeProperty("--about-credits-clip-top");
        return;
      }

      const contactRect = contact.getBoundingClientRect();
      const rootRect = rootNode.getBoundingClientRect();
      const top = Math.max(
        0,
        Math.ceil(contactRect.bottom - rootRect.top + 8),
      );
      shellNode.style.setProperty("--about-credits-clip-top", `${top}px`);
    }

    function measureAll() {
      readFont();
      readCircle();
      readClipTop();
      needsLayout = true;
      applyLayout();
      needsLayout = false;
    }

    const shellCandidate = root.closest("[data-about-shell]");
    const shell = shellCandidate instanceof HTMLElement ? shellCandidate : null;
    const portrait = document.querySelector("[data-about-portrait]");
    const contact = document.querySelector("[data-about-contact]");
    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    const resizeObserver = new ResizeObserver(measureAll);
    resizeObserver.observe(root);
    if (portrait instanceof HTMLElement) {
      resizeObserver.observe(portrait);
    }
    if (contact instanceof HTMLElement) {
      resizeObserver.observe(contact);
    }

    measureAll();
    void document.fonts.ready.then(() => {
      measureAll();
    });

    function onMotionPreferenceChange() {
      needsLayout = true;
    }

    rafId = window.requestAnimationFrame(frame);

    motionQuery.addEventListener("change", onMotionPreferenceChange);
    desktopQuery.addEventListener("change", measureAll);
    shell?.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("keydown", onKeyDown);
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd);
    root.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(resumeTimerRef.current);
      resizeObserver.disconnect();
      motionQuery.removeEventListener("change", onMotionPreferenceChange);
      desktopQuery.removeEventListener("change", measureAll);
      shell?.removeEventListener("wheel", onWheel);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [paragraphs, endLabel]);

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="region"
      aria-label="Biography"
      className="relative size-full touch-none overflow-hidden -outline-offset-2"
    >
      <div className="sr-only">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>{endLabel}</p>
      </div>

      <span
        ref={probeRef}
        className={`pointer-events-none invisible absolute ${CREDITS_TEXT_CLASS}`}
        aria-hidden
      >
        Measure
      </span>

      <div aria-hidden className="absolute inset-0">
        {Array.from({ length: COPIES }, (_, copyIndex) =>
          words.map((word, tokenIndex) => (
            <span
              key={wordKey(copyIndex, tokenIndex)}
              ref={(node) => {
                const key = wordKey(copyIndex, tokenIndex);
                if (node) {
                  wordRefs.current.set(key, node);
                } else {
                  wordRefs.current.delete(key);
                }
              }}
              className={`pointer-events-none absolute top-0 left-0 ${CREDITS_TEXT_CLASS}`}
              style={{
                opacity: 0,
                transform: "translate3d(0, 0, 0)",
                willChange: "transform",
              }}
            >
              {word}
            </span>
          )),
        )}
      </div>
    </div>
  );
}
