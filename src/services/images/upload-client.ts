import { createClient } from "@/src/lib/supabase/client";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/src/lib/supabase/env";
import {
  PORTFOLIO_MEDIA_BUCKET,
  sanitizeFileName,
  validateImageFile,
} from "@/src/lib/media";

export type UploadProgress = {
  percent: number;
  status: "uploading" | "saving" | "done" | "error";
  error?: string;
};

function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    image.src = url;
  });
}

function uploadWithProgress(
  file: File,
  objectPath: string,
  accessToken: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  const base = getSupabaseUrl();
  const url = `${base}/storage/v1/object/${PORTFOLIO_MEDIA_BUCKET}/${objectPath}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", getSupabaseAnonKey());
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(xhr.responseText || `Upload failed (${xhr.status}).`));
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(file);
  });
}

async function requireUploadSession(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be signed in to upload.");
  }

  return session.access_token;
}

async function uploadImageToStorage(input: {
  file: File;
  storagePath: string;
  onProgress?: (progress: UploadProgress) => void;
}): Promise<{
  storagePath: string;
  width: number | null;
  height: number | null;
}> {
  const validationError = validateImageFile(input.file);
  if (validationError) {
    throw new Error(validationError);
  }

  const accessToken = await requireUploadSession();

  input.onProgress?.({ percent: 0, status: "uploading" });

  await uploadWithProgress(
    input.file,
    input.storagePath,
    accessToken,
    (percent) => {
      input.onProgress?.({ percent, status: "uploading" });
    },
  );

  input.onProgress?.({ percent: 100, status: "saving" });

  const dimensions = await readImageDimensions(input.file);

  return {
    storagePath: input.storagePath,
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
  };
}

export async function uploadProjectImageFile(input: {
  projectId: string;
  file: File;
  onProgress?: (progress: UploadProgress) => void;
}): Promise<{
  storagePath: string;
  width: number | null;
  height: number | null;
}> {
  const safeName = sanitizeFileName(input.file.name) || "image.jpg";
  const storagePath = `projects/${input.projectId}/gallery/${crypto.randomUUID()}-${safeName}`;

  return uploadImageToStorage({
    file: input.file,
    storagePath,
    onProgress: input.onProgress,
  });
}

export async function uploadSitePortraitFile(input: {
  file: File;
  onProgress?: (progress: UploadProgress) => void;
}): Promise<{
  storagePath: string;
  width: number | null;
  height: number | null;
}> {
  const safeName = sanitizeFileName(input.file.name) || "portrait.jpg";
  const storagePath = `site/portrait/${crypto.randomUUID()}-${safeName}`;

  return uploadImageToStorage({
    file: input.file,
    storagePath,
    onProgress: input.onProgress,
  });
}
