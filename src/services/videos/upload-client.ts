import { createUpload } from "@mux/upchunk";
import { validateVideoFile } from "@/src/lib/video";
import { updateVideoStatusAction } from "@/src/services/videos/admin-actions";

export type VideoUploadProgress = {
  percent: number;
  phase: "requesting" | "uploading" | "processing" | "done" | "error";
  error?: string;
  videoId?: string;
};

type DirectUploadResponse =
  | { videoId: string; uploadUrl: string }
  | { error: string };

async function requestDirectUpload(input: {
  projectId: string;
  title: string;
}): Promise<{ videoId: string; uploadUrl: string }> {
  const response = await fetch("/api/mux/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: input.projectId,
      title: input.title,
      corsOrigin: window.location.origin,
    }),
  });

  const payload = (await response.json()) as DirectUploadResponse;

  if (!response.ok || !("uploadUrl" in payload)) {
    throw new Error(
      "error" in payload ? payload.error : `Upload request failed (${response.status}).`,
    );
  }

  return payload;
}

function uploadFileToMux(
  uploadUrl: string,
  file: File,
  onPercent: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const upload = createUpload({
      endpoint: uploadUrl,
      file,
      // ~5 MB chunks — Mux-recommended default for resumable direct uploads.
      chunkSize: 5120,
    });

    upload.on("error", (event) => {
      const detail = (event as { detail?: unknown }).detail;
      const message =
        typeof detail === "string"
          ? detail
          : detail &&
              typeof detail === "object" &&
              "message" in detail &&
              typeof (detail as { message: unknown }).message === "string"
            ? (detail as { message: string }).message
            : "Mux upload failed.";
      reject(new Error(message));
    });

    upload.on("progress", (event) => {
      const detail = (event as { detail?: unknown }).detail;
      const percent = typeof detail === "number" ? detail : 0;
      onPercent(Math.max(0, Math.min(100, Math.round(percent))));
    });

    upload.on("success", () => {
      resolve();
    });
  });
}

/**
 * Request a Mux direct-upload URL, PUT the file from the browser (via UpChunk),
 * then mark the local row as processing. Never sends the file through Next.js.
 */
export async function uploadProjectVideoFile(input: {
  projectId: string;
  file: File;
  onProgress?: (progress: VideoUploadProgress) => void;
}): Promise<{ videoId: string }> {
  const validationError = validateVideoFile(input.file);
  if (validationError) {
    throw new Error(validationError);
  }

  input.onProgress?.({ percent: 0, phase: "requesting" });

  const { videoId, uploadUrl } = await requestDirectUpload({
    projectId: input.projectId,
    title: input.file.name,
  });

  const uploading = await updateVideoStatusAction({
    videoId,
    status: "uploading",
  });
  if (!uploading.ok) {
    throw new Error(uploading.error);
  }

  input.onProgress?.({ percent: 0, phase: "uploading", videoId });

  try {
    await uploadFileToMux(uploadUrl, input.file, (percent) => {
      input.onProgress?.({ percent, phase: "uploading", videoId });
    });
  } catch (err) {
    await updateVideoStatusAction({ videoId, status: "errored" });
    throw err;
  }

  input.onProgress?.({ percent: 100, phase: "processing", videoId });

  const processing = await updateVideoStatusAction({
    videoId,
    status: "processing",
  });
  if (!processing.ok) {
    throw new Error(processing.error);
  }

  input.onProgress?.({ percent: 100, phase: "done", videoId });
  return { videoId };
}
