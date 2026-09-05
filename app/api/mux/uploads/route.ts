import { NextResponse } from "next/server";
import { isAllowedMuxCorsOrigin, isUuid } from "@/src/lib/security/mux-upload";
import { createProjectVideoDirectUpload } from "@/src/services/videos/create-direct-upload";

export const runtime = "nodejs";

type RequestBody = {
  projectId?: unknown;
  title?: unknown;
  corsOrigin?: unknown;
};

const TITLE_MAX = 200;

function pickAllowedCorsOrigin(
  request: Request,
  bodyOrigin: string | null,
): string | null {
  const headerOrigin = request.headers.get("origin");
  if (headerOrigin) {
    return isAllowedMuxCorsOrigin(headerOrigin)
      ? new URL(headerOrigin).origin
      : null;
  }

  if (bodyOrigin && isAllowedMuxCorsOrigin(bodyOrigin)) {
    return new URL(bodyOrigin).origin;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? null;
  if (siteUrl && isAllowedMuxCorsOrigin(siteUrl)) {
    return new URL(siteUrl).origin;
  }

  return null;
}

/**
 * POST /api/mux/uploads
 *
 * CMS administrators only. Creates a `project_videos` row and a Mux
 * direct-upload URL. Does not accept the video file body — the browser uploads
 * directly to Mux.
 */
export async function POST(request: Request) {
  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const projectId =
    typeof body.projectId === "string" ? body.projectId.trim() : "";
  const title =
    typeof body.title === "string" ? body.title.slice(0, TITLE_MAX) : null;
  const bodyCorsOrigin =
    typeof body.corsOrigin === "string" ? body.corsOrigin.trim() : null;

  if (!projectId || !isUuid(projectId)) {
    return NextResponse.json({ error: "Invalid project ID." }, { status: 400 });
  }

  const corsOrigin = pickAllowedCorsOrigin(request, bodyCorsOrigin);
  if (!corsOrigin) {
    return NextResponse.json(
      { error: "Origin is not allowed." },
      { status: 400 },
    );
  }

  const result = await createProjectVideoDirectUpload({
    projectId,
    corsOrigin,
    title,
  });

  if (!result.ok) {
    const response = NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
    if (result.status === 429) {
      response.headers.set("Retry-After", "60");
    }
    return response;
  }

  return NextResponse.json(
    {
      videoId: result.videoId,
      uploadUrl: result.uploadUrl,
    },
    { status: 201 },
  );
}
