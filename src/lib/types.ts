export type ElementName = "Fusion" | "Glacio" | "Electro" | "Spectro" | "Havoc" | "Aero";
export type Role = "Main DPS" | "Sub-DPS" | "Support";
export type Status = "green" | "yellow" | "red" | "neutral";
export type Sequence = "S0" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6";
export type WeaponType = "Sword" | "Pistols" | "Broadblade" | "Gauntlets" | "Rectifier";
export type Rating = "" | "S" | "SS" | "SSS" | "CROWNED";

export type ThemeId = "obsidian" | "atelier" | "console";
export type PageId = "roster" | "resonator" | "teams" | "cycles";

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
}

export type RosterEntry = Resonator & { audit?: AuditEntry };
