"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

type PhotoProjectTitleProps = {
  title: string;
};

export function PhotoProjectTitle({ title }: PhotoProjectTitleProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const lastSlotWidth = useRef(-1);

  const fit = useCallback(() => {
    const slot = slotRef.current;
    const text = textRef.current;
    if (!slot || !text) {
      return;
    }

    const available = slot.clientWidth;
    if (available <= 0) {
      return;
    }

    text.style.fontSize = "";
    const maxPx = Number.parseFloat(getComputedStyle(text).fontSize);
    if (!Number.isFinite(maxPx) || maxPx <= 0) {
      return;
    }

    const needed = text.scrollWidth;
    if (needed <= available) {
      return;
    }

    text.style.fontSize = `${maxPx * (available / needed)}px`;
    if (text.scrollWidth > available) {
      const fitted = Number.parseFloat(text.style.fontSize);
      text.style.fontSize = `${fitted * (available / text.scrollWidth)}px`;
    }
  }, []);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) {
      return;
    }

    lastSlotWidth.current = -1;
    fit();
    lastSlotWidth.current = slot.clientWidth;

    const observer = new ResizeObserver(() => {
      const width = slot.clientWidth;
      if (width === lastSlotWidth.current) {
        return;
      }
      lastSlotWidth.current = width;
      fit();
    });
    observer.observe(slot);

    void document.fonts.ready.then(() => {
      lastSlotWidth.current = slot.clientWidth;
      fit();
    });

    return () => observer.disconnect();
  }, [fit, title]);

  return (
    <div
      ref={slotRef}
      className="pointer-events-none absolute top-[calc(100dvh-15px)] right-[-15px] left-0 z-10 hidden translate-y-[calc(-100%+0.25rem)] lg:flex lg:justify-end lg:right-[-21px] lg:top-[calc(100dvh-23px)] lg:translate-y-[calc(-100%+1rem)]"
    >
      <p
        ref={textRef}
        aria-hidden
        className="photo-project-title w-max whitespace-nowrap font-bold uppercase leading-none text-accent"
      >
        {title}
      </p>
    </div>
  );
}
