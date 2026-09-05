import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import {
  getMuxTokenId,
  getMuxTokenSecret,
  getMuxWebhookSecret,
} from "@/src/lib/mux/env";
import { webhookClientError } from "@/src/lib/security/webhook-errors";
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
  } catch {
    return NextResponse.json(
      { error: webhookClientError("unconfigured") },
      { status: 503 },
    );
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
  } catch {
    return NextResponse.json(
      { error: webhookClientError("invalid_signature") },
      { status: 401 },
    );
  }

  try {
    const result = await handleMuxWebhookEvent(event);
    return NextResponse.json({
      received: true,
      type: event.type,
      ...result,
    });
  } catch {
    return NextResponse.json(
      { error: webhookClientError("processing") },
      { status: 500 },
    );
  }
}
