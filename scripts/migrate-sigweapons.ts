#!/usr/bin/env node
/**
 * One-time migration: seed the `signatureWeapons` collection into the live
 * Supabase row. Backs the row up to ./backups/ first, then adds a blank stub
 * for every resonator's weapon that doesn't have one yet (idempotent — safe to
 * re-run; it never overwrites filled-in entries).
 *
 * Run:  npx tsx scripts/migrate-sigweapons.ts
 */

import { createClient } from "@supabase/supabase-js";
import { serviceKey } from "./service-key";
import { mkdirSync, writeFileSync } from "fs";

const SUPABASE_URL = "https://ayhrqkxdeecybjhmgdoq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5aHJxa3hkZWVjeWJqaG1nZG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTI0NjcsImV4cCI6MjA5Mzg2ODQ2N30.GN-y9xEyNfQUVUXCqOGJC5cpN35X7B8PpOlFJPn10A8";
const SUPABASE_TABLE = "dashboard_profiles";
const PROFILE_KEY = "andres-wuwa";

interface Stub {
  name: string;
  type: string;
  wearer: string;
  baseAtk: string;
  mainStat: string;
  mainStatValue: string;
  passiveName: string;
  passive: string;
  synergy: string;
}

async function main() {
  const supabase = createClient(SUPABASE_URL, serviceKey());

  const { data: row, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("data")
    .eq("profile", PROFILE_KEY)
    .maybeSingle();
  if (error) throw error;
  if (!row?.data) throw new Error(`No row for profile "${PROFILE_KEY}". Open the dashboard once to seed it.`);

  const data = row.data as {
    resonators: { name: string; weapon: string; weaponType: string }[];
    signatureWeapons?: Stub[];
    meta: { updated: string; [k: string]: unknown };
    [k: string]: unknown;
  };

  // 1. Backup the live row, untouched, before doing anything.
  mkdirSync("backups", { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `backups/${PROFILE_KEY}-${stamp}.json`;
  writeFileSync(backupPath, JSON.stringify(row.data, null, 2));
  console.log(`✓ backed up live row → ${backupPath}`);

  // 2. Additively seed stubs (never clobber filled entries).
  if (!Array.isArray(data.signatureWeapons)) data.signatureWeapons = [];
  const known = new Set(data.signatureWeapons.map((w) => w.name));
  let added = 0;
  for (const r of data.resonators) {
    if (r.weapon && !known.has(r.weapon)) {
      data.signatureWeapons.push({
        name: r.weapon,
        type: r.weaponType ?? "",
        wearer: r.name,
        baseAtk: "",
        mainStat: "",
        mainStatValue: "",
        passiveName: "",
        passive: "",
        synergy: "",
      });
      known.add(r.weapon);
      added++;
    }
  }

  if (added === 0) {
    console.log("Nothing to add — every weapon already has an entry. (no write)");
    return;
  }

  // 3. Upsert.
  const { error: saveError } = await supabase
    .from(SUPABASE_TABLE)
    .upsert(
      { profile: PROFILE_KEY, data, updated_at: new Date().toISOString() },
      { onConflict: "profile" },
    );
  if (saveError) throw saveError;
  console.log(`✓ seeded ${added} blank signature-weapon stub(s) into Supabase (profile=${PROFILE_KEY})`);
  console.log(`  total entries: ${data.signatureWeapons.length}`);
  console.log(`  fill them with:  npm run update -- sigweapon "<weapon>" passive "..."`);
}

main().catch((e) => {
  console.error("✕", e instanceof Error ? e.message : e);
  process.exit(1);
});
