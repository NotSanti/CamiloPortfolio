"use client";

import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const REVEAL_MS = 520;
const REVEAL_EASE = "cubic-bezier(0.76, 0, 0.24, 1)";
const REVEAL_TRANSITION = `transform ${REVEAL_MS}ms ${REVEAL_EASE}`;
const CLIP_TRANSITION = `clip-path ${REVEAL_MS}ms ${REVEAL_EASE}`;

type LiquidPillLinkProps = {
  href: string;
  label: string;
  className?: string;
  external?: boolean;
};

function ArrowNe({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 68.6396 73.6396"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M67.1751 40.3553C69.1278 38.4027 69.1278 35.2369 67.1751 33.2843L35.3553 1.46447C33.4027 -0.488155 30.2369 -0.488155 28.2843 1.46447C26.3316 3.41709 26.3316 6.58291 28.2843 8.53553L56.5685 36.8198L28.2843 65.1041C26.3316 67.0567 26.3316 70.2225 28.2843 72.1751C30.2369 74.1278 33.4027 74.1278 35.3553 72.1751L67.1751 40.3553ZM0 36.8198V41.8198H63.6396V36.8198V31.8198H0V36.8198Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PillLabel({ label }: { label: string }) {
  return (
    <>
      <span className="text-[clamp(2rem,6vw,96px)] font-medium uppercase leading-none">
        {label}
      </span>
      <ArrowNe className="size-11 shrink-0" />
    </>
  );
}

export function LiquidPillLink({
  href,
  label,
  className = "",
  external = false,
}: LiquidPillLinkProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [diameter, setDiameter] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [root, setRoot] = useState<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      setReduceMotion(media.matches);
    }
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const measure = useCallback((el: HTMLAnchorElement) => {
    const { width, height } = el.getBoundingClientRect();
    setDiameter(Math.ceil(Math.hypot(width, height) * 2));
  }, []);

  const setPointerLocal = useCallback(
    (event: ReactPointerEvent<HTMLAnchorElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setCoords({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    },
    [],
  );

  function onPointerEnter(event: ReactPointerEvent<HTMLAnchorElement>) {
    measure(event.currentTarget);
    setPointerLocal(event);
    setHovered(true);
  }

  function onPointerLeave(event: ReactPointerEvent<HTMLAnchorElement>) {
    setPointerLocal(event);
    setHovered(false);
  }

  const radius = hovered ? diameter / 2 : 0;
  const clipPath = `circle(${radius}px at ${coords.x}px ${coords.y}px)`;

  return (
    <a
      ref={setRoot}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`relative flex h-[100px] items-center overflow-hidden rounded-[20px] border border-accent bg-transparent px-8 ${className}`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={() => {
        if (!root) return;
        measure(root);
        setCoords({ x: root.clientWidth / 2, y: root.clientHeight / 2 });
        setHovered(true);
      }}
      onBlur={() => setHovered(false)}
    >
      {reduceMotion ? (
        <>
          {hovered ? (
            <span aria-hidden className="absolute inset-0 z-0 bg-accent" />
          ) : null}
          <span
            className={`relative z-10 flex w-full items-center justify-between ${hovered ? "text-white" : "text-accent"}`}
          >
            <PillLabel label={label} />
          </span>
        </>
      ) : (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute z-0 rounded-full bg-accent"
            style={{
              left: coords.x,
              top: coords.y,
              width: diameter,
              height: diameter,
              transform: `translate(-50%, -50%) scale(${hovered ? 1 : 0})`,
              transition: REVEAL_TRANSITION,
            }}
          />

          <span className="relative z-10 flex w-full items-center justify-between text-accent">
            <PillLabel label={label} />
          </span>

          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 flex items-center px-8 text-white"
          >
            <span
              className="flex w-full items-center justify-between"
              style={{
                clipPath,
                transition: CLIP_TRANSITION,
              }}
            >
              <PillLabel label={label} />
            </span>
          </span>
        </>
      )}
    </a>
  );
}
