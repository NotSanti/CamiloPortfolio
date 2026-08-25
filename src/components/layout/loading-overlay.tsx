"use client";

import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { waitForPageReady } from "@/src/lib/page-ready";

const MARK = "CALOID";
const TYPE_MS = 160;
const MIN_OVERLAY_MS = 2000;
const EXIT_MS = 400;
const APP_LOADING_CLASS = "app-loading";

const OVERLAY_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483647,
  display: "grid",
  placeItems: "center",
  width: "100%",
  height: "100%",
  margin: 0,
  background: "#ffffff",
  pointerEvents: "auto",
};

/** Module-level so Strict Mode remounts don't reset progress. */
let overlayStartedAt: number | null = null;
let bootFinished = false;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Full-screen boot cover until the page is ready and at least 2s have elapsed.
 */
export function LoadingOverlay() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [visible, setVisible] = useState(() => !bootFinished && !isAdmin);
  const [exiting, setExiting] = useState(false);
  const [typed, setTyped] = useState("");

  useLayoutEffect(() => {
    const root = document.documentElement;

    if (isAdmin || bootFinished || !visible || exiting) {
      root.classList.remove(APP_LOADING_CLASS);
      return;
    }

    root.classList.add(APP_LOADING_CLASS);
  }, [isAdmin, visible, exiting]);

  useEffect(() => {
    if (isAdmin || bootFinished) {
      return;
    }

    if (overlayStartedAt === null) {
      overlayStartedAt = Date.now();
    }

    const signal = { cancelled: false };
    const remaining = Math.max(
      0,
      MIN_OVERLAY_MS - (Date.now() - overlayStartedAt),
    );

    void Promise.all([waitForPageReady(signal), delay(remaining)]).then(() => {
      bootFinished = true;
      document.documentElement.classList.remove(APP_LOADING_CLASS);
      if (!signal.cancelled) {
        setExiting(true);
      }
    });

    return () => {
      signal.cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!exiting) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      setVisible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, EXIT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [exiting]);

  useEffect(() => {
    if (!visible || isAdmin) {
      return;
    }

    let typeTimer: number | null = null;

    const startId = window.setTimeout(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setTyped(MARK);
        return;
      }

      let count = 0;
      typeTimer = window.setInterval(() => {
        count = Math.min(MARK.length, count + 1);
        setTyped(MARK.slice(0, count));
        if (count >= MARK.length && typeTimer !== null) {
          window.clearInterval(typeTimer);
          typeTimer = null;
        }
      }, TYPE_MS);
    }, 0);

    return () => {
      window.clearTimeout(startId);
      if (typeTimer !== null) {
        window.clearInterval(typeTimer);
      }
    };
  }, [visible, isAdmin]);

  if (!visible || isAdmin) {
    return null;
  }

  return (
    <div
      className={`loading-overlay${exiting ? " loading-overlay--exit" : ""}`}
      style={OVERLAY_STYLE}
      role="status"
      aria-live="polite"
      aria-busy={!exiting}
      aria-label="Loading"
    >
      <p className="loading-overlay__mark" aria-hidden="true">
        <span className="loading-overlay__typed">{typed}</span>
        <span className="loading-overlay__caret" />
      </p>
    </div>
  );
}
