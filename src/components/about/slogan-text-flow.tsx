"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

type Particle = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
};

type SloganTextFlowProps = {
  text: string;
  repeat: number;
  lineClassName?: string;
  stackClassName?: string;
  /** `about` sits slightly below center on small screens. */
  align?: "about" | "center";
};

const DEFAULT_LINE_CLASS =
  "whitespace-nowrap text-center text-[clamp(0.7rem,3.4vw,1.5rem)] font-bold uppercase leading-[1.35] text-accent md:text-lg md:leading-[44px] lg:text-2xl";

const DEFAULT_STACK_CLASS =
  "pointer-events-none absolute left-1/2 top-[58%] w-max max-w-[calc(100vw-5.5rem)] -translate-x-1/2 -translate-y-1/2 md:top-1/2";

/** Matches the stacked lines' `margin-top: calc(-0.6lh)`. */
const LINE_OVERLAP = 0.6;
/** Tuned to https://text-flow.framer.website/ */
const PARTICLE_SIZE = 1;
const PARTICLE_DENSITY = 2;
const MOUSE_RADIUS = 240;
const RETURN_SPEED = 0.03;
const PUSH_STRENGTH = 2;
const DAMPING = 0.95;
const MOUSE_SUPPRESS_MS = 700;
const TOUCH_LINGER_MS = 160;

function SloganStack({
  text,
  repeat,
  lineClassName,
}: {
  text: string;
  repeat: number;
  lineClassName: string;
}) {
  return (
    <>
      {Array.from({ length: repeat }, (_, index) => (
        <p
          key={index}
          className={lineClassName}
          style={{ marginTop: index === 0 ? 0 : "calc(-0.6lh)" }}
        >
          {text}
        </p>
      ))}
    </>
  );
}

export function SloganTextFlow({
  text,
  repeat,
  lineClassName = DEFAULT_LINE_CLASS,
  stackClassName = DEFAULT_STACK_CLASS,
  align = "about",
}: SloganTextFlowProps) {
  const reducedMotion = useReducedMotion() === true;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const measureRef = useRef<HTMLParagraphElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const surface = canvasRef.current;
    const sample = measureRef.current;
    const ctx = surface?.getContext("2d", { willReadFrequently: true }) ?? null;
    if (!surface || !sample || !ctx) {
      return;
    }

    return runTextFlow(surface, sample, ctx, text, repeat, align, setReady);
  }, [align, lineClassName, reducedMotion, repeat, text]);

  return (
    <>
      <p
        ref={measureRef}
        className={`pointer-events-none invisible absolute ${lineClassName}`}
        aria-hidden
      >
        {text}
      </p>

      {reducedMotion || !ready ? (
        <div className={stackClassName} aria-hidden>
          <SloganStack
            text={text}
            repeat={repeat}
            lineClassName={lineClassName}
          />
        </div>
      ) : null}

      {reducedMotion ? null : (
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-0 size-full"
          aria-hidden
        />
      )}
    </>
  );
}

function runTextFlow(
  surface: HTMLCanvasElement,
  sample: HTMLParagraphElement,
  ctx: CanvasRenderingContext2D,
  text: string,
  repeat: number,
  align: "about" | "center",
  setReady: (ready: boolean) => void,
): () => void {
  const particles: Particle[] = [];
  const mouse = { x: -1000, y: -1000 };
  let cssWidth = 0;
  let cssHeight = 0;
  let fillColor = "";
  let frameId = 0;
  let cancelled = false;
  let started = false;

  let pointerKind = "mouse";
  let suppressMouseUntil = 0;
  let resetTimer = 0;

  function resetMouse() {
    mouse.x = -1000;
    mouse.y = -1000;
  }

  function setMouseFromEvent(event: PointerEvent) {
    if (
      event.pointerType === "mouse" &&
      performance.now() < suppressMouseUntil
    ) {
      return;
    }

    const rect = surface.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    pointerKind = event.pointerType;
  }

  function onPointerDown(event: PointerEvent) {
    window.clearTimeout(resetTimer);
    if (event.pointerType !== "mouse") {
      suppressMouseUntil = performance.now() + MOUSE_SUPPRESS_MS;
    }
    setMouseFromEvent(event);
  }

  function onPointerMove(event: PointerEvent) {
    setMouseFromEvent(event);
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerType === "mouse") {
      return;
    }

    suppressMouseUntil = performance.now() + MOUSE_SUPPRESS_MS;
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(resetMouse, TOUCH_LINGER_MS);
  }

  function onMouseLeave() {
    if (pointerKind !== "mouse") {
      return;
    }
    resetMouse();
  }

  function buildParticles() {
    const dpr = window.devicePixelRatio || 1;
    const rect = surface.getBoundingClientRect();
    cssWidth = rect.width;
    cssHeight = rect.height;
    if (cssWidth === 0 || cssHeight === 0) {
      return;
    }

    surface.width = Math.round(cssWidth * dpr);
    surface.height = Math.round(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const styles = getComputedStyle(sample);
    const fontSize = Number.parseFloat(styles.fontSize);
    let lineHeight = Number.parseFloat(styles.lineHeight);
    if (Number.isNaN(lineHeight)) {
      lineHeight = fontSize * 1.35;
    }
    fillColor = styles.color;

    ctx.fillStyle = fillColor;
    ctx.font = `${styles.fontWeight} ${fontSize}px ${styles.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = styles.letterSpacing;

    const isMd = window.matchMedia("(min-width: 768px)").matches;
    const centerX = cssWidth / 2;
    const centerY =
      align === "center" || isMd ? cssHeight / 2 : cssHeight * 0.58;
    const lineStep = lineHeight * (1 - LINE_OVERLAP);
    const stackHeight = lineHeight + (repeat - 1) * lineStep;
    const firstBaseline = centerY - stackHeight / 2 + lineHeight / 2;

    for (let index = 0; index < repeat; index += 1) {
      ctx.fillText(text, centerX, firstBaseline + index * lineStep);
    }

    const pixels = ctx.getImageData(0, 0, surface.width, surface.height).data;
    const step = Math.max(2, PARTICLE_DENSITY);
    particles.length = 0;

    for (let y = 0; y < surface.height; y += step) {
      for (let x = 0; x < surface.width; x += step) {
        if (pixels[(y * surface.width + x) * 4 + 3] > 128) {
          const cssX = x / dpr;
          const cssY = y / dpr;
          particles.push({
            x: cssX,
            y: cssY,
            baseX: cssX,
            baseY: cssY,
            vx: 0,
            vy: 0,
          });
        }
      }
    }

    ctx.clearRect(0, 0, cssWidth, cssHeight);
  }

  function tick() {
    if (cancelled) {
      return;
    }

    ctx.setTransform(
      window.devicePixelRatio || 1,
      0,
      0,
      window.devicePixelRatio || 1,
      0,
      0,
    );
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.fillStyle = fillColor;

    const mouseX = mouse.x;
    const mouseY = mouse.y;
    const diameter = PARTICLE_SIZE * 2;

    for (const particle of particles) {
      const offsetX = mouseX - particle.x;
      const offsetY = mouseY - particle.y;
      const distance = Math.hypot(offsetX, offsetY);

      if (distance < MOUSE_RADIUS) {
        const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
        const angle = Math.atan2(offsetY, offsetX);
        particle.vx -= Math.cos(angle) * force * PUSH_STRENGTH;
        particle.vy -= Math.sin(angle) * force * PUSH_STRENGTH;
      }

      particle.vx += (particle.baseX - particle.x) * RETURN_SPEED;
      particle.vy += (particle.baseY - particle.y) * RETURN_SPEED;
      particle.vx *= DAMPING;
      particle.vy *= DAMPING;
      particle.x += particle.vx;
      particle.y += particle.vy;

      ctx.fillRect(
        particle.x - PARTICLE_SIZE,
        particle.y - PARTICLE_SIZE,
        diameter,
        diameter,
      );
    }

    frameId = window.requestAnimationFrame(tick);
  }

  function startLoop() {
    if (cancelled || started || particles.length === 0) {
      return;
    }

    started = true;
    setReady(true);
    frameId = window.requestAnimationFrame(tick);
  }

  const resizeObserver = new ResizeObserver(() => {
    buildParticles();
    startLoop();
  });
  resizeObserver.observe(surface);

  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
  window.addEventListener("blur", resetMouse);
  document.documentElement.addEventListener("mouseleave", onMouseLeave);

  void document.fonts.ready.then(() => {
    if (cancelled) {
      return;
    }

    buildParticles();
    startLoop();
  });

  return () => {
    cancelled = true;
    window.clearTimeout(resetTimer);
    window.cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    window.removeEventListener("blur", resetMouse);
    document.documentElement.removeEventListener("mouseleave", onMouseLeave);
  };
}
