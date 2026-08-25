"use client";

import { useState, type DragEvent, type ReactNode } from "react";

type AdminFileDropzoneProps = {
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  label: string;
  hint: string;
  onFiles: (files: FileList | null) => void;
  children?: ReactNode;
};

/**
 * Click-or-drop file picker for CMS uploads (images/videos).
 */
export function AdminFileDropzone({
  accept,
  multiple = false,
  disabled = false,
  label,
  hint,
  onFiles,
  children,
}: AdminFileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (disabled) return;
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    onFiles(event.dataTransfer.files);
  }

  return (
    <div className="space-y-2">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center border border-dashed px-4 py-8 text-center transition-colors ${
          disabled
            ? "cursor-not-allowed border-foreground/15 opacity-50"
            : isDragging
              ? "border-accent bg-accent/5"
              : "border-accent/50 hover:border-accent"
        }`}
      >
        <span className="text-sm font-bold uppercase text-accent">
          {disabled ? "Busy…" : label}
        </span>
        <span className="mt-2 max-w-sm text-xs font-normal normal-case text-foreground/55">
          {hint}
        </span>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            onFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {children}
    </div>
  );
}

type AdminFeedbackProps = {
  status?: string | null;
  error?: string | null;
};

export function AdminFeedback({ status, error }: AdminFeedbackProps) {
  if (!status && !error) {
    return null;
  }

  return (
    <div className="space-y-1" aria-live="polite">
      {status ? (
        <p className="text-sm text-foreground/70" role="status">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm font-medium text-accent" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
