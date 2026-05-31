/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useData, rosterIndexOf, rosterNeighborsOf, teamsFeaturingOf, getResonatorOrFirstOf, roleAccent, signatureWeaponOf, echoBuildOf } from "@/lib/data-context";
import { useEffect } from "react";
import { ELEMENTS, STATUS_HEX } from "@/lib/elements";
import { elementIcon, fiveStarIcon, portrait, tallPortrait, weaponTypeIcon } from "@/lib/portraits";
import { useTheme } from "@/lib/theme-context";
import { useEditMode } from "@/lib/edit-context";
import { WeaponImg } from "@/components/weapon-img";
import { EditableField } from "@/components/editable-field";
import { SonataIcons } from "@/components/sonata-icons";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import type { EchoCost, EchoMainStatLabel, EchoSubstatLabel, Sequence, Status } from "@/lib/types";
import { scoreBuild, scoreEcho, statusOf, MAIN_STAT_POOLS, SUBSTAT_POOL, isPercentStat, type EchoGrade } from "@/lib/echo-audit";
import { rateResonator } from "@/lib/resonator-rating";
import { deriveStatStatus } from "@/lib/stat-audit";
import { K_PAL, kStyles } from "./styles";
import { KPanel, KScanlines } from "./primitives";

const SEQUENCES: readonly Sequence[] = ["S0", "S1", "S2", "S3", "S4", "S5", "S6"];
const STATUSES: readonly Status[] = ["green", "yellow", "red", "neutral"];

// The prestige tiers earn their own chrome and a glow: S is GOLD (the optimal,
// peak-state milestone — a genuine arrival), SSS goes violet, and ✦ (the Clio
// sparkle — top of the ladder, basically a unicorn) gets a pink→gold gradient
// glyph. Everything below S rides the shared Status palette, no glow.
const PRESTIGE_HEX: Partial<Record<EchoGrade, string>> = { S: "#fbbf24", SSS: "#a78bfa", "✦": "#f9a8d4" };

// Grade chip used by the echo audit + resonator rating. `hero` is the largest
// size, reserved for the Resonator Rating — the at-a-glance number that grounds
// the whole page.
function GradePill({ grade, status, score, big, hero }: { grade: EchoGrade; status: Status; score: number | null; big?: boolean; hero?: boolean }) {
  const sparkle = grade === "✦";
  const glow = PRESTIGE_HEX[grade];
  const hex = glow ?? STATUS_HEX[status];
  const pad = hero ? "8px 16px" : big ? "5px 11px" : "2px 7px";
  const fs = hero ? 23 : big ? 16 : 11;
  const sfs = hero ? 14 : big ? 11 : 9;
  const glowR = hero ? 20 : big ? 14 : 8;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: hero ? 7 : 5,
        padding: pad,
        border: `1px solid ${hex}`, borderRadius: hero ? 4 : 3, color: hex,
        ...kStyles.mono, fontSize: fs, letterSpacing: hero ? 1.5 : 1, lineHeight: 1,
        background: `${hex}14`,
        boxShadow: glow ? `0 0 ${glowR}px ${hex}66` : undefined,
      }}
    >
      <span
        style={
          sparkle
            ? { fontWeight: 700, backgroundImage: "linear-gradient(90deg,#f9a8d4,#fcd34d)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }
            : { fontWeight: 700 }
        }
      >
        {grade}
      </span>
      {score !== null && <span style={{ opacity: 0.7, fontSize: sfs }}>{Math.round(score)}</span>}
    </span>
  );
}

// roll-quality 0..1 → a status tier for the substat bar color.
function qualityStatus(q: number): Status {
  return q >= 0.66 ? "green" : q >= 0.33 ? "yellow" : "red";
}

// One input bar in the Resonator Rating breakdown: sub-score + effective weight.
function RatingSubBar({ label, score, weight }: { label: string; score: number | null; weight: number }) {
  const hex = STATUS_HEX[statusOf(score)];
  const fill = score == null ? 0 : Math.min(100, score);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", ...kStyles.mono, fontSize: 9, color: K_PAL.textMute, letterSpacing: 1.5 }}>
        <span>{label}</span>
        <span style={{ color: score == null ? K_PAL.textMute : hex }}>
          {score == null ? "—" : Math.round(score)}
          <span style={{ opacity: 0.5 }}> · {Math.round(weight * 100)}%</span>
        </span>
      </div>
      <div style={{ height: 4, background: "#ffffff14", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${fill}%`, background: hex }} />
      </div>
    </div>
  );
}

export function ConsoleResonator({ name }: { name: string }) {
  const { raw, roster, rosterByName, update } = useData();
  const { isMobile, isTablet } = useDashboardViewport();
  const { editMode } = useEditMode();

  const r = getResonatorOrFirstOf(rosterByName, roster, name);
  const el = ELEMENTS[r.element];
  const teams = teamsFeaturingOf(raw, r.name);
  const sw = signatureWeaponOf(raw, r.weapon);
  const echoBuild = echoBuildOf(raw, r.name);
  const echoVerdict = echoBuild ? scoreBuild(echoBuild.echoes, echoBuild.weights) : null;
  const rating = rateResonator({
    sequence: r.sequence,
    weaponRank: r.weaponRank,
    hasWeapon: !!r.weapon,
    onSignature: !!sw && sw.wearer === r.name,
    stats: r.audit?.stats ?? [],
    echoScore: echoVerdict?.score ?? null,
  });
  const idx = Math.max(0, rosterIndexOf(roster, r.name));
  const { prev, next } = rosterNeighborsOf(roster, r.name);
  const { setLastResonator } = useTheme();

  useEffect(() => {
    setLastResonator(r.name);
  }, [r.name, setLastResonator]);

  // Edit closures — all lookup by `r.name` inside the mutator so index drift is safe.
  const setResonatorField = (field: "sequence" | "weapon" | "weaponRank" | "echoSet" | "notes", value: string) => {
    update((d) => {
      const target = d.resonators.find((x) => x.name === r.name);
      if (!target) return;
      (target as unknown as Record<string, unknown>)[field] = value;
    });
  };
  const setResonatorLevel = (value: string) => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return;
    update((d) => {
      const target = d.resonators.find((x) => x.name === r.name);
      if (target) target.level = n;
    });
  };
  const setAuditField = (field: "notes" | "buildType" | "priorityStatus", value: string) => {
    update((d) => {
      const a = d.audit.find((x) => x.name === r.name);
      if (!a) return;
      if (field === "priorityStatus") a.priorityStatus = value as Status;
      else if (field === "buildType") a.buildType = value;
      else a.notes = value;
    });
  };
  const setStatField = (statIdx: number, field: "current" | "optimal" | "_status", value: string) => {
    update((d) => {
      const a = d.audit.find((x) => x.name === r.name);
      if (!a || !a.stats[statIdx]) return;
      const stat = a.stats[statIdx];
      if (field === "_status") {
        stat._status = value as Status; // explicit manual override
      } else if (field === "current") {
        stat.current = value;
        // Numbers are ground truth: re-derive status from the band, falling back
        // to the existing status when there's no numeric basis to judge against.
        stat._status = deriveStatStatus(stat) ?? stat._status;
      } else {
        stat.optimal = value;
      }
    });
  };
  const setSigWeaponField = (
    field: "baseAtk" | "mainStat" | "mainStatValue" | "passiveName" | "passive" | "synergy",
    value: string,
  ) => {
    update((d) => {
      if (!Array.isArray(d.signatureWeapons)) d.signatureWeapons = [];
      let target = d.signatureWeapons.find((w) => w.name === r.weapon);
      if (!target) {
        target = {
          name: r.weapon, type: r.weaponType, wearer: r.name,
          baseAtk: "", mainStat: "", mainStatValue: "",
          passiveName: "", passive: "", synergy: "",
        };
        d.signatureWeapons.push(target);
      }
      target[field] = value;
    });
  };

  // Echo edit closures — look up build + slot by name inside the mutator.
  const parseNum = (v: string) => {
    const n = parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
  };
  const setEchoMain = (slot: number, field: "mainStat" | "mainValue", value: string) => {
    update((d) => {
      const e = d.echoBuilds?.find((x) => x.resonator === r.name)?.echoes[slot];
      if (!e) return;
      if (field === "mainStat") e.mainStat = value as EchoMainStatLabel | "";
      else e.mainValue = parseNum(value);
    });
  };
  // Cost is per-echo, so a resonator can run a non-standard spread (e.g. an HP
  // scaler's 4-4-1-1-1). Changing a slot's cost may orphan its main stat if the
  // stat isn't in the new cost's pool — clear it so the build can't go invalid.
  const setEchoCost = (slot: number, value: string) => {
    const cost = parseInt(value, 10) as EchoCost;
    if (cost !== 1 && cost !== 3 && cost !== 4) return;
    update((d) => {
      const e = d.echoBuilds?.find((x) => x.resonator === r.name)?.echoes[slot];
      if (!e) return;
      e.cost = cost;
      if (e.mainStat && !MAIN_STAT_POOLS[cost].includes(e.mainStat as EchoMainStatLabel)) {
        e.mainStat = "";
        e.mainValue = 0;
      }
    });
  };
  const setEchoSub = (slot: number, sub: number, field: "stat" | "value", value: string) => {
    update((d) => {
      const e = d.echoBuilds?.find((x) => x.resonator === r.name)?.echoes[slot];
      if (!e?.substats[sub]) return;
      if (field === "stat") e.substats[sub].stat = value as EchoSubstatLabel | "";
      else e.substats[sub].value = parseNum(value);
    });
  };
  const addEchoSub = (slot: number) => {
    update((d) => {
      const e = d.echoBuilds?.find((x) => x.resonator === r.name)?.echoes[slot];
      if (e && e.substats.length < 5) e.substats.push({ stat: "", value: 0 });
    });
  };
  const removeEchoSub = (slot: number, sub: number) => {
    update((d) => {
      const e = d.echoBuilds?.find((x) => x.resonator === r.name)?.echoes[slot];
      if (e && e.substats.length > 1) e.substats.splice(sub, 1);
    });
  };

  return (
    <div style={kStyles.shell}>
      <KScanlines />
      <div style={{ position: "relative", padding: isMobile ? "18px 16px 24px" : isTablet ? "22px 22px" : "24px 28px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            gap: isMobile ? 12 : 18,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              ...kStyles.mono,
              fontSize: 10,
              color: K_PAL.cyan,
              letterSpacing: 3,
            }}
          >
            ◢ MODULE / RESONATOR_PROFILE · UID_{String(idx + 1).padStart(3, "0")}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link
              href={`/r/${encodeURIComponent(prev.name)}`}
              style={{
                ...kStyles.mono,
                fontSize: 10,
                padding: "4px 10px",
                border: `1px solid ${K_PAL.border}`,
                color: K_PAL.textDim,
                letterSpacing: 1.5,
                textDecoration: "none",
              }}
            >
              ← {prev.name.toUpperCase()}
            </Link>
            <Link
              href={`/r/${encodeURIComponent(next.name)}`}
              style={{
                ...kStyles.mono,
                fontSize: 10,
                padding: "4px 10px",
                border: `1px solid ${K_PAL.border}`,
                color: K_PAL.textDim,
                letterSpacing: 1.5,
                textDecoration: "none",
              }}
            >
              {next.name.toUpperCase()} →
            </Link>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "440px 1fr", gap: 14 }}>
          <KPanel
            label={`PROFILE.${r.name.toUpperCase()}`}
            code={`UID.${String(idx + 1).padStart(3, "0")}`}
            accent={el.hex}
            style={{ padding: 0, overflow: "hidden" }}
          >
            <div
              style={{
                position: "relative",
                height: isMobile ? 430 : isTablet ? 520 : 580,
                background: `radial-gradient(circle at 50% 60%, ${el.hex}25, transparent 70%)`,
                overflow: "hidden",
              }}
            >
              <img
                src={tallPortrait(r.name)}
                alt={r.name}
                style={{
                  position: "absolute",
                  bottom: -10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  height: isMobile ? "102%" : "100%",
                  width: "auto",
                  maxWidth: "none",
                  filter: `drop-shadow(0 20px 40px ${el.glow})`,
                }}
              />
              <div style={{ position: "absolute", top: 16, left: 16 }}>
                <div
                  style={{
                    ...kStyles.mono,
                    fontSize: 9,
                    color: el.hex,
                    letterSpacing: 2,
                  }}
                >
                  ELEMENT
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <img src={elementIcon(r.element)} alt="" style={{ width: 24, height: 24 }} />
                  <div
                    style={{
                      ...kStyles.mono,
                      fontSize: 14,
                      color: K_PAL.text,
                      letterSpacing: 1,
                    }}
                  >
                    {el.label.toUpperCase()}
                  </div>
                </div>
              </div>
              <div style={{ position: "absolute", top: 16, right: 16, textAlign: "right" }}>
                <div
                  style={{
                    ...kStyles.mono,
                    fontSize: 9,
                    color: el.hex,
                    letterSpacing: 2,
                  }}
                >
                  SEQUENCE
                </div>
                <div style={{ ...kStyles.mono, fontSize: 24, color: K_PAL.text, marginTop: 2 }}>
                  <EditableField
                    value={r.sequence}
                    onCommit={(v) => setResonatorField("sequence", v)}
                    options={SEQUENCES}
                    align="right"
                    inputStyle={{ background: "rgba(0,0,0,0.6)" }}
                  />
                </div>
              </div>
              <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  {([
                    ["WEAPON", r.weaponType],
                    ["ROLE", roleAccent(r.role)],
                  ] as [string, string][]).map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        padding: "6px 10px",
                        background: "rgba(0,0,0,0.6)",
                        border: `1px solid ${el.hex}40`,
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <div
                        style={{
                          ...kStyles.mono,
                          fontSize: 8,
                          color: K_PAL.textMute,
                          letterSpacing: 1.5,
                        }}
                      >
                        {k}
                      </div>
                      <div
                        style={{
                          ...kStyles.mono,
                          fontSize: 12,
                          color: K_PAL.text,
                          marginTop: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        {k === "WEAPON" && (
                          <img
                            src={weaponTypeIcon(r.weaponType)}
                            alt={r.weaponType}
                            style={{ width: 14, height: 14 }}
                          />
                        )}
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img
                    src={fiveStarIcon()}
                    alt="5★"
                    title="5★ Resonator"
                    style={{ height: isMobile ? 13 : 16, width: "auto", flexShrink: 0 }}
                  />
                  <div
                    style={{
                      ...kStyles.display,
                      fontSize: isMobile ? 34 : 42,
                      color: K_PAL.text,
                      lineHeight: 1,
                      textShadow: `0 0 16px ${el.glow}`,
                    }}
                  >
                    {r.name.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </KPanel>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rating.score != null && (
              <KPanel label="RESONATOR RATING" code="RR.001" accent={STATUS_HEX[rating.status]}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: 16,
                    alignItems: isMobile ? "stretch" : "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 130 }}>
                    <GradePill grade={rating.grade} status={rating.status} score={rating.score} hero />
                    {rating.partial && (
                      <span style={{ ...kStyles.mono, fontSize: 8, color: K_PAL.textMute, letterSpacing: 1 }}>
                        PARTIAL
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
                      gap: 12,
                      flex: 1,
                    }}
                  >
                    {rating.subs.map((s) => (
                      <RatingSubBar key={s.key} label={s.label} score={s.score} weight={s.weight} />
                    ))}
                  </div>
                </div>
                <div style={{ ...kStyles.mono, fontSize: 8.5, color: K_PAL.textMute, letterSpacing: 1, marginTop: 10 }}>
                  OPTIMIZER WEIGHTING · ECHO 35 / STATS 35 / SIG 15 / SEQ 15 — BUILD QUALITY OVER INVESTMENT
                </div>
              </KPanel>
            )}
            {r.audit && (
              <KPanel
                label={`STATS_AUDIT · ${r.audit.buildType.toUpperCase()}`}
                code="AUDIT.001"
                accent={STATUS_HEX[r.audit.priorityStatus]}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, 1fr)",
                    gap: 12,
                  }}
                >
                  {r.audit.stats.map((s, statIdx) => {
                    const num = parseFloat(String(s.current).replace(/[,%]/g, "")) || 0;
                    const ceiling = s.max || (s.min || 1) * 1.4;
                    const pct = Math.min(100, (num / ceiling) * 100);
                    const c = STATUS_HEX[s._status] ?? K_PAL.text;
                    return (
                      <div key={s.label} style={{ position: "relative" }}>
                        <div
                          style={{
                            ...kStyles.mono,
                            fontSize: 9,
                            color: K_PAL.textMute,
                            letterSpacing: 2,
                          }}
                        >
                          {s.label}
                        </div>
                        <div
                          style={{
                            ...kStyles.mono,
                            fontSize: 24,
                            color: c,
                            marginTop: 4,
                          }}
                        >
                          <EditableField
                            value={s.current}
                            onCommit={(v) => setStatField(statIdx, "current", v)}
                            align="left"
                          />
                        </div>
                        <div
                          style={{
                            ...kStyles.mono,
                            fontSize: 9,
                            color: K_PAL.textMute,
                            marginTop: 2,
                            letterSpacing: 1,
                            display: "flex",
                            gap: 4,
                            alignItems: "center",
                          }}
                        >
                          <span>OPT</span>
                          <EditableField
                            value={s.optimal}
                            onCommit={(v) => setStatField(statIdx, "optimal", v)}
                            align="left"
                          />
                        </div>
                        <div style={{ display: "flex", gap: 1, marginTop: 6 }}>
                          {Array.from({ length: 12 }).map((_, i) => {
                            const on = (i / 12) * 100 < pct;
                            return (
                              <div
                                key={i}
                                style={{
                                  flex: 1,
                                  height: 4,
                                  background: on ? c : "rgba(120,220,255,0.08)",
                                }}
                              />
                            );
                          })}
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <EditableField
                            value={s._status}
                            onCommit={(v) => setStatField(statIdx, "_status", v)}
                            options={STATUSES}
                            staticStyle={{ display: "none" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    padding: "10px 12px",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${K_PAL.border}`,
                  }}
                >
                  <div
                    style={{
                      ...kStyles.mono,
                      fontSize: 9,
                      color: K_PAL.cyan,
                      letterSpacing: 2,
                      marginBottom: 4,
                      display: "flex",
                      gap: 12,
                      alignItems: "baseline",
                    }}
                  >
                    <span>// NOTES</span>
                    <EditableField
                      value={r.audit.buildType}
                      onCommit={(v) => setAuditField("buildType", v)}
                      staticStyle={{ color: K_PAL.amber }}
                      inputStyle={{ fontSize: 9 }}
                    />
                    <EditableField
                      value={r.audit.priorityStatus}
                      onCommit={(v) => setAuditField("priorityStatus", v)}
                      options={STATUSES}
                      staticStyle={{ display: "none" }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: K_PAL.text }}>
                    <EditableField
                      value={r.audit.notes}
                      onCommit={(v) => setAuditField("notes", v)}
                      multiline
                      placeholder="audit notes…"
                    />
                  </div>
                </div>
              </KPanel>
            )}

            <KPanel label="LOADOUT" code="GEAR.001" accent={el.hex}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div
                  style={{
                    padding: 12,
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${K_PAL.border}`,
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: 14,
                    alignItems: isMobile ? "stretch" : "center",
                  }}
                >
                  <div
                    style={{
                      width: isMobile ? 76 : 88,
                      height: isMobile ? 76 : 88,
                      background: `radial-gradient(circle at 50% 50%, ${el.hex}20, transparent 70%)`,
                      border: `1px solid ${el.hex}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <WeaponImg name={r.weapon} size={isMobile ? 68 : 80} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 9,
                        color: el.hex,
                        letterSpacing: 2,
                      }}
                    >
                      ▸ SIGNATURE WEAPON
                    </div>
                    <div
                      style={{
                        ...kStyles.display,
                        fontSize: 20,
                        color: K_PAL.text,
                        marginTop: 6,
                      }}
                    >
                      <EditableField
                        value={r.weapon}
                        onCommit={(v) => setResonatorField("weapon", v)}
                      />
                    </div>
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 10,
                        color: K_PAL.textDim,
                        marginTop: 4,
                        letterSpacing: 1,
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <EditableField
                        value={r.weaponRank}
                        onCommit={(v) => setResonatorField("weaponRank", v)}
                        width={56}
                      />
                      <span>·</span>
                      <span>LV.</span>
                      <EditableField
                        value={String(r.level)}
                        onCommit={setResonatorLevel}
                        width={56}
                      />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    padding: 12,
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${K_PAL.border}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      ...kStyles.mono,
                      fontSize: 10,
                      color: K_PAL.textDim,
                      letterSpacing: 1,
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ color: el.hex }}>BASE ATK</span>
                    <EditableField
                      value={sw?.baseAtk ?? ""}
                      onCommit={(v) => setSigWeaponField("baseAtk", v)}
                      width={60}
                      placeholder="—"
                    />
                    <span>·</span>
                    <EditableField
                      value={sw?.mainStat ?? ""}
                      onCommit={(v) => setSigWeaponField("mainStat", v)}
                      width={92}
                      placeholder="main stat"
                    />
                    <EditableField
                      value={sw?.mainStatValue ?? ""}
                      onCommit={(v) => setSigWeaponField("mainStatValue", v)}
                      width={70}
                      placeholder="+0%"
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 9,
                        color: el.hex,
                        letterSpacing: 2,
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <span>▸ PASSIVE</span>
                      <EditableField
                        value={sw?.passiveName ?? ""}
                        onCommit={(v) => setSigWeaponField("passiveName", v)}
                        placeholder="skill name"
                        inputStyle={{ fontSize: 11 }}
                        staticStyle={{ color: K_PAL.textDim }}
                      />
                    </div>
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 11,
                        marginTop: 5,
                        lineHeight: 1.5,
                      }}
                    >
                      <EditableField
                        value={sw?.passive ?? ""}
                        onCommit={(v) => setSigWeaponField("passive", v)}
                        multiline
                        placeholder="what it does — fill in edit mode or via the CLI"
                        staticStyle={{
                          color: sw?.passive ? K_PAL.text : K_PAL.textMute,
                          fontStyle: sw?.passive ? "normal" : "italic",
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 9,
                        color: K_PAL.amber,
                        letterSpacing: 2,
                      }}
                    >
                      ▸ WHY IT&apos;S CRACKED
                    </div>
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 11,
                        marginTop: 5,
                        lineHeight: 1.5,
                      }}
                    >
                      <EditableField
                        value={sw?.synergy ?? ""}
                        onCommit={(v) => setSigWeaponField("synergy", v)}
                        multiline
                        placeholder="why it's cracked for this resonator"
                        staticStyle={{
                          color: sw?.synergy ? K_PAL.text : K_PAL.textMute,
                          fontStyle: sw?.synergy ? "normal" : "italic",
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    padding: 12,
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${K_PAL.border}`,
                  }}
                >
                  <div
                    style={{
                      ...kStyles.mono,
                      fontSize: 9,
                      color: el.hex,
                      letterSpacing: 2,
                    }}
                  >
                    ▸ ECHO SET
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <SonataIcons
                      set={r.echoSet}
                      size={20}
                      badgeBg={K_PAL.panelStrong}
                      badgeColor={K_PAL.text}
                      style={{ marginBottom: 6 }}
                    />
                    <div style={{ ...kStyles.display, fontSize: 16, color: K_PAL.text }}>
                      <EditableField
                        value={r.echoSet}
                        onCommit={(v) => setResonatorField("echoSet", v)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </KPanel>

            {echoBuild && echoVerdict && (
              <KPanel label="ECHO AUDIT" code="ECHO.001" accent={el.hex}>
                {/* overall stat grade */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                  <GradePill grade={echoVerdict.grade} status={echoVerdict.status} score={echoVerdict.score} big />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ ...kStyles.display, fontSize: 15, color: K_PAL.text }}>{echoVerdict.headline}</div>
                    <div style={{ ...kStyles.mono, fontSize: 9, color: K_PAL.textDim, letterSpacing: 1.5, marginTop: 2 }}>
                      {echoVerdict.graded} GRADED · STAT GRADE ONLY — SET BONUS NOT SCORED
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                  {echoBuild.echoes.map((echo, i) => {
                    const ev = scoreEcho(echo, echoBuild.weights);
                    const mainPool: readonly string[] = ["", ...MAIN_STAT_POOLS[echo.cost]];
                    const subPool: readonly string[] = ["", ...SUBSTAT_POOL];
                    return (
                      <div
                        key={i}
                        style={{
                          padding: 12,
                          background: "rgba(0,0,0,0.3)",
                          border: `1px solid ${K_PAL.border}`,
                        }}
                      >
                        {/* cost badge (editable spread) + per-echo grade */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <EditableField
                            value={`${echo.cost}-COST`}
                            onCommit={(v) => setEchoCost(i, v)}
                            options={["4-COST", "3-COST", "1-COST"]}
                            width={64}
                            staticStyle={{ ...kStyles.mono, fontSize: 10, color: el.hex, letterSpacing: 1.5 }}
                            inputStyle={{ ...kStyles.mono, fontSize: 10 }}
                          />
                          <GradePill grade={ev.grade} status={ev.status} score={ev.score} />
                        </div>

                        {/* main stat */}
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                          <span style={{ ...kStyles.mono, fontSize: 9, color: K_PAL.textDim, letterSpacing: 1, minWidth: 32 }}>MAIN</span>
                          <EditableField
                            value={echo.mainStat}
                            onCommit={(v) => setEchoMain(i, "mainStat", v)}
                            options={mainPool}
                            width={132}
                            placeholder="—"
                            staticStyle={{ color: echo.mainStat ? K_PAL.text : K_PAL.textMute, fontStyle: echo.mainStat ? "normal" : "italic", fontSize: 12 }}
                            inputStyle={{ fontSize: 11 }}
                          />
                          <EditableField
                            value={echo.mainValue ? String(echo.mainValue) : ""}
                            onCommit={(v) => setEchoMain(i, "mainValue", v)}
                            width={46}
                            align="right"
                            inputStyle={{ fontSize: 11 }}
                            staticStyle={{ color: K_PAL.textDim, fontSize: 12 }}
                          />
                          {echo.mainStat && isPercentStat(echo.mainStat) && (
                            <span style={{ ...kStyles.mono, fontSize: 10, color: K_PAL.textMute }}>%</span>
                          )}
                        </div>

                        {/* substats */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {echo.substats.map((sub, j) => {
                            const sv = ev.substatVerdicts[j];
                            return (
                              <div key={j} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <EditableField
                                  value={sub.stat}
                                  onCommit={(v) => setEchoSub(i, j, "stat", v)}
                                  options={subPool}
                                  width={124}
                                  placeholder="—"
                                  staticStyle={{
                                    color: sub.stat ? (sv?.dead ? K_PAL.textMute : K_PAL.text) : K_PAL.textMute,
                                    textDecoration: sv?.dead ? "line-through" : "none",
                                    fontSize: 11,
                                  }}
                                  inputStyle={{ fontSize: 11 }}
                                />
                                <EditableField
                                  value={sub.value ? String(sub.value) : ""}
                                  onCommit={(v) => setEchoSub(i, j, "value", v)}
                                  width={42}
                                  align="right"
                                  inputStyle={{ fontSize: 11 }}
                                  staticStyle={{ color: K_PAL.textDim, fontSize: 11 }}
                                />
                                {sub.stat && isPercentStat(sub.stat) && (
                                  <span style={{ ...kStyles.mono, fontSize: 9, color: K_PAL.textMute }}>%</span>
                                )}
                                {sub.stat && (
                                  <div style={{ flex: 1, minWidth: 24, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                                    <div style={{ width: `${Math.round((sv?.quality ?? 0) * 100)}%`, height: "100%", background: sv?.dead ? K_PAL.textMute : STATUS_HEX[qualityStatus(sv?.quality ?? 0)] }} />
                                  </div>
                                )}
                                {editMode && echo.substats.length > 1 && (
                                  <button
                                    onClick={() => removeEchoSub(i, j)}
                                    style={{ ...kStyles.mono, fontSize: 12, lineHeight: 1, color: K_PAL.textMute, background: "none", border: "none", cursor: "pointer", padding: "0 2px" }}
                                    title="remove substat"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {editMode && echo.substats.length < 5 && (
                            <button
                              onClick={() => addEchoSub(i)}
                              style={{ ...kStyles.mono, fontSize: 10, letterSpacing: 1, color: el.hex, background: "none", border: `1px dashed ${K_PAL.border}`, cursor: "pointer", padding: "3px 0", marginTop: 2 }}
                            >
                              + SUBSTAT
                            </button>
                          )}
                        </div>

                        {!editMode && ev.deadStats.length > 0 && (
                          <div style={{ ...kStyles.mono, fontSize: 9, color: STATUS_HEX.red, marginTop: 7, letterSpacing: 0.5 }}>
                            ⚠ {ev.deadStats.length} dead substat{ev.deadStats.length > 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ ...kStyles.mono, fontSize: 9, color: K_PAL.textMute, letterSpacing: 1, marginTop: 12 }}>
                  weights seeded from build type · tune via CLI: <span style={{ color: K_PAL.textDim }}>npm run update -- echoweight &quot;{r.name}&quot; &lt;stat&gt; &lt;0..1&gt;</span>
                </div>
              </KPanel>
            )}

            {teams.length > 0 && (
              <KPanel
                label={`LINEUPS · n=${teams.length}`}
                code="TBL.LNK"
                accent={K_PAL.amber}
              >
                {teams.slice(0, 4).map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "30px 1fr 60px 60px",
                      gap: 10,
                      alignItems: isMobile ? "stretch" : "center",
                      padding: "8px 0",
                      borderBottom:
                        i < Math.min(3, teams.length - 1)
                          ? `1px solid ${K_PAL.border}`
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 10,
                        color: K_PAL.amber,
                        letterSpacing: 1,
                      }}
                    >
                      #{String(t.rank).padStart(2, "0")}
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                      {t.team.map((n) => {
                        const rr = rosterByName[n];
                        const elx = rr ? ELEMENTS[rr.element] : null;
                        return (
                          <div
                            key={n}
                            style={{
                              width: 22,
                              height: 22,
                              border: `1px solid ${elx?.hex ?? K_PAL.border}80`,
                              background: "rgba(0,0,0,0.4)",
                              overflow: "hidden",
                            }}
                          >
                            <img
                              src={portrait(n)}
                              alt={n}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "center 20%",
                              }}
                            />
                          </div>
                        );
                      })}
                      <div style={{ fontSize: 11, color: K_PAL.textDim, marginLeft: 6 }}>
                        {t.team.filter((n) => n !== r.name).join(" + ")}
                      </div>
                    </div>
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 11,
                        color: K_PAL.text,
                        textAlign: isMobile ? "left" : "right",
                      }}
                    >
                      {t.best}
                    </div>
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 10,
                        color: K_PAL.textDim,
                        textAlign: isMobile ? "left" : "right",
                      }}
                    >
                      ~{t.average}
                    </div>
                  </div>
                ))}
              </KPanel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

