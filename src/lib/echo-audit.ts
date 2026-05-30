// Pure echo-scoring engine. NO "use client", NO browser APIs — imported by
// both the Console resonator component AND the Node CLI (scripts/update.ts).
//
// The model grades each echo, and the whole build, for how good it is FOR A
// SPECIFIC resonator, using a per-resonator stat-weight profile. Substats are
// scored by roll-quality × weight; the main stat is a categorical slot-pool
// match. Everything normalizes against the IDEAL build for that resonator, so
// a grade answers "how close is this to perfect for THIS character".
//
// Out of scope: set-bonus (2pc/5pc) effects. This is a STAT grade, not a
// complete build verdict — `echoSet` still carries the set name separately.

import type {
  Echo,
  EchoCost,
  EchoMainStatLabel,
  EchoSubstat,
  EchoSubstatLabel,
  ElementName,
  StatWeights,
  Status,
} from "./types";

// --- Slot layout --------------------------------------------------------
export const SLOT_COSTS = [4, 3, 3, 1, 1] as const;

// --- Main stat pools by cost -------------------------------------------
const ELEMENT_DMG: EchoMainStatLabel[] = [
  "Glacio DMG", "Fusion DMG", "Electro DMG", "Aero DMG", "Spectro DMG", "Havoc DMG",
];

export const MAIN_STAT_POOLS: Record<EchoCost, EchoMainStatLabel[]> = {
  4: ["Crit Rate", "Crit DMG", "ATK%", "HP%", "DEF%", "Healing Bonus"],
  3: ["ATK%", "HP%", "DEF%", "Energy Regen", ...ELEMENT_DMG],
  1: ["ATK%", "HP%", "DEF%", "HP"],
};

// --- Substat roll ranges (min/max per roll, +0..+25) -------------------
export const SUBSTAT_RANGE: Record<EchoSubstatLabel, { min: number; max: number }> = {
  "HP": { min: 320, max: 580 },
  "ATK": { min: 30, max: 60 },
  "DEF": { min: 40, max: 70 },
  "HP%": { min: 6.4, max: 11.6 },
  "ATK%": { min: 6.4, max: 11.6 },
  "DEF%": { min: 8.1, max: 14.7 },
  "Crit Rate": { min: 6.3, max: 10.5 },
  "Crit DMG": { min: 12.6, max: 21.0 },
  "Energy Regen": { min: 6.8, max: 12.4 },
  "Basic Attack DMG": { min: 6.4, max: 11.6 },
  "Heavy Attack DMG": { min: 6.4, max: 11.6 },
  "Resonance Skill DMG": { min: 6.4, max: 11.6 },
  "Resonance Liberation DMG": { min: 6.4, max: 11.6 },
};

export const SUBSTAT_POOL = Object.keys(SUBSTAT_RANGE) as EchoSubstatLabel[];

// Flat stats use whole-number values; everything else is a percent.
export function isPercentStat(stat: string): boolean {
  return stat !== "HP" && stat !== "ATK" && stat !== "DEF" && stat !== "";
}

// --- Weight seeding -----------------------------------------------------
// Buckets keyed by a normalized build archetype. `<elem> DMG` is injected at
// seed time from the resonator's element so off-element DMG scores ~0.
type Bucket =
  | "crit-dps" | "hp-scaler" | "sub-dps" | "battery"
  | "support-er" | "support-cr" | "support";

const DEFAULT_WEIGHTS: Record<Bucket, StatWeights> = {
  "crit-dps": {
    "Crit Rate": 1.0, "Crit DMG": 1.0, "ATK%": 0.9,
    "Resonance Skill DMG": 0.6, "Resonance Liberation DMG": 0.6,
    "Basic Attack DMG": 0.5, "Heavy Attack DMG": 0.5,
    "Energy Regen": 0.3, "ATK": 0.2,
  },
  "hp-scaler": {
    "HP%": 1.0, "HP": 0.7, "Crit Rate": 0.9, "Crit DMG": 0.9, "Energy Regen": 0.4,
  },
  "sub-dps": {
    "Crit Rate": 1.0, "Crit DMG": 1.0, "ATK%": 0.8,
    "Energy Regen": 0.6, "Resonance Liberation DMG": 0.6, "ATK": 0.2,
  },
  "battery": {
    "Energy Regen": 1.0, "ATK%": 0.6, "Crit Rate": 0.5, "Crit DMG": 0.5, "HP%": 0.3,
  },
  "support-er": {
    "Energy Regen": 1.0, "HP%": 0.8, "HP": 0.5, "Crit Rate": 0.4, "Crit DMG": 0.4,
  },
  "support-cr": {
    "Crit Rate": 1.0, "ATK%": 0.8, "Crit DMG": 0.7, "Energy Regen": 0.5,
  },
  "support": {
    "Energy Regen": 0.8, "HP%": 0.7, "DEF%": 0.5, "Crit Rate": 0.4,
  },
};

// Resolve a (possibly messy) buildType string to a bucket. Substring matching
// with fallthrough — an unmapped buildType must NEVER seed all-zeros (that
// causes divide-by-zero in the scorer), so the final fallback is "support".
export function bucketFor(buildType: string): Bucket {
  const b = buildType.toLowerCase();
  if (b.includes("hp scaler") || b.includes("hp-scaler")) return "hp-scaler";
  if (b.includes("battery") || b.includes("buffer")) return "battery";
  if (b.includes("crit dps") || b === "dps support" || b.includes("dps")) {
    // "DPS Support" / "CRIT DPS" both want a crit profile; pure "Sub-DPS" below.
    if (b.includes("sub-dps") || b.includes("sub dps")) return "sub-dps";
    return "crit-dps";
  }
  if (b.includes("sub-dps") || b.includes("sub dps")) return "sub-dps";
  if (b.includes("support")) {
    if (b.includes("er") || b.includes("buff")) return "support-er";
    if (b.includes("cr") || b.includes("atk")) return "support-cr";
    return "support";
  }
  return "support";
}

export function elementDmgLabel(element: ElementName): EchoMainStatLabel {
  return `${element} DMG` as EchoMainStatLabel;
}

// Seed an editable weight profile for a resonator. Element DMG bonus is set
// high for the resonator's own element only.
export function defaultWeightsFor(buildType: string, element: ElementName): StatWeights {
  const bucket = bucketFor(buildType);
  const weights: StatWeights = { ...DEFAULT_WEIGHTS[bucket] };
  // Element-DMG main stat matters when the archetype deals that element's damage.
  const dmgWeight =
    bucket === "crit-dps" ? 0.9 : bucket === "sub-dps" ? 0.8 : 0;
  if (dmgWeight > 0) weights[elementDmgLabel(element)] = dmgWeight;
  return weights;
}

// --- Scoring ------------------------------------------------------------
const WMAIN: Record<EchoCost, number> = { 4: 0.4, 3: 0.3, 1: 0.25 };
const DEAD_THRESHOLD = 0.1;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

// 0..1 — how close a substat value rolled to its max for that stat.
export function rollQuality(stat: EchoSubstatLabel | "", value: number): number {
  if (!stat || !(stat in SUBSTAT_RANGE)) return 0;
  const { min, max } = SUBSTAT_RANGE[stat];
  if (max === min) return 0;
  return clamp01((value - min) / (max - min));
}

// The best a 5-substat echo can possibly do for this resonator: the sum of the
// 5 highest substat weights (substats can't repeat, so the ideal is the top-5
// distinct stats all rolled max). Normalizing by this makes 100 = a genuinely
// perfect echo and keeps an "S" grade reachable.
function bestSubstatPotential(weights: StatWeights): number {
  const top5 = SUBSTAT_POOL
    .map((s) => weights[s] ?? 0)
    .sort((a, b) => b - a)
    .slice(0, 5);
  return top5.reduce((acc, w) => acc + w, 0);
}

function isEchoEmpty(echo: Echo): boolean {
  return !echo.mainStat && !echo.substats.some((s) => s.stat);
}

export type EchoGrade = "S" | "A" | "B" | "C" | "D" | "—";

export interface SubstatVerdict {
  stat: EchoSubstatLabel | "";
  value: number;
  weight: number;       // 0..1 — relevance for this resonator
  quality: number;      // 0..1 — roll quality
  dead: boolean;        // weight below threshold
}

export interface EchoVerdict {
  score: number | null;         // 0..100, null when empty
  grade: EchoGrade;
  status: Status;
  mainMatch: number;            // 0..1 — main stat relevance vs slot pool
  substatVerdicts: SubstatVerdict[];
  deadStats: string[];
}

export interface BuildVerdict {
  score: number | null;
  grade: EchoGrade;
  status: Status;
  headline: string;
  graded: string;               // "n/5"
}

function gradeOf(score: number): EchoGrade {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

export function statusOf(score: number | null): Status {
  if (score === null) return "neutral";
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

export function scoreEcho(echo: Echo, weights: StatWeights): EchoVerdict {
  if (isEchoEmpty(echo)) {
    return { score: null, grade: "—", status: "neutral", mainMatch: 0, substatVerdicts: [], deadStats: [] };
  }

  // Main stat: categorical match vs the best stat available in this slot's pool.
  const pool = MAIN_STAT_POOLS[echo.cost];
  const bestMainWeight = Math.max(0, ...pool.map((s) => weights[s] ?? 0));
  const mainWeight = echo.mainStat ? weights[echo.mainStat] ?? 0 : 0;
  const mainMatch = bestMainWeight > 0 ? clamp01(mainWeight / bestMainWeight) : 0;

  // Substats: Σ(weight × rollQuality) normalized by the best 5-substat combo
  // achievable for this resonator — so a flawless echo scores 100.
  const potential = bestSubstatPotential(weights);
  const substatVerdicts: SubstatVerdict[] = echo.substats.map((sub: EchoSubstat) => {
    const weight = sub.stat ? weights[sub.stat] ?? 0 : 0;
    const quality = rollQuality(sub.stat, sub.value);
    return { stat: sub.stat, value: sub.value, weight, quality, dead: !!sub.stat && weight < DEAD_THRESHOLD };
  });
  const substatSum = substatVerdicts.reduce((acc, v) => acc + v.weight * v.quality, 0);
  const substatScore = potential > 0 ? clamp01(substatSum / potential) : 0;

  const wMain = WMAIN[echo.cost];
  const raw = 100 * (wMain * mainMatch + (1 - wMain) * substatScore);
  const score = Math.max(0, Math.min(100, raw));

  return {
    score,
    grade: gradeOf(score),
    status: statusOf(score),
    mainMatch,
    substatVerdicts,
    deadStats: substatVerdicts.filter((v) => v.dead).map((v) => v.stat as string),
  };
}

export function scoreBuild(echoes: Echo[], weights: StatWeights): BuildVerdict {
  const verdicts = echoes.map((e) => scoreEcho(e, weights));
  const graded = verdicts.filter((v) => v.score !== null);

  if (graded.length === 0) {
    return { score: null, grade: "—", status: "neutral", headline: "No echoes entered yet", graded: `0/${echoes.length}` };
  }

  const score = graded.reduce((acc, v) => acc + (v.score ?? 0), 0) / graded.length;
  const deadCount = verdicts.reduce((acc, v) => acc + v.deadStats.length, 0);
  const grade = gradeOf(score);

  let headline: string;
  if (grade === "S") headline = "Cracked — near-ideal stats";
  else if (grade === "A") headline = "Strong build for this resonator";
  else if (grade === "B") headline = "Solid, room to optimize";
  else if (grade === "C") headline = "Underbuilt — re-roll priorities";
  else headline = "Off-stat — major substat waste";
  if (deadCount > 0) headline += ` · ${deadCount} dead substat${deadCount > 1 ? "s" : ""}`;

  return { score, grade, status: statusOf(score), headline, graded: `${graded.length}/${echoes.length}` };
}

// Build a blank 5-slot build with cost-stamped slots and one empty substat row.
export function blankEchoes(): Echo[] {
  return SLOT_COSTS.map((cost) => ({
    cost,
    mainStat: "" as const,
    mainValue: 0,
    substats: [{ stat: "" as const, value: 0 }],
  }));
}
