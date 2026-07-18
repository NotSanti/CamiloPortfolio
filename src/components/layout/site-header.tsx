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
  const railClassName = "lg:[writing-mode:vertical-rl] lg:rotate-180";
  const navItemClassName = `cursor-pointer ${railClassName}`;

  return (
    <header className="pointer-events-none fixed inset-0 z-40">
      {isHome ? (
        <div className="pointer-events-auto absolute left-[15px] top-5 max-w-[min(693px,calc(100%-5rem))] text-accent">
          <p className="text-sm font-bold uppercase leading-normal md:text-xl lg:text-2xl">
            Montreal based photographer &amp; cinematographer
          </p>
          <p className="text-sm font-bold uppercase leading-normal md:text-xl lg:text-2xl">
            Camilo Luna
          </p>
        </div>
      ) : null}

      <nav
        aria-label="Primary"
        className="pointer-events-auto absolute right-[15px] top-5 flex items-center gap-2 text-sm font-medium uppercase text-accent md:text-xl lg:right-[23px] lg:top-1/2 lg:-translate-y-1/2 lg:flex-col lg:items-center lg:gap-3 lg:text-[32px]"
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
          className="pointer-events-auto absolute bottom-4 right-[15px] text-4xl font-bold uppercase leading-none text-accent md:bottom-6 md:right-6 md:text-6xl lg:bottom-0 lg:right-[23px] lg:text-[128px]"
          aria-label="Caloid home"
        >
          Caloid
        </Link>
      ) : projectTitle ? (
        <p className="pointer-events-none absolute bottom-4 right-[15px] max-w-[70%] truncate text-right text-4xl font-bold uppercase leading-none text-accent md:bottom-6 md:right-6 md:text-6xl lg:bottom-0 lg:right-[23px] lg:max-w-none lg:text-[128px]">
          {projectTitle}
        </p>
      ) : null}
    </header>
  );
}
