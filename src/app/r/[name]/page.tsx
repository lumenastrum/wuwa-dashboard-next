import { promises as fs } from "fs";
import path from "path";
import type { DashboardData } from "@/lib/types";
import { ResonatorRoute } from "./client";

// Pre-render every resonator at build time from public/data.json.
// New resonators added later via the CLI / edit mode need a rebuild + push
// to get their own static page (otherwise their /r/{name} 404s on GH Pages).
export async function generateStaticParams() {
  const file = await fs.readFile(
    path.join(process.cwd(), "public", "data.json"),
    "utf-8",
  );
  const data = JSON.parse(file) as DashboardData;
  return data.resonators.map((r) => ({ name: r.name }));
}

export default async function ResonatorPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return <ResonatorRoute name={decodeURIComponent(name)} />;
}
