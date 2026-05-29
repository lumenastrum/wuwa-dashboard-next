/**
 * Pure (no-React) analytics over raw convene records.
 *
 * Imported by BOTH the UI and the `convene-sync` CLI, so keep it dependency-free.
 *
 * Pity model: WuWa pity is sequential within a banner POOL. Records come from
 * the API newest-first; we reverse to chronological (oldest-first) and walk
 * forward counting pulls between 5★ (and 4★) hits.
 *
 * 50/50 (Featured Resonator / type 1 only): a 5★ resonator NOT in the standard
 * pool is a featured WIN; one that IS in the standard pool is a LOSS. After a
 * loss the next 5★ is guaranteed featured (not counted as a coinflip).
 */

import {
  ASTRITE_PER_PULL,
  BANNERS,
  type ConveneRecord,
  type ConveneStore,
  STANDARD_5STAR_RESONATORS,
} from "./convene-types";

const STANDARD_SET = new Set<string>(STANDARD_5STAR_RESONATORS);

export interface FiveStarPull {
  name: string;
  resourceType: string;
  time: string;
  /** Pulls it took to land this 5★ (1 = hit on the very next pull after prev 5★). */
  pity: number;
  /** type 1 only: true = won featured, false = lost to standard. undefined elsewhere. */
  won5050?: boolean;
  /** type 1 only: this 5★ was a guaranteed pull (came right after a loss). */
  guaranteed?: boolean;
}

export interface BannerStats {
  cardPoolType: number;
  name: string;
  total: number;
  astrite: number;
  fiveStars: FiveStarPull[];
  fiveStarCount: number;
  fourStarCount: number;
  /** Ongoing pulls since the last 5★ (your current pity). */
  currentPity5: number;
  /** Ongoing pulls since the last 4★. */
  currentPity4: number;
  /** Mean pity across all 5★ hits, or null if none. */
  avgPity5: number | null;
  /** Largest gap between 5★ (counts the ongoing current streak too). */
  longestDry: number;
  earliest: string;
  latest: string;
  // ── 50/50 (type 1 only; zeros elsewhere) ──
  wins5050: number;
  losses5050: number;
  winRate5050: number | null;
  /** Currently sitting on a guarantee (last coinflip was a loss). */
  nextGuaranteed: boolean;
}

export interface ConveneSummary {
  banners: BannerStats[];
  totalPulls: number;
  totalAstrite: number;
  totalFiveStars: number;
  lastSync: string;
}

/** API returns newest-first; reverse to oldest-first for sequential pity. */
function chronological(records: ConveneRecord[]): ConveneRecord[] {
  return [...records].reverse();
}

export function computeBannerStats(
  records: ConveneRecord[],
  cardPoolType: number,
): BannerStats {
  const chrono = chronological(records);
  const name = BANNERS[cardPoolType] ?? `Banner ${cardPoolType}`;
  const is5050Banner = cardPoolType === 1;

  const fiveStars: FiveStarPull[] = [];
  let sinceFive = 0;
  let since5050IsGuaranteed = false; // set true after a loss
  let wins = 0;
  let losses = 0;

  let sinceFour = 0;
  let fourStarCount = 0;

  let longestDry = 0;

  for (const rec of chrono) {
    sinceFive += 1;
    sinceFour += 1;

    if (rec.qualityLevel === 5) {
      const fp: FiveStarPull = {
        name: rec.name,
        resourceType: rec.resourceType,
        time: rec.time,
        pity: sinceFive,
      };

      if (is5050Banner && rec.resourceType === "Resonator") {
        const isStandard = STANDARD_SET.has(rec.name);
        if (since5050IsGuaranteed) {
          // Came off a guarantee — always the featured char, not a coinflip.
          fp.guaranteed = true;
          fp.won5050 = true;
          since5050IsGuaranteed = false;
        } else if (isStandard) {
          fp.won5050 = false; // lost the 50/50
          losses += 1;
          since5050IsGuaranteed = true; // next 5★ guaranteed
        } else {
          fp.won5050 = true; // won the 50/50
          wins += 1;
        }
      }

      fiveStars.push(fp);
      if (sinceFive > longestDry) longestDry = sinceFive;
      sinceFive = 0;
    }

    if (rec.qualityLevel === 4) {
      fourStarCount += 1;
      sinceFour = 0;
    }
  }

  // Ongoing dry streak can be the longest if you're deep into bad luck.
  if (sinceFive > longestDry) longestDry = sinceFive;

  const total = chrono.length;
  const fiveStarCount = fiveStars.length;
  const avgPity5 =
    fiveStarCount > 0
      ? fiveStars.reduce((a, f) => a + f.pity, 0) / fiveStarCount
      : null;
  const winRate5050 =
    wins + losses > 0 ? wins / (wins + losses) : null;

  return {
    cardPoolType,
    name,
    total,
    astrite: total * ASTRITE_PER_PULL,
    fiveStars,
    fiveStarCount,
    fourStarCount,
    currentPity5: sinceFive,
    currentPity4: sinceFour,
    avgPity5,
    longestDry,
    earliest: chrono[0]?.time ?? "",
    latest: chrono[chrono.length - 1]?.time ?? "",
    wins5050: wins,
    losses5050: losses,
    winRate5050,
    nextGuaranteed: since5050IsGuaranteed,
  };
}

export function summarize(store: ConveneStore): ConveneSummary {
  const banners = Object.entries(store.banners)
    .map(([type, recs]) => computeBannerStats(recs, Number(type)))
    .filter((b) => b.total > 0)
    .sort((a, b) => a.cardPoolType - b.cardPoolType);

  return {
    banners,
    totalPulls: banners.reduce((a, b) => a + b.total, 0),
    totalAstrite: banners.reduce((a, b) => a + b.astrite, 0),
    totalFiveStars: banners.reduce((a, b) => a + b.fiveStarCount, 0),
    lastSync: store.lastSync,
  };
}

/** Qualitative luck read against the ~62.5 statistical average pity. */
export function luckLabel(avgPity: number | null): {
  label: string;
  tone: "blessed" | "lucky" | "average" | "cursed";
} {
  if (avgPity == null) return { label: "No data", tone: "average" };
  if (avgPity < 50) return { label: "Blessed", tone: "blessed" };
  if (avgPity < 62) return { label: "Lucky", tone: "lucky" };
  if (avgPity <= 70) return { label: "Average", tone: "average" };
  return { label: "Cursed", tone: "cursed" };
}

export interface HistogramBucket {
  /** e.g. "1–10" */
  range: string;
  lo: number;
  hi: number;
  count: number;
}

/** Bucket 5★ pity values for the distribution chart. Default 8 buckets of 10 → 1..80. */
export function pityHistogram(
  fiveStars: FiveStarPull[],
  bucketSize = 10,
  max = 80,
): HistogramBucket[] {
  const buckets: HistogramBucket[] = [];
  for (let lo = 1; lo <= max; lo += bucketSize) {
    const hi = Math.min(lo + bucketSize - 1, max);
    buckets.push({ range: `${lo}–${hi}`, lo, hi, count: 0 });
  }
  for (const f of fiveStars) {
    const idx = Math.min(Math.floor((f.pity - 1) / bucketSize), buckets.length - 1);
    if (idx >= 0) buckets[idx].count += 1;
  }
  return buckets;
}
