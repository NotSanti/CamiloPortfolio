"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

/**
 * Tuned to the Sexy Scroll “Portfolio” feel: a slightly underdamped spring
 * (~0.8s settle) so the page trails the scrollbar instead of snapping.
 * https://ready-app-037223.framer.app/
 */
const SPRING = {
  stiffness: 80,
  damping: 16,
  mass: 1,
  restDelta: 0.35,
  restSpeed: 2,
} as const;

function subscribeToClient() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

type PhotoSmoothScrollProps = {
  children: ReactNode;
};

export function PhotoSmoothScroll({ children }: PhotoSmoothScrollProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [spacerHeight, setSpacerHeight] = useState(0);
  const isClient = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );
  const reduced = useReducedMotion();
  const active = isClient && reduced === false;
  const { scrollY } = useScroll();
  const smoothY = useSpring(scrollY, {
    ...SPRING,
    skipInitialAnimation: true,
  });
  const y = useTransform(smoothY, (value) => -value);

  useLayoutEffect(() => {
    if (!active) {
      return;
    }

    const node = contentRef.current;
    if (!node) {
      return;
    }

    const content = node;

    function measure() {
      setSpacerHeight(content.offsetHeight);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [active]);

  useEffect(() => {
    const html = document.documentElement;
    const previousOverscroll = html.style.overscrollBehaviorY;
    html.style.overscrollBehaviorY = "none";
    return () => {
      html.style.overscrollBehaviorY = previousOverscroll;
    };
  }, []);

  if (!active) {
    return children;
  }

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none"
        style={{ height: spacerHeight }}
      />
      <motion.div
        ref={contentRef}
        className="fixed top-0 right-0 left-0 will-change-transform"
        style={{ y }}
      >
        {children}
      </motion.div>
    </>
  );
}
