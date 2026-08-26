"use client";

import { useEffect, useRef, useState } from "react";

type TypedTextProps = {
  text: string;
  delayMs?: number;
  charMs?: number;
  className?: string;
};

export function TypedText({
  text,
  delayMs = 0,
  charMs = 32,
  className,
}: TypedTextProps) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setCount(0);
    setDone(false);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(text.length);
      setDone(true);
      return;
    }

    let typed = 0;
    let intervalId: number | null = null;

    const startId = window.setTimeout(() => {
      if (text.length === 0) {
        setDone(true);
        return;
      }

      intervalId = window.setInterval(() => {
        typed += 1;
        setCount(typed);
        if (typed >= text.length) {
          if (intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
          }
          setDone(true);
        }
      }, charMs);
    }, delayMs);

    return () => {
      window.clearTimeout(startId);
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [text, delayMs, charMs]);

  return (
    <span className={className}>
      {text.slice(0, count)}
      {!done ? <span className="typed-caret" aria-hidden /> : null}
    </span>
  );
}

type TypedLinesProps = {
  lines: string[];
  delayMs?: number;
  charMs?: number;
  lineGapMs?: number;
  lineClassName?: string;
  onComplete?: () => void;
};

export function TypedLines({
  lines,
  delayMs = 0,
  charMs = 32,
  lineGapMs = 0,
  lineClassName,
  onComplete,
}: TypedLinesProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const lineKey = lines.join("\n");

  useEffect(() => {
    setDone(false);
    setLineIndex(0);
    setCount(0);

    if (lines.length === 0) {
      setDone(true);
      onCompleteRef.current?.();
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLineIndex(Math.max(0, lines.length - 1));
      setCount(lines[lines.length - 1]?.length ?? 0);
      setDone(true);
      onCompleteRef.current?.();
      return;
    }

    let currentLine = 0;
    let typed = 0;
    let intervalId: number | null = null;
    let gapId: number | null = null;

    function typeCurrentLine() {
      const line = lines[currentLine];
      if (!line) {
        setDone(true);
        onCompleteRef.current?.();
        return;
      }

      typed = 0;
      setLineIndex(currentLine);
      setCount(0);

      intervalId = window.setInterval(() => {
        typed += 1;
        setCount(typed);
        if (typed < line.length) {
          return;
        }

        if (intervalId !== null) {
          window.clearInterval(intervalId);
          intervalId = null;
        }

        if (currentLine >= lines.length - 1) {
          gapId = window.setTimeout(() => {
            setDone(true);
            onCompleteRef.current?.();
          }, lineGapMs);
          return;
        }

        currentLine += 1;
        setLineIndex(currentLine);
        setCount(0);
        gapId = window.setTimeout(() => {
          typeCurrentLine();
        }, lineGapMs);
      }, charMs);
    }

    const startId = window.setTimeout(() => {
      typeCurrentLine();
    }, delayMs);

    return () => {
      window.clearTimeout(startId);
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      if (gapId !== null) {
        window.clearTimeout(gapId);
      }
    };
  }, [charMs, delayMs, lineGapMs, lineKey]);

  return (
    <>
      {lines.map((line, index) => {
        const isCurrent = index === lineIndex;
        const visible =
          index < lineIndex ? line : isCurrent ? line.slice(0, count) : "";

        return (
          <p key={line} className={lineClassName}>
            <span className="sr-only">{line}</span>
            <span aria-hidden>
              {visible}
              {!done && isCurrent ? (
                <span className="typed-caret" aria-hidden />
              ) : null}
            </span>
          </p>
        );
      })}
    </>
  );
}
