// Mirrors `basePath` in next.config.ts.
// Plain `<img>` tags + fetch() calls don't get Next's auto-prefixing,
// so any path that lands in those needs to be prefixed manually.
// process.env.NODE_ENV is inlined at build time by Next.
export const BASE_PATH = process.env.NODE_ENV === "production" ? "/wuwa-dashboard-next" : "";

export function withBase(path: string): string {
  if (!path) return BASE_PATH;
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
