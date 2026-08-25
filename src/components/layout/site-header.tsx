"use client";

import Link from "next/link";
import { useProjectsOverlay } from "@/src/components/work/projects-provider";

type SiteHeaderProps = {
  mode?: "home" | "project" | "about";
  projectTitle?: string;
};

export function SiteHeader({
  mode = "home",
  projectTitle,
}: SiteHeaderProps) {
  const { openProjects } = useProjectsOverlay();
  const isHome = mode === "home";
  const isAbout = mode === "about";
  const railClassName = "[writing-mode:vertical-rl] rotate-180";
  const navItemClassName = `cursor-pointer px-1 py-2 ${railClassName}`;

  return (
    <header className="pointer-events-none fixed inset-0 z-40">
      {isHome ? (
        <div className="pointer-events-auto absolute left-[15px] top-5 max-w-[min(693px,calc(100%-5rem))] text-accent">
          <p className="text-xl font-bold uppercase leading-normal md:text-2xl lg:text-2xl">
            Montreal based photographer &amp; cinematographer
          </p>
          <p className="text-xl font-bold uppercase leading-normal md:text-2xl lg:text-2xl">
            Camilo Luna
          </p>
        </div>
      ) : null}

      {mode === "project" ? (
        <Link
          href="/"
          className="pointer-events-auto absolute left-[23px] top-[26px] z-40 size-[30px] rounded-full bg-accent transition-opacity hover:opacity-80"
          aria-label="Back to home"
        />
      ) : null}

      <nav
        aria-label="Primary"
        className="pointer-events-auto absolute right-[15px] top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 text-2xl font-medium uppercase text-accent md:text-3xl lg:right-[23px] lg:gap-3 lg:text-[32px]"
      >
        {isAbout ? (
          <>
            <button
              type="button"
              onClick={openProjects}
              className={`uppercase ${navItemClassName}`}
            >
              Projects
            </button>
            <span aria-hidden="true" className={`cursor-default ${railClassName}`}>
              -
            </span>
            <Link href="/" className={navItemClassName}>
              Home
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={openProjects}
              className={`uppercase ${navItemClassName}`}
            >
              Projects
            </button>
            <span aria-hidden="true" className={`cursor-default ${railClassName}`}>
              -
            </span>
            <Link href="/about" className={navItemClassName}>
              About
            </Link>
          </>
        )}
      </nav>

      {isHome ? (
        <Link
          href="/"
          className="pointer-events-auto absolute bottom-4 right-[15px] text-6xl font-bold uppercase leading-none text-accent md:bottom-6 md:right-6 md:text-7xl lg:bottom-0 lg:right-[23px] lg:text-[128px]"
          aria-label="Caloid home"
        >
          Caloid
        </Link>
      ) : projectTitle ? (
        <p className="project-title pointer-events-none absolute bottom-4 right-[15px] truncate text-right font-bold uppercase leading-none text-accent md:bottom-6 md:right-6 lg:bottom-0 lg:right-[23px]">
          {projectTitle}
        </p>
      ) : null}
    </header>
  );
}
