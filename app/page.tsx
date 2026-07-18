import { getFeaturedProjects } from "@/data/projects";
import { HomeShell } from "@/src/components/home/home-shell";

export default function Home() {
  const featuredProjects = getFeaturedProjects();

  return <HomeShell projects={featuredProjects} />;
}
