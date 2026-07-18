import { notFound } from "next/navigation";
import {
  getAllProjectSlugs,
  getProjectBySlug,
} from "@/data/projects";
import { SiteHeader } from "@/src/components/layout/site-header";
import { PhotoProjectView } from "@/src/components/project/photo-project-view";
import { VideoProjectView } from "@/src/components/project/video-project-view";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

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
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <SiteHeader mode="project" projectTitle={project.title} />
      <main className="flex-1">
        {project.kind === "video" ? (
          <VideoProjectView
            title={project.title}
            media={project.media}
            cover={project.cover}
          />
        ) : (
          <PhotoProjectView title={project.title} media={project.media} />
        )}
      </main>
    </>
  );
}
