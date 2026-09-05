import { describe, expect, it } from "vitest";
import {
  isAllowedMuxCorsOrigin,
  isUuid,
  publicErrorMessage,
} from "@/src/lib/security/mux-upload";

describe("isUuid", () => {
  it("accepts canonical UUIDs", () => {
    expect(isUuid("00000000-0000-4000-8000-000000000001")).toBe(true);
  });

  it("rejects malformed ids", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("")).toBe(false);
  });
});

describe("isAllowedMuxCorsOrigin", () => {
  it("allows production site origins", () => {
    expect(
      isAllowedMuxCorsOrigin("https://www.caloid.com", { nodeEnv: "production" }),
    ).toBe(true);
  });

  it("rejects hostile origins", () => {
    expect(
      isAllowedMuxCorsOrigin("https://evil.example", { nodeEnv: "production" }),
    ).toBe(false);
    expect(isAllowedMuxCorsOrigin("javascript:alert(1)")).toBe(false);
    expect(isAllowedMuxCorsOrigin("https://www.caloid.com.evil.example")).toBe(
      false,
    );
  });

  it("allows configured local site URL in development", () => {
    expect(
      isAllowedMuxCorsOrigin("http://localhost:3000", {
        siteUrl: "http://localhost:3000",
        nodeEnv: "development",
      }),
    ).toBe(true);
  });

  it("rejects localhost in production", () => {
    expect(
      isAllowedMuxCorsOrigin("http://localhost:3000", {
        siteUrl: "http://localhost:3000",
        nodeEnv: "production",
      }),
    ).toBe(false);
  });
});

describe("publicErrorMessage", () => {
  it("does not return Mux secret env names", () => {
    const result = publicErrorMessage(
      new Error("Missing MUX_TOKEN_SECRET"),
      "Failed to create Mux upload.",
    );
    expect(result.missingMuxCreds).toBe(true);
    expect(result.message).not.toMatch(/MUX_TOKEN/);
  });
});
