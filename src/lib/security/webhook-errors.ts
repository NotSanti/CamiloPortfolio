export function webhookClientError(
  kind: "unconfigured" | "invalid_signature" | "processing",
): string {
  switch (kind) {
    case "unconfigured":
      return "Webhook is not configured.";
    case "invalid_signature":
      return "Invalid webhook signature.";
    default:
      return "Failed to process webhook.";
  }
}
