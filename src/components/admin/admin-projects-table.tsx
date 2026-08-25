"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useState,
  useTransition,
  type DragEvent,
} from "react";
import type { ProjectRow } from "@/types/database";
import { AdminFeedback } from "@/src/components/admin/admin-file-dropzone";
import { DeleteProjectButton } from "@/src/components/admin/delete-project-button";
import {
  reorderProjectsAction,
  setProjectFeaturedAction,
  setProjectPublishedAction,
} from "@/src/services/projects/admin-actions";

type AdminProjectsTableProps = {
  projects: ProjectRow[];
};

function sortByDisplayOrder(projects: ProjectRow[]): ProjectRow[] {
  return [...projects].sort((a, b) => a.display_order - b.display_order);
}

function projectsSignature(projects: ProjectRow[]): string {
  return sortByDisplayOrder(projects)
    .map((project) => `${project.id}:${project.display_order}`)
    .join("|");
}

function moveItem<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return list;
  }

  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function AdminProjectsTable({ projects }: AdminProjectsTableProps) {
  const router = useRouter();
  const [ordered, setOrdered] = useState(() => sortByDisplayOrder(projects));
  const [syncedSignature, setSyncedSignature] = useState(() =>
    projectsSignature(projects),
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextSignature = projectsSignature(projects);
  if (nextSignature !== syncedSignature) {
    setSyncedSignature(nextSignature);
    setOrdered(sortByDisplayOrder(projects));
  }

  function persistOrder(nextProjects: ProjectRow[]) {
    const previous = ordered;
    setOrdered(nextProjects);
    setError(null);
    setStatusMessage("Saving order…");

    startTransition(async () => {
      const result = await reorderProjectsAction({
        orderedProjectIds: nextProjects.map((project) => project.id),
      });

      if (!result.ok) {
        setOrdered(previous);
        setError(result.error);
        setStatusMessage(null);
        return;
      }

      setStatusMessage("Order saved.");
      router.refresh();
    });
  }

  function handleMove(projectId: string, direction: -1 | 1) {
    const fromIndex = ordered.findIndex((project) => project.id === projectId);
    if (fromIndex === -1) return;
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= ordered.length) return;
    persistOrder(moveItem(ordered, fromIndex, toIndex));
  }

  function handleDragStart(projectId: string) {
    setDraggingId(projectId);
  }

  function handleDragOver(event: DragEvent<HTMLLIElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      return;
    }

    const fromIndex = ordered.findIndex((project) => project.id === draggingId);
    const toIndex = ordered.findIndex((project) => project.id === targetId);
    setDraggingId(null);
    if (fromIndex === -1 || toIndex === -1) return;
    persistOrder(moveItem(ordered, fromIndex, toIndex));
  }

  if (ordered.length === 0) {
    return (
      <div className="border border-dashed border-foreground/20 px-6 py-12 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-foreground/70">
          No projects yet
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm normal-case text-foreground/55">
          Create your first project, then add photos or videos from the editor.
        </p>
        <Link
          href="/admin/projects/new"
          className="mt-6 inline-block bg-accent px-4 py-2 text-sm font-bold uppercase text-background transition-opacity hover:opacity-90"
        >
          + New project
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/60">
        Drag cards (or use Up / Down) to set the public portfolio order. Changes
        save automatically.
      </p>

      <ul className="space-y-3">
        {ordered.map((project, index) => (
          <li
            key={project.id}
            draggable={!isPending}
            onDragStart={() => handleDragStart(project.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(project.id)}
            onDragEnd={() => setDraggingId(null)}
            className={`border border-foreground/10 px-4 py-4 ${
              draggingId === project.id ? "opacity-50" : ""
            } ${isPending ? "opacity-80" : ""}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-foreground/40">
                    #{index + 1} · Drag to reorder
                  </span>
                  <span
                    className={
                      project.is_published
                        ? "bg-foreground/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-foreground"
                        : "bg-foreground/5 px-1.5 py-0.5 text-[10px] font-bold uppercase text-foreground/50"
                    }
                  >
                    {project.is_published ? "Published" : "Draft"}
                  </span>
                  {project.is_featured ? (
                    <span className="bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">
                      Featured
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-base font-medium text-foreground">
                  {project.title}
                </p>
                <p className="mt-0.5 text-xs text-foreground/50">
                  /work/{project.slug} ·{" "}
                  {project.kind === "video" ? "Video" : "Photo"}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={index === 0 || isPending}
                    onClick={() => handleMove(project.id, -1)}
                    className="text-xs font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-40"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    disabled={index === ordered.length - 1 || isPending}
                    onClick={() => handleMove(project.id, 1)}
                    className="text-xs font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-40"
                  >
                    Down
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <form
                    action={setProjectPublishedAction.bind(
                      null,
                      project.id,
                      !project.is_published,
                    )}
                  >
                    <button
                      type="submit"
                      disabled={isPending}
                      className="text-xs font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-50"
                    >
                      {project.is_published ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <span aria-hidden className="text-foreground/20">
                    ·
                  </span>
                  <form
                    action={setProjectFeaturedAction.bind(
                      null,
                      project.id,
                      !project.is_featured,
                    )}
                  >
                    <button
                      type="submit"
                      disabled={isPending}
                      className="text-xs font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-50"
                    >
                      {project.is_featured ? "Unfeature" : "Feature"}
                    </button>
                  </form>
                  <span aria-hidden className="text-foreground/20">
                    ·
                  </span>
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="text-xs font-medium uppercase text-accent transition-opacity hover:opacity-70"
                  >
                    Edit
                  </Link>
                  <span aria-hidden className="text-foreground/20">
                    ·
                  </span>
                  <DeleteProjectButton
                    projectId={project.id}
                    projectTitle={project.title}
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <AdminFeedback status={statusMessage} error={error} />
    </div>
  );
}
