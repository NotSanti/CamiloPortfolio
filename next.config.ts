import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep PostCSS/Turbopack workers inside this app. A parent lockfile can
  // make Turbopack treat a wider folder as the workspace root and spawn
  // unbounded Node evaluate processes (multi-GB RAM).
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 80, 85, 90],
    imageSizes: [256, 384],
    deviceSizes: [640, 1080, 1920],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "image.mux.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
