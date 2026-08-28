"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { TypedLines, TypedText } from "@/src/components/layout/typed-text";
import { useProjectsOverlay } from "@/src/components/work/projects-provider";

const HOME_INTRO = "Montreal based photographer & cinematographer";
const HOME_NAME = "Camilo Luna";
const HOME_MARK = "Caloid";
const HOME_TITLE_LINES = [HOME_INTRO, HOME_NAME];
const TITLE_CHAR_MS = 32;
const MARK_CHAR_MS = 90;
const TYPE_START_MS = 1000;
const LINE_GAP_MS = 220;

type SiteHeaderProps = {
  mode?: "home" | "project" | "about";
  projectTitle?: string;
};

function SiteNav({ isHome, isAbout }: { isHome: boolean; isAbout: boolean }) {
  const { openProjects } = useProjectsOverlay();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const secondaryHref = isAbout ? "/" : "/about";
  const secondaryLabel = isAbout ? "Home" : "About";
  const railClassName = "[writing-mode:vertical-rl] rotate-180";
  const navItemClassName = `cursor-pointer px-1 py-2 ${railClassName}`;
  const mobileItemClassName =
    "cursor-pointer py-1 text-right text-lg font-medium uppercase";

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    const media = window.matchMedia("(min-width: 1024px)");
    function onViewportChange() {
      if (media.matches) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    media.addEventListener("change", onViewportChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      media.removeEventListener("change", onViewportChange);
    };
  }, [menuOpen]);

  function handleOpenProjects() {
    setMenuOpen(false);
    openProjects();
  }

  return (
    <nav aria-label="Primary" className="site-nav-fade pointer-events-auto">
      {menuOpen ? (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          aria-hidden
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="absolute right-[15px] top-1/2 hidden -translate-y-1/2 flex-col items-center gap-2 text-lg font-medium uppercase text-accent lg:flex lg:right-[23px] lg:gap-3 lg:text-2xl">
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
        <Link href={secondaryHref} className={navItemClassName}>
          {secondaryLabel}
        </Link>
      </div>

      <div className="absolute right-[15px] top-[26px] z-40 lg:hidden">
        <button
          type="button"
          className="size-[30px] rounded-full bg-accent transition-opacity hover:opacity-80"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
        />
        <div
          id={menuId}
          role="menu"
          data-open={menuOpen ? "true" : "false"}
          aria-hidden={!menuOpen}
          inert={!menuOpen}
          className="site-nav-dropdown absolute top-[calc(100%+8px)] right-0 flex min-w-32 flex-col items-end py-1 pl-4 text-accent"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleOpenProjects}
            className={mobileItemClassName}
          >
            Projects
          </button>
          {isHome ? null : (
            <Link
              href="/"
              role="menuitem"
              className={mobileItemClassName}
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
          )}
          {isAbout ? null : (
            <Link
              href="/about"
              role="menuitem"
              className={mobileItemClassName}
              onClick={() => setMenuOpen(false)}
            >
              About
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export function SiteHeader({ mode = "home", projectTitle }: SiteHeaderProps) {
  const isHome = mode === "home";
  const isAbout = mode === "about";
  const [introDone, setIntroDone] = useState(false);

  return (
    <header className="pointer-events-none fixed inset-0 z-40">
      {isHome ? (
        <div className="pointer-events-auto absolute left-[15px] top-5 max-w-[min(693px,calc(100%-5rem))] text-accent">
          <TypedLines
            lines={HOME_TITLE_LINES}
            delayMs={TYPE_START_MS}
            charMs={TITLE_CHAR_MS}
            lineGapMs={LINE_GAP_MS}
            lineClassName="text-xl font-bold uppercase leading-normal md:text-2xl lg:text-2xl"
            onComplete={() => setIntroDone(true)}
          />
        </div>
      ) : null}

      {mode === "project" ? (
        <Link
          href="/"
          className="pointer-events-auto absolute left-[23px] top-[26px] z-40 hidden size-[30px] rounded-full bg-accent transition-opacity hover:opacity-80 lg:block"
          aria-label="Back to home"
        />
      ) : null}

      <SiteNav isHome={isHome} isAbout={isAbout} />

      {isHome ? (
        <Link
          href="/"
          className="pointer-events-auto absolute bottom-4 right-[15px] text-[6rem] font-bold uppercase leading-none text-accent md:bottom-6 md:right-6 md:text-7xl lg:bottom-0 lg:right-[23px] lg:text-[10rem]"
          aria-label="Caloid home"
        >
          <span className="relative inline-block text-left" aria-hidden>
            <span className="invisible select-none">{HOME_MARK}</span>
            <span className="absolute top-0 left-0 whitespace-nowrap">
              {introDone ? (
                <TypedText text={HOME_MARK} delayMs={0} charMs={MARK_CHAR_MS} />
              ) : null}
            </span>
          </span>
        </Link>
      ) : projectTitle ? (
        <p className="project-title pointer-events-none absolute bottom-4 right-[15px] truncate text-right font-bold uppercase leading-none text-accent md:bottom-6 md:right-6 lg:bottom-0 lg:right-[23px]">
          {projectTitle}
        </p>
      ) : null}
    </header>
  );
}
