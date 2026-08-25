/**
 * Server-only Mux credentials. Never import into Client Components.
 */

export function getMuxTokenId(): string {
  const value = process.env.MUX_TOKEN_ID;
  if (!value) {
    throw new Error(
      "Missing MUX_TOKEN_ID. Copy .env.example to .env.local and add Mux API tokens.",
    );
  }
  return value;
}

export function getMuxTokenSecret(): string {
  const value = process.env.MUX_TOKEN_SECRET;
  if (!value) {
    throw new Error(
      "Missing MUX_TOKEN_SECRET. Copy .env.example to .env.local and add Mux API tokens.",
    );
  }
  return value;
}

/**
 * Signing secret from Mux Dashboard → Settings → Webhooks.
 * Required for POST /api/webhooks/mux.
 */
export function getMuxWebhookSecret(): string {
  const value =
    process.env.MUX_WEBHOOK_SECRET ?? process.env.MUX_WEBHOOK_SIGNING_SECRET;
  if (!value) {
    throw new Error(
      "Missing MUX_WEBHOOK_SECRET. Create a webhook in the Mux dashboard and add the signing secret to .env.local.",
    );
  }
  return value;
}
