import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteProjectButton } from "@/src/components/admin/delete-project-button";
import { ProjectEditorForm } from "@/src/components/admin/project-editor-form";
import { ProjectMediaManager } from "@/src/components/admin/project-media-manager";
import { ProjectVideoManager } from "@/src/components/admin/project-video-manager";
import { getAdminProjectById } from "@/src/services/projects/admin";

type AdminProjectEditPageProps = {
  params: Promise<{ projectId: string }>;
};

export async function generateMetadata({ params }: AdminProjectEditPageProps) {
  const { projectId } = await params;
  const project = await getAdminProjectById(projectId);

  return {
    title: project
      ? `Edit ${project.title} · Caloid CMS`
      : "Project · Caloid CMS",
  };
}

export default async function AdminProjectEditPage({
  params,
}: AdminProjectEditPageProps) {
  const { projectId } = await params;
  const project = await getAdminProjectById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl">
      <p className="mb-4">
        <Link
          href="/admin/projects"
          className="text-sm font-medium uppercase text-accent transition-opacity hover:opacity-70"
        >
          ← Projects
        </Link>
      </p>
      <h1 className="text-2xl font-bold uppercase text-accent md:text-3xl">
        {project.title}
      </h1>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/60">
        <span>Edit project details and media</span>
        {project.is_published ? (
          <Link
            href={`/work/${project.slug}`}
            target="_blank"
            rel="noreferrer"
            className="font-medium uppercase text-accent transition-opacity hover:opacity-70"
          >
            View live →
          </Link>
        ) : (
          <span className="uppercase text-foreground/40">Draft · not public</span>
        )}
      </p>

      <div className="mt-8">
        <ProjectEditorForm
          mode="edit"
          projectId={project.id}
          initialValues={{
            title: project.title,
            slug: project.slug,
            description: project.description ?? "",
            kind: project.kind,
            isPublished: project.is_published,
            isFeatured: project.is_featured,
          }}
        />
      </div>

      <ProjectMediaManager
        projectId={project.id}
        coverImagePath={project.cover_image_path}
        coverAltText={project.cover_alt_text}
        images={project.project_images}
      />

      <ProjectVideoManager
        projectId={project.id}
        videos={project.project_videos}
      />

      <div className="mt-12 border border-accent/30 px-4 py-4">
        <p className="text-sm text-foreground/70">
          Deleting removes this project, cascaded media rows, managed Storage
          images, and unshared Mux assets. Shared Mux placeholders used by other
          projects are left alone. This cannot be undone.
        </p>
        <div className="mt-3">
          <DeleteProjectButton
            projectId={project.id}
            projectTitle={project.title}
            className="text-sm font-medium uppercase text-accent transition-opacity hover:opacity-70"
          />
        </div>
      </div>
    </main>
  );
}
