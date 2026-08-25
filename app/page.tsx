import { getPublishedFeaturedProjects } from "@/src/services/projects/get-published-projects";
import { HomeShell } from "@/src/components/home/home-shell";

export const revalidate = 60;

export default async function Home() {
  const featuredProjects = await getPublishedFeaturedProjects();

  return <HomeShell projects={featuredProjects} />;
}
