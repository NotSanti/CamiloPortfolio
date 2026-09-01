"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { AdminFeedback } from "@/src/components/admin/admin-file-dropzone";
import {
  generateAboutSeo,
  generateHomeSeo,
  generateProjectSeo,
  META_DESCRIPTION_MAX,
  META_TITLE_MAX,
} from "@/src/lib/seo";
import {
  generateAllProjectSeoAction,
  generateProjectSeoAction,
  generateSiteSeoAction,
  refreshSeoAction,
  saveProjectSeoAction,
  saveSiteSeoAction,
} from "@/src/services/seo/admin-actions";
import type { ProjectRow, SiteSettingsRow } from "@/types/database";

type SeoManagerProps = {
  settings: SiteSettingsRow;
  projects: ProjectRow[];
  aboutBio: string;
};

type ProjectDraft = {
  seoTitle: string;
  seoDescription: string;
};

function draftsFromProjects(
  projects: ProjectRow[],
): Record<string, ProjectDraft> {
  return Object.fromEntries(
    projects.map((project) => {
      const generated = generateProjectSeo({
        title: project.title,
        kind: project.kind,
        description: project.description,
      });
      return [
        project.id,
        {
          seoTitle: project.seo_title ?? generated.title,
          seoDescription: project.seo_description ?? generated.description,
        },
      ];
    }),
  );
}

export function SeoManager({
  settings,
  projects,
  aboutBio,
}: SeoManagerProps) {
  const router = useRouter();
  const generatedHome = generateHomeSeo();
  const generatedAbout = generateAboutSeo(aboutBio);
  const [homeTitle, setHomeTitle] = useState(
    settings.home_seo_title ?? generatedHome.title,
  );
  const [homeDescription, setHomeDescription] = useState(
    settings.home_seo_description ?? generatedHome.description,
  );
  const [aboutTitle, setAboutTitle] = useState(
    settings.about_seo_title ?? generatedAbout.title,
  );
  const [aboutDescription, setAboutDescription] = useState(
    settings.about_seo_description ?? generatedAbout.description,
  );
  const [projectDrafts, setProjectDrafts] = useState(() =>
    draftsFromProjects(projects),
  );
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setDraft(projectId: string, patch: Partial<ProjectDraft>) {
    setProjectDrafts((current) => {
      const existing = current[projectId];
      if (!existing) return current;
      return { ...current, [projectId]: { ...existing, ...patch } };
    });
  }

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    setStatusMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleSaveSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(async () => {
      const result = await saveSiteSeoAction({
        homeTitle,
        homeDescription,
        aboutTitle,
        aboutDescription,
      });
      if (result.ok) {
        setStatusMessage("Site metadata saved.");
      }
      return result;
    });
  }

  return (
    <div className="space-y-12">
      <section className="flex flex-col gap-4 border-b border-foreground/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold uppercase text-accent">
            Live index
          </h2>
          <p className="mt-1 max-w-xl text-sm text-foreground/60">
            After you change titles, descriptions, or project content, refresh
            so the public pages, sitemap, and social previews pick it up
            immediately.
          </p>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(async () => {
              const result = await refreshSeoAction();
              if (result.ok) {
                setStatusMessage("Live SEO cache refreshed.");
              }
              return result;
            })
          }
          className="bg-accent px-4 py-2 text-sm font-bold uppercase text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Working…" : "Refresh SEO"}
        </button>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold uppercase text-accent">
              Site pages
            </h2>
            <p className="mt-1 text-sm text-foreground/60">
              Home and about titles and descriptions. Generate fills them from
              the current brand copy and bio.
            </p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(async () => {
                const result = await generateSiteSeoAction();
                if (result.ok) {
                  const home = generateHomeSeo();
                  const about = generateAboutSeo(aboutBio);
                  setHomeTitle(home.title);
                  setHomeDescription(home.description);
                  setAboutTitle(about.title);
                  setAboutDescription(about.description);
                  setStatusMessage("Home and about metadata generated.");
                }
                return result;
              })
            }
            className="text-sm font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-60"
          >
            Generate from content
          </button>
        </div>

        <form onSubmit={handleSaveSite} className="grid gap-8 lg:grid-cols-2">
          <fieldset className="flex flex-col gap-4">
            <legend className="text-xs font-medium uppercase text-foreground/50">
              Home
            </legend>
            <label className="flex flex-col gap-2 text-xs font-medium uppercase text-accent">
              Meta title
              <input
                type="text"
                value={homeTitle}
                maxLength={META_TITLE_MAX}
                onChange={(event) => setHomeTitle(event.target.value)}
                className="border border-foreground/20 bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none focus-visible:border-accent"
              />
              <span className="font-normal normal-case text-foreground/40">
                {homeTitle.length}/{META_TITLE_MAX}
              </span>
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium uppercase text-accent">
              Meta description
              <textarea
                rows={4}
                value={homeDescription}
                maxLength={META_DESCRIPTION_MAX}
                onChange={(event) => setHomeDescription(event.target.value)}
                className="border border-foreground/20 bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none focus-visible:border-accent"
              />
              <span className="font-normal normal-case text-foreground/40">
                {homeDescription.length}/{META_DESCRIPTION_MAX}
              </span>
            </label>
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="text-xs font-medium uppercase text-foreground/50">
              About
            </legend>
            <label className="flex flex-col gap-2 text-xs font-medium uppercase text-accent">
              Meta title
              <input
                type="text"
                value={aboutTitle}
                maxLength={META_TITLE_MAX}
                onChange={(event) => setAboutTitle(event.target.value)}
                className="border border-foreground/20 bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none focus-visible:border-accent"
              />
              <span className="font-normal normal-case text-foreground/40">
                {aboutTitle.length}/{META_TITLE_MAX}
              </span>
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium uppercase text-accent">
              Meta description
              <textarea
                rows={4}
                value={aboutDescription}
                maxLength={META_DESCRIPTION_MAX}
                onChange={(event) => setAboutDescription(event.target.value)}
                className="border border-foreground/20 bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none focus-visible:border-accent"
              />
              <span className="font-normal normal-case text-foreground/40">
                {aboutDescription.length}/{META_DESCRIPTION_MAX}
              </span>
            </label>
          </fieldset>

          <button
            type="submit"
            disabled={isPending}
            className="bg-accent px-4 py-2 text-sm font-bold uppercase text-background transition-opacity hover:opacity-90 disabled:opacity-60 lg:col-span-2"
          >
            {isPending ? "Saving…" : "Save site metadata"}
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold uppercase text-accent">
              Projects
            </h2>
            <p className="mt-1 text-sm text-foreground/60">
              Generated from each project’s title and description. Generate
              again after you change that content.
            </p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              const confirmed = window.confirm(
                "Replace meta titles and descriptions for every project with text generated from current titles and descriptions?",
              );
              if (!confirmed) return;
              run(async () => {
                const result = await generateAllProjectSeoAction();
                if (result.ok) {
                  setProjectDrafts(
                    Object.fromEntries(
                      projects.map((project) => {
                        const generated = generateProjectSeo({
                          title: project.title,
                          kind: project.kind,
                          description: project.description,
                        });
                        return [
                          project.id,
                          {
                            seoTitle: generated.title,
                            seoDescription: generated.description,
                          },
                        ];
                      }),
                    ),
                  );
                  setStatusMessage("Project metadata generated.");
                }
                return result;
              });
            }}
            className="text-sm font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-60"
          >
            Generate all from content
          </button>
        </div>

        <ul className="space-y-8">
          {projects.map((project) => {
            const draft = projectDrafts[project.id];
            if (!draft) return null;
            const busy = isPending && pendingProjectId === project.id;

            return (
              <li
                key={project.id}
                className="border-t border-foreground/10 pt-6"
              >
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-bold uppercase text-foreground">
                    {project.title}
                  </p>
                  <p className="text-xs uppercase text-foreground/40">
                    {project.is_published ? "Published" : "Draft"} · /work/
                    {project.slug}
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs font-medium uppercase text-accent">
                    Meta title
                    <input
                      type="text"
                      value={draft.seoTitle}
                      maxLength={META_TITLE_MAX}
                      onChange={(event) =>
                        setDraft(project.id, { seoTitle: event.target.value })
                      }
                      className="border border-foreground/20 bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none focus-visible:border-accent"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-medium uppercase text-accent">
                    Meta description
                    <textarea
                      rows={3}
                      value={draft.seoDescription}
                      maxLength={META_DESCRIPTION_MAX}
                      onChange={(event) =>
                        setDraft(project.id, {
                          seoDescription: event.target.value,
                        })
                      }
                      className="border border-foreground/20 bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none focus-visible:border-accent"
                    />
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-4">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setPendingProjectId(project.id);
                      run(async () => {
                        const result = await saveProjectSeoAction({
                          projectId: project.id,
                          seoTitle: draft.seoTitle,
                          seoDescription: draft.seoDescription,
                        });
                        setPendingProjectId(null);
                        if (result.ok) {
                          setStatusMessage(`Saved SEO for ${project.title}.`);
                        }
                        return result;
                      });
                    }}
                    className="text-sm font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-60"
                  >
                    {busy ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setPendingProjectId(project.id);
                      run(async () => {
                        const result = await generateProjectSeoAction({
                          projectId: project.id,
                        });
                        setPendingProjectId(null);
                        if (result.ok) {
                          const generated = generateProjectSeo({
                            title: project.title,
                            kind: project.kind,
                            description: project.description,
                          });
                          setDraft(project.id, {
                            seoTitle: generated.title,
                            seoDescription: generated.description,
                          });
                          setStatusMessage(
                            `Generated SEO for ${project.title}.`,
                          );
                        }
                        return result;
                      });
                    }}
                    className="text-sm font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-60"
                  >
                    Generate from content
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <AdminFeedback status={statusMessage} error={error} />
    </div>
  );
}
