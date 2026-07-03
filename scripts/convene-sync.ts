#!/usr/bin/env node
/**
 * Convene (gacha pull) history sync.
 *
 * Finds the cached convene-history URL in the WuWa client logs, queries Kuro's
 * official gacha API for all 7 banners, and full-replaces the pull history in
 * the Supabase row `andres-wuwa-pulls` (separate from the roster blob).
 *
 * The URL is only written to the logs when you open Convene History IN-GAME.
 * So the flow each refresh is: launch WuWa → open Convene History → run this.
 *
 * Usage:
 *   npm run convene                       auto-find URL in the game logs
 *   npm run convene -- --url "https://…"  paste the URL yourself
 *   npm run convene -- --game "F:\path"   override the game install dir
 *   npm run convene -- --dry              fetch + print, do NOT write Supabase
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  BANNERS,
  type ConveneRecord,
  type ConveneStore,
  emptyStore,
  PULL_PROFILE_KEY,
} from "../src/lib/convene-types";
import { summarize } from "../src/lib/convene-analytics";
import { mergeWindow } from "../src/lib/convene-merge";

const SUPABASE_URL = "https://ayhrqkxdeecybjhmgdoq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5aHJxa3hkZWVjeWJqaG1nZG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTI0NjcsImV4cCI6MjA5Mzg2ODQ2N30.GN-y9xEyNfQUVUXCqOGJC5cpN35X7B8PpOlFJPn10A8";
const SUPABASE_TABLE = "dashboard_profiles";

const DEFAULT_GAME_DIR = "F:\\Wuthering Waves\\Wuthering Waves Game";

/** Log files (relative to the game dir) that can hold the convene URL. */
const LOG_RELPATHS = [
  "Client\\Saved\\Logs\\Client.log",
  "Client\\Binaries\\Win64\\ThirdParty\\KrPcSdk_Global\\KRSDKRes\\KRSDKWebView\\debug.log",
];

const URL_RE =
  /https?:\/\/aki-gm-resources(?:-oversea)?\.aki-game\.(?:net|com)\/aki\/gacha\/index\.html#\/record\?[^\s"'\\]+/g;

/**
 * Pools to sync: the 7 permanent banners + the collab pools (10 = resonator,
 * 11 = weapon; first seen with the Edgerunners collab, 2026-06).
 */
const POOL_TYPES = [1, 2, 3, 4, 5, 6, 7, 10, 11];

const BANNER_DELAY_MS = 300;

interface ConveneParams {
  apiBase: string;
  serverId: string;
  playerId: string;
  languageCode: string;
  recordId: string;
  cardPoolId: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const hasFlag = (flag: string) => process.argv.includes(flag);

/**
 * Kuro XOR-obfuscates Client.log since ~2.x: bytes with an odd low nibble are
 * XOR'd with 0xA5, the rest with 0xEF. (Scheme from wuwatracker's import.ps1.)
 */
function xorDecodeLog(bytes: Buffer): string {
  const out = Buffer.allocUnsafe(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    out[i] = (b & 0x0f) % 2 === 1 ? b ^ 0xa5 : b ^ 0xef;
  }
  return out.toString("utf8");
}

/**
 * Scan the candidate log files; return ALL convene URLs found, freshest first
 * (newer file wins; within a file, later occurrence wins).
 *
 * Why all of them: each convene page the game opens logs its own URL, and
 * collab pools get a SEPARATE record_id from the main banners. The credentials
 * are not symmetric — the main record_id cannot query collab pools (API code
 * -1), while a collab record_id happens to query everything. So the sync
 * gathers every credential set and falls back per pool.
 */
function findUrlsInLogs(gameDir: string): string[] {
  const found: { mtime: number; idx: number; url: string }[] = [];
  for (const rel of LOG_RELPATHS) {
    const full = join(gameDir, rel);
    if (!existsSync(full)) continue;
    let bytes: Buffer;
    try {
      bytes = readFileSync(full);
    } catch {
      continue;
    }
    let matches = bytes.toString("utf8").match(URL_RE);
    if (!matches || matches.length === 0) {
      matches = xorDecodeLog(bytes).match(URL_RE);
    }
    if (!matches || matches.length === 0) continue;
    const mtime = statSync(full).mtimeMs;
    matches.forEach((url, idx) => found.push({ mtime, idx, url }));
  }
  found.sort((a, b) => b.mtime - a.mtime || b.idx - a.idx);
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const f of found) {
    if (!seen.has(f.url)) {
      seen.add(f.url);
      urls.push(f.url);
    }
  }
  return urls;
}

function parseUrl(url: string): ConveneParams {
  const qStr = url.split("#/record?")[1];
  if (!qStr) throw new Error("URL has no #/record query string.");
  const params = new Map<string, string>();
  for (const pair of qStr.split("&")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    params.set(pair.slice(0, eq), decodeURIComponent(pair.slice(eq + 1)));
  }
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = params.get(k);
      if (v) return v;
    }
    return "";
  };
  const isCN = /aki-game\.com/.test(url);
  const apiBase = isCN
    ? "https://gmserver-api.aki-game2.com"
    : "https://gmserver-api.aki-game2.net";

  const p: ConveneParams = {
    apiBase,
    serverId: get("svr_id", "server_id"),
    playerId: get("player_id", "playerId"),
    languageCode: get("lang", "languageCode") || "en",
    recordId: get("record_id", "recordId"),
    cardPoolId: get("resources_id", "gacha_id", "cardPoolId"),
  };
  if (!p.playerId || !p.recordId) {
    throw new Error(
      "URL is missing player_id or record_id. Re-open Convene History in-game for a fresh URL.",
    );
  }
  return p;
}

async function fetchBanner(
  p: ConveneParams,
  cardPoolType: number,
): Promise<ConveneRecord[]> {
  const body = {
    cardPoolId: p.cardPoolId,
    cardPoolType, // MUST be a number or the API 404s
    languageCode: p.languageCode,
    playerId: p.playerId,
    recordId: p.recordId,
    serverId: p.serverId,
  };
  const res = await fetch(`${p.apiBase}/gacha/record/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as {
    code: number;
    message: string;
    data: ConveneRecord[] | null;
  };
  if (json.code !== 0) throw new Error(`API code ${json.code}: ${json.message}`);
  // Coerce qualityLevel to a number defensively.
  return (json.data ?? []).map((r) => ({
    ...r,
    qualityLevel: Number(r.qualityLevel),
    cardPoolType,
  }));
}

async function main() {
  const gameDir = arg("--game") ?? process.env.WUWA_GAME_PATH ?? DEFAULT_GAME_DIR;
  const dry = hasFlag("--dry");

  // 1. Resolve the convene URL(s). A manual --url goes first; the log scan
  //    still runs behind it so collab-pool credentials (separate record_id —
  //    see findUrlsInLogs) are picked up either way.
  const manualUrl = arg("--url");
  console.log(`• Searching logs under: ${gameDir}`);
  const urls = [...(manualUrl ? [manualUrl] : []), ...findUrlsInLogs(gameDir)];
  if (urls.length === 0) {
    console.error(
      "✕ No convene URL found in the logs.\n" +
        "  → Launch Wuthering Waves, open Convene History in-game, then re-run.\n" +
        "  → Or paste it manually: npm run convene -- --url \"https://…\"",
    );
    process.exit(1);
  }

  // Dedupe credential sets by record_id (each page-open logs the same URL
  // repeatedly, sometimes with trailing punctuation the regex can't shed).
  const creds: ConveneParams[] = [];
  for (const u of urls) {
    try {
      const c = parseUrl(u);
      if (!creds.some((x) => x.recordId === c.recordId)) creds.push(c);
    } catch {
      // malformed/truncated log line — skip
    }
  }
  if (creds.length === 0) {
    console.error("✕ Found URL(s) but none parsed cleanly. Re-open Convene History in-game.");
    process.exit(1);
  }

  const p = creds[0];
  console.log(
    `✓ ${creds.length} credential set(s) in logs · player ${p.playerId} · server ${p.serverId} · ${p.apiBase}`,
  );

  // 2. Load existing store (so a failed banner keeps its old data).
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let store: ConveneStore = emptyStore();
  if (!dry) {
    const { data: row, error } = await supabase
      .from(SUPABASE_TABLE)
      .select("data")
      .eq("profile", PULL_PROFILE_KEY)
      .maybeSingle();
    if (error) throw error;
    if (row?.data) store = row.data as ConveneStore;
  }

  // 3. Fetch every pool; archival-merge per banner on success. The fresh
  //    API window is authoritative for its range; older records we've already
  //    captured are preserved so the archive outlives Kuro's rolling retention.
  //    Each pool tries every credential set (freshest first) — collab pools
  //    only answer to their own record_id.
  const errors: string[] = [];
  for (const type of POOL_TYPES) {
    let fresh: ConveneRecord[] | null = null;
    let lastErr = "";
    for (const c of creds) {
      try {
        fresh = await fetchBanner(c, type);
        break;
      } catch (e) {
        lastErr = (e as Error).message;
      }
    }
    if (fresh === null) {
      errors.push(`Banner ${type} (${BANNERS[type]}): ${lastErr}`);
      console.log(`  [${type}] ${BANNERS[type].padEnd(20)}   FAILED — kept previous`);
    } else {
      const existing = store.banners[String(type)] ?? [];
      const { merged, windowCount, archivedCount } = mergeWindow(existing, fresh);
      store.banners[String(type)] = merged;
      const archNote = archivedCount > 0 ? ` + ${archivedCount} archived = ${merged.length}` : "";
      console.log(
        `  [${type}] ${BANNERS[type].padEnd(20)} ${String(windowCount).padStart(5)} in window${archNote}`,
      );
    }
    await sleep(BANNER_DELAY_MS);
  }

  store.playerId = p.playerId;
  store.serverId = p.serverId;
  store.lastSync = new Date().toISOString();

  // 4. Summary.
  const sum = summarize(store);
  console.log(
    `\n${"═".repeat(48)}\n` +
      `  TOTAL  ${sum.totalPulls} pulls · ${sum.totalAstrite.toLocaleString()} Astrite · ${sum.totalFiveStars} ⭐5\n` +
      `${"═".repeat(48)}`,
  );
  for (const b of sum.banners) {
    const wr =
      b.winRate5050 != null ? ` · 50/50 ${Math.round(b.winRate5050 * 100)}%` : "";
    const avg = b.avgPity5 != null ? `avg pity ${b.avgPity5.toFixed(1)}` : "no 5★";
    console.log(
      `  ${b.name.padEnd(20)} ${avg} · current ${b.currentPity5}${wr}`,
    );
  }

  if (errors.length) {
    console.log("\n⚠ Some banners failed:");
    for (const e of errors) console.log(`    ${e}`);
  }

  // 5. Persist.
  if (dry) {
    console.log("\n(--dry: nothing written to Supabase)");
    return;
  }
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
