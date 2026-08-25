import Link from "next/link";
import { AdminProjectsTable } from "@/src/components/admin/admin-projects-table";
import { getAllProjects } from "@/src/services/projects/admin";

export const metadata = {
  title: "Projects · Caloid CMS",
};

export default async function AdminProjectsPage() {
  const projects = await getAllProjects();

  return (
    <main className="mx-auto w-full max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase text-accent md:text-3xl">
            Projects
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            {projects.length} total · including drafts
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="bg-accent px-4 py-2 text-center text-sm font-bold uppercase text-background transition-opacity hover:opacity-90"
        >
          + New project
        </Link>
      </div>

      <AdminProjectsTable projects={projects} />
    </main>
  );
}
