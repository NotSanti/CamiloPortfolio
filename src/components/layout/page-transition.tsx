"use client";

import { ViewTransition } from "react";
import type { ReactNode } from "react";

type PageTransitionProps = {
  children: ReactNode;
};

/** Fades route changes via React / Next.js View Transitions. */
export function PageTransition({ children }: PageTransitionProps) {
  return <ViewTransition>{children}</ViewTransition>;
}
