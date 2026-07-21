import { BASE_PATH } from "./base-path";
import type { ElementName, WeaponType } from "./types";
import { routeName } from "./route-name";
import echoIconMap from "./echo-icons.json";

// Helpers for the ripped in-game assets under public/game/ (see wuwa-extract).
// Every helper degrades: unknown names return null / a path whose <img> should
// hide itself onError — a partial asset set must never produce broken boxes.

/** Monster-portrait for an echo species, e.g. "Inferno Rider" -> /game/echoes/325.webp */
export function echoIcon(species: string | undefined): string | null {
  if (!species) return null;
  const id = (echoIconMap as Record<string, string>)[species];
  return id ? `${BASE_PATH}/game/echoes/${id}.webp` : null;
}

// Stat label -> stats/ glyph file. Covers both the echo-stat vocabulary
// ("Crit Rate", "Resonance Liberation DMG") and the audit's short labels
// ("CR", "Team CD"). Element DMG mains map to the element key.
const STAT_ICON_KEY: Record<string, string> = {
  HP: "hp", "HP%": "hp",
  ATK: "atk", "ATK%": "atk",
  DEF: "def", "DEF%": "def",
  "Crit Rate": "crit-rate", CR: "crit-rate", "Team CR": "crit-rate",
  "Crit DMG": "crit-dmg", CD: "crit-dmg", "Team CD": "crit-dmg",
  "Energy Regen": "energy-regen", ER: "energy-regen",
  "Healing Bonus": "healing",
  "Basic Attack DMG": "basic",
  "Heavy Attack DMG": "heavy",
  "Resonance Skill DMG": "skill",
  "Resonance Liberation DMG": "liberation",
  "Fusion DMG": "fusion",
  "Glacio DMG": "glacio",
  "Electro DMG": "electro",
  "Spectro DMG": "spectro",
  "Havoc DMG": "havoc",
  "Aero DMG": "aero",
};

export function statIcon(label: string | undefined): string | null {
  if (!label) return null;
  const key = STAT_ICON_KEY[label];
  return key ? `${BASE_PATH}/game/stats/${key}.webp` : null;
}

/** Round in-game element badge (colored), distinct from the flat elementIcon(). */
export function elementBadge(el: ElementName): string {
  return `${BASE_PATH}/game/elements/${el}.webp`;
}

// In-game settlement-screen grade letters (grades/ — brushed metal + per-tier
// neon halo, ripped from Common/Image/ComImg/T_ComScore*). The pak's "SSS"
// texture is byte-identical to SS, so sss.webp is OUR composition of three
// single-S glyphs at the SS overlap stride. ✦ has no in-game art by design
// (the one tier the game can't award) — callers render it as text.
const GRADE_ICON_KEY: Record<string, string> = {
  D: "d", C: "c", B: "b", A: "a", S: "s", SS: "ss", SSS: "sss",
};

export function gradeIcon(grade: string | undefined): string | null {
  const key = grade ? GRADE_ICON_KEY[grade] : undefined;
  return key ? `${BASE_PATH}/game/grades/${key}.webp` : null;
}

// Compact display labels for narrow echo-card substat rows.
const STAT_ABBREV: Record<string, string> = {
  "Energy Regen": "ER",
  "Basic Attack DMG": "Basic DMG",
  "Heavy Attack DMG": "Heavy DMG",
  "Resonance Skill DMG": "Skill DMG",
  "Resonance Liberation DMG": "Lib DMG",
};

export function statAbbrev(label: string): string {
  return STAT_ABBREV[label] ?? label;
}

// ── Forte tree ───────────────────────────────────────────────────────
export type ForteSlot = "basic" | "skill" | "circuit" | "liberation" | "intro";

export const FORTE_SLOTS: { key: ForteSlot; label: string }[] = [
  { key: "basic", label: "BASIC" },
  { key: "skill", label: "SKILL" },
  { key: "circuit", label: "CIRCUIT" },
  { key: "liberation", label: "LIBERATION" },
  { key: "intro", label: "INTRO" },
];

// Kuro's per-character skill-icon naming (SP_Icon<Char><Slot>): B1 = Resonance
// Skill, C1 = Liberation, Y = Forte Circuit. The tree's Basic + Intro glyphs
// are NOT in the char's SkillIcon atlas — they ship as per-char basic.webp /
// intro.webp (extracted from in-game screenshots until the pak path is found).
// Everything lives in public/game/forte/<resonator-lowercase>/; a missing file
// hides itself, and basic additionally falls back to the shared per-weapon
// glyph via forteIconFallback.
const FORTE_SLOT_FILES: Record<ForteSlot, string> = {
  basic: "basic",
  skill: "b1",
  circuit: "y",
  liberation: "c1",
  intro: "intro",
};

export function forteIcon(resonator: string, slot: ForteSlot): string {
  // routeName strips Windows-illegal filename chars (the ":" in "Yangyang: Xuanling")
  return `${BASE_PATH}/game/forte/${routeName(resonator).toLowerCase()}/${FORTE_SLOT_FILES[slot]}.webp`;
}

/** Second-chance icon when the per-char file is missing; null = just hide. */
export function forteIconFallback(slot: ForteSlot, weaponType: WeaponType): string | null {
  return slot === "basic" ? `${BASE_PATH}/game/skill-common/${weaponType.toLowerCase()}.webp` : null;
}

/** Kit-codex icon by raw atlas file stem (basic|b1|y|c1|intro|t|d1|d2…) — the
 *  FORTE tab's entries name their own file instead of going through the
 *  five-slot ForteSlot mapping, so outro (t) and inherents (d1/d2) resolve too. */
export function forteKitIcon(resonator: string, stem: string): string {
  return `${BASE_PATH}/game/forte/${routeName(resonator).toLowerCase()}/${stem}.webp`;
}

/** Sequence-node medallion for the CHAIN tab (wiki "Sequence Node …" art,
 *  shipped as public/game/chain/<resonator>/s1..s6.webp). Missing file →
 *  the card's S# disc, handled at the render. */
export function chainIcon(resonator: string, node: number): string {
  return `${BASE_PATH}/game/chain/${routeName(resonator).toLowerCase()}/s${node}.webp`;
}
