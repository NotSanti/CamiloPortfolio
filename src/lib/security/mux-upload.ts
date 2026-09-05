const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

const PRODUCTION_MUX_ORIGINS = [
  "https://www.caloid.com",
  "https://caloid.com",
] as const;

function isLoopbackHttpOrigin(url: URL): boolean {
  return (
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  );
}

export function isAllowedMuxCorsOrigin(
  origin: string,
  options?: {
    siteUrl?: string | null;
    nodeEnv?: string | null;
  },
): boolean {
  const trimmed = origin.trim();
  if (!trimmed) return false;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (parsed.username || parsed.password) return false;
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

  const nodeEnv = options?.nodeEnv ?? process.env.NODE_ENV;
  if (parsed.protocol === "http:" && !isLoopbackHttpOrigin(parsed)) {
    return false;
  }
  if (parsed.protocol === "http:" && nodeEnv === "production") {
    return false;
  }

  const allowed = new Set<string>(PRODUCTION_MUX_ORIGINS);
  const siteUrl = options?.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      allowed.add(new URL(siteUrl).origin);
    } catch {
      // ignore malformed site URL
    }
  }

  return allowed.has(parsed.origin);
}

export function publicErrorMessage(
  err: unknown,
  fallback: string,
): { message: string; missingMuxCreds: boolean } {
  const raw = err instanceof Error ? err.message : fallback;
  const missingMuxCreds =
    raw.includes("MUX_TOKEN_ID") || raw.includes("MUX_TOKEN_SECRET");
  return {
    message: missingMuxCreds ? "Video uploads are temporarily unavailable." : fallback,
    missingMuxCreds,
  };
}
