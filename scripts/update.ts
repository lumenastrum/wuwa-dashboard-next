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
 *   npm run update -- cycle 2 team 7 score 13500
 *   npm run update -- cycle 2 team 7 rating CROWNED
 *   npm run update -- cycle 2 team 7 notes "carry by Aemeath"
 *   npm run update -- action 0 status green
 *   npm run update -- finding 0 "new finding text"
 *   npm run update -- list
 *   npm run update -- help
 */

import { createClient } from "@supabase/supabase-js";
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

const SUPABASE_URL = "https://ayhrqkxdeecybjhmgdoq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5aHJxa3hkZWVjeWJqaG1nZG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTI0NjcsImV4cCI6MjA5Mzg2ODQ2N30.GN-y9xEyNfQUVUXCqOGJC5cpN35X7B8PpOlFJPn10A8";
const SUPABASE_TABLE = "dashboard_profiles";
const PROFILE_KEY = "andres-wuwa";

const STATUSES = ["green", "yellow", "red", "neutral"];
const WEAPON_TYPES = ["Sword", "Pistols", "Broadblade", "Gauntlets", "Rectifier"];

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

const HELP = `WuWa dashboard CLI · profile ${PROFILE_KEY}

usage: npm run update -- <command> <args>

resonator:
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
  echoslot <name> spread <4-4-1-1-1>              set the whole cost spread at once
  echoslot <name> show                            print build + stat grade
  echoweight <name> <stat> <0..1>                 tune one audit weight
  echoweight <name> reset                         re-seed weights from buildType
    e.g. echoslot Aemeath 1 main "Crit DMG" 44
         echoslot Aemeath 1 sub 1 "Crit Rate" 9.3
         echoweight Aemeath "Resonance Liberation DMG" 0.8

resonator rating (read-only, Optimizer weighting):
  rating <name>                                   echo+stats+sig+seq → one grade

signature weapon (by weapon name, not resonator):
  sigweapon <weapon> <field> <value>    field: ${Object.keys(SIGWEAPON_FIELDS).join("|")}
  addsigweapon <weapon> <type> <wearer> create a new blank weapon entry
    e.g. sigweapon "Ages of Harvest" passive "On cast, ATK +12%..."
         sigweapon "Ages of Harvest" synergy "Doubles Jinhsi's Incandescence ramp"
         sigweapon "Ages of Harvest" mainstat "Crit DMG"

benchmark:
  bench <rank> <best|worst|average|spread|notes|element> <value>
  deaths <rank> <int>

cycle:
  cycle <id> team <order> score <int>
  cycle <id> team <order> rating <""|S|SS|SSS|CROWNED>
  cycle <id> team <order> buff <text>
  cycle <id> team <order> notes <text>
  cycle <id> team <order> members <"A,B,C">     comma-separated names
  cycle <id> team <order> over5k <true|false>
  cycleTotal <id> <int>                   override totalPoints

misc:
  action <idx> <task|detail|status> <value>
  finding <idx> <text>
  list                                    print summary
  help                                    this message`;

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === "help" || argv[0] === "--help") {
    console.log(HELP);
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
      const list = ensureSigWeapons(data);
      if (list.some((x) => x.name === name)) throw new Error(`Signature weapon "${name}" already exists`);
      list.push({
        name,
        type: type ?? "",
        wearer: wearerParts.join(" "),
        baseAtk: "",
        mainStat: "",
        mainStatValue: "",
        passiveName: "",
        passive: "",
        synergy: "",
      });
      console.log(`added signature weapon "${name}" (${type ?? "?"} · ${wearerParts.join(" ") || "no wearer"}) — fill it with: sigweapon "${name}" passive "..."`);
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
          console.log(`  [${e.cost}c] slot ${i + 1}: ${e.mainStat || "—"} ${e.mainValue || ""} · subs: ${subs} · ${grade}${ev.deadStats.length ? ` · dead: ${ev.deadStats.join(", ")}` : ""}`);
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
      } else {
        throw new Error(`usage: echoslot ${name} ${slot} <main|sub|cost> ...`);
      }
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
