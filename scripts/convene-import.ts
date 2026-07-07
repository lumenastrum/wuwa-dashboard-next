#!/usr/bin/env node
/**
 * Historical convene import — graft pre-window pull history from an old tracker
 * export into the `andres-wuwa-pulls` archive.
 *
 * Kuro's API only serves a rolling ~6-month window. If you tracked your pulls
 * with another tool earlier, this grafts the records that are OLDER than what
 * we already have, so the dashboard becomes a complete archive.
 *
 * SAFE BY DEFAULT: prints a preview and writes NOTHING unless you pass --commit.
 * That historical data can't be re-fetched, so confirm the parse looks right
 * (run without --commit first) before committing.
 *
 * Usage:
 *   npm run convene:import -- --file "C:\path\export.json"            preview only
 *   npm run convene:import -- --file "C:\path\export.json" --commit   write it
 *
 * Format: tolerant. Accepts either
 *   • a flat array of pull records, or
 *   • an object keyed by banner (numeric cardPoolType or banner name) → arrays.
 * Field names are matched loosely (time/Time/timestamp, name/Name, quality/rank/
 * qualityLevel, type/resourceType, cardPoolType/gachaType/pool/banner). If your
 * file doesn't map cleanly, show me a sample and I'll add a normalizer for it.
 */

import { createClient } from "@supabase/supabase-js";
import { serviceKey } from "./service-key";
import { readFileSync } from "node:fs";
import {
  BANNERS,
  type ConveneRecord,
  type ConveneStore,
  emptyStore,
  PULL_PROFILE_KEY,
} from "../src/lib/convene-types";
import { graftOlder } from "../src/lib/convene-merge";
import { summarize } from "../src/lib/convene-analytics";

const SUPABASE_URL = "https://ayhrqkxdeecybjhmgdoq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5aHJxa3hkZWVjeWJqaG1nZG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTI0NjcsImV4cCI6MjA5Mzg2ODQ2N30.GN-y9xEyNfQUVUXCqOGJC5cpN35X7B8PpOlFJPn10A8";
const SUPABASE_TABLE = "dashboard_profiles";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const hasFlag = (flag: string) => process.argv.includes(flag);

/** Loosely pull a field out of a record object by trying several key spellings. */
function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] != null) return obj[k];
    // case-insensitive fallback
    const found = Object.keys(obj).find((kk) => kk.toLowerCase() === k.toLowerCase());
    if (found && obj[found] != null) return obj[found];
  }
  return undefined;
}

const BANNER_NAME_TO_TYPE: Record<string, number> = {};
for (const [type, name] of Object.entries(BANNERS)) {
  BANNER_NAME_TO_TYPE[name.toLowerCase()] = Number(type);
}
// common aliases other trackers use
Object.assign(BANNER_NAME_TO_TYPE, {
  "featured resonator convene": 1,
  "character event": 1,
  "limited character": 1,
  "featured weapon convene": 2,
  "weapon event": 2,
  "limited weapon": 2,
  "standard resonator convene": 3,
  "permanent character": 3,
  "standard weapon convene": 4,
  "permanent weapon": 4,
  "novice convene": 5,
  beginner: 5,
});

function bannerKeyToType(key: string): number | null {
  const n = Number(key);
  if (Number.isInteger(n) && n >= 1 && n <= 7) return n;
  const t = BANNER_NAME_TO_TYPE[key.toLowerCase().trim()];
  return t ?? null;
}

function normQuality(v: unknown): number {
  if (typeof v === "number") return v;
  const m = String(v ?? "").match(/[345]/);
  return m ? Number(m[0]) : 0;
}

function normType(v: unknown, resourceId?: number): string {
  const s = String(v ?? "").toLowerCase();
  if (/weap/.test(s)) return "Weapon";
  if (/reson|char/.test(s)) return "Resonator";
  // No explicit type (e.g. wuwatracker exports) → infer from resourceId.
  // Resonator IDs are 4-digit (~1102–1700); weapon IDs are 8-digit (21######).
  if (resourceId != null && resourceId >= 100000) return "Weapon";
  return "Resonator";
}

function normTime(v: unknown): string {
  let s = String(v ?? "").trim();
  // accept ISO "2025-03-01T12:00:00Z" → "2025-03-01 12:00:00"
  s = s.replace("T", " ").replace(/\.\d+/, "").replace(/Z$/, "").replace(/[+-]\d{2}:?\d{2}$/, "").trim();
  return s;
}

function toRecord(raw: Record<string, unknown>, fallbackType: number | null): ConveneRecord | null {
  const time = normTime(pick(raw, ["time", "timestamp", "date", "pullTime"]));
  const name = String(pick(raw, ["name", "itemName", "resourceName"]) ?? "").trim();
  if (!time || !name) return null;
  const cardPoolTypeRaw = pick(raw, ["cardPoolType", "gachaType", "poolType", "pool", "banner", "bannerType", "cardPoolId"]);
  let cardPoolType = cardPoolTypeRaw != null ? bannerKeyToType(String(cardPoolTypeRaw)) : null;
  if (cardPoolType == null) cardPoolType = fallbackType;
  if (cardPoolType == null) return null;
  const resourceId = Number(pick(raw, ["resourceId", "itemId", "id"]) ?? 0) || 0;
  return {
    cardPoolType,
    resourceId,
    qualityLevel: normQuality(pick(raw, ["qualityLevel", "quality", "rank", "star", "rarity"])),
    resourceType: normType(pick(raw, ["resourceType", "type", "itemType", "resType"]), resourceId),
    name,
    count: Number(pick(raw, ["count"]) ?? 1) || 1,
    time,
  };
}

/** Normalize whatever JSON shape into per-banner record arrays. */
function normalize(parsed: unknown): Map<number, ConveneRecord[]> {
  const out = new Map<number, ConveneRecord[]>();
  const push = (rec: ConveneRecord | null) => {
    if (!rec || rec.qualityLevel === 0) return;
    const arr = out.get(rec.cardPoolType) ?? [];
    arr.push(rec);
    out.set(rec.cardPoolType, arr);
  };

  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (item && typeof item === "object") push(toRecord(item as Record<string, unknown>, null));
    }
  } else if (parsed && typeof parsed === "object") {
    // object keyed by banner → arrays, OR a wrapper like { data: [...] } / { list: [...] }
    const obj = parsed as Record<string, unknown>;
    const wrapper = obj.data ?? obj.list ?? obj.records ?? obj.pulls;
    if (Array.isArray(wrapper)) {
      return normalize(wrapper);
    }
    for (const [key, val] of Object.entries(obj)) {
      if (!Array.isArray(val)) continue;
      const type = bannerKeyToType(key);
      for (const item of val) {
        if (item && typeof item === "object") push(toRecord(item as Record<string, unknown>, type));
      }
    }
  }
  return out;
}

/** Parse a "YYYY-MM-DD HH:mm:ss" wall-clock string as epoch ms (treated as UTC). */
function wallToMs(t: string): number {
  return Date.parse(t.replace(" ", "T") + "Z");
}

/** Re-format an epoch (read in UTC fields) back to a wall-clock string. */
function msToWall(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`
  );
}

/**
 * Detect the timezone offset between the incoming tracker (UTC) and our stored
 * API data (server-local) by matching overlapping 5★ pulls by name within a
 * day. Returns the median (existing − incoming) delta in ms, or null if no
 * overlap was found. Applying this delta to tracker times aligns them to the
 * API's server-local clock.
 */
function detectOffsetMs(
  store: ConveneStore,
  incoming: Map<number, ConveneRecord[]>,
): number | null {
  const deltas: number[] = [];
  for (const [type, recs] of incoming) {
    const existing = store.banners[String(type)] ?? [];
    const ex5 = existing.filter((r) => r.qualityLevel === 5);
    const in5 = recs.filter((r) => r.qualityLevel === 5);
    for (const e of ex5) {
      let best: number | null = null;
      let bestAbs = Infinity;
      for (const i of in5) {
        if (i.name !== e.name) continue;
        const d = wallToMs(e.time) - wallToMs(i.time);
        const abs = Math.abs(d);
        if (abs < bestAbs && abs < 24 * 3600 * 1000) {
          bestAbs = abs;
          best = d;
        }
      }
      if (best != null) deltas.push(best);
    }
  }
  if (deltas.length === 0) return null;
  deltas.sort((a, b) => a - b);
  return deltas[Math.floor(deltas.length / 2)];
}

function range(recs: ConveneRecord[]): string {
  if (recs.length === 0) return "—";
  const times = recs.map((r) => r.time).sort();
  return `${times[0]} → ${times[times.length - 1]}`;
}

async function main() {
  const file = arg("--file");
  const commit = hasFlag("--commit");
  if (!file) {
    console.error('✕ --file is required.\n  npm run convene:import -- --file "C:\\path\\export.json"');
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`✕ Could not read/parse ${file}: ${(e as Error).message}`);
    process.exit(1);
  }

  const incoming = normalize(parsed);
  const totalIncoming = [...incoming.values()].reduce((a, r) => a + r.length, 0);
  if (totalIncoming === 0) {
    console.error(
      "✕ Parsed 0 usable records. The format probably needs a custom normalizer —\n" +
        "  paste me a sample of the file and I'll wire it up.",
    );
    process.exit(1);
  }
  console.log(`• Parsed ${totalIncoming} records from ${file}`);

  // Load current archive.
  const supabase = createClient(SUPABASE_URL, serviceKey());
  let store: ConveneStore = emptyStore();
  const { data: row, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("data")
    .eq("profile", PULL_PROFILE_KEY)
    .maybeSingle();
  if (error) throw error;
  if (row?.data) store = row.data as ConveneStore;

  // Align tracker timezone to the API's server-local clock (wuwatracker stores
  // UTC; Kuro's API stores server time). Detected from overlapping 5★ pulls.
  const offsetMs = detectOffsetMs(store, incoming);
  if (offsetMs && Math.abs(offsetMs) >= 60_000) {
    const hrs = (offsetMs / 3_600_000).toFixed(1);
    let shifted = 0;
    for (const recs of incoming.values()) {
      for (const r of recs) {
        r.time = msToWall(wallToMs(r.time) + offsetMs);
        shifted++;
      }
    }
    console.log(`• Aligned ${shifted} tracker times by ${hrs}h to match API server timezone`);
  } else if (offsetMs == null) {
    console.log("• No 5★ overlap to detect timezone offset — grafting times as-is");
  }

  // Graft per banner.
  console.log(`\n${"─".repeat(70)}`);
  let grandAdded = 0;
  for (const [type, recs] of [...incoming.entries()].sort((a, b) => a[0] - b[0])) {
    const existing = store.banners[String(type)] ?? [];
    const { merged, added } = graftOlder(existing, recs);
    grandAdded += added;
    store.banners[String(type)] = merged;
    console.log(
      `  [${type}] ${(BANNERS[type] ?? "Banner " + type).padEnd(20)}\n` +
        `       have ${String(existing.length).padStart(4)}  ${range(existing)}\n` +
        `       file ${String(recs.length).padStart(4)}  ${range(recs)}\n` +
        `       graft+${String(added).padStart(3)} → ${merged.length}  ${range(merged)}`,
    );
  }
  console.log(`${"─".repeat(70)}`);
  console.log(`  GRAFTED ${grandAdded} historical records (older than current archive).`);

  const sum = summarize(store);
  console.log(
    `  NEW TOTAL  ${sum.totalPulls} pulls · ${sum.totalAstrite.toLocaleString()} Astrite · ${sum.totalFiveStars} ⭐5`,
  );

  if (!commit) {
    console.log("\n(preview only — re-run with --commit to write to Supabase)");
    return;
  }
  if (grandAdded === 0) {
    console.log("\nNothing older than the current archive to add. Not writing.");
    return;
  }

  store.lastSync = store.lastSync || new Date().toISOString();
  const { error: saveError } = await supabase
    .from(SUPABASE_TABLE)
    .upsert(
      { profile: PULL_PROFILE_KEY, data: store, updated_at: new Date().toISOString() },
      { onConflict: "profile" },
    );
  if (saveError) throw saveError;
  console.log(`\n✓ saved to Supabase (profile=${PULL_PROFILE_KEY})`);
}

main().catch((e) => {
  console.error("✕", e instanceof Error ? e.message : e);
  process.exit(1);
});
