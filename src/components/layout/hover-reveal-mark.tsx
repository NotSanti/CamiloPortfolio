"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { TypedText } from "@/src/components/layout/typed-text";

type HoverRevealMarkProps = {
  text: string;
  reveal: string;
  revealHref: string;
  revealLabel: string;
  typing: boolean;
  charMs: number;
};

/** Tuned to https://exquisite-road-005415.framer.app/ */
const FOLLOW_DELAY = 0.5;
const MASK_RADIUS_EM = 0.45;
const MASK_BLUR_EM = 0.22;

function RevealMark({
  reveal,
  revealHref,
  revealLabel,
}: {
  reveal: string;
  revealHref: string;
  revealLabel: string;
}) {
  return (
    <Link
      href={revealHref}
      aria-label={revealLabel}
      className="pointer-events-auto absolute top-1/2 left-1/2 z-10 flex size-[0.75em] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center"
    >
      <span aria-hidden>{reveal}</span>
    </Link>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function spotlightMask(x: number, y: number, radius: number, blur: number) {
  const hard = Math.max(0, radius - blur);
  return `radial-gradient(circle ${radius}px at ${x}px ${y}px, #000 0px, #000 ${hard}px, transparent ${radius}px)`;
}

function holeMask(x: number, y: number, radius: number, blur: number) {
  const hard = Math.max(0, radius - blur);
  return `radial-gradient(circle ${radius}px at ${x}px ${y}px, transparent 0px, transparent ${hard}px, #000 ${radius}px)`;
}

export function HoverRevealMark({
  text,
  reveal,
  revealHref,
  revealLabel,
  typing,
  charMs,
}: HoverRevealMarkProps) {
  const reducedMotion = useReducedMotion() === true;
  const rootRef = useRef<HTMLSpanElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const revealRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const root = rootRef.current;
    const word = wordRef.current;
    const revealLayer = revealRef.current;
    if (!root || !word || !revealLayer) {
      return;
    }

    return runHoverMask(root, word, revealLayer);
  }, [reducedMotion]);

  return (
    <span
      ref={rootRef}
      className="hover-reveal-mark relative inline-block cursor-default text-left"
    >
      <span className="pointer-events-none invisible select-none" aria-hidden>
        {text}
      </span>

      {reducedMotion ? (
        <span className="hover-reveal-mark__static pointer-events-none absolute inset-0">
          <RevealMark
            reveal={reveal}
            revealHref={revealHref}
            revealLabel={revealLabel}
          />
        </span>
      ) : (
        <span
          ref={revealRef}
          className="hover-reveal-mark__reveal pointer-events-none absolute inset-0"
        >
          <span className="pointer-events-none absolute inset-0 bg-background" />
          <RevealMark
            reveal={reveal}
            revealHref={revealHref}
            revealLabel={revealLabel}
          />
        </span>
      )}

      <span
        ref={wordRef}
        className="pointer-events-none absolute top-0 left-0 whitespace-nowrap"
        aria-hidden
      >
        {typing ? <TypedText text={text} delayMs={0} charMs={charMs} /> : null}
      </span>
    </span>
  );
}

function runHoverMask(
  root: HTMLSpanElement,
  word: HTMLSpanElement,
  revealLayer: HTMLSpanElement,
): () => void {
  const current = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let hovering = false;
  let frameId = 0;
  let lastTime: number | null = null;

  function metrics() {
    const fontSize = Number.parseFloat(getComputedStyle(root).fontSize) || 16;
    return {
      radius: fontSize * MASK_RADIUS_EM,
      blur: fontSize * MASK_BLUR_EM,
    };
  }

  function outsideNearestEdge(localX: number, localY: number) {
    const { radius } = metrics();
    const bounds = root.getBoundingClientRect();
    const toLeft = localX;
    const toRight = bounds.width - localX;
    const toTop = localY;
    const toBottom = bounds.height - localY;
    const nearest = Math.min(toLeft, toRight, toTop, toBottom);
    const point = { x: localX, y: localY };

    if (nearest === toLeft) {
      point.x = -radius;
    } else if (nearest === toRight) {
      point.x = bounds.width + radius;
    } else if (nearest === toTop) {
      point.y = -radius;
    } else {
      point.y = bounds.height + radius;
    }

    return point;
  }

  function maskStyles() {
    return {
      repeat: "no-repeat",
      size: "100% 100%",
    } as const;
  }

  function stopLoop() {
    if (frameId === 0) {
      return;
    }

    window.cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = null;
  }

  function exitAt(localX: number, localY: number) {
    const { radius } = metrics();
    const bounds = root.getBoundingClientRect();
    const dx = localX - current.x;
    const dy = localY - current.y;
    const travel = Math.hypot(dx, dy);
    if (travel > 0.5) {
      target.x = localX + (dx / travel) * radius;
      target.y = localY + (dy / travel) * radius;
      return;
    }

    const fromCenterX = localX - bounds.width / 2;
    const fromCenterY = localY - bounds.height / 2;
    const fromCenter = Math.hypot(fromCenterX, fromCenterY) || 1;
    target.x = localX + (fromCenterX / fromCenter) * radius;
    target.y = localY + (fromCenterY / fromCenter) * radius;
  }

  function applyMask(x: number, y: number) {
    const { radius, blur } = metrics();
    const { repeat, size } = maskStyles();
    const hole = holeMask(x, y, radius, blur);
    const spot = spotlightMask(x, y, radius, blur);

    word.style.webkitMaskImage = hole;
    word.style.maskImage = hole;
    word.style.webkitMaskRepeat = repeat;
    word.style.maskRepeat = repeat;
    word.style.webkitMaskSize = size;
    word.style.maskSize = size;

    revealLayer.style.webkitMaskImage = spot;
    revealLayer.style.maskImage = spot;
    revealLayer.style.webkitMaskRepeat = repeat;
    revealLayer.style.maskRepeat = repeat;
    revealLayer.style.webkitMaskSize = size;
    revealLayer.style.maskSize = size;
  }

  function clearMask() {
    word.style.webkitMaskImage = "none";
    word.style.maskImage = "none";
    revealLayer.style.webkitMaskImage = "none";
    revealLayer.style.maskImage = "none";
    root.classList.remove("is-revealing");
  }

  function tick(now: number) {
    const dt =
      lastTime === null ? 0 : clamp((now - lastTime) / 1000, 0, 0.25);
    lastTime = now;
    const ease =
      1 - (1 - (FOLLOW_DELAY <= 0 ? 1 : 1 - Math.exp(-dt / FOLLOW_DELAY))) ** 2;
    current.x += (target.x - current.x) * ease;
    current.y += (target.y - current.y) * ease;
    applyMask(current.x, current.y);

    const settled =
      !hovering &&
      Math.abs(target.x - current.x) < 0.5 &&
      Math.abs(target.y - current.y) < 0.5;

    if (settled) {
      lastTime = null;
      frameId = 0;
      clearMask();
      return;
    }

    frameId = window.requestAnimationFrame(tick);
  }

  function startLoop() {
    if (frameId !== 0) {
      return;
    }

    lastTime = null;
    frameId = window.requestAnimationFrame(tick);
  }

  function onPointerEnter(event: PointerEvent) {
    stopLoop();
    clearMask();

    hovering = true;
    root.classList.add("is-revealing");
    const bounds = root.getBoundingClientRect();
    const localX = event.clientX - bounds.left;
    const localY = event.clientY - bounds.top;
    const entry = outsideNearestEdge(localX, localY);
    current.x = entry.x;
    current.y = entry.y;
    target.x = clamp(localX, 0, bounds.width);
    target.y = clamp(localY, 0, bounds.height);
    applyMask(current.x, current.y);
    startLoop();
  }

  function onPointerMove(event: PointerEvent) {
    if (!hovering) {
      return;
    }

    const bounds = root.getBoundingClientRect();
    target.x = clamp(event.clientX - bounds.left, 0, bounds.width);
    target.y = clamp(event.clientY - bounds.top, 0, bounds.height);
    startLoop();
  }

  function onPointerLeave(event: PointerEvent) {
    hovering = false;
    const bounds = root.getBoundingClientRect();
    exitAt(event.clientX - bounds.left, event.clientY - bounds.top);
    startLoop();
  }

  function onFocus() {
    stopLoop();
    clearMask();

    const bounds = root.getBoundingClientRect();
    hovering = true;
    root.classList.add("is-revealing");
    const entry = outsideNearestEdge(bounds.width / 2, bounds.height / 2);
    current.x = entry.x;
    current.y = entry.y;
    target.x = bounds.width / 2;
    target.y = bounds.height / 2;
    applyMask(current.x, current.y);
    startLoop();
  }

  function onBlur() {
    hovering = false;
    exitAt(current.x, current.y);
    startLoop();
  }

  clearMask();

  root.addEventListener("pointerenter", onPointerEnter);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerleave", onPointerLeave);

  const link = root.querySelector("a");
  link?.addEventListener("focus", onFocus);
  link?.addEventListener("blur", onBlur);

  return () => {
    window.cancelAnimationFrame(frameId);
    root.removeEventListener("pointerenter", onPointerEnter);
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerleave", onPointerLeave);
    link?.removeEventListener("focus", onFocus);
    link?.removeEventListener("blur", onBlur);
  };
}
