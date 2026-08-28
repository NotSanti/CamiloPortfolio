"use client";

import { useEffect } from "react";
import type { ProjectSummary } from "@/types/projects";
import { ProjectsWheel } from "@/src/components/work/projects-wheel";

type ProjectsOverlayProps = {
  projects: ProjectSummary[];
  onClose: () => void;
};

export function ProjectsOverlay({ projects, onClose }: ProjectsOverlayProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  /** Lock the page underneath so only the projects wheel receives input. */
  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Projects"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute left-[23px] top-[26px] z-40 size-[30px] rounded-full bg-accent transition-opacity hover:opacity-80"
        aria-label="Close projects"
      />

      <div className="absolute inset-0 z-10">
        <ProjectsWheel projects={projects} />
      </div>
    </div>
  );
}
