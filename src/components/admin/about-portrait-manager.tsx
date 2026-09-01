"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  AdminFeedback,
  AdminFileDropzone,
} from "@/src/components/admin/admin-file-dropzone";
import { getMediaUrl } from "@/src/lib/media";
import {
  savePortraitAction,
  updatePortraitAltAction,
} from "@/src/services/site/admin-actions";
import {
  uploadSitePortraitFile,
  type UploadProgress,
} from "@/src/services/images/upload-client";
import type { SiteSettingsRow } from "@/types/database";

type AboutPortraitManagerProps = {
  settings: SiteSettingsRow;
  fallbackSrc: string;
  fallbackAlt: string;
};

function ProgressBar({ progress }: { progress: UploadProgress | null }) {
  if (!progress || progress.status === "done") {
    return null;
  }

  const label =
    progress.status === "error"
      ? (progress.error ?? "Upload failed")
      : progress.status === "saving"
        ? "Saving…"
        : `Uploading ${progress.percent}%`;

  return (
    <div className="mt-2">
      <p className="text-xs uppercase text-foreground/60">{label}</p>
      {progress.status !== "error" ? (
        <div className="mt-1 h-1.5 w-full bg-foreground/10">
          <div
            className="h-full bg-accent transition-[width]"
            style={{
              width: `${progress.status === "saving" ? 100 : progress.percent}%`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function AboutPortraitManager({
  settings,
  fallbackSrc,
  fallbackAlt,
}: AboutPortraitManagerProps) {
  const router = useRouter();
  const [altText, setAltText] = useState(settings.portrait_alt ?? "");
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const portraitSrc = getMediaUrl(settings.portrait_path) || fallbackSrc;
  const portraitAlt = settings.portrait_alt?.trim() || fallbackAlt;
  const isUploading =
    progress?.status === "uploading" || progress?.status === "saving";

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    setError(null);
    setStatusMessage(null);

    try {
      const uploaded = await uploadSitePortraitFile({
        file,
        onProgress: setProgress,
      });

      const result = await savePortraitAction({
        storagePath: uploaded.storagePath,
        width: uploaded.width,
        height: uploaded.height,
      });

      if (!result.ok) {
        setProgress({ percent: 0, status: "error", error: result.error });
        setError(result.error);
        return;
      }

      setProgress({ percent: 100, status: "done" });
      setStatusMessage("Portrait saved.");
      router.refresh();
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Upload failed.";
      setProgress({ percent: 0, status: "error", error: message });
      setError(message);
    }
  }

  function handleAltSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatusMessage(null);

    startTransition(async () => {
      const result = await updatePortraitAltAction({ altText });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStatusMessage("Portrait alt text saved.");
      router.refresh();
    });
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-bold uppercase text-accent">Portrait</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Shown on the about page. JPEG, PNG, or WebP · up to 50 MB.
        </p>
      </div>

      <div className="relative aspect-[3/4] w-full max-w-[200px] overflow-hidden bg-media-placeholder">
        {portraitSrc ? (
          <Image
            src={portraitSrc}
            alt={portraitAlt}
            fill
            className="object-cover"
            sizes="200px"
          />
        ) : (
          <span className="flex size-full items-center justify-center px-3 text-center text-xs uppercase text-foreground/40">
            No portrait yet
          </span>
        )}
      </div>

      <AdminFileDropzone
        accept="image/jpeg,image/png,image/webp"
        disabled={isUploading || isPending}
        label="Drop a portrait here or click to upload"
        hint="Replaces the current about-page photo."
        onFiles={(files) => {
          void handleFiles(files);
        }}
      >
        <ProgressBar progress={progress} />
      </AdminFileDropzone>

      <form onSubmit={handleAltSubmit} className="flex max-w-md flex-col gap-3">
        <label className="flex flex-col gap-2 text-xs font-medium uppercase text-accent">
          Alt text
          <input
            type="text"
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            disabled={isUploading || isPending}
            className="border border-foreground/20 bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none focus-visible:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={isUploading || isPending}
          className="self-start bg-accent px-4 py-2 text-sm font-bold uppercase text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save alt text"}
        </button>
      </form>

      <AdminFeedback status={statusMessage} error={error} />
    </section>
  );
}
