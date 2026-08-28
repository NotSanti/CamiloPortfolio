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
const TICK_MS = 32;
const RESUME_MS = 1600;
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
      const seen = new Set<string>();

      for (const word of placed) {
        const key = wordKey(word.copyIndex, word.tokenIndex);
        seen.add(key);
        const node = wordRefs.current.get(key);
        if (!node) {
          continue;
        }

        node.style.transform = `translate3d(${word.x}px, ${word.y}px, 0)`;
        node.style.opacity = "1";
      }

      for (const [key, node] of wordRefs.current) {
        if (!seen.has(key)) {
          node.style.opacity = "0";
        }
      }
    }

    function pauseAuto() {
      interactingRef.current = true;
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = window.setTimeout(() => {
        interactingRef.current = false;
      }, RESUME_MS);
    }

    let intervalId = 0;

    function tick() {
      if (!prefersReducedMotion() && !interactingRef.current) {
        offsetRef.current += PX_PER_SECOND * (TICK_MS / 1000);
        wrapOffset();
      }
      applyLayout();
    }

    function onWheel(event: WheelEvent) {
      pauseAuto();
      event.preventDefault();
      offsetRef.current += event.deltaY;
      wrapOffset();
      applyLayout();
    }

    const touchStart = { y: 0 };

    function onTouchStart(event: TouchEvent) {
      pauseAuto();
      touchStart.y = event.touches[0]?.clientY ?? 0;
    }

    function onTouchMove(event: TouchEvent) {
      const currentY = event.touches[0]?.clientY ?? touchStart.y;
      offsetRef.current += touchStart.y - currentY;
      touchStart.y = currentY;
      wrapOffset();
      applyLayout();
      event.preventDefault();
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
        applyLayout();
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        pauseAuto();
        offsetRef.current -= event.key === "PageUp" ? height * 0.8 : 48;
        wrapOffset();
        applyLayout();
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
      applyLayout();
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

    if (!prefersReducedMotion()) {
      intervalId = window.setInterval(tick, TICK_MS);
    }

    function onMotionPreferenceChange() {
      window.clearInterval(intervalId);
      intervalId = 0;
      if (!prefersReducedMotion()) {
        intervalId = window.setInterval(tick, TICK_MS);
      }
      applyLayout();
    }

    motionQuery.addEventListener("change", onMotionPreferenceChange);
    desktopQuery.addEventListener("change", measureAll);
    shell?.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("keydown", onKeyDown);
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(resumeTimerRef.current);
      resizeObserver.disconnect();
      motionQuery.removeEventListener("change", onMotionPreferenceChange);
      desktopQuery.removeEventListener("change", measureAll);
      shell?.removeEventListener("wheel", onWheel);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
    };
  }, [paragraphs, endLabel]);

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="region"
      aria-label="Biography"
      className="relative size-full overflow-hidden -outline-offset-2"
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
