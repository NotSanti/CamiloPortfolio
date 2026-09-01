"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  AdminFeedback,
  AdminFileDropzone,
} from "@/src/components/admin/admin-file-dropzone";
import { MuxAssetLibrary } from "@/src/components/admin/mux-asset-library";
import { getMuxPosterUrl } from "@/src/lib/mux/playback";
import { VIDEO_ACCEPT } from "@/src/lib/video";
import { deleteProjectVideoAction } from "@/src/services/videos/admin-actions";
import { hardDeleteMuxAssetAction } from "@/src/services/videos/mux-library-actions";
import {
  uploadProjectVideoFile,
  type VideoUploadProgress,
} from "@/src/services/videos/upload-client";
import type { ProjectVideoRow, ProjectVideoStatus } from "@/types/database";

type ProjectVideoManagerProps = {
  projectId: string;
  videos: ProjectVideoRow[];
};

function statusLabel(status: ProjectVideoStatus): string {
  switch (status) {
    case "waiting":
      return "Waiting";
    case "uploading":
      return "Uploading";
    case "processing":
      return "Processing";
    case "ready":
      return "Ready";
    case "errored":
      return "Errored";
    default:
      return status;
  }
}

function statusHint(status: ProjectVideoStatus): string | null {
  switch (status) {
    case "waiting":
      return "Upload started — finish the transfer if it stalled.";
    case "uploading":
      return "File is transferring to Mux.";
    case "processing":
      return "Upload finished. Mux is preparing playback — this page refreshes automatically.";
    case "ready":
      return "Ready to play on the public site.";
    case "errored":
      return "Upload or processing failed. Delete and try again.";
    default:
      return null;
  }
}

function statusBadgeClass(status: ProjectVideoStatus): string {
  switch (status) {
    case "ready":
      return "bg-accent/15 text-accent";
    case "errored":
      return "bg-accent/20 text-accent";
    case "processing":
    case "uploading":
    case "waiting":
      return "bg-foreground/10 text-foreground/70";
    default:
      return "bg-foreground/10 text-foreground/60";
  }
}

function ProgressBar({ progress }: { progress: VideoUploadProgress | null }) {
  if (!progress || progress.phase === "done") {
    return null;
  }

  const label =
    progress.phase === "error"
      ? (progress.error ?? "Upload failed")
      : progress.phase === "requesting"
        ? "Requesting upload…"
        : progress.phase === "processing"
          ? "Upload complete — marking as processing…"
          : `Uploading ${progress.percent}%`;

  return (
    <div className="mt-2">
      <p className="text-xs uppercase text-foreground/60">{label}</p>
      {progress.phase !== "error" ? (
        <div className="mt-1 h-1.5 w-full bg-foreground/10">
          <div
            className="h-full bg-accent transition-[width]"
            style={{
              width: `${
                progress.phase === "requesting"
                  ? 5
                  : progress.phase === "processing"
                    ? 100
                    : progress.percent
              }%`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ProjectVideoManager({
  projectId,
  videos,
}: ProjectVideoManagerProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<VideoUploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingMuxDeleteId, setPendingMuxDeleteId] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  const needsStatusPoll = videos.some(
    (video) =>
      video.status === "waiting" ||
      video.status === "uploading" ||
      video.status === "processing",
  );

  useEffect(() => {
    if (!needsStatusPoll) return;

    const timer = window.setInterval(() => {
      router.refresh();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [needsStatusPoll, router]);

  async function handleVideoChange(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    setError(null);
    setStatusMessage(null);
    setIsUploading(true);
    const files = Array.from(fileList);

    try {
      for (const file of files) {
        await uploadProjectVideoFile({
          projectId,
          file,
          onProgress: setProgress,
        });
      }

      setProgress({ percent: 100, phase: "done" });
      setStatusMessage(
        files.length === 1
          ? "Video uploaded. Waiting for Mux to finish processing…"
          : `${files.length} videos uploaded. Waiting for Mux to finish processing…`,
      );
      startTransition(() => router.refresh());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Video upload failed.";
      setError(message);
      setProgress({ percent: 0, phase: "error", error: message });
      startTransition(() => router.refresh());
    } finally {
      setIsUploading(false);
    }
  }

  function handleDelete(video: ProjectVideoRow) {
    const label = video.title || video.id.slice(0, 8);
    const confirmed = window.confirm(
      [
        `Delete video “${label}”?`,
        "",
        "This removes the video from this project. The Mux asset is deleted only if no other project uses it.",
      ].join("\n"),
    );
    if (!confirmed) return;

    setPendingDeleteId(video.id);
    setError(null);
    setStatusMessage(null);

    startTransition(async () => {
      const result = await deleteProjectVideoAction(video.id);
      setPendingDeleteId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStatusMessage("Video deleted.");
      router.refresh();
    });
  }

  function handleHardDelete(video: ProjectVideoRow) {
    const assetId = video.mux_asset_id;
    if (!assetId) {
      setError("This video has no Mux asset to delete.");
      return;
    }

    const label = video.title || video.id.slice(0, 8);
    const confirmed = window.confirm(
      [
        `Delete “${label}” from Mux?`,
        "",
        "This permanently removes the asset from Mux. It cannot be undone.",
        "Every project that uses this video will lose it.",
      ].join("\n"),
    );
    if (!confirmed) return;

    setPendingMuxDeleteId(video.id);
    setError(null);
    setStatusMessage(null);

    startTransition(async () => {
      const result = await hardDeleteMuxAssetAction({ assetId });
      setPendingMuxDeleteId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStatusMessage("Mux asset deleted.");
      router.refresh();
    });
  }

  return (
    <section className="mt-12 space-y-6 border-t border-foreground/10 pt-10">
      <div>
        <h2 className="text-lg font-bold uppercase text-accent">Videos</h2>
        <p className="mt-1 text-sm text-foreground/60">
          MP4, MOV, WebM, or M4V. Files go straight to Mux (not through this
          server). Upload complete does not mean playable — wait for Ready.
        </p>

        <div className="mt-4">
          <AdminFileDropzone
            accept={VIDEO_ACCEPT}
            multiple
            disabled={isUploading}
            label={
              isUploading
                ? "Uploading…"
                : "Drop video here or click to upload"
            }
            hint="Large files are fine — progress shows below."
            onFiles={(files) => {
              void handleVideoChange(files);
            }}
          >
            <ProgressBar progress={progress} />
          </AdminFileDropzone>
        </div>

        <MuxAssetLibrary
          projectId={projectId}
          disabled={isUploading}
          onAttached={() => {
            startTransition(() => router.refresh());
          }}
          onHardDeleted={() => {
            startTransition(() => router.refresh());
          }}
          onError={setError}
          onStatus={setStatusMessage}
        />

        <AdminFeedback status={statusMessage} error={error} />
      </div>

      {videos.length === 0 ? (
        <div className="border border-dashed border-foreground/15 px-4 py-8 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-foreground/60">
            No videos yet
          </p>
          <p className="mt-2 text-sm normal-case text-foreground/50">
            Drop a file above, or use an existing Mux video. Status will move
            Waiting → Processing → Ready.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {videos.map((video) => {
            const hint = statusHint(video.status);
            const poster =
              video.status === "ready" && video.mux_playback_id
                ? getMuxPosterUrl(video.mux_playback_id, { width: 480 })
                : null;

            return (
              <li
                key={video.id}
                className="border border-foreground/10 px-3 py-3"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="relative aspect-video w-full max-w-[180px] shrink-0 overflow-hidden bg-media-placeholder sm:w-[140px]">
                    {poster ? (
                      <Image
                        src={poster}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="180px"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center px-2 text-center text-[10px] uppercase text-foreground/40">
                        {video.status === "ready"
                          ? "No preview"
                          : statusLabel(video.status)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {video.title || "Untitled video"}
                        </p>
                        <p
                          className={`mt-1 inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(video.status)}`}
                        >
                          {statusLabel(video.status)}
                        </p>
                        {hint ? (
                          <p className="mt-1 text-xs text-foreground/55">
                            {hint}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          disabled={isPending && pendingDeleteId === video.id}
                          onClick={() => handleDelete(video)}
                          className="text-[10px] font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-60"
                        >
                          {pendingDeleteId === video.id ? "…" : "Delete"}
                        </button>
                        {video.mux_asset_id ? (
                          <button
                            type="button"
                            disabled={
                              isPending && pendingMuxDeleteId === video.id
                            }
                            onClick={() => handleHardDelete(video)}
                            className="text-[10px] font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-60"
                          >
                            {pendingMuxDeleteId === video.id
                              ? "…"
                              : "Delete from Mux"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
