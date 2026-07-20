#!/usr/bin/env node
/**
 * CLI to update the WuWa dashboard data in Supabase.
 * Run via: npm run update -- <command> <args>
 *
 * Examples:
 *   npm run update -- stat Aemeath ATK "1,927"
 *   npm run update -- statstatus Aemeath CR yellow
 *   npm run update -- notes Aemeath "Near perfect"
 *   npm run update -- build Aemeath "CRIT DPS"
 *   npm run update -- prio Aemeath green
 *   npm run update -- seq Aemeath S4
 *   npm run update -- level Aemeath 90
 *   npm run update -- weapon Aemeath "Everbright Polestar"
 *   npm run update -- rank Aemeath R1
 *   npm run update -- echo Aemeath "Trailblazing Star 5/5"
 *   npm run update -- echoslot Aemeath 1 main "Crit DMG" 44
 *   npm run update -- echoslot Aemeath 1 sub 1 "Crit Rate" 9.3
 *   npm run update -- echoslot Aemeath show
 *   npm run update -- echoweight Aemeath "Resonance Liberation DMG" 0.8
 *   npm run update -- bench 1 best 0:31
 *   npm run update -- bench 1 notes "New PB 2026-05-30"
 *   npm run update -- deaths 1 0
 *   npm run update -- addbench "Lucy,Rebecca,Shorekeeper" 0:48 worst=0:55 notes="Edgerunner debut"
 *   npm run update -- benchmove 8 up
 *   npm run update -- benchsort best
 *   npm run update -- cycle 2 team 7 score 13500
 *   npm run update -- cycle 2 team 7 rating CROWNED
 *   npm run update -- cycle 2 team 7 notes "carry by Aemeath"
 *   npm run update -- action 0 status green
 *   npm run update -- finding 0 "new finding text"
 *   npm run update -- list
 *   npm run update -- help
 */

import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { serviceKey } from "./service-key";
import {
  blankEchoes,
  defaultWeightsFor,
  MAIN_STAT_POOLS,
  SUBSTAT_POOL,
  scoreBuild,
  scoreEcho,
} from "../src/lib/echo-audit";
import type {
  AuditStat,
  Echo,
  EchoBuild,
  EchoCost,
  EchoMainStatLabel,
  EchoSubstatLabel,
  ElementName,
  Sequence,
  StatWeights,
} from "../src/lib/types";
import { rateResonator } from "../src/lib/resonator-rating";
import { deriveStatStatus } from "../src/lib/stat-audit";
import { durationToSec } from "../src/lib/duration";

const SUPABASE_URL = "https://ayhrqkxdeecybjhmgdoq.supabase.co";
const SUPABASE_TABLE = "dashboard_profiles";
const PROFILE_KEY = "andres-wuwa";

const STATUSES = ["green", "yellow", "red", "neutral"];
const WEAPON_TYPES = ["Sword", "Pistols", "Broadblade", "Gauntlets", "Rectifier"];
const ELEMENTS = ["Fusion", "Glacio", "Electro", "Spectro", "Havoc", "Aero"];
const ROLES = ["Main DPS", "Sub-DPS", "Support"];
const SEQUENCES = ["S0", "S1", "S2", "S3", "S4", "S5", "S6"];

type AnyRecord = Record<string, unknown>;
interface Data {
  meta: { updated: string; [k: string]: unknown };
  resonators: AnyRecord[];
  audit: { name: string; stats: AnyRecord[]; [k: string]: unknown }[];
  benchmarks: AnyRecord[];
  actionItems: AnyRecord[];
  keyFindings: string[];
  endstateMatrix: { cycles: { id: number; teams: AnyRecord[]; [k: string]: unknown }[] };
  signatureWeapons?: { name: string; [k: string]: unknown }[];
  echoBuilds?: EchoBuild[];
  [k: string]: unknown;
}

// command field → SignatureWeapon key (case-insensitive lookup)
const SIGWEAPON_FIELDS: Record<string, string> = {
  type: "type",
  wearer: "wearer",
  baseatk: "baseAtk",
  mainstat: "mainStat",
  mainstatvalue: "mainStatValue",
  passivename: "passiveName",
  passive: "passive",
  synergy: "synergy",
};

function ensureSigWeapons(data: Data) {
  if (!Array.isArray(data.signatureWeapons)) data.signatureWeapons = [];
  const known = new Set(data.signatureWeapons.map((w) => w.name));
  for (const r of data.resonators) {
    const weapon = r.weapon as string | undefined;
    if (weapon && !known.has(weapon)) {
      data.signatureWeapons.push({
        name: weapon,
        type: (r.weaponType as string) ?? "",
        wearer: (r.name as string) ?? "",
        baseAtk: "",
        mainStat: "",
        mainStatValue: "",
        passiveName: "",
        passive: "",
        synergy: "",
      });
      known.add(weapon);
    }
  }
  return data.signatureWeapons;
}

function findSigWeapon(data: Data, name: string) {
  const list = ensureSigWeapons(data);
  const w = list.find((x) => x.name === name);
  if (!w) throw new Error(`No signature weapon "${name}". Known: ${list.map((x) => x.name).join(", ")}`);
  return w;
}

// Echo builds — mirror ensureSigWeapons. Additive + idempotent.
const ALL_MAIN_STATS = new Set<string>(Object.values(MAIN_STAT_POOLS).flat());
const ALL_ECHO_STATS = new Set<string>([...SUBSTAT_POOL, ...ALL_MAIN_STATS]);

function ensureEchoBuilds(data: Data): EchoBuild[] {
  if (!Array.isArray(data.echoBuilds)) data.echoBuilds = [];
  const known = new Set(data.echoBuilds.map((b) => b.resonator));
  for (const r of data.resonators) {
    const name = r.name as string;
    if (!name || known.has(name)) continue;
    const buildType = (data.audit.find((a) => a.name === name)?.buildType as string) ?? "";
    data.echoBuilds.push({
      resonator: name,
      echoes: blankEchoes(),
      weights: defaultWeightsFor(buildType, r.element as ElementName),
    });
    known.add(name);
  }
  return data.echoBuilds;
}

function findEchoBuild(data: Data, name: string): EchoBuild {
  const list = ensureEchoBuilds(data);
  const b = list.find((x) => x.resonator === name);
  if (!b) throw new Error(`No resonator named "${name}". Known: ${list.map((x) => x.resonator).join(", ")}`);
  return b;
}

// A fresh audit stub for a new resonator: the universal CRIT-DPS stat rows,
// all blank + neutral. `stat`/`statopt`/`statstatus` fill them in afterward.
function blankAuditRow(name: string): Data["audit"][number] {
  return {
    name,
    buildType: "",
    stats: [
      { label: "ATK", current: "", optimal: "", _status: "neutral" },
      { label: "CR", current: "", optimal: "", unit: "%", _status: "neutral" },
      { label: "CD", current: "", optimal: "", unit: "%", _status: "neutral" },
      { label: "ER", current: "", optimal: "", unit: "%", _status: "neutral" },
    ],
    notes: "",
    priorityStatus: "neutral",
    _calcPriority: "neutral",
  };
}

// Add a new resonator + its audit stub to a dashboard blob, then top up the
// derived stores (echo build + signature weapon) and the count. Runs against
// BOTH the live Supabase blob and the public/data.json seed so they stay in
// the lockstep the roster already keeps.
function applyNewResonator(d: Data, resonator: AnyRecord, audit: Data["audit"][number]) {
  d.resonators.push(resonator);
  d.audit.push(audit);
  ensureEchoBuilds(d);
  ensureSigWeapons(d);
  (d.meta as AnyRecord).totalResonators = d.resonators.length;
}

function parseFloatOrThrow(v: string, label = "value") {
  const n = parseFloat(v);
  if (Number.isNaN(n)) throw new Error(`Expected number for ${label}, got "${v}"`);
  return n;
}

function findResonator(data: Data, name: string) {
  const r = data.resonators.find((x) => x.name === name);
  if (!r) throw new Error(`No resonator named "${name}". Known: ${data.resonators.map((x) => x.name).join(", ")}`);
  return r;
}
function findAudit(data: Data, name: string) {
  const a = data.audit.find((x) => x.name === name);
  if (!a) throw new Error(`No audit row for "${name}"`);
  return a;
}
function findStat(audit: ReturnType<typeof findAudit>, label: string) {
  const s = audit.stats.find((x) => x.label === label);
  if (!s) throw new Error(`Stat "${label}" not on ${audit.name}. Has: ${audit.stats.map((x) => x.label).join(", ")}`);
  return s;
}
function assertStatus(v: string) {
  if (!STATUSES.includes(v)) throw new Error(`Status must be one of: ${STATUSES.join(", ")} (got "${v}")`);
}
function parseIntOrThrow(v: string, label = "value") {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) throw new Error(`Expected integer for ${label}, got "${v}"`);
  return n;
}

// --- Benchmarks -----------------------------------------------------------
// Clear times are "M:SS" (decimals allowed on averages, e.g. "0:37.3").
const TIME_RE = /^\d+:[0-5]\d(\.\d+)?$/;
function assertTime(v: string, label = "time") {
  if (!TIME_RE.test(v)) {
    throw new Error(`${label} must be M:SS (e.g. 0:48 or 1:23.5) — got "${v}"`);
  }
  return v;
}

// Invariant: a benchmark's rank === its position in the array (1-based). The
// Emberline renders key off both array order AND b.rank, so keep them locked.
// Call after every add / move / sort / remove.
function renumberBenchmarks(data: Data) {
  data.benchmarks.forEach((b, i) => {
    b.rank = i + 1;
  });
}

// "Fusion+Spectro" — the unique elements of the lineup, in member order.
// Members not yet in the roster are skipped (with a warning) so a benchmark can
// reference a freshly-released resonator before its roster row lands.
function deriveBenchElement(data: Data, team: string[]): string {
  const seen: string[] = [];
  for (const name of team) {
    const r = data.resonators.find((x) => x.name === name);
    if (!r) {
      console.warn(`  ⚠ "${name}" not in roster — element auto-derive skips it (portrait falls back to bust)`);
      continue;
    }
    const el = r.element as string;
    if (el && !seen.includes(el)) seen.push(el);
  }
  return seen.join("+");
}

const HELP = `WuWa dashboard CLI · profile ${PROFILE_KEY}

usage: npm run update -- <command> <args>

resonator:
  addresonator <name> <element> <weaponType> <role> [seq] [level]
                                        create a new resonator (+ blank audit/echo/sig stubs; syncs data.json)
  stat <name> <statLabel> <value>       set audit stat current value
  statopt <name> <statLabel> <text>     set stat optimal range
  statstatus <name> <statLabel> <st>    set stat _status (${STATUSES.join("|")})
  notes <name> <text>                   set audit notes
  build <name> <text>                   set audit buildType
  prio <name> <status>                  set audit priorityStatus
  seq <name> <S0..S6>                   set resonator sequence
  level <name> <int>                    set resonator level
  weapon <name> <text>                  set resonator weapon name
  weapontype <name> <type>              set resonator weapon type (${WEAPON_TYPES.join("|")})
  rank <name> <text>                    set weaponRank (R1..R5)
  echo <name> <text>                    set echoSet (set name, e.g. "Frosty Resolve 5/5")

echoes (per-echo stats + audit; slots 1-5 = cost 4/3/3/1/1):
  echoslot <name> <1-5> main <stat> [value]       set a slot's main stat
  echoslot <name> <1-5> sub <1-5> <stat> <value>  set a substat (stat + roll value)
  echoslot <name> <1-5> cost <1|3|4>              set one slot's cost
  echoslot <name> <1-5> echo <species>            set the echo species (drives the monster portrait)
  echoslot <name> <1-5> sonata <set>              set the slot's sonata set (drives the per-slot set icon)
  echoslot <name> spread <4-4-1-1-1>              set the whole cost spread at once
  echoslot <name> show                            print build + stat grade
  echoweight <name> <stat> <0..1>                 tune one audit weight
  echoweight <name> reset                         re-seed weights from buildType
    e.g. echoslot Aemeath 1 main "Crit DMG" 44
         echoslot Aemeath 1 sub 1 "Crit Rate" 9.3
         echoslot Aemeath 1 echo "Inferno Rider"
         echoslot Aemeath 1 sonata "Trailblazing Star"
         echoweight Aemeath "Resonance Liberation DMG" 0.8

forte (tree investment; levels 1-10, nodes = unlocked side bonus nodes):
  forte <name> <basic> <skill> <circuit> <liberation> <intro> [nodes=8]
    e.g. forte Aemeath 10 10 10 10 10

resonator rating (read-only, Optimizer weighting):
  rating <name>                                   echo+stats+sig+seq → one grade

signature weapon (by weapon name, not resonator):
  sigweapon <weapon> <field> <value>    field: ${Object.keys(SIGWEAPON_FIELDS).join("|")}
  addsigweapon <weapon> <type> <wearer> create a new blank weapon entry (auto-links wearer.weapon if unset)
    e.g. sigweapon "Ages of Harvest" passive "On cast, ATK +12%..."
         sigweapon "Ages of Harvest" synergy "Doubles Jinhsi's Incandescence ramp"
         sigweapon "Ages of Harvest" mainstat "Crit DMG"

benchmark:
  addbench <team> <best> [avg= worst= spread= deaths= element= notes= pos=]
                                        add a new team (team="A,B,C"; inserts by best time)
  bench <rank> <best|worst|average|spread|notes|element> <value>
  deaths <rank> <int>
  benchmove <rank> <up|down|top|bottom|N> reorder a team manually
  benchsort [best|average|worst]          re-rank ALL teams by clear time (fastest first)
  rmbench <rank>                          remove a team

cycle:
  addcycle --file <cycle.json>             append a whole new cycle (teams + lessons; totals/over5k derive)
  cycle <id> team <order> score <int>
  cycle <id> team <order> rating <""|B|A|S|SS|SSS|CROWNED>
  cycle <id> team <order> buff <text>
  cycle <id> team <order> notes <text>
  cycle <id> team <order> members <"A,B,C">     comma-separated names
  cycle <id> team <order> over5k <true|false>
  cycleTotal <id> <int>                   override totalPoints

misc:
  action <idx> <task|detail|status> <value>
  finding <idx> <text>
  list                                    print summary
  help                                    this message

global flags:
  --dry                                   preview the result without saving (any command)`;

async function main() {
  // `--dry` previews the result without saving (reads live data, skips the
  // upsert). Stripped before positional parsing so it can sit anywhere.
  const rawArgv = process.argv.slice(2);
  const dry = rawArgv.includes("--dry");
  const argv = rawArgv.filter((a) => a !== "--dry");
  if (argv.length === 0 || argv[0] === "help" || argv[0] === "--help") {
    console.log(HELP);
    return;
  }

  const supabase = createClient(SUPABASE_URL, serviceKey());
  const { data: row, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("data")
    .eq("profile", PROFILE_KEY)
    .maybeSingle();
  if (error) throw error;
  if (!row?.data) throw new Error(`No row for profile "${PROFILE_KEY}". Open the dashboard once to seed it.`);
  const data = row.data as Data;

  const [cmd, ...rest] = argv;

  if (cmd === "list") {
    console.log(`updated: ${data.meta.updated}`);
    console.log(`resonators: ${data.resonators.length}`);
    console.log(`benchmarks: ${data.benchmarks.length}`);
    console.log(`cycles: ${data.endstateMatrix.cycles.length}`);
    console.log(`action items: ${data.actionItems.length}`);
    console.log(`key findings: ${data.keyFindings.length}`);
    console.log("\nResonators:");
    for (const r of data.resonators) console.log(`  ${r.name} (${r.element} ${r.sequence} ${r.role})`);
    const sigs = ensureSigWeapons(data);
    const documented = sigs.filter((w) => (w.passive as string) || (w.synergy as string)).length;
    console.log(`\nSignature weapons: ${sigs.length} (${documented} documented, ${sigs.length - documented} blank)`);
    for (const w of sigs) {
      const filled = (w.passive as string) || (w.synergy as string) ? "●" : "○";
      console.log(`  ${filled} ${w.name} → ${w.wearer}`);
    }
    return;
  }

  if (cmd === "rating") {
    const name = rest[0];
    if (!name) throw new Error(`usage: rating <name>`);
    const r = findResonator(data, name);
    const audit = data.audit.find((x) => x.name === name);
    const sig = data.signatureWeapons?.find((w) => w.name === r.weapon);
    const build = data.echoBuilds?.find((b) => b.resonator === name);
    const echoScore = build
      ? scoreBuild(build.echoes as Echo[], build.weights as StatWeights).score
      : null;
    const rating = rateResonator({
      sequence: r.sequence as Sequence,
      weaponRank: r.weaponRank as string,
      hasWeapon: !!r.weapon,
      onSignature: !!sig && sig.wearer === name,
      stats: (audit?.stats ?? []) as unknown as AuditStat[],
      echoScore,
    });
    const scoreStr = rating.score !== null ? ` (${Math.round(rating.score)})` : "";
    console.log(`${name} — RESONATOR RATING ${rating.grade}${scoreStr}${rating.partial ? " · PARTIAL" : ""}`);
    for (const s of rating.subs) {
      const v = s.score !== null ? String(Math.round(s.score)) : "—";
      console.log(`  ${s.label.padEnd(10)} ${v.padStart(4)} · weight ${Math.round(s.weight * 100)}%`);
    }
    console.log(`  weighting: OPTIMIZER (echo 35 / stats 35 / sig 15 / seq 15)`);
    return;
  }

  let mutated = true;
  switch (cmd) {
    case "stat": {
      const [name, label, ...valueParts] = rest;
      const value = valueParts.join(" ");
      const audit = findAudit(data, name);
      const stat = findStat(audit, label);
      console.log(`${name} ${label}: ${stat.current} → ${value}`);
      stat.current = value;
      // Numbers are ground truth: re-derive status from the band so the rating
      // follows. Preserve the existing status when there's no numeric basis.
      const derived = deriveStatStatus(stat as unknown as AuditStat);
      if (derived && derived !== stat._status) {
        console.log(`${name} ${label} status: ${stat._status} → ${derived} (auto)`);
        stat._status = derived;
      }
      break;
    }
    case "statopt": {
      const [name, label, ...valueParts] = rest;
      const audit = findAudit(data, name);
      const stat = findStat(audit, label);
      stat.optimal = valueParts.join(" ");
      console.log(`${name} ${label} optimal: ${stat.optimal}`);
      break;
    }
    case "statstatus": {
      const [name, label, value] = rest;
      assertStatus(value);
      const audit = findAudit(data, name);
      const stat = findStat(audit, label);
      stat._status = value;
      console.log(`${name} ${label} status: ${value}`);
      break;
    }
    case "notes": {
      const [name, ...valueParts] = rest;
      const audit = findAudit(data, name);
      audit.notes = valueParts.join(" ");
      console.log(`${name} audit notes: ${audit.notes}`);
      break;
    }
    case "build": {
      const [name, ...valueParts] = rest;
      const audit = findAudit(data, name);
      audit.buildType = valueParts.join(" ");
      console.log(`${name} buildType: ${audit.buildType}`);
      break;
    }
    case "prio": {
      const [name, value] = rest;
      assertStatus(value);
      const audit = findAudit(data, name);
      audit.priorityStatus = value;
      console.log(`${name} priorityStatus: ${value}`);
      break;
    }
    case "seq":
    case "weapon":
    case "rank":
    case "echo": {
      const [name, ...valueParts] = rest;
      const r = findResonator(data, name);
      const field = cmd === "seq" ? "sequence" : cmd === "rank" ? "weaponRank" : cmd === "echo" ? "echoSet" : "weapon";
      r[field] = valueParts.join(" ");
      console.log(`${name} ${field}: ${r[field]}`);
      break;
    }
    case "level": {
      const [name, value] = rest;
      const r = findResonator(data, name);
      r.level = parseIntOrThrow(value, "level");
      console.log(`${name} level: ${r.level}`);
      break;
    }
    case "weapontype": {
      const [name, value] = rest;
      if (!name || !value) throw new Error(`usage: weapontype <name> <${WEAPON_TYPES.join("|")}>`);
      if (!WEAPON_TYPES.includes(value)) {
        throw new Error(`weapon type must be one of: ${WEAPON_TYPES.join(", ")} (got "${value}")`);
      }
      const r = findResonator(data, name);
      console.log(`${name} weaponType: ${r.weaponType ?? ""} → ${value}`);
      r.weaponType = value;
      break;
    }
    case "sigweapon": {
      const [name, fieldRaw, ...valueParts] = rest;
      if (!name || !fieldRaw) throw new Error(`usage: sigweapon <weapon> <field> <value>  (fields: ${Object.keys(SIGWEAPON_FIELDS).join(", ")})`);
      const key = SIGWEAPON_FIELDS[fieldRaw.toLowerCase()];
      if (!key) throw new Error(`sigweapon field must be one of: ${Object.keys(SIGWEAPON_FIELDS).join(", ")} (got "${fieldRaw}")`);
      const w = findSigWeapon(data, name);
      const value = valueParts.join(" ");
      console.log(`${name} ${key}: ${w[key] ?? ""} → ${value}`);
      w[key] = value;
      break;
    }
    case "addsigweapon": {
      const [name, type, ...wearerParts] = rest;
      if (!name) throw new Error(`usage: addsigweapon <weapon> <type> <wearer>`);
      const wearer = wearerParts.join(" ");
      const list = ensureSigWeapons(data);
      if (list.some((x) => x.name === name)) throw new Error(`Signature weapon "${name}" already exists`);
      list.push({
        name,
        type: type ?? "",
        wearer,
        baseAtk: "",
        mainStat: "",
        mainStatValue: "",
        passiveName: "",
        passive: "",
        synergy: "",
      });
      // Auto-link the wearer's resonator at this weapon. The render resolves a sig via
      // `resonator.weapon === sigWeapon.name` (signatureWeaponOf), so a weapon entry with
      // no matching resonator.weapon renders nothing AND has no image. Set it at creation,
      // but only when the slot is empty so an existing link is never clobbered.
      let linkNote = "";
      if (wearer) {
        const r = data.resonators.find((x) => x.name === wearer);
        if (!r) linkNote = ` (no resonator "${wearer}" to link — set it later with: weapon "${wearer}" "${name}")`;
        else if (!r.weapon) {
          r.weapon = name;
          linkNote = ` — linked ${wearer}.weapon → "${name}"`;
        } else if (r.weapon !== name) {
          linkNote = ` (${wearer} already wields "${r.weapon as string}", left as-is — re-point with: weapon "${wearer}" "${name}")`;
        } else {
          linkNote = ` (${wearer} already linked)`;
        }
      }
      console.log(`added signature weapon "${name}" (${type ?? "?"} · ${wearer || "no wearer"})${linkNote}`);
      console.log(`  fill it: sigweapon "${name}" passive "..."`);
      break;
    }
    case "addresonator": {
      const [name, element, weaponType, role, sequenceArg, levelArg] = rest;
      const usage =
        `usage: addresonator <name> <element> <weaponType> <role> [sequence=S0] [level=0]\n` +
        `  element:    ${ELEMENTS.join(" | ")}\n` +
        `  weaponType: ${WEAPON_TYPES.join(" | ")}\n` +
        `  role:       ${ROLES.join(" | ")}\n` +
        `  e.g. addresonator Lucy Fusion Pistols "Main DPS" S0 90`;
      if (!name || !element || !weaponType || !role) throw new Error(usage);
      if (!ELEMENTS.includes(element)) throw new Error(`element must be one of: ${ELEMENTS.join(", ")} (got "${element}")`);
      if (!WEAPON_TYPES.includes(weaponType)) throw new Error(`weaponType must be one of: ${WEAPON_TYPES.join(", ")} (got "${weaponType}")`);
      if (!ROLES.includes(role)) throw new Error(`role must be one of: ${ROLES.join(", ")} (got "${role}")`);
      const sequence = sequenceArg ?? "S0";
      if (!SEQUENCES.includes(sequence)) throw new Error(`sequence must be one of: ${SEQUENCES.join(", ")} (got "${sequence}")`);
      const level = levelArg !== undefined ? parseIntOrThrow(levelArg, "level") : 0;
      if (data.resonators.some((r) => r.name === name)) throw new Error(`Resonator "${name}" already exists`);

      const resonator: AnyRecord = {
        name, element, weaponType, role, sequence,
        weapon: "", weaponRank: "", echoSet: "", level, notes: "",
      };
      // Live Supabase blob — saved by the upsert at the end of main().
      applyNewResonator(data, resonator, blankAuditRow(name));
      console.log(`added resonator "${name}" (${element} · ${weaponType} · ${role} · ${sequence} · Lv${level}) → now ${data.resonators.length} resonators`);

      // public/data.json seed — generateStaticParams() reads it at build time,
      // so the new /r/<name>/ page only emits on GH Pages if the seed lists it.
      const seedPath = path.join(process.cwd(), "public", "data.json");
      const seed = JSON.parse(await fs.readFile(seedPath, "utf-8")) as Data;
      if (seed.resonators.some((r) => r.name === name)) {
        console.log(`  (public/data.json already had "${name}", left as-is)`);
      } else {
        applyNewResonator(seed, structuredClone(resonator), blankAuditRow(name));
        // Match the existing file: 2-space indent, CRLF, no trailing newline.
        await fs.writeFile(seedPath, JSON.stringify(seed, null, 2).replace(/\n/g, "\r\n"), "utf-8");
        console.log(`  ✓ synced public/data.json — rebuild + push to emit /r/${name}/ on prod`);
      }
      console.log(`  next: npm run update -- stat ${name} ATK "..." · build ${name} "CRIT DPS" · echoslot ${name} 1 main "Crit DMG" 44`);
      break;
    }
    case "echoslot": {
      const [name, slotArg, ...slotRest] = rest;
      if (!name) throw new Error(`usage: echoslot <name> <1-5|show> ...`);
      const build = findEchoBuild(data, name);

      if (slotArg === "show") {
        const echoes = build.echoes as Echo[];
        const bv = scoreBuild(echoes, build.weights as StatWeights);
        console.log(`${name} — ${bv.grade}${bv.score !== null ? ` (${Math.round(bv.score)})` : ""} · ${bv.graded} graded · ${bv.headline}`);
        echoes.forEach((e, i) => {
          const ev = scoreEcho(e, build.weights as StatWeights);
          const subs = e.substats.filter((s) => s.stat).map((s) => `${s.stat} ${s.value}`).join(", ") || "—";
          const grade = ev.score !== null ? `${ev.grade} (${Math.round(ev.score)})` : "—";
          const identity = e.name ? ` ${e.name}${e.sonata ? ` · ${e.sonata}` : ""} ·` : e.sonata ? ` ${e.sonata} ·` : "";
          console.log(`  [${e.cost}c] slot ${i + 1}:${identity} ${e.mainStat || "—"} ${e.mainValue || ""} · subs: ${subs} · ${grade}${ev.deadStats.length ? ` · dead: ${ev.deadStats.join(", ")}` : ""}`);
        });
        mutated = false;
        return;
      }

      // Set the whole cost spread at once, e.g. `echoslot Cartethyia spread 4-4-1-1-1`.
      if (slotArg === "spread") {
        const spec = slotRest[0];
        if (!spec) throw new Error(`usage: echoslot ${name} spread <e.g. 4-4-1-1-1>`);
        const costs = spec.split("-").map((c) => parseIntOrThrow(c, "cost"));
        if (costs.length !== 5) throw new Error(`spread needs exactly 5 costs (got ${costs.length}): "${spec}"`);
        const echoes = build.echoes as Echo[];
        const cleared: number[] = [];
        costs.forEach((c, i) => {
          if (c !== 1 && c !== 3 && c !== 4) throw new Error(`cost must be 1, 3, or 4 (slot ${i + 1} got ${c})`);
          echoes[i].cost = c as EchoCost;
          if (echoes[i].mainStat && !MAIN_STAT_POOLS[c as EchoCost].includes(echoes[i].mainStat as EchoMainStatLabel)) {
            echoes[i].mainStat = "";
            echoes[i].mainValue = 0;
            cleared.push(i + 1);
          }
        });
        const total = costs.reduce((a, b) => a + b, 0);
        console.log(`${name} spread set: ${costs.join("-")} (total cost ${total}${total > 12 ? " — OVER the 12 budget!" : ""})`);
        if (cleared.length) console.log(`  cleared now-invalid main stat on slot(s): ${cleared.join(", ")}`);
        break;
      }

      const slot = parseIntOrThrow(slotArg, "slot");
      if (slot < 1 || slot > 5) throw new Error(`slot must be 1-5 (got ${slot})`);
      const echo = (build.echoes as Echo[])[slot - 1];
      const cost = echo.cost; // per-echo, not the standard spread — supports custom layouts
      const [kind, ...kindRest] = slotRest;

      if (kind === "main") {
        const [stat, valueStr] = [kindRest[0], kindRest[1]];
        if (!stat) throw new Error(`usage: echoslot ${name} ${slot} main <stat> [value]`);
        if (!MAIN_STAT_POOLS[cost].includes(stat as EchoMainStatLabel)) {
          throw new Error(`"${stat}" is not a valid main stat for a ${cost}-cost echo. Pool: ${MAIN_STAT_POOLS[cost].join(", ")}`);
        }
        echo.mainStat = stat as EchoMainStatLabel;
        if (valueStr !== undefined) echo.mainValue = parseFloatOrThrow(valueStr, "main value");
        console.log(`${name} slot ${slot} (${cost}c) main: ${echo.mainStat}${valueStr !== undefined ? ` = ${echo.mainValue}` : ""}`);
      } else if (kind === "sub") {
        const [subIdxStr, stat, valueStr] = [kindRest[0], kindRest[1], kindRest[2]];
        const subIdx = parseIntOrThrow(subIdxStr, "substat index");
        if (subIdx < 1 || subIdx > 5) throw new Error(`substat index must be 1-5 (got ${subIdx})`);
        if (!stat || !SUBSTAT_POOL.includes(stat as EchoSubstatLabel)) {
          throw new Error(`"${stat}" is not a valid substat. Pool: ${SUBSTAT_POOL.join(", ")}`);
        }
        const value = parseFloatOrThrow(valueStr, "substat value");
        while (echo.substats.length < subIdx) echo.substats.push({ stat: "", value: 0 });
        echo.substats[subIdx - 1] = { stat: stat as EchoSubstatLabel, value };
        console.log(`${name} slot ${slot} (${cost}c) sub ${subIdx}: ${stat} = ${value}`);
      } else if (kind === "cost") {
        const c = parseIntOrThrow(kindRest[0], "cost");
        if (c !== 1 && c !== 3 && c !== 4) throw new Error(`cost must be 1, 3, or 4 (got ${c})`);
        echo.cost = c as EchoCost;
        let note = "";
        if (echo.mainStat && !MAIN_STAT_POOLS[c as EchoCost].includes(echo.mainStat as EchoMainStatLabel)) {
          echo.mainStat = "";
          echo.mainValue = 0;
          note = " · cleared now-invalid main stat";
        }
        console.log(`${name} slot ${slot} cost: ${echo.cost}${note}`);
      } else if (kind === "echo") {
        // Species name drives the monster-portrait icon on the echo card.
        // Unknown names warn (future patch species) but still save. "-" clears.
        const species = kindRest.join(" ").trim();
        if (!species) throw new Error(`usage: echoslot ${name} ${slot} echo <species name | ->`);
        if (species === "-") {
          delete echo.name;
          console.log(`${name} slot ${slot} echo: cleared`);
          break;
        }
        echo.name = species;
        const iconMap = JSON.parse(
          await fs.readFile(path.join(process.cwd(), "src", "lib", "echo-icons.json"), "utf-8"),
        ) as Record<string, string>;
        const known = iconMap[species];
        console.log(`${name} slot ${slot} echo: ${species}${known ? ` (icon ${known})` : " — ⚠ no icon mapped for this name; check spelling vs src/lib/echo-icons.json"}`);
      } else if (kind === "sonata") {
        const set = kindRest.join(" ").trim();
        if (!set) throw new Error(`usage: echoslot ${name} ${slot} sonata <set name | ->`);
        if (set === "-") {
          delete echo.sonata;
          console.log(`${name} slot ${slot} sonata: cleared`);
          break;
        }
        echo.sonata = set;
        const iconFile = path.join(process.cwd(), "public", "sonatas", `${set.replace(/\s+/g, "_")}.webp`);
        const hasIcon = await fs.access(iconFile).then(() => true, () => false);
        console.log(`${name} slot ${slot} sonata: ${set}${hasIcon ? "" : " — ⚠ no icon at public/sonatas/" + path.basename(iconFile)}`);
      } else {
        throw new Error(`usage: echoslot ${name} ${slot} <main|sub|cost|echo|sonata> ...`);
      }
      break;
    }
    case "forte": {
      // forte <name> <basic> <skill> <circuit> <liberation> <intro> [nodes=8]
      const [name, ...lv] = rest;
      if (!name || lv.length < 5) throw new Error(`usage: forte <name> <basic> <skill> <circuit> <liberation> <intro> [nodes 0-8]`);
      const r = findResonator(data, name);
      const [basic, skill, circuit, liberation, intro] = lv.slice(0, 5).map((v, i) => {
        const n = parseIntOrThrow(v, ["basic", "skill", "circuit", "liberation", "intro"][i]);
        if (n < 1 || n > 10) throw new Error(`forte levels are 1-10 (${["basic", "skill", "circuit", "liberation", "intro"][i]} got ${n})`);
        return n;
      });
      const nodes = lv[5] !== undefined ? parseIntOrThrow(lv[5], "nodes") : 8;
      if (nodes < 0 || nodes > 8) throw new Error(`nodes must be 0-8 (got ${nodes})`);
      r.forte = { basic, skill, circuit, liberation, intro, nodes };
      console.log(`${name} forte: basic ${basic} · skill ${skill} · circuit ${circuit} · lib ${liberation} · intro ${intro} · ${nodes}/8 nodes`);
      break;
    }
    case "echoweight": {
      const [name, statArg, weightStr] = rest;
      if (!name) throw new Error(`usage: echoweight <name> <stat> <0..1> | echoweight <name> reset`);
      const build = findEchoBuild(data, name);

      if (statArg === "reset") {
        const r = findResonator(data, name);
        const buildType = (findAudit(data, name).buildType as string) ?? "";
        build.weights = defaultWeightsFor(buildType, r.element as ElementName);
        console.log(`${name} weights re-seeded from buildType "${buildType}"`);
        break;
      }

      if (!statArg || !ALL_ECHO_STATS.has(statArg)) {
        throw new Error(`"${statArg}" is not a known echo stat. Valid: ${[...ALL_ECHO_STATS].join(", ")}`);
      }
      const weight = parseFloatOrThrow(weightStr, "weight");
      if (weight < 0 || weight > 1) throw new Error(`weight must be 0..1 (got ${weight})`);
      (build.weights as StatWeights)[statArg as EchoSubstatLabel] = weight;
      console.log(`${name} weight ${statArg} → ${weight}`);
      break;
    }
    case "bench": {
      const [rankStr, field, ...valueParts] = rest;
      const rank = parseIntOrThrow(rankStr, "rank");
      const b = data.benchmarks.find((x) => x.rank === rank);
      if (!b) throw new Error(`No benchmark with rank #${rank}`);
      if (!["best", "worst", "average", "spread", "notes", "element"].includes(field)) {
        throw new Error(`bench field must be one of: best, worst, average, spread, notes, element`);
      }
      b[field] = valueParts.join(" ");
      console.log(`bench #${rank} ${field}: ${b[field]}`);
      break;
    }
    case "deaths": {
      const [rankStr, value] = rest;
      const rank = parseIntOrThrow(rankStr, "rank");
      const b = data.benchmarks.find((x) => x.rank === rank);
      if (!b) throw new Error(`No benchmark with rank #${rank}`);
      b.deaths = parseIntOrThrow(value, "deaths");
      console.log(`bench #${rank} deaths: ${b.deaths}`);
      break;
    }
    case "addbench": {
      const [teamStr, bestArg, ...kvs] = rest;
      const usage =
        `usage: addbench <team> <best> [key=value ...]\n` +
        `  team:  comma-separated resonator names, e.g. "Lucy,Rebecca,Shorekeeper"\n` +
        `  best:  headline clear time, M:SS (e.g. 0:48)\n` +
        `  keys:  avg= worst= spread= deaths= element= notes= pos=<N|end>\n` +
        `  defaults: avg/worst=best · spread auto from worst-best · deaths=0 ·\n` +
        `            element auto from team · inserts at the best-time-sorted slot (override with pos=)\n` +
        `  e.g. addbench "Lucy,Rebecca,Shorekeeper" 0:48 worst=0:55 deaths=0 notes="Edgerunner debut"`;
      if (!teamStr || !bestArg) throw new Error(usage);
      const team = teamStr.split(",").map((s) => s.trim()).filter(Boolean);
      if (team.length === 0) throw new Error(`team is empty\n${usage}`);
      assertTime(bestArg, "best");

      // trailing key=value options (order-independent)
      const opts: Record<string, string> = {};
      for (const kv of kvs) {
        const eq = kv.indexOf("=");
        if (eq === -1) throw new Error(`option "${kv}" must be key=value\n${usage}`);
        opts[kv.slice(0, eq).trim().toLowerCase()] = kv.slice(eq + 1).trim();
      }
      const KNOWN_OPTS = ["avg", "average", "worst", "spread", "deaths", "element", "notes", "pos", "rank"];
      for (const k of Object.keys(opts)) {
        if (!KNOWN_OPTS.includes(k)) throw new Error(`unknown option "${k}". Valid: ${KNOWN_OPTS.join(", ")}`);
      }

      const best = bestArg;
      const average = opts.avg ?? opts.average ?? best;
      assertTime(average, "avg");
      const worst = opts.worst ?? best;
      assertTime(worst, "worst");
      let spread = opts.spread;
      if (!spread) {
        const d = Math.max(0, Math.round(durationToSec(worst) - durationToSec(best)));
        spread = `${d}s`;
      }
      const deaths = opts.deaths != null ? parseIntOrThrow(opts.deaths, "deaths") : 0;
      const element = opts.element ?? deriveBenchElement(data, team);
      const notes = opts.notes ?? "";

      const dup = data.benchmarks.find(
        (b) => Array.isArray(b.team) && (b.team as string[]).join("|") === team.join("|"),
      );
      if (dup) console.warn(`  ⚠ a benchmark with this exact lineup already exists (#${dup.rank}) — adding anyway`);

      const bench: AnyRecord = { rank: 0, team, element, best, worst, average, spread, deaths, notes };

      // default: insert at the best-time-sorted slot (fastest on top); pos=end
      // appends; pos=<N> inserts before rank N. Curated order is preserved —
      // only the new row is placed; nothing else moves. Re-sort with benchsort.
      const bestSec = durationToSec(best);
      const posOpt = opts.pos ?? opts.rank;
      let idx: number;
      if (posOpt === "end") {
        idx = data.benchmarks.length;
      } else if (posOpt != null) {
        idx = Math.min(Math.max(parseIntOrThrow(posOpt, "pos") - 1, 0), data.benchmarks.length);
      } else {
        idx = data.benchmarks.findIndex((b) => durationToSec(b.best as string) > bestSec);
        if (idx === -1) idx = data.benchmarks.length;
      }
      data.benchmarks.splice(idx, 0, bench);
      renumberBenchmarks(data);

      console.log(
        `added benchmark #${bench.rank} [${element || "?"}] ${team.join(" / ")} — ` +
          `best ${best} · avg ${average} · worst ${worst} · spread ${spread} · ${deaths === 0 ? "CLEAN" : "D" + deaths}`,
      );
      console.log(
        `  tweak it: bench ${bench.rank} best <M:SS> · deaths ${bench.rank} <n> · ` +
          `benchmove ${bench.rank} <up|down|top|bottom|N> · benchsort`,
      );
      break;
    }
    case "benchmove": {
      const [rankStr, dest] = rest;
      if (!rankStr || !dest) throw new Error(`usage: benchmove <rank> <up|down|top|bottom|N>`);
      const rank = parseIntOrThrow(rankStr, "rank");
      const from = data.benchmarks.findIndex((b) => b.rank === rank);
      if (from === -1) throw new Error(`No benchmark with rank #${rank}`);
      const [b] = data.benchmarks.splice(from, 1);
      const n = data.benchmarks.length; // length AFTER removal
      let to: number;
      if (dest === "up") to = Math.max(0, from - 1);
      else if (dest === "down") to = Math.min(n, from + 1);
      else if (dest === "top") to = 0;
      else if (dest === "bottom") to = n;
      else to = Math.min(Math.max(parseIntOrThrow(dest, "destination rank") - 1, 0), n);
      data.benchmarks.splice(to, 0, b);
      renumberBenchmarks(data);
      console.log(`moved "${(b.team as string[]).join(" / ")}" → now rank #${b.rank}`);
      break;
    }
    case "benchsort": {
      const field = (rest[0] ?? "best").toLowerCase();
      if (!["best", "average", "worst"].includes(field)) {
        throw new Error(`benchsort field must be one of: best, average, worst (got "${field}")`);
      }
      // sort ascending by the chosen time, tie-broken best → average → worst
      const key = (b: AnyRecord) => [
        durationToSec(b[field] as string),
        durationToSec(b.best as string),
        durationToSec(b.average as string),
        durationToSec(b.worst as string),
      ];
      data.benchmarks.sort((a, c) => {
        const ka = key(a), kc = key(c);
        for (let i = 0; i < ka.length; i++) if (ka[i] !== kc[i]) return ka[i] - kc[i];
        return 0;
      });
      renumberBenchmarks(data);
      console.log(`re-ranked ${data.benchmarks.length} benchmarks by ${field} time (fastest first):`);
      for (const b of data.benchmarks) console.log(`  #${b.rank} ${(b.team as string[]).join(" / ")} — ${b.best}`);
      break;
    }
    case "rmbench": {
      const rankStr = rest[0];
      if (!rankStr) throw new Error(`usage: rmbench <rank>`);
      const rank = parseIntOrThrow(rankStr, "rank");
      const idx = data.benchmarks.findIndex((b) => b.rank === rank);
      if (idx === -1) throw new Error(`No benchmark with rank #${rank}`);
      const [b] = data.benchmarks.splice(idx, 1);
      renumberBenchmarks(data);
      console.log(`removed benchmark "${(b.team as string[]).join(" / ")}" (was #${rank}) — ${data.benchmarks.length} remain`);
      break;
    }
    case "cycle": {
      const [cycleIdStr, sub, ...subRest] = rest;
      const cycleId = parseIntOrThrow(cycleIdStr, "cycleId");
      const cycle = data.endstateMatrix.cycles.find((x) => x.id === cycleId);
      if (!cycle) throw new Error(`No cycle with id ${cycleId}`);
      if (sub !== "team") throw new Error(`cycle sub-command must be "team"`);
      const [orderStr, field, ...valueParts] = subRest;
      const order = parseIntOrThrow(orderStr, "team order");
      const team = cycle.teams.find((x) => x.order === order);
      if (!team) throw new Error(`No team #${order} in cycle ${cycleId}`);
      const value = valueParts.join(" ");
      if (field === "score") {
        team.score = parseIntOrThrow(value, "score");
        team.over5k = (team.score as number) >= 5000;
        // Recompute cycle totalPoints + teamsOver5k.
        cycle.totalPoints = cycle.teams.reduce((acc, t) => acc + ((t.score as number) || 0), 0);
        cycle.teamsOver5k = cycle.teams.filter((t) => t.over5k).length;
        console.log(`cycle ${cycleId} team ${order} score → ${value} (totalPoints recomputed to ${cycle.totalPoints})`);
      } else if (field === "rating") {
        team.rating = value;
        console.log(`cycle ${cycleId} team ${order} rating → ${value}`);
      } else if (field === "buff" || field === "notes") {
        team[field] = value;
        console.log(`cycle ${cycleId} team ${order} ${field} → ${value}`);
      } else if (field === "members") {
        team.members = value.split(",").map((s) => s.trim()).filter(Boolean);
        console.log(`cycle ${cycleId} team ${order} members → ${JSON.stringify(team.members)}`);
      } else if (field === "over5k") {
        team.over5k = value === "true";
        cycle.teamsOver5k = cycle.teams.filter((t) => t.over5k).length;
        console.log(`cycle ${cycleId} team ${order} over5k → ${team.over5k}`);
      } else {
        throw new Error(`cycle team field must be one of: score, rating, buff, notes, members, over5k`);
      }
      break;
    }
    case "cycleTotal": {
      const [cycleIdStr, value] = rest;
      const cycleId = parseIntOrThrow(cycleIdStr, "cycleId");
      const cycle = data.endstateMatrix.cycles.find((x) => x.id === cycleId);
      if (!cycle) throw new Error(`No cycle with id ${cycleId}`);
      cycle.totalPoints = parseIntOrThrow(value, "totalPoints");
      console.log(`cycle ${cycleId} totalPoints → ${cycle.totalPoints}`);
      break;
    }
    case "addcycle": {
      const fileIdx = rest.indexOf("--file");
      const filePath = fileIdx !== -1 ? rest[fileIdx + 1] : undefined;
      if (!filePath) {
        throw new Error(
          `usage: addcycle --file <path-to-cycle.json>\n` +
            `  JSON: { id?, date, label, target, teamTarget, dayOne, teams[], lessons[] }\n` +
            `  team: { order?, members[]|"A,B,C", buff, score, rating?, over5k?, notes }\n` +
            `  id auto-assigns to max+1; totalPoints / teamsOver5k / over5k derive from scores (>=5000)`,
        );
      }
      const raw = JSON.parse(await fs.readFile(path.resolve(filePath), "utf-8")) as AnyRecord;
      const cycles = data.endstateMatrix.cycles;
      const id =
        raw.id != null
          ? parseIntOrThrow(String(raw.id), "cycle id")
          : cycles.reduce((m, c) => Math.max(m, c.id), 0) + 1;
      if (cycles.some((c) => c.id === id)) {
        throw new Error(`Cycle id ${id} already exists — omit "id" to auto-assign, or pick a free one`);
      }
      if (!raw.label) throw new Error(`cycle JSON needs a "label"`);
      if (!raw.date) throw new Error(`cycle JSON needs a "date" (YYYY-MM-DD)`);
      if (!Array.isArray(raw.teams) || raw.teams.length === 0) {
        throw new Error(`cycle JSON needs a non-empty "teams" array`);
      }

      const VALID_RATINGS = ["", "B", "A", "S", "SS", "SSS", "CROWNED"];
      const teams = (raw.teams as AnyRecord[]).map((t, i) => {
        const order = t.order != null ? parseIntOrThrow(String(t.order), "team order") : i + 1;
        const score = parseIntOrThrow(String(t.score ?? 0), `team ${order} score`);
        let rating = String(t.rating ?? "").trim();
        if (rating === "—" || rating === "-") rating = ""; // em-dash / dash both mean "no rating"
        if (!VALID_RATINGS.includes(rating)) {
          throw new Error(
            `team ${order} rating "${rating}" invalid — use one of: ${VALID_RATINGS.filter(Boolean).join(", ")} (or empty)`,
          );
        }
        const members = Array.isArray(t.members)
          ? (t.members as unknown[]).map((m) => String(m).trim()).filter(Boolean)
          : String(t.members ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        return {
          order,
          members,
          buff: String(t.buff ?? ""),
          score,
          rating,
          over5k: typeof t.over5k === "boolean" ? t.over5k : score >= 5000,
          notes: String(t.notes ?? ""),
        };
      });

      const totalPoints = teams.reduce((acc, t) => acc + t.score, 0);
      const teamsOver5k = teams.filter((t) => t.over5k).length;
      if (raw.totalPoints != null && Number(raw.totalPoints) !== totalPoints) {
        console.warn(`  ⚠ file totalPoints ${raw.totalPoints} ≠ sum of scores ${totalPoints} — using computed ${totalPoints}`);
      }
      if (raw.teamsOver5k != null && Number(raw.teamsOver5k) !== teamsOver5k) {
        console.warn(`  ⚠ file teamsOver5k ${raw.teamsOver5k} ≠ computed ${teamsOver5k} — using computed ${teamsOver5k}`);
      }

      const cycle = {
        id,
        date: String(raw.date),
        label: String(raw.label),
        totalPoints,
        target: parseIntOrThrow(String(raw.target ?? 0), "target"),
        teamsOver5k,
        teamTarget: parseIntOrThrow(String(raw.teamTarget ?? 0), "teamTarget"),
        dayOne: Boolean(raw.dayOne),
        teams,
        lessons: Array.isArray(raw.lessons) ? (raw.lessons as unknown[]).map(String) : [],
      };
      cycles.push(cycle);
      cycles.sort((a, b) => a.id - b.id);
      console.log(
        `added cycle ${id} "${cycle.label}" (${cycle.date}) — ${teams.length} teams · ` +
          `${totalPoints.toLocaleString()} pts / ${cycle.target.toLocaleString()} target · ` +
          `${teamsOver5k}/${cycle.teamTarget} over 5k${cycle.dayOne ? " · day-one" : ""}`,
      );
      for (const t of teams) {
        console.log(
          `  #${t.order} ${t.members.join(" / ")} — ${t.score.toLocaleString()}` +
            `${t.rating ? ` · ${t.rating}` : ""}${t.over5k ? " · 5K+" : ""} · ${t.buff}`,
        );
      }
      break;
    }
    case "action": {
      const [idxStr, field, ...valueParts] = rest;
      const idx = parseIntOrThrow(idxStr, "idx");
      const item = data.actionItems[idx];
      if (!item) throw new Error(`No action item at idx ${idx}`);
      if (!["task", "detail", "status"].includes(field)) {
        throw new Error(`action field must be one of: task, detail, status`);
      }
      if (field === "status") assertStatus(valueParts.join(" "));
      item[field] = valueParts.join(" ");
      console.log(`action[${idx}] ${field}: ${item[field]}`);
      break;
    }
    case "finding": {
      const [idxStr, ...valueParts] = rest;
      const idx = parseIntOrThrow(idxStr, "idx");
      if (idx < 0 || idx >= data.keyFindings.length) {
        throw new Error(`finding idx must be 0..${data.keyFindings.length - 1}`);
      }
      data.keyFindings[idx] = valueParts.join(" ");
      console.log(`finding[${idx}]: ${data.keyFindings[idx]}`);
      break;
    }
    default:
      console.error(`Unknown command: ${cmd}\n`);
      console.log(HELP);
      mutated = false;
      process.exitCode = 1;
      return;
  }

  if (!mutated) return;

  data.meta.updated = new Date().toISOString().slice(0, 10);
  if (dry) {
    console.log(`\n[--dry] computed result NOT saved to Supabase.`);
    return;
  }
  const { error: saveError } = await supabase
    .from(SUPABASE_TABLE)
    .upsert(
      {
        profile: PROFILE_KEY,
        data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile" },
    );
  if (saveError) throw saveError;
  console.log(`✓ saved to Supabase (profile=${PROFILE_KEY})`);
}

main().catch((e) => {
  console.error("✕", e instanceof Error ? e.message : e);
  process.exit(1);
});
