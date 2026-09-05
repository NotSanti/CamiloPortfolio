import path from "node:path";
import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security/headers";

function supabaseHostname(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const supabaseHost = supabaseHostname();

const supabaseRemotePatterns = supabaseHost
  ? [
      {
        protocol: "https" as const,
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https" as const,
        hostname: supabaseHost,
        pathname: "/storage/v1/render/image/public/**",
      },
    ]
  : [
      {
        protocol: "https" as const,
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ];

const nextConfig: NextConfig = {
  // Keep PostCSS/Turbopack workers inside this app. A parent lockfile can
  // make Turbopack treat a wider folder as the workspace root and spawn
  // unbounded Node evaluate processes (multi-GB RAM).
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 80, 85, 90],
    imageSizes: [256, 384],
    deviceSizes: [640, 1080, 1920],
    remotePatterns: [
      ...supabaseRemotePatterns,
      {
        protocol: "https",
        hostname: "image.mux.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
