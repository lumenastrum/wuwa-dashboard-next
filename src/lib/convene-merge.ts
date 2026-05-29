/**
 * Boundary-splice merge for convene records.
 *
 * Kuro only serves a rolling ~6-month window. To turn the dashboard into a
 * permanent archive we never delete records — we splice on a TIME boundary
 * rather than dedupe individual pulls (which is unsafe because every pull in a
 * 10-pull shares one timestamp, so uid-dedup collapses real duplicates).
 *
 * Record `time` is "YYYY-MM-DD HH:mm:ss", which sorts lexicographically the
 * same as chronologically — so plain string comparison is correct throughout.
 */

import type { ConveneRecord } from "./convene-types";

const byTimeDesc = (a: ConveneRecord, b: ConveneRecord): number =>
  a.time < b.time ? 1 : a.time > b.time ? -1 : 0;

function earliestTime(recs: ConveneRecord[]): string | null {
  if (recs.length === 0) return null;
  return recs.reduce((m, r) => (r.time < m ? r.time : m), recs[0].time);
}

/**
 * Live-sync merge. `fresh` (the current API window) is authoritative for its
 * own time range; any stored records OLDER than the window's start are kept.
 * Returns newest-first. If `fresh` is empty, the existing archive is preserved
 * untouched (a banner that aged entirely out of the window keeps its history).
 */
export function mergeWindow(
  existing: ConveneRecord[],
  fresh: ConveneRecord[],
): { merged: ConveneRecord[]; windowCount: number; archivedCount: number } {
  const windowStart = earliestTime(fresh);
  if (windowStart === null) {
    const merged = [...existing].sort(byTimeDesc);
    return { merged, windowCount: 0, archivedCount: merged.length };
  }
  const archived = existing.filter((r) => r.time < windowStart);
  const merged = [...fresh, ...archived].sort(byTimeDesc);
  return { merged, windowCount: fresh.length, archivedCount: archived.length };
}

/**
 * Historical graft. Adds `incoming` records that are OLDER than everything we
 * already have (e.g. a past tracker export covering pre-window pulls). Records
 * inside our existing range are ignored — the API archive is authoritative
 * there. Returns newest-first plus how many were actually grafted.
 */
export function graftOlder(
  existing: ConveneRecord[],
  incoming: ConveneRecord[],
): { merged: ConveneRecord[]; added: number } {
  const boundary = earliestTime(existing);
  if (boundary === null) {
    const merged = [...incoming].sort(byTimeDesc);
    return { merged, added: incoming.length };
  }
  const older = incoming.filter((r) => r.time < boundary);
  const merged = [...existing, ...older].sort(byTimeDesc);
  return { merged, added: older.length };
}
