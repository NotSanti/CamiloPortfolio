import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/src/components/seo/json-ld";
import { SiteHeader } from "@/src/components/layout/site-header";
import { PhotoProjectView } from "@/src/components/project/photo-project-view";
import { VideoProjectView } from "@/src/components/project/video-project-view";
import {
  buildPageMetadata,
  generateProjectSeo,
  projectJsonLd,
  resolveSeoField,
} from "@/src/lib/seo";
import {
  getPublishedProjectBySlug,
  getPublishedProjectSlugs,
} from "@/src/services/projects/get-published-projects";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getPublishedProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);

  if (!project) {
    return { title: "Project not found" };
  }

  const generated = generateProjectSeo({
    title: project.title,
    kind: project.kind,
    description: project.summary,
  });

  return buildPageMetadata({
    title: resolveSeoField(project.seoTitle, generated.title),
    description: resolveSeoField(project.seoDescription, generated.description),
    path: `/work/${project.slug}`,
    images: project.cover.src
      ? [{ url: project.cover.src, alt: project.cover.alt }]
      : undefined,
  });
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const generated = generateProjectSeo({
    title: project.title,
    kind: project.kind,
    description: project.summary,
  });
  const seoTitle = resolveSeoField(project.seoTitle, generated.title);
  const seoDescription = resolveSeoField(
    project.seoDescription,
    generated.description,
  );

  return (
    <>
      <JsonLd
        json={projectJsonLd({
          title: seoTitle,
          description: seoDescription,
          path: `/work/${project.slug}`,
          imageUrl: project.cover.src,
        })}
      />
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
