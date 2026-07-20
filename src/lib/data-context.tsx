"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getSupabase,
  PROFILE_KEY,
  SAVE_DEBOUNCE_MS,
  SUPABASE_TABLE,
} from "./supabase";
import { BASE_PATH } from "./base-path";
import type { DashboardData, EchoBuild, Resonator, RosterEntry, SignatureWeapon } from "./types";
import { blankEchoes, defaultWeightsFor } from "./echo-audit";
import { routeName } from "./route-name";

export type SyncStatus = "loading" | "live" | "saving" | "local" | "error";

interface DataContextValue {
  raw: DashboardData;
  roster: RosterEntry[];
  rosterByName: Record<string, RosterEntry>;
  syncStatus: SyncStatus;
  update: (mutator: (draft: DashboardData) => void) => void;
  reload: () => Promise<void>;
}

const DataCtx = createContext<DataContextValue | null>(null);

// Make sure every resonator's signature weapon has an entry. Additive +
// idempotent, so adding a resonator later auto-gets a blank stub to fill in.
function ensureSignatureWeapons(data: DashboardData): DashboardData {
  if (!Array.isArray(data.signatureWeapons)) data.signatureWeapons = [];
  const known = new Set(data.signatureWeapons.map((w) => w.name));
  for (const r of data.resonators) {
    if (r.weapon && !known.has(r.weapon)) {
      data.signatureWeapons.push({
        name: r.weapon,
        type: r.weaponType,
        wearer: r.name,
        baseAtk: "",
        mainStat: "",
        mainStatValue: "",
        passiveName: "",
        passive: "",
        synergy: "",
      });
      known.add(r.weapon);
    }
  }
  return data;
}

// Make sure every resonator has an echo build. Additive + idempotent: only
// adds blank builds for resonators lacking one, and only seeds weights when
// absent/empty — never overwrites a user-tuned profile or deletes data.
export function ensureEchoBuilds(data: DashboardData): DashboardData {
  if (!Array.isArray(data.echoBuilds)) data.echoBuilds = [];
  const byName = new Map(data.echoBuilds.map((b) => [b.resonator, b]));
  for (const r of data.resonators) {
    const buildType = data.audit.find((a) => a.name === r.name)?.buildType ?? "";
    const existing = byName.get(r.name);
    if (!existing) {
      data.echoBuilds.push({
        resonator: r.name,
        echoes: blankEchoes(),
        weights: defaultWeightsFor(buildType, r.element),
      });
    } else if (!existing.weights || Object.keys(existing.weights).length === 0) {
      existing.weights = defaultWeightsFor(buildType, r.element);
    }
  }
  return data;
}

function deriveRoster(raw: DashboardData) {
  const roster: RosterEntry[] = raw.resonators.map((r) => ({
    ...r,
    audit: raw.audit.find((a) => a.name === r.name),
  }));
  const rosterByName = Object.fromEntries(roster.map((r) => [r.name, r]));
  return { roster, rosterByName };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [raw, setRaw] = useState<DashboardData | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRaw = useRef<DashboardData | null>(null);
  const supa = getSupabase();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let data: DashboardData | null = null;

        if (supa) {
          const { data: row, error } = await supa
            .from(SUPABASE_TABLE)
            .select("data")
            .eq("profile", PROFILE_KEY)
            .maybeSingle();
          if (error) {
            console.warn("Supabase load error, falling back to JSON", error);
          } else if (row?.data) {
            data = row.data as DashboardData;
          }
        }

        if (!data) {
          const resp = await fetch(`${BASE_PATH}/data.json`, { cache: "no-store" });
          if (!resp.ok) throw new Error("HTTP " + resp.status);
          data = (await resp.json()) as DashboardData;
          if (supa) {
            await supa
              .from(SUPABASE_TABLE)
              .upsert(
                {
                  profile: PROFILE_KEY,
                  data,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "profile" },
              );
          }
        }

        if (!mounted) return;
        ensureSignatureWeapons(data);
        ensureEchoBuilds(data);
        latestRaw.current = data;
        setRaw(data);
        setSyncStatus(supa ? "live" : "local");
      } catch (e) {
        console.error("Data load failed", e);
        if (mounted) setSyncStatus("error");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supa]);

  const scheduleSave = useCallback(() => {
    if (!supa) {
      setSyncStatus("local");
      return;
    }
    setSyncStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!latestRaw.current) return;
      try {
        const { error } = await supa
          .from(SUPABASE_TABLE)
          .upsert(
            {
              profile: PROFILE_KEY,
              data: latestRaw.current,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "profile" },
          );
        if (error) throw error;
        setSyncStatus("live");
      } catch (e) {
        console.error("Save failed", e);
        setSyncStatus("error");
      }
    }, SAVE_DEBOUNCE_MS);
  }, [supa]);

  const update = useCallback(
    (mutator: (draft: DashboardData) => void) => {
      setRaw((prev) => {
        if (!prev) return prev;
        const draft = structuredClone(prev);
        mutator(draft);
        latestRaw.current = draft;
        return draft;
      });
      scheduleSave();
    },
    [scheduleSave],
  );

  const reload = useCallback(async () => {
    if (!supa) return;
    setSyncStatus("loading");
    const { data: row, error } = await supa
      .from(SUPABASE_TABLE)
      .select("data")
      .eq("profile", PROFILE_KEY)
      .maybeSingle();
    if (!error && row?.data) {
      const data = row.data as DashboardData;
      ensureSignatureWeapons(data);
      ensureEchoBuilds(data);
      latestRaw.current = data;
      setRaw(data);
      setSyncStatus("live");
    } else {
      setSyncStatus("error");
    }
  }, [supa]);

  if (!raw) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9db8bd",
          fontFamily: "var(--font-martian), ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: 2,
          background: "#050f15",
        }}
      >
        {syncStatus === "error" ? "DATA UNAVAILABLE" : "SYNCING ROSTER…"}
      </div>
    );
  }

  const { roster, rosterByName } = deriveRoster(raw);

  return (
    <DataCtx.Provider
      value={{ raw, roster, rosterByName, syncStatus, update, reload }}
    >
      {children}
    </DataCtx.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}

// Pure selectors — take data as input, no module-level state.
export function roleAccent(role: Resonator["role"]): string {
  if (role === "Main DPS") return "DPS";
  if (role === "Sub-DPS") return "SUB";
  if (role === "Support") return "SUP";
  return role;
}

export function rosterIndexOf(roster: RosterEntry[], name: string): number {
  return roster.findIndex((r) => r.name === name);
}

export function rosterNeighborsOf(
  roster: RosterEntry[],
  name: string,
): { prev: RosterEntry; next: RosterEntry } {
  const idx = Math.max(0, rosterIndexOf(roster, name));
  return {
    prev: roster[(idx - 1 + roster.length) % roster.length],
    next: roster[(idx + 1) % roster.length],
  };
}

export function teamsFeaturingOf(raw: DashboardData, name: string) {
  return raw.benchmarks.filter((b) => b.team.includes(name));
}

export function cycleAppearancesOf(raw: DashboardData, name: string) {
  return raw.endstateMatrix.cycles.flatMap((c) =>
    c.teams
      .filter((t) => t.members.includes(name))
      .map((t) => ({ ...t, cycleId: c.id, cycleLabel: c.label })),
  );
}

export function signatureWeaponOf(
  raw: DashboardData,
  weaponName: string,
): SignatureWeapon | undefined {
  return raw.signatureWeapons?.find((w) => w.name === weaponName);
}

export function echoBuildOf(
  raw: DashboardData,
  resonatorName: string,
): EchoBuild | undefined {
  return raw.echoBuilds?.find((b) => b.resonator === resonatorName);
}

export function getResonatorOrFirstOf(
  rosterByName: Record<string, RosterEntry>,
  roster: RosterEntry[],
  name: string | undefined,
): RosterEntry {
  if (name) {
    if (rosterByName[name]) return rosterByName[name];
    // Route params strip Windows-reserved characters (see route-name.ts), so a
    // param may not literally equal the display name it stands for.
    const byRoute = roster.find((r) => routeName(r.name) === routeName(name));
    if (byRoute) return byRoute;
  }
  return roster[0];
}
