"use client";

import Image from "next/image";
import { useState } from "react";
import { getMuxPosterUrl } from "@/src/lib/mux/playback";
import {
  attachMuxAssetAction,
  hardDeleteMuxAssetAction,
  listMuxLibraryAction,
  type MuxLibraryAsset,
} from "@/src/services/videos/mux-library-actions";

type MuxAssetLibraryProps = {
  projectId: string;
  disabled?: boolean;
  onAttached: () => void;
  onHardDeleted: () => void;
  onError: (message: string | null) => void;
  onStatus: (message: string | null) => void;
};

function formatDuration(seconds: number | null): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function formatCreatedAt(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const numeric = Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(numeric < 1e12 ? numeric * 1000 : numeric)
    : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const buttonClassName =
  "text-[10px] font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-60";

export function MuxAssetLibrary({
  projectId,
  disabled = false,
  onAttached,
  onHardDeleted,
  onError,
  onStatus,
}: MuxAssetLibraryProps) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MuxLibraryAsset[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingAttachId, setPendingAttachId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function loadPage(cursor: string | null, append: boolean) {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    onError(null);

    const result = await listMuxLibraryAction({
      projectId,
      cursor,
    });

    setLoading(false);
    setLoadingMore(false);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    setAssets((current) =>
      append ? [...current, ...result.assets] : result.assets,
    );
    setNextCursor(result.nextCursor);
  }

  async function handleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (!nextOpen || assets.length > 0) {
      return;
    }
    await loadPage(null, false);
  }

  async function handleAttach(asset: MuxLibraryAsset) {
    setPendingAttachId(asset.assetId);
    onError(null);
    onStatus(null);

    const result = await attachMuxAssetAction({
      projectId,
      assetId: asset.assetId,
    });

    setPendingAttachId(null);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    setAssets((current) =>
      current.map((item) =>
        item.assetId === asset.assetId
          ? {
              ...item,
              alreadyOnThisProject: true,
              usedByProjectIds: item.usedByProjectIds.includes(projectId)
                ? item.usedByProjectIds
                : [...item.usedByProjectIds, projectId],
            }
          : item,
      ),
    );
    onStatus("Existing Mux video added to this project.");
    onAttached();
  }

  async function handleHardDelete(asset: MuxLibraryAsset) {
    const usage =
      asset.usedByProjectTitles.length > 0
        ? `\n\nUsed by: ${asset.usedByProjectTitles.join(", ")}`
        : asset.usedByProjectIds.length > 0
          ? `\n\nUsed by ${asset.usedByProjectIds.length} project(s).`
          : "";

    const confirmed = window.confirm(
      [
        `Delete “${asset.title}” from Mux?`,
        "",
        "This permanently removes the asset from Mux. It cannot be undone.",
        "Project records that use this video will also be removed.",
        usage,
      ].join("\n"),
    );
    if (!confirmed) {
      return;
    }

    setPendingDeleteId(asset.assetId);
    onError(null);
    onStatus(null);

    const result = await hardDeleteMuxAssetAction({ assetId: asset.assetId });
    setPendingDeleteId(null);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    setAssets((current) =>
      current.filter((item) => item.assetId !== asset.assetId),
    );
    onStatus("Mux asset deleted.");
    onHardDeleted();
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          void handleOpen();
        }}
        className="text-sm font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-60"
      >
        {open
          ? "Hide Mux library"
          : loading
            ? "Loading Mux library…"
            : "Use existing Mux video"}
      </button>

      {open ? (
        <div className="mt-3 border border-foreground/10 px-3 py-3">
          <p className="text-xs text-foreground/60">
            Videos already in your Mux account. Add one to this project without
            uploading again, or hard-delete it from Mux.
          </p>

          {loading ? (
            <p className="mt-3 text-sm text-foreground/55">Loading…</p>
          ) : assets.length === 0 ? (
            <p className="mt-3 text-sm text-foreground/55">
              No Mux videos found.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {assets.map((asset) => {
                const poster = asset.playbackId
                  ? getMuxPosterUrl(asset.playbackId, { width: 480 })
                  : null;
                const duration = formatDuration(asset.duration);
                const created = formatCreatedAt(asset.createdAt);
                const canAdd =
                  asset.status === "ready" &&
                  Boolean(asset.playbackId) &&
                  !asset.alreadyOnThisProject;

                return (
                  <li
                    key={asset.assetId}
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
                            {asset.status === "ready" ? "No preview" : asset.status}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {asset.title}
                            </p>
                            <p className="mt-1 text-xs text-foreground/55">
                              {[
                                asset.status,
                                duration,
                                created,
                                asset.aspectRatio,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                            {asset.alreadyOnThisProject ? (
                              <p className="mt-1 text-xs text-foreground/55">
                                Already on this project
                              </p>
                            ) : asset.usedByProjectTitles.length > 0 ? (
                              <p className="mt-1 text-xs text-foreground/55">
                                Used by {asset.usedByProjectTitles.join(", ")}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button
                              type="button"
                              disabled={
                                disabled ||
                                !canAdd ||
                                pendingAttachId === asset.assetId
                              }
                              onClick={() => {
                                void handleAttach(asset);
                              }}
                              className={buttonClassName}
                            >
                              {pendingAttachId === asset.assetId
                                ? "Adding…"
                                : asset.alreadyOnThisProject
                                  ? "Added"
                                  : "Add to project"}
                            </button>
                            <button
                              type="button"
                              disabled={
                                disabled || pendingDeleteId === asset.assetId
                              }
                              onClick={() => {
                                void handleHardDelete(asset);
                              }}
                              className={buttonClassName}
                            >
                              {pendingDeleteId === asset.assetId
                                ? "Deleting…"
                                : "Delete from Mux"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {nextCursor ? (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => {
                void loadPage(nextCursor, true);
              }}
              className="mt-3 text-sm font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
