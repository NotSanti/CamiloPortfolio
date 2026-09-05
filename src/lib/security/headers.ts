function supabaseHostname(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

export function contentSecurityPolicy(): string {
  const supabaseHost = supabaseHostname();
  const supabaseHttps = supabaseHost
    ? `https://${supabaseHost}`
    : "https://*.supabase.co";
  const supabaseWss = supabaseHost
    ? `wss://${supabaseHost}`
    : "wss://*.supabase.co";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabaseHttps} https://image.mux.com`,
    "font-src 'self'",
    "media-src 'self' blob: https://stream.mux.com https://*.mux.com",
    `connect-src 'self' ${supabaseHttps} ${supabaseWss} https://*.mux.com https://inferred.mux.com https://image.mux.com https://stream.mux.com https://va.vercel-scripts.com https://vitals.vercel-insights.com`,
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join("; ");
}

export const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
];
