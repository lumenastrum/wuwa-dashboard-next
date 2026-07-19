// Pure Resonator Rating engine. NO "use client", NO browser APIs — imported by
// both the Console resonator component AND the Node CLI (scripts/update.ts).
//
// Rolls four sub-scores into one final per-resonator verdict on the SAME ladder
// the echo audit uses (D→C→B→A→S→SSS→✦), so the dashboard speaks one language.
//
// Philosophy: "OPTIMIZER" — build quality is king, investment is gravy. Echo and
// stats dominate (35% each, the stuff you control); signature + sequence are a
// lighter ceiling (15% each). An immaculate f2p S0 off-sig unit can outscore a
// sloppily-built whale. Weights are defaults — tune per-taste later.
//
// Out of scope: team synergy, rotation comfort, content-specific tuning. This is
// a single-unit, account-state snapshot.

import type { AuditStat, Sequence, Status } from "./types";
import { gradeOf, statusOf, type EchoGrade } from "./echo-audit";

// --- Weights (the "Optimizer" soul) ------------------------------------
export const RATING_WEIGHTS = { echo: 0.35, stats: 0.35, sig: 0.15, seq: 0.15 } as const;

// --- Sub-score: STATS ---------------------------------------------------
// Reuse the per-stat _status the audit already carries (green/yellow/red), so
// the rating inherits the same human-or-computed judgment shown in STATS_AUDIT.
// Neutral / unset stats are skipped, not counted as failures.
const STATUS_POINTS: Partial<Record<Status, number>> = { green: 100, yellow: 65, red: 30 };

export function statsScore(stats: AuditStat[]): number | null {
  const vals = stats
    .map((s) => STATUS_POINTS[s._status])
    .filter((v): v is number => v != null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// --- Sub-score: SIGNATURE ----------------------------------------------
// On-signature R1 is already excellent (75); refinement scales it to a max 100.
// Off-signature is viable but capped lower (a good substitute, not the BiS key);
// rank still nudges it. No weapon at all → null (excluded, not punished as 0).
export function signatureScore(
  hasWeapon: boolean,
  onSignature: boolean,
  weaponRank: string,
): number | null {
  if (!hasWeapon) return null;
  const rank = Math.max(1, Math.min(5, parseInt(weaponRank.replace(/\D/g, ""), 10) || 1));
  return onSignature
    ? 80 + (rank - 1) * 5 // R1 80 → R5 100 — on-sig always reads green
    : 52 + (rank - 1) * 4.5; // off-sig R1 52 → R5 70
}

// --- Sub-score: SEQUENCE -----------------------------------------------
// S0 is a respectable floor (60), NOT zero — plenty of units cook at S0. The
// S0→S6 spread (60→100) is deliberately gentle so sequence nudges rather than
// dominates, matching the Optimizer philosophy.
const SEQ_SCORE: Record<Sequence, number> = {
  S0: 60, S1: 70, S2: 78, S3: 85, S4: 90, S5: 95, S6: 100,
};

// --- Grade ladder for the RATING ---------------------------------------
// Same letters as the echo audit, but a weighted blend compresses toward the
// middle, so the top thresholds are tuned to keep prestige reachable-but-brutal.
// ✦ requires a prestige echo build (which can push echoScore past 100) AND
// near-max everything else — the truly insane unit. SSS is the realistic ceiling.
function ratingGradeOf(score: number): EchoGrade {
  if (score >= 108) return "✦";
  if (score >= 100) return "SSS";
  if (score >= 88) return "S";
  if (score >= 78) return "A";
  if (score >= 64) return "B";
  if (score >= 50) return "C";
  return "D";
}

export interface RatingInput {
  sequence: Sequence;
  weaponRank: string;
  hasWeapon: boolean;
  onSignature: boolean;        // equipped weapon's `wearer` === this resonator
  stats: AuditStat[];
  echoScore: number | null;    // scoreBuild(...).score (0..130; null if no build)
}

export interface RatingSub {
  key: "echo" | "stats" | "sig" | "seq";
  label: string;
  score: number | null;        // raw sub-score (echo may exceed 100 — prestige)
  weight: number;              // EFFECTIVE weight after renormalizing for missing inputs
  grade: EchoGrade;            // per-sub medal — echo on the echo ladder (matches the
                               // Echo Audit panel), the rest on the rating ladder
}

export interface ResonatorRating {
  score: number | null;        // 0..~110 weighted blend (null when nothing to score)
  grade: EchoGrade;
  status: Status;
  subs: RatingSub[];
  partial: boolean;            // some inputs missing → weights renormalized over the rest
}

export function rateResonator(input: RatingInput): ResonatorRating {
  const raw: Record<RatingSub["key"], number | null> = {
    echo: input.echoScore,
    stats: statsScore(input.stats),
    sig: signatureScore(input.hasWeapon, input.onSignature, input.weaponRank),
    seq: SEQ_SCORE[input.sequence] ?? 60,
  };

  const defs: { key: RatingSub["key"]; label: string; weight: number }[] = [
    { key: "echo", label: "ECHO", weight: RATING_WEIGHTS.echo },
    { key: "stats", label: "STATS", weight: RATING_WEIGHTS.stats },
    { key: "sig", label: "SIGNATURE", weight: RATING_WEIGHTS.sig },
    { key: "seq", label: "SEQUENCE", weight: RATING_WEIGHTS.seq },
  ];

  // Drop missing inputs and renormalize the surviving weights so they sum to 1 —
  // a unit with no echoes entered isn't punished, it's scored on what's known.
  const totalW = defs.reduce((acc, d) => acc + (raw[d.key] != null ? d.weight : 0), 0);
  const subs: RatingSub[] = defs.map((d) => {
    const s = raw[d.key];
    return {
      key: d.key,
      label: d.label,
      score: s,
      weight: s != null && totalW > 0 ? d.weight / totalW : 0,
      grade: s == null ? ("—" as EchoGrade) : d.key === "echo" ? gradeOf(s) : ratingGradeOf(s),
    };
  });

  if (totalW === 0) {
    return { score: null, grade: "—", status: "neutral", subs, partial: true };
  }

  const score = subs.reduce((acc, s) => acc + (s.score != null ? s.score * s.weight : 0), 0);
  const present = subs.filter((s) => s.score != null).length;

  return {
    score,
    grade: ratingGradeOf(score),
    status: statusOf(score),
    subs,
    partial: present < defs.length,
  };
}
