/**
 * Service-role key loader for the CLI scripts.
 *
 * Since the 2026-07-07 lockdown, `dashboard_profiles` is read-only for the anon
 * key (RLS): browser edits ride Andres's signed-in session, and the CLI rides
 * the service key, which lives in the gitignored `.env` at the repo root.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function serviceKey(): string {
  const fromEnv = process.env.SUPABASE_SERVICE_KEY;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  try {
    const envFile = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    const m = envFile.match(/^SUPABASE_SERVICE_KEY=(.+)$/m);
    if (m) return m[1].trim();
  } catch {
    /* fall through to the error below */
  }
  throw new Error(
    "SUPABASE_SERVICE_KEY not found — writes need it since the 2026-07-07 RLS lockdown.\n" +
      "Put it in a `.env` file at the repo root (gitignored):\n" +
      "  SUPABASE_SERVICE_KEY=<Supabase → Project Settings → API → service_role>",
  );
}
