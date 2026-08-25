"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { ProjectSummary } from "@/types/projects";
import { ProjectsOverlay } from "@/src/components/work/projects-overlay";

type ProjectsOverlayContextValue = {
  openProjects: () => void;
  closeProjects: () => void;
  isOpen: boolean;
};

const ProjectsOverlayContext =
  createContext<ProjectsOverlayContextValue | null>(null);

export function useProjectsOverlay(): ProjectsOverlayContextValue {
  const value = useContext(ProjectsOverlayContext);
  if (!value) {
    throw new Error("useProjectsOverlay must be used within ProjectsProvider");
  }
  return value;
}

type ProjectsProviderProps = {
  projects: ProjectSummary[];
  children: ReactNode;
};

export function ProjectsProvider({ projects, children }: ProjectsProviderProps) {
  const pathname = usePathname();
  const [openOnPath, setOpenOnPath] = useState<string | null>(null);
  const isOpen = openOnPath === pathname;

  const openProjects = useCallback(() => setOpenOnPath(pathname), [pathname]);
  const closeProjects = useCallback(() => setOpenOnPath(null), []);

  const value = useMemo(
    () => ({ openProjects, closeProjects, isOpen }),
    [openProjects, closeProjects, isOpen],
  );

  return (
    <ProjectsOverlayContext.Provider value={value}>
      <div className="flex min-h-full flex-1 flex-col">{children}</div>
      {isOpen ? (
        <ProjectsOverlay projects={projects} onClose={closeProjects} />
      ) : null}
    </ProjectsOverlayContext.Provider>
  );
}
