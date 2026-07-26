export type ElementName = "Fusion" | "Glacio" | "Electro" | "Spectro" | "Havoc" | "Aero";
export type Role = "Main DPS" | "Sub-DPS" | "Support";
export type Status = "green" | "yellow" | "red" | "neutral";
export type Sequence = "S0" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6";
export type WeaponType = "Sword" | "Pistols" | "Broadblade" | "Gauntlets" | "Rectifier";
export type Rating = "" | "B" | "A" | "S" | "SS" | "SSS" | "CROWNED" | "IRIDESCENT";

export type PageId = "roster" | "resonator" | "teams" | "cycles" | "toa" | "wastes" | "convene";

export interface DashboardMeta {
  title: string;
  updated: string;
  totalResonators: number;
  maxLevel: number;
}

export interface Resonator {
  name: string;
  rarity?: 4 | 5;              // legacy rows omit this and default to 5★
  element: ElementName;
  weaponType: WeaponType;
  role: Role;
  sequence: Sequence;
  weapon: string;
  weaponRank: string;
  echoSet: string;
  level: number;
  notes: string;
  forte?: ResonatorForte;        // optional — render nothing when absent
  forteKit?: ForteKitEntry[];    // optional — FORTE tab kit codex, absent = empty state
  chain?: ChainNode[];           // optional — CHAIN tab, exactly 6 (index = S1..S6)
}

// One sequence node for the CHAIN tab. Array position = node number (S1..S6).
// Ownership is derived from Resonator.sequence at render time — never stored,
// so a sequence bump lights the next card with no chain edit.
export interface ChainNode {
  name: string;   // in-game node name, e.g. "Prisoner Hanged in the Tower"
  take: string;   // house-voice read of what the copy actually buys
}

// One ability in the FORTE tab's kit codex. `icon` is the atlas file stem under
// public/game/forte/<resonator>/ (Kuro naming: basic, b1=skill, y=circuit,
// c1=liberation, intro, t=outro, d1/d2=inherents) — a missing file degrades to
// a letter tile, so entries can ship before their icon is ripped. `take` is the
// house-voice breakdown, same register as SignatureWeapon.synergy: what the
// ability actually does for the player, not the game's jargon restated.
export interface ForteKitEntry {
  icon: string;
  name: string;   // in-game ability name, e.g. "Shared Voyage"
  type: string;   // in-game slot label, e.g. "Resonance Skill", "Inherent Skill"
  take: string;
}

// Every branch of the forte tree carries TWO side nodes, and there are five
// branches — including Forte Circuit, whose pair are the inherent skills (for
// Camellya: Seedbed / Epiphyte). So the ceiling is 10, not 8. This was modelled
// as 8 until 2026-07-21, which silently dropped the Circuit pair and let a
// partially-built tree render as "8/8 — maxed".
export const FORTE_NODE_MAX = 10;

// Forte tree investment: the five skill levels (1-10) plus how many of the ten
// side nodes are unlocked.
export interface ResonatorForte {
  basic: number;
  skill: number;
  circuit: number;
  liberation: number;
  intro: number;
  nodes: number;                 // 0-FORTE_NODE_MAX unlocked side nodes
}

export type StatLabel = "ATK" | "HP" | "DEF" | "CR" | "CD" | "ER" | "Team CR" | "Team CD";

export interface AuditStat {
  label: StatLabel;
  current: string;
  min?: number;
  max?: number;
  optimal: string;
  unit?: "%";
  _status: Status;
}

// A stat off the in-game sheet's later pages that the AUDIT deliberately does
// not grade: Healing Bonus, element/skill DMG bonuses, and the HP/DEF that only
// matter for actual HP/DEF scalers. These are a RECORD, not a judgment — most
// carry no community band, and several (Healing Bonus) aren't in `StatLabel` at
// all. Kept off `stats` on purpose so the audit stays opinionated and short.
export interface ExtraStat {
  label: string;
  value: string;
}

export interface AuditEntry {
  name: string;
  buildType: string;
  stats: AuditStat[];
  extraStats?: ExtraStat[];   // optional: absent on most rows, panel hides when empty
  notes: string;
  priorityStatus: Status;
  _calcPriority: Status;
}

export interface Benchmark {
  rank: number;
  team: string[];
  element: string;
  best: string;
  worst: string;
  average: string;
  spread: string;
  deaths: number;
  notes: string;
}

export interface BenchmarkMeta {
  location: string;
  timer: string;
  runs: string;
  date: string;
  resistances: string;
}

export interface TeamPreset {
  name: string;
  members: string[];
  notes?: string;
}

export interface ActionItem {
  task: string;
  detail: string;
  status: Status;
}

export interface CycleTeamRow {
  order: number;
  members: string[];
  buff: string;
  score: number;
  rating: Rating;
  over5k: boolean;
  notes: string;
}

export interface Cycle {
  id: number;
  date: string;
  label: string;
  totalPoints: number;
  target: number;
  teamsOver5k: number;
  teamTarget: number;
  dayOne: boolean;
  teams: CycleTeamRow[];
  lessons: string[];
}

export interface EndstateMatrix {
  cycles: Cycle[];
}

// --- Tower of Adversity ---------------------------------------------------
// The classic tower climb. Zone vocabulary is the in-game set (pak
// NewTower_Diffcult_1..4); floors are recorded per zone with the crests the
// clear earned (0-3 per floor). Resonators lock per zone in-game, so the
// floor rows double as a deployment ledger.
export type ToaZone = "Stable" | "Experiment" | "Hazard" | "Overdrive";
export const TOA_ZONES: ToaZone[] = ["Stable", "Experiment", "Hazard", "Overdrive"];
// In-game tower names within each zone (Text_TowerOne/Two/Three_Text). The
// rotating Hazard Zone runs all three ×4 floors (36 crests since v2.6);
// Stable runs Resonant only, Experiment runs Resonant+Echoing, Overdrive
// runs all three ×2 stages.
export type ToaTower = "Resonant" | "Echoing" | "Hazard";
export const TOA_TOWERS: ToaTower[] = ["Resonant", "Hazard", "Echoing"];
export const TOA_CRESTS_PER_FLOOR = 3;

export interface ToaFloorRow {
  zone: ToaZone;
  tower: ToaTower;
  floor: number;        // floor number within its tower (1-based)
  boss: string;         // headline enemy ("" = unrecorded)
  members: string[];    // the team that cleared it
  crests: number;       // 0..TOA_CRESTS_PER_FLOOR
  time: string;         // time REMAINING on the floor clock, e.g. "2:41" ("" = untimed)
  notes: string;        // kicker convention: first short sentence = headline
}

export interface ToaSeason {
  id: number;
  date: string;         // record date YYYY-MM-DD
  label: string;        // flavor name, same register as cycle labels
  window: string;       // in-game phase window label ("" ok)
  crestTarget: number;  // the chase, e.g. 30
  totalCrests: number;  // derived: sum of floor crests
  floors: ToaFloorRow[];
  lessons: string[];
}

export interface TowerOfAdversity {
  seasons: ToaSeason[];
}

// --- Whimpering Wastes ----------------------------------------------------
// The drowned score-attack. Twelve stages across three Waters; every stage is
// two halves, each with its own trio + equipped Token. Stage grades are the
// in-game ladder (B/A/S — Infinite Torrents alone extends to SS/SSS).
export type WastesWaters = "Forbidden" | "Chasm" | "Torrents";
export const WASTES_WATERS: WastesWaters[] = ["Forbidden", "Chasm", "Torrents"];
export type WastesGrade = "" | "B" | "A" | "S" | "SS" | "SSS";

export interface WastesStageRow {
  stage: number;        // 1-12
  name: string;         // in-game stage name, e.g. "Siren's Boneyard"
  waters: WastesWaters;
  teamA: string[];      // First Half trio
  teamB: string[];      // Second Half trio
  tokenA: string;       // equipped Token name ("" = unrecorded)
  tokenB: string;
  tokenAIcon?: number;  // public/game/wastes/tokens/<n>.webp — absent = text chip
  tokenBIcon?: number;
  score: number;        // stage total (both halves summed, in-game display)
  grade: WastesGrade;
  notes: string;        // kicker convention applies
}

export interface WastesSeason {
  id: number;
  date: string;           // record date YYYY-MM-DD
  label: string;          // flavor name
  window: string;         // in-game cycle label, e.g. "Respawning Waters July, 2026"
  chasmTarget: number;    // the point chase, e.g. 15000
  torrentsTarget: number; // e.g. 4500 (S) — or 5500 for the SSS hunt
  forbiddenPoints: number; // derived per-Waters sums
  chasmPoints: number;
  torrentsPoints: number;
  stages: WastesStageRow[];
  lessons: string[];
}

export interface WhimperingWastes {
  seasons: WastesSeason[];
}

export interface SignatureWeapon {
  name: string;          // matches Resonator.weapon — the link key
  type: WeaponType;
  wearer: string;        // resonator who owns it (1:1)
  isSignature?: boolean; // false when this record only describes an equipped off-signature weapon
  baseAtk: string;       // e.g. "587"
  mainStat: string;      // e.g. "Crit DMG"
  mainStatValue: string; // e.g. "+72.0%"
  passiveName: string;   // weapon skill name
  passive: string;       // what it does (mechanics)
  synergy: string;       // why it's cracked for the wearer (the Clio take)
}

// --- Echoes -------------------------------------------------------------
// A WuWa build is 5 echoes in fixed cost slots: [4, 3, 3, 1, 1].
export type EchoCost = 4 | 3 | 1;

// Substat pool — shared across all costs. Flat (HP/ATK/DEF) and % variants
// are DISTINCT stats with distinct roll ranges; never collapse them.
export type EchoSubstatLabel =
  | "HP" | "ATK" | "DEF"                  // flat
  | "HP%" | "ATK%" | "DEF%"
  | "Crit Rate" | "Crit DMG" | "Energy Regen"
  | "Basic Attack DMG" | "Heavy Attack DMG"
  | "Resonance Skill DMG" | "Resonance Liberation DMG";

// Main stat vocabulary = substats plus the main-only stats (Healing, element DMG).
export type EchoMainStatLabel =
  | EchoSubstatLabel
  | "Healing Bonus"
  | "Glacio DMG" | "Fusion DMG" | "Electro DMG"
  | "Aero DMG" | "Spectro DMG" | "Havoc DMG";

export interface EchoSubstat {
  stat: EchoSubstatLabel | "";   // "" = empty slot
  value: number;                 // unit implied by stat (% or flat); 0 when empty
}

export interface Echo {
  cost: EchoCost;
  name?: string;                 // optional echo name (e.g. "Inferno Rider")
  sonata?: string;               // optional per-slot set name (e.g. "Trailblazing Star")
  mainStat: EchoMainStatLabel | "";
  mainValue: number;
  substats: EchoSubstat[];       // up to 5
}

// Per-resonator stat weights (0..1) — the audit "brain". Seeded from buildType
// + element, then user-tunable. Keyed on the echo-stat vocabulary, NOT the
// audit's abstract StatLabel.
export type StatWeights = Partial<Record<EchoSubstatLabel | EchoMainStatLabel, number>>;

export interface EchoBuild {
  resonator: string;             // 1:1 link to Resonator.name
  echoes: Echo[];                // exactly 5; cost is PER-echo (default spread
                                 // [4,3,3,1,1], but e.g. HP scalers run 4-4-1-1-1)
  weights: StatWeights;
}

export interface DashboardData {
  meta: DashboardMeta;
  resonators: Resonator[];
  audit: AuditEntry[];
  benchmarks: Benchmark[];
  benchmarkMeta: BenchmarkMeta;
  teams: TeamPreset[];
  actionItems: ActionItem[];
  keyFindings: string[];
  endstateMatrix: EndstateMatrix;
  // Optional on old Supabase rows — ensureEndgameModes() defaults them at load.
  towerOfAdversity?: TowerOfAdversity;
  whimperingWastes?: WhimperingWastes;
  signatureWeapons: SignatureWeapon[];
  echoBuilds: EchoBuild[];
}

export type RosterEntry = Resonator & { audit?: AuditEntry };
