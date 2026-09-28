import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Repo name — surfaces in the GH Pages URL: lumenastrum.github.io/<repo>/.
// Set basePath only in prod so `npm run dev` stays at http://localhost:3000/.
const REPO = "wuwa-dashboard-next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? `/${REPO}` : "",
  assetPrefix: isProd ? `/${REPO}/` : "",
  trailingSlash: true,
  images: { unoptimized: true },
  // No persistent Turbopack dev cache: a stale one restored after a crash leaks a postcss
  // worker pool per re-run (vercel/next.js#92978) and fork-stormed this box on 2026-09-28.
  experimental: { turbopackFileSystemCacheForDev: false },
};

export default nextConfig;
