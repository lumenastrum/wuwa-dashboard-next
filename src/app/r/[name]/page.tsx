import { promises as fs } from "fs";
import path from "path";
import type { DashboardData } from "@/lib/types";
import { ResonatorRoute } from "./client";
import { routeName } from "@/lib/route-name";

// Pre-render every resonator at build time from public/data.json.
// New resonators added later via the CLI / edit mode need a rebuild + push
// to get their own static page (otherwise their /r/{name} 404s on GH Pages).
export async function generateStaticParams() {
  // cwd is the repo under `next build`, but the workspace root when the dev
  // server is launched via the shared .claude/launch.json — try both.
  const roots = [
    process.cwd(),
    path.join(process.cwd(), "Gacha Dashboards", "wuwa-dashboard-next"),
  ];
  const file = await roots
    .reduce<Promise<string>>(
      (p, root) =>
        p.catch(() => fs.readFile(path.join(root, "public", "data.json"), "utf-8")),
      Promise.reject(),
    );
  const data = JSON.parse(file) as DashboardData;
  const names = data.resonators.map((r) => routeName(r.name));
  // The dev server matches the param against the URL-encoded segment (page.tsx
  // decodes it for display), so multi-word names need their encoded twin too.
  // Production builds keep raw names only — out/r/<name>/ stays clean.
  if (process.env.NODE_ENV !== "production") {
    for (const n of [...names]) {
      const enc = encodeURIComponent(n);
      if (enc !== n) names.push(enc);
    }
  }
  return names.map((name) => ({ name }));
}

export default async function ResonatorPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return <ResonatorRoute name={decodeURIComponent(name)} />;
}
