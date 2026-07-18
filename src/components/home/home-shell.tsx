import type { Project } from "@/types/projects";
import { FeaturedProjects } from "@/src/components/home/featured-projects";
import { HomeHero } from "@/src/components/home/home-hero";
import { SiteHeader } from "@/src/components/layout/site-header";

type HomeShellProps = {
  projects: Project[];
};

export function HomeShell({ projects }: HomeShellProps) {
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
