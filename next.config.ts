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
};

export default nextConfig;
