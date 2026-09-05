import { describe, expect, it } from "vitest";
import { securityHeaders } from "@/src/lib/security/headers";

describe("securityHeaders", () => {
  const keys = securityHeaders.map((header) => header.key);

  it("sets standard defense-in-depth headers", () => {
    expect(keys).toContain("Content-Security-Policy");
    expect(keys).toContain("X-Content-Type-Options");
    expect(keys).toContain("Referrer-Policy");
    expect(keys).toContain("Permissions-Policy");
    expect(keys).toContain("Strict-Transport-Security");
  });

  it("does not allow script-src *", () => {
    const csp = securityHeaders.find(
      (header) => header.key === "Content-Security-Policy",
    )?.value;
    expect(csp).toBeTruthy();
    expect(csp).not.toMatch(/script-src\s+\*/);
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
