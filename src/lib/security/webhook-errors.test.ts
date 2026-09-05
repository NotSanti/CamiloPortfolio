import { describe, expect, it } from "vitest";
import { webhookClientError } from "@/src/lib/security/webhook-errors";

describe("webhookClientError", () => {
  it("does not mention env var names or stack details", () => {
    expect(webhookClientError("unconfigured")).not.toMatch(/MUX_|SECRET|stack/i);
    expect(webhookClientError("invalid_signature")).not.toMatch(/MUX_|SECRET/i);
    expect(webhookClientError("processing")).not.toMatch(/postgres|sql/i);
  });
});
