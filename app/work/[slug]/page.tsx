import { notFound } from "next/navigation";
import {
  getPublishedProjectBySlug,
  getPublishedProjectSlugs,
} from "@/src/services/projects/get-published-projects";
import { SiteHeader } from "@/src/components/layout/site-header";
import { PhotoProjectView } from "@/src/components/project/photo-project-view";
import { VideoProjectView } from "@/src/components/project/video-project-view";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getPublishedProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);

  if (!project) {
    return { title: "Project not found" };
  }

  return {
    title: `${project.title} · Caloid`,
    description: project.summary,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <SiteHeader
        mode="project"
        projectTitle={project.kind === "video" ? project.title : undefined}
      />
      <main className="flex-1">
        {project.kind === "video" ? (
          <VideoProjectView
            title={project.title}
            summary={project.summary}
            media={project.media}
            cover={project.cover}
          />
        ) : (
          <PhotoProjectView
            title={project.title}
            category={project.category}
            year={project.year}
            summary={project.summary}
            media={project.media}
          />
        )}
      </main>
    </>
  );
}
