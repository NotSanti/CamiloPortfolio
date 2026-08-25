import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import {
  getMuxTokenId,
  getMuxTokenSecret,
  getMuxWebhookSecret,
} from "@/src/lib/mux/env";
import { handleMuxWebhookEvent } from "@/src/services/videos/handle-mux-webhook";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/mux
 *
 * Mux → app sync for upload/asset lifecycle. Signature must verify.
 * Uses the service-role Supabase client (no user session on webhooks).
 */
export async function POST(request: Request) {
  let webhookSecret: string;
  try {
    webhookSecret = getMuxWebhookSecret();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook secret missing.";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const rawBody = await request.text();

  let event: Mux.Webhooks.UnwrapWebhookEvent;
  try {
    const mux = new Mux({
      tokenId: getMuxTokenId(),
      tokenSecret: getMuxTokenSecret(),
      webhookSecret,
    });
    event = await mux.webhooks.unwrap(rawBody, request.headers);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  try {
    const result = await handleMuxWebhookEvent(event);
    return NextResponse.json({
      received: true,
      type: event.type,
      ...result,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to process webhook.";
    // 500 so Mux retries transient DB failures.
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
