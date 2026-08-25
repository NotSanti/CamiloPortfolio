"use client";

import { useState, useTransition } from "react";
import { deleteProjectAction } from "@/src/services/projects/admin-actions";

type DeleteProjectButtonProps = {
  projectId: string;
  projectTitle: string;
  className?: string;
};

export function DeleteProjectButton({
  projectId,
  projectTitle,
  className = "text-xs font-medium uppercase text-accent transition-opacity hover:opacity-70",
}: DeleteProjectButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const confirmed = window.confirm(
      [
        `Delete “${projectTitle}”?`,
        "",
        "This permanently removes:",
        "• Gallery / cover images from Storage",
        "• Mux video assets (when not shared with other projects)",
        "• The project and all media records",
        "",
        "This cannot be undone.",
      ].join("\n"),
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteProjectAction(projectId);
      // Successful deletes redirect; a returned value means failure.
      if (result && result.ok === false) {
        const detail =
          result.notes && result.notes.length > 0
            ? `\n${result.notes.join("\n")}`
            : "";
        setError(`${result.error}${detail}`);
      }
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`${className} disabled:opacity-60`}
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error ? (
        <span className="max-w-xs whitespace-pre-wrap text-[10px] font-medium normal-case text-accent" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
