import { beforeEach, describe, expect, it, vi } from "vitest";

const { createProjectVideoDirectUpload } = vi.hoisted(() => ({
  createProjectVideoDirectUpload: vi.fn(),
}));

vi.mock("@/src/services/videos/create-direct-upload", () => ({
  createProjectVideoDirectUpload,
}));

import { POST } from "@/app/api/mux/uploads/route";

function jsonRequest(body: unknown, origin?: string): Request {
  return new Request("http://localhost:3000/api/mux/uploads", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/mux/uploads", () => {
  beforeEach(() => {
    createProjectVideoDirectUpload.mockReset();
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.caloid.com";
  });

  it("rejects invalid JSON", async () => {
    const request = new Request("http://localhost:3000/api/mux/uploads", {
      method: "POST",
      body: "{",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(createProjectVideoDirectUpload).not.toHaveBeenCalled();
  });

  it("rejects an invalid project ID before calling Mux", async () => {
    const response = await POST(
      jsonRequest(
        { projectId: "not-a-uuid", corsOrigin: "https://www.caloid.com" },
        "https://www.caloid.com",
      ),
    );
    expect(response.status).toBe(400);
    expect(createProjectVideoDirectUpload).not.toHaveBeenCalled();
  });

  it("rejects a hostile origin", async () => {
    const response = await POST(
      jsonRequest(
        {
          projectId: "00000000-0000-4000-8000-000000000001",
          corsOrigin: "https://evil.example",
        },
        "https://evil.example",
      ),
    );
    expect(response.status).toBe(400);
    expect(createProjectVideoDirectUpload).not.toHaveBeenCalled();
  });

  it("creates an upload for an allowlisted origin", async () => {
    createProjectVideoDirectUpload.mockResolvedValue({
      ok: true,
      videoId: "video-1",
      uploadUrl: "https://storage.googleapis.com/mux-example",
      muxUploadId: "upload-1",
    });

    const response = await POST(
      jsonRequest(
        { projectId: "00000000-0000-4000-8000-000000000001" },
        "https://www.caloid.com",
      ),
    );

    expect(response.status).toBe(201);
    expect(createProjectVideoDirectUpload).toHaveBeenCalledWith({
      projectId: "00000000-0000-4000-8000-000000000001",
      corsOrigin: "https://www.caloid.com",
      title: null,
    });
  });
});
