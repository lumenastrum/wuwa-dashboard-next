export type ElementName = "Fusion" | "Glacio" | "Electro" | "Spectro" | "Havoc" | "Aero";
export type Role = "Main DPS" | "Sub-DPS" | "Support";
export type Status = "green" | "yellow" | "red" | "neutral";
export type Sequence = "S0" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6";
export type WeaponType = "Sword" | "Pistols" | "Broadblade" | "Gauntlets" | "Rectifier";
export type Rating = "" | "S" | "SS" | "SSS" | "CROWNED";

export type ThemeId = "obsidian" | "atelier" | "console";
export type PageId = "roster" | "resonator" | "teams" | "cycles" | "convene";

export interface DashboardMeta {
  title: string;
  updated: string;
  totalResonators: number;
  maxLevel: number;
}

export interface Resonator {
  name: string;
  element: ElementName;
  weaponType: WeaponType;
  role: Role;
  sequence: Sequence;
  weapon: string;
  weaponRank: string;
  echoSet: string;
  level: number;
  notes: string;
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

export interface AuditEntry {
  name: string;
  buildType: string;
  stats: AuditStat[];
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

export interface SignatureWeapon {
  name: string;          // matches Resonator.weapon — the link key
  type: WeaponType;
  wearer: string;        // resonator who owns it (1:1)
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
  signatureWeapons: SignatureWeapon[];
  echoBuilds: EchoBuild[];
}

export type RosterEntry = Resonator & { audit?: AuditEntry };
