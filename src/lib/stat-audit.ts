// Pure stat-status derivation. NO "use client", NO browser APIs — imported by
// both the Console resonator component AND the Node CLI (scripts/update.ts).
//
// The audit's green/yellow/red `_status` is meant to FOLLOW the numbers: each
// stat carries a numeric optimal band (`min`..`max`), and `current` is judged
// against the band's floor. Before this, `_status` was a frozen manual field —
// editing `current` left it stale, so the Resonator Rating (which reads only
// `_status`) never moved. Deriving here keeps display color + rating in sync.

import type { AuditStat, Status } from "./types";

// Parse a display value ("1,927", "75.4%") into a plain number. Strips thousands
// commas and a trailing %, so it lands in the same unit space as `min`/`max`
// (which store 70 for 70%, 2000 for ATK). Returns null when there's no number.
export function parseStatValue(s: string | undefined | null): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(/,/g, "").replace(/%/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

// Derive green/yellow/red from `current` vs the optimal floor (`min`):
//   at/above floor → green (overcapping a stat still reads as "good")
//   within 10% under floor → yellow (close, needs a nudge)
//   further below → red
// Returns null when there's no numeric basis (no parseable current, or no `min`)
// — the caller PRESERVES the existing `_status` in that case, so hand-tuned
// statuses on band-less stats (e.g. Team CR/CD) survive untouched.
export function deriveStatStatus(
  stat: Pick<AuditStat, "current" | "min">,
): Status | null {
  const cur = parseStatValue(stat.current);
  if (cur == null || stat.min == null) return null;
  if (cur >= stat.min) return "green";
  if (cur >= stat.min * 0.9) return "yellow";
  return "red";
}
