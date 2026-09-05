import { describe, expect, it } from "vitest";
import { safeAdminNextPath } from "@/src/lib/security/safe-next-path";

describe("safeAdminNextPath", () => {
  it("allows internal admin paths", () => {
    expect(safeAdminNextPath("/admin/projects")).toBe("/admin/projects");
    expect(safeAdminNextPath("/admin/projects/abc")).toBe("/admin/projects/abc");
  });

  it("rejects protocol-relative and encoded open redirects", () => {
    expect(safeAdminNextPath("//evil.example")).toBe("/admin/projects");
    expect(safeAdminNextPath("https://evil.example")).toBe("/admin/projects");
    expect(safeAdminNextPath("/admin/%2f%2fevil.example")).toBe(
      "/admin/projects",
    );
    expect(safeAdminNextPath("/admin\\evil")).toBe("/admin/projects");
  });
});
