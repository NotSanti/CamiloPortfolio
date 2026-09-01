import { preload } from "react-dom";
import type { Project } from "@/types/projects";
import { FeaturedProjects } from "@/src/components/home/featured-projects";
import { HomeHero } from "@/src/components/home/home-hero";
import { SiteHeader } from "@/src/components/layout/site-header";
import { getGlobeStillSrc } from "@/src/lib/globe-media";

const PRELOAD_STILL_COUNT = 4;

type HomeShellProps = {
  projects: Project[];
};

export function HomeShell({ projects }: HomeShellProps) {
  const preloaded = new Set<string>();
  for (const project of projects) {
    if (preloaded.size >= PRELOAD_STILL_COUNT) {
      break;
    }
    const src = getGlobeStillSrc(project);
    if (!src || preloaded.has(src)) {
      continue;
    }
    preloaded.add(src);
    preload(src, { as: "image", fetchPriority: "high" });
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <HomeHero>
          <FeaturedProjects projects={projects} />
        </HomeHero>
      </main>
    </>
  );
}
