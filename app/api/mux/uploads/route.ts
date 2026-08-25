import { NextResponse } from "next/server";
import { createProjectVideoDirectUpload } from "@/src/services/videos/create-direct-upload";

export const runtime = "nodejs";

type RequestBody = {
  projectId?: unknown;
  title?: unknown;
  corsOrigin?: unknown;
};

function resolveCorsOrigin(
  request: Request,
  bodyOrigin: string | null,
): string | null {
  if (bodyOrigin) return bodyOrigin;

  const headerOrigin = request.headers.get("origin");
  if (headerOrigin) return headerOrigin;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (siteUrl) return siteUrl;

  return null;
}

/**
 * POST /api/mux/uploads
 *
 * Authenticated CMS users only. Creates a `project_videos` row and a Mux
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
  const title = typeof body.title === "string" ? body.title : null;
  const bodyCorsOrigin =
    typeof body.corsOrigin === "string" ? body.corsOrigin.trim() : null;
  const corsOrigin = resolveCorsOrigin(request, bodyCorsOrigin);

  if (!corsOrigin) {
    return NextResponse.json(
      {
        error:
          "Missing Origin. Send corsOrigin in the body or set NEXT_PUBLIC_SITE_URL.",
      },
      { status: 400 },
    );
  }

  const result = await createProjectVideoDirectUpload({
    projectId,
    corsOrigin,
    title,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      videoId: result.videoId,
      uploadUrl: result.uploadUrl,
    },
    { status: 201 },
  );
}
