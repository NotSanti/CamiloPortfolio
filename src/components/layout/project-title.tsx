"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ProjectTitleProps = {
  title: string;
};

export function ProjectTitle({ title }: ProjectTitleProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  const updateOverflow = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    setCanScroll(scroller.scrollWidth > scroller.clientWidth + 1);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    updateOverflow();

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(scroller);
    const inner = scroller.firstElementChild;
    if (inner) {
      observer.observe(inner);
    }

    void document.fonts.ready.then(updateOverflow);

    function onWheel(event: WheelEvent) {
      const el = scrollerRef.current;
      if (!el || el.scrollWidth <= el.clientWidth + 1) {
        return;
      }

      const delta = event.deltaX !== 0 ? event.deltaX : event.deltaY;
      el.scrollLeft += delta;
      event.preventDefault();
      event.stopPropagation();
    }

    scroller.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      observer.disconnect();
      scroller.removeEventListener("wheel", onWheel);
    };
  }, [title, updateOverflow]);

  return (
    <div
      ref={scrollerRef}
      className={`project-title-scroll absolute inset-x-[15px] bottom-4 select-none md:bottom-6 md:inset-x-6 lg:bottom-0 lg:inset-x-[23px] ${
        canScroll ? "pointer-events-auto" : "pointer-events-none"
      }`}
      tabIndex={canScroll ? 0 : undefined}
      role="region"
      aria-label={title}
    >
      <p className="project-title ml-auto w-max font-bold uppercase leading-none text-accent">
        {title}
      </p>
    </div>
  );
}
