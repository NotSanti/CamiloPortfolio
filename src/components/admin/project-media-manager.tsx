"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, type DragEvent, type FormEvent } from "react";
import {
  AdminFeedback,
  AdminFileDropzone,
} from "@/src/components/admin/admin-file-dropzone";
import { getMediaUrl } from "@/src/lib/media";
import {
  deleteGalleryImageAction,
  reorderGalleryImagesAction,
  saveGalleryImageAction,
  setCoverFromGalleryImageAction,
  updateGalleryImageMetaAction,
} from "@/src/services/images/admin-actions";
import {
  uploadProjectImageFile,
  type UploadProgress,
} from "@/src/services/images/upload-client";
import type { ProjectImageRow } from "@/types/database";

type ProjectMediaManagerProps = {
  projectId: string;
  coverImagePath: string | null;
  coverAltText: string | null;
  images: ProjectImageRow[];
};

type MetaDraft = {
  altText: string;
  caption: string;
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

function sortByDisplayOrder(images: ProjectImageRow[]): ProjectImageRow[] {
  return [...images].sort((a, b) => a.display_order - b.display_order);
}

function imagesSignature(images: ProjectImageRow[]): string {
  return sortByDisplayOrder(images)
    .map(
      (image) =>
        `${image.id}:${image.display_order}:${image.alt_text ?? ""}:${image.caption ?? ""}:${image.storage_path}`,
    )
    .join("|");
}

function draftsFromImages(images: ProjectImageRow[]): Record<string, MetaDraft> {
  return Object.fromEntries(
    images.map((image) => [
      image.id,
      {
        altText: image.alt_text ?? "",
        caption: image.caption ?? "",
      },
    ]),
  );
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

export function ProjectMediaManager({
  projectId,
  coverImagePath,
  coverAltText,
  images,
}: ProjectMediaManagerProps) {
  const router = useRouter();
  const [orderedImages, setOrderedImages] = useState(() =>
    sortByDisplayOrder(images),
  );
  const [metaDrafts, setMetaDrafts] = useState(() => draftsFromImages(images));
  const [syncedSignature, setSyncedSignature] = useState(() =>
    imagesSignature(images),
  );
  const [galleryProgress, setGalleryProgress] =
    useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingCoverId, setPendingCoverId] = useState<string | null>(null);
  const [pendingMetaId, setPendingMetaId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextSignature = imagesSignature(images);
  if (nextSignature !== syncedSignature) {
    setSyncedSignature(nextSignature);
    setOrderedImages(sortByDisplayOrder(images));
    setMetaDrafts((current) => {
      const next: Record<string, MetaDraft> = {};
      for (const image of images) {
        const serverDraft = {
          altText: image.alt_text ?? "",
          caption: image.caption ?? "",
        };
        const existing = current[image.id];
        // Keep in-progress edits for rows that still exist and differ from server.
        next[image.id] =
          existing &&
          (existing.altText !== serverDraft.altText ||
            existing.caption !== serverDraft.caption)
            ? existing
            : serverDraft;
      }
      return next;
    });
  }

  const coverSrc = getMediaUrl(coverImagePath);

  function persistOrder(nextImages: ProjectImageRow[]) {
    setOrderedImages(nextImages);
    setError(null);
    setStatusMessage(null);

    startTransition(async () => {
      const result = await reorderGalleryImagesAction({
        projectId,
        orderedImageIds: nextImages.map((image) => image.id),
      });
      if (!result.ok) {
        setError(result.error);
        setOrderedImages(sortByDisplayOrder(images));
        return;
      }
      setStatusMessage("Gallery order saved.");
      router.refresh();
    });
  }

  async function handleGalleryChange(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    setError(null);
    setStatusMessage(null);
    const files = Array.from(fileList);

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setGalleryProgress({
          percent: 0,
          status: "uploading",
        });

        const uploaded = await uploadProjectImageFile({
          projectId,
          file,
          onProgress: (progress) => {
            setGalleryProgress({
              ...progress,
              percent: Math.round(
                ((index + progress.percent / 100) / files.length) * 100,
              ),
            });
          },
        });

        const result = await saveGalleryImageAction({
          projectId,
          storagePath: uploaded.storagePath,
          width: uploaded.width,
          height: uploaded.height,
        });

        if (!result.ok) {
          throw new Error(result.error);
        }
      }

      setGalleryProgress({ percent: 100, status: "done" });
      setStatusMessage(
        files.length === 1
          ? "Image uploaded."
          : `${files.length} images uploaded.`,
      );
      startTransition(() => router.refresh());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gallery upload failed.";
      setError(message);
      setGalleryProgress({ percent: 0, status: "error", error: message });
    }
  }

  function handleSetCover(imageId: string) {
    setPendingCoverId(imageId);
    setError(null);
    setStatusMessage(null);

    startTransition(async () => {
      const result = await setCoverFromGalleryImageAction({
        projectId,
        imageId,
      });
      setPendingCoverId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStatusMessage("Cover updated.");
      router.refresh();
    });
  }

  function handleDelete(imageId: string, alt: string | null) {
    const confirmed = window.confirm(
      `Delete gallery image${alt ? ` “${alt}”` : ""}?`,
    );
    if (!confirmed) return;

    setPendingDeleteId(imageId);
    setError(null);
    setStatusMessage(null);

    startTransition(async () => {
      const result = await deleteGalleryImageAction(imageId);
      setPendingDeleteId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStatusMessage("Image deleted.");
      router.refresh();
    });
  }

  function handleMetaSave(event: FormEvent<HTMLFormElement>, imageId: string) {
    event.preventDefault();
    const draft = metaDrafts[imageId];
    if (!draft) return;

    setPendingMetaId(imageId);
    setError(null);
    setStatusMessage(null);

    startTransition(async () => {
      const result = await updateGalleryImageMetaAction({
        projectId,
        imageId,
        altText: draft.altText,
        caption: draft.caption,
      });
      setPendingMetaId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStatusMessage("Image details saved.");
      router.refresh();
    });
  }

  function handleMove(imageId: string, direction: -1 | 1) {
    const fromIndex = orderedImages.findIndex((image) => image.id === imageId);
    if (fromIndex === -1) return;
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= orderedImages.length) return;
    persistOrder(moveItem(orderedImages, fromIndex, toIndex));
  }

  function handleDragStart(imageId: string) {
    setDraggingId(imageId);
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

    const fromIndex = orderedImages.findIndex(
      (image) => image.id === draggingId,
    );
    const toIndex = orderedImages.findIndex((image) => image.id === targetId);
    setDraggingId(null);
    if (fromIndex === -1 || toIndex === -1) return;
    persistOrder(moveItem(orderedImages, fromIndex, toIndex));
  }

  return (
    <section className="mt-12 space-y-10 border-t border-foreground/10 pt-10">
      <div>
        <h2 className="text-lg font-bold uppercase text-accent">Cover image</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Choose a cover from the gallery below. The first uploaded image is
          used automatically if none is set.
        </p>

        <div className="relative mt-4 aspect-[4/5] w-full max-w-[200px] overflow-hidden bg-media-placeholder">
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt={coverAltText || "Project cover"}
              fill
              className="object-cover"
              sizes="200px"
            />
          ) : (
            <span className="flex size-full flex-col items-center justify-center gap-1 px-3 text-center text-xs uppercase text-foreground/40">
              <span>No cover yet</span>
              <span className="normal-case text-[10px] tracking-normal">
                Upload images below, then Set as cover
              </span>
            </span>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold uppercase text-accent">Gallery</h2>
        <p className="mt-1 text-sm text-foreground/60">
          JPEG, PNG, or WebP · up to 50 MB. Drag thumbnails (or use Move) to
          reorder. Edit alt text and captions per image.
        </p>

        <div className="mt-4">
          <AdminFileDropzone
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={
              galleryProgress?.status === "uploading" ||
              galleryProgress?.status === "saving"
            }
            label="Drop images here or click to upload"
            hint="You can select several files at once."
            onFiles={(files) => {
              void handleGalleryChange(files);
            }}
          >
            <ProgressBar progress={galleryProgress} />
          </AdminFileDropzone>
        </div>

        <AdminFeedback status={statusMessage} error={error} />

        {orderedImages.length === 0 ? (
          <div className="mt-6 border border-dashed border-foreground/15 px-4 py-8 text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-foreground/60">
              Gallery is empty
            </p>
            <p className="mt-2 text-sm normal-case text-foreground/50">
              Drop photos above. The first upload becomes the cover if none is
              set.
            </p>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {orderedImages.map((image, index) => {
              const src = getMediaUrl(image.storage_path);
              const isCover = image.storage_path === coverImagePath;
              const draft = metaDrafts[image.id] ?? {
                altText: image.alt_text ?? "",
                caption: image.caption ?? "",
              };
              const metaDirty =
                draft.altText !== (image.alt_text ?? "") ||
                draft.caption !== (image.caption ?? "");

              return (
                <li
                  key={image.id}
                  draggable
                  onDragStart={() => handleDragStart(image.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(image.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={`border ${
                    isCover ? "border-accent" : "border-foreground/10"
                  } ${draggingId === image.id ? "opacity-60" : ""}`}
                >
                  <div className="relative aspect-[4/3] bg-media-placeholder">
                    {src ? (
                      <Image
                        src={src}
                        alt={draft.altText || image.alt_text || ""}
                        fill
                        className="pointer-events-none object-cover"
                        sizes="320px"
                        draggable={false}
                      />
                    ) : null}
                    {isCover ? (
                      <span className="absolute left-2 top-2 bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase text-background">
                        Cover
                      </span>
                    ) : null}
                    <span className="absolute right-2 top-2 bg-background/85 px-1.5 py-0.5 text-[9px] font-medium uppercase text-foreground/70">
                      Drag to reorder
                    </span>
                  </div>

                  <div className="space-y-3 px-3 py-3">
                    <div className="flex flex-wrap gap-3">
                      {!isCover ? (
                        <button
                          type="button"
                          disabled={isPending && pendingCoverId === image.id}
                          onClick={() => handleSetCover(image.id)}
                          className="text-[10px] font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-60"
                        >
                          {pendingCoverId === image.id ? "…" : "Set as cover"}
                        </button>
                      ) : (
                        <span className="text-[10px] font-medium uppercase text-foreground/50">
                          Current cover
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={index === 0 || isPending}
                        onClick={() => handleMove(image.id, -1)}
                        className="text-[10px] font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-40"
                      >
                        Move up
                      </button>
                      <button
                        type="button"
                        disabled={
                          index === orderedImages.length - 1 || isPending
                        }
                        onClick={() => handleMove(image.id, 1)}
                        className="text-[10px] font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-40"
                      >
                        Move down
                      </button>
                      <button
                        type="button"
                        disabled={isPending && pendingDeleteId === image.id}
                        onClick={() => handleDelete(image.id, image.alt_text)}
                        className="text-[10px] font-medium uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-60"
                      >
                        {pendingDeleteId === image.id ? "…" : "Delete"}
                      </button>
                    </div>

                    <form
                      onSubmit={(event) => handleMetaSave(event, image.id)}
                      className="space-y-2"
                    >
                      <label className="flex flex-col gap-1 text-[10px] font-medium uppercase text-accent">
                        Alt text
                        <input
                          type="text"
                          value={draft.altText}
                          onChange={(event) =>
                            setMetaDrafts((current) => ({
                              ...current,
                              [image.id]: {
                                ...draft,
                                altText: event.target.value,
                              },
                            }))
                          }
                          className="border border-foreground/20 bg-background px-2 py-1.5 text-sm font-normal normal-case text-foreground outline-none focus-visible:border-accent"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-[10px] font-medium uppercase text-accent">
                        Caption
                        <textarea
                          value={draft.caption}
                          rows={2}
                          onChange={(event) =>
                            setMetaDrafts((current) => ({
                              ...current,
                              [image.id]: {
                                ...draft,
                                caption: event.target.value,
                              },
                            }))
                          }
                          className="resize-y border border-foreground/20 bg-background px-2 py-1.5 text-sm font-normal normal-case text-foreground outline-none focus-visible:border-accent"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={
                          !metaDirty ||
                          (isPending && pendingMetaId === image.id)
                        }
                        className="text-[10px] font-bold uppercase text-accent transition-opacity hover:opacity-70 disabled:opacity-40"
                      >
                        {pendingMetaId === image.id
                          ? "Saving…"
                          : "Save details"}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
