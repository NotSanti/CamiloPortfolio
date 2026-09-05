import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("@/src/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from,
  })),
}));

import {
  AdminAuthError,
  isListedAdmin,
  requireAdminClient,
} from "@/src/lib/auth/require-admin";

describe("isListedAdmin", () => {
  it("rejects missing membership", () => {
    expect(isListedAdmin(null, "user-1")).toBe(false);
  });

  it("rejects a row for a different user", () => {
    expect(isListedAdmin({ user_id: "other" }, "user-1")).toBe(false);
  });

  it("accepts an explicit admin row", () => {
    expect(isListedAdmin({ user_id: "user-1" }, "user-1")).toBe(true);
  });
});

describe("requireAdminClient", () => {
  beforeEach(() => {
    getUser.mockReset();
    maybeSingle.mockReset();
    eq.mockClear();
    select.mockClear();
    from.mockClear();
  });

  it("rejects anonymous callers", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    await expect(requireAdminClient()).rejects.toMatchObject({
      status: 401,
    } satisfies Partial<AdminAuthError>);
  });

  it("rejects authenticated non-admin users", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(requireAdminClient()).rejects.toMatchObject({ status: 403 });
    expect(from).toHaveBeenCalledWith("admin_users");
  });

  it("allows an explicit admin", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    maybeSingle.mockResolvedValue({
      data: { user_id: "user-1" },
      error: null,
    });

    const result = await requireAdminClient();
    expect(result.user.id).toBe("user-1");
    expect(result.supabase).toBeDefined();
  });
});
