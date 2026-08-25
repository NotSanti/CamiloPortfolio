import Link from "next/link";
import { ProjectEditorForm } from "@/src/components/admin/project-editor-form";

export const metadata = {
  title: "New project · Caloid CMS",
};

export default function AdminNewProjectPage() {
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
        New project
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        Start as a draft or publish right away. After creating, you can upload
        photos and videos on the next screen.
      </p>

      <div className="mt-8">
        <ProjectEditorForm mode="create" />
      </div>
    </main>
  );
}
