/**
 * Types for the Convene (gacha pull) history section.
 *
 * Pull data is stored in its OWN Supabase row (profile key `andres-wuwa-pulls`)
 * separate from the main roster blob — so a multi-thousand-record pull history
 * never gets re-serialized on every roster edit's 650ms auto-save.
 *
 * Records are stored verbatim as the Kuro API returns them (newest-first per
 * banner). All derived stats (pity, 50/50, dry streaks, distributions) are
 * computed at read time in `convene-analytics.ts` — the stored shape stays raw.
 */

export const PULL_PROFILE_KEY = "andres-wuwa-pulls";

/** Astrite cost of a single convene. */
export const ASTRITE_PER_PULL = 160;

/** Hard pity (guaranteed 5★) for resonator + weapon featured/standard banners. */
export const HARD_PITY = 80;
/** Soft pity onset — 5★ rate ramps hard from roughly here. */
export const SOFT_PITY = 66;
/** Guaranteed 4★ within this many pulls. */
export const FOUR_STAR_PITY = 10;

/** cardPoolType → human banner name. Keys are the integer the API expects. */
export const BANNERS: Record<number, string> = {
  1: "Featured Resonator",
  2: "Featured Weapon",
  3: "Standard Resonator",
  4: "Standard Weapon",
  5: "Beginner Convene",
  6: "Beginner's Choice",
  7: "Giveback Convene",
  // Collab convenes (first seen: Edgerunners, 2026-06). Own pools, own pity,
  // and the game issues a SEPARATE record_id for them — see convene-sync.ts.
  10: "Collab Resonator",
  11: "Collab Weapon",
};

/** The banner types we surface as primary tiles (the ones that actually matter). */
export const PRIMARY_BANNERS: number[] = [1, 2, 3, 4];

export type CardPoolType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11;

/**
 * Banners with a featured-vs-standard coinflip. The collab resonator banner
 * (10) has one too — standard 5★s can steal the pull (verified: a Calcharo
 * landed on the Edgerunners banner).
 */
export const is5050Pool = (cardPoolType: number): boolean =>
  cardPoolType === 1 || cardPoolType === 10;

/**
 * The five permanent 5★ resonators in the standard pool. On the Featured
 * Resonator banner (type 1) you can ONLY pull the featured limited char or one
 * of these — so any 5★ resonator NOT in this set is a 50/50 WIN, and one that
 * IS in it is a LOSS. No banner-version date mapping required.
 */
export const STANDARD_5STAR_RESONATORS = [
  "Calcharo",
  "Encore",
  "Jianxin",
  "Lingyang",
  "Verina",
] as const;

/** A single raw pull record exactly as the Kuro gacha API returns it. */
export interface ConveneRecord {
  cardPoolType: number;
  resourceId: number;
  /** 3 | 4 | 5 — always coerced to a number on ingest. */
  qualityLevel: number;
  /** "Resonator" | "Weapon" */
  resourceType: string;
  name: string;
  count: number;
  /** "YYYY-MM-DD HH:mm:ss" in the account's server timezone. */
  time: string;
}

/** The full stored blob in the `andres-wuwa-pulls` Supabase row. */
export interface ConveneStore {
  /** ISO timestamp of the last successful sync. */
  lastSync: string;
  playerId: string;
  serverId: string;
  /** key = cardPoolType as a string; value = records newest-first per banner. */
  banners: Record<string, ConveneRecord[]>;
}

export function emptyStore(): ConveneStore {
  return { lastSync: "", playerId: "", serverId: "", banners: {} };
}
