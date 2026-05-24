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

const SUPABASE_URL = "https://ayhrqkxdeecybjhmgdoq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5aHJxa3hkZWVjeWJqaG1nZG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTI0NjcsImV4cCI6MjA5Mzg2ODQ2N30.GN-y9xEyNfQUVUXCqOGJC5cpN35X7B8PpOlFJPn10A8";
const SUPABASE_TABLE = "dashboard_profiles";
const PROFILE_KEY = "andres-wuwa";

const STATUSES = ["green", "yellow", "red", "neutral"];

type AnyRecord = Record<string, unknown>;
interface Data {
  meta: { updated: string; [k: string]: unknown };
  resonators: AnyRecord[];
  audit: { name: string; stats: AnyRecord[]; [k: string]: unknown }[];
  benchmarks: AnyRecord[];
  actionItems: AnyRecord[];
  keyFindings: string[];
  endstateMatrix: { cycles: { id: number; teams: AnyRecord[]; [k: string]: unknown }[] };
  [k: string]: unknown;
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
  rank <name> <text>                    set weaponRank (R1..R5)
  echo <name> <text>                    set echoSet

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
