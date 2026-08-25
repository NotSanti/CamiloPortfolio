import Mux from "@mux/mux-node";
import { getMuxTokenId, getMuxTokenSecret } from "@/src/lib/mux/env";

/**
 * Mux Video API client. Server-only — credentials must never reach the browser.
 */
export function createMuxClient(): Mux {
  if (typeof window !== "undefined") {
    throw new Error("createMuxClient() must only be called on the server.");
  }

  return new Mux({
    tokenId: getMuxTokenId(),
    tokenSecret: getMuxTokenSecret(),
  });
}
