"use client";

import { useActionState, useState } from "react";
import { slugifyTitle } from "@/src/services/projects/slugify";
import {
  createProjectFromEditorAction,
  updateProjectAction,
  type ProjectEditorValues,
  type UpdateProjectState,
} from "@/src/services/projects/admin-actions";

type ProjectEditorFormProps =
  | {
      mode: "edit";
      projectId: string;
      initialValues: ProjectEditorValues;
    }
  | {
      mode: "create";
      initialValues?: Partial<ProjectEditorValues>;
    };

const emptyValues: ProjectEditorValues = {
  title: "",
  slug: "",
  description: "",
  kind: "photo",
  isPublished: false,
  isFeatured: false,
};

function buildInitialState(values: ProjectEditorValues): UpdateProjectState {
  return {
    error: null,
    success: null,
    values,
  };
}

type EditorFieldsProps = {
  mode: "edit" | "create";
  values: ProjectEditorValues;
  slugStartsTouched: boolean;
  formAction: (payload: FormData) => void;
  pending: boolean;
  error: string | null;
  success: string | null;
};

function EditorFields({
  mode,
  values,
  slugStartsTouched,
  formAction,
  pending,
  error,
  success,
}: EditorFieldsProps) {
  const [slugTouched, setSlugTouched] = useState(slugStartsTouched);
  const [title, setTitle] = useState(values.title);
  const [slug, setSlug] = useState(values.slug);

  function handleTitleChange(nextTitle: string) {
    setTitle(nextTitle);
    if (!slugTouched) {
      setSlug(slugifyTitle(nextTitle));
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-xs font-medium uppercase text-accent">
        Title
        <input
          type="text"
          name="title"
          required
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          className="border border-foreground/20 bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      <label className="flex flex-col gap-2 text-xs font-medium uppercase text-accent">
        Slug
        <div className="flex items-center gap-2">
          <span className="text-xs font-normal normal-case text-foreground/50">
            /work/
          </span>
          <input
            type="text"
            name="slug"
            required
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            onBlur={() => setSlug(slugifyTitle(slug))}
            className="min-w-0 flex-1 border border-foreground/20 bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none focus-visible:border-accent"
          />
        </div>
      </label>

      <label className="flex flex-col gap-2 text-xs font-medium uppercase text-accent">
        Description
        <textarea
          name="description"
          rows={5}
          defaultValue={values.description}
          className="border border-foreground/20 bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      <label className="flex flex-col gap-2 text-xs font-medium uppercase text-accent">
        Kind
        <select
          name="kind"
          defaultValue={values.kind}
          className="border border-foreground/20 bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none focus-visible:border-accent"
        >
          <option value="photo">Photo</option>
          <option value="video">Video</option>
        </select>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
        <label className="flex items-center gap-2 text-sm font-medium uppercase text-accent">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={values.isPublished}
            className="size-4 accent-[var(--accent)]"
          />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm font-medium uppercase text-accent">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={values.isFeatured}
            className="size-4 accent-[var(--accent)]"
          />
          Featured
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-accent px-5 py-3 text-sm font-bold uppercase text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create project"
              : "Save changes"}
        </button>

        {error ? (
          <p className="text-sm font-medium text-accent" role="alert">
            {error}
          </p>
        ) : null}

        {success && !error ? (
          <p
            className="text-sm font-medium text-foreground"
            role="status"
            aria-live="polite"
          >
            {success}
          </p>
        ) : null}
      </div>
    </form>
  );
}

export function ProjectEditorForm(props: ProjectEditorFormProps) {
  const seedValues: ProjectEditorValues =
    props.mode === "edit"
      ? props.initialValues
      : { ...emptyValues, ...props.initialValues };

  const boundUpdate =
    props.mode === "edit"
      ? updateProjectAction.bind(null, props.projectId)
      : createProjectFromEditorAction;

  const [state, formAction, pending] = useActionState(
    boundUpdate,
    buildInitialState(seedValues),
  );

  const fieldsKey = [
    state.values.title,
    state.values.slug,
    state.values.description,
    state.values.kind,
    String(state.values.isPublished),
    String(state.values.isFeatured),
    state.error ?? "",
    state.success ?? "",
  ].join("|");

  return (
    <EditorFields
      key={fieldsKey}
      mode={props.mode}
      values={state.values}
      slugStartsTouched={
        props.mode === "edit" || Boolean(state.values.slug)
      }
      formAction={formAction}
      pending={pending}
      error={state.error}
      success={state.success}
    />
  );
}
