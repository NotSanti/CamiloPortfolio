"use client";

import { ViewTransition } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type PageTransitionProps = {
  children: ReactNode;
};

/**
 * Fades route changes via React / Next.js View Transitions.
 * Skipped on the home route so it does not fight the boot loading overlay.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return children;
  }

  return <ViewTransition>{children}</ViewTransition>;
}
