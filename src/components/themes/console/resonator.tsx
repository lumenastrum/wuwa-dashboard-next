/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useData, rosterIndexOf, rosterNeighborsOf, teamsFeaturingOf, getResonatorOrFirstOf, roleAccent } from "@/lib/data-context";
import { useEffect } from "react";
import { ELEMENTS, STATUS_HEX } from "@/lib/elements";
import { elementIcon, portrait, tallPortrait } from "@/lib/portraits";
import { useTheme } from "@/lib/theme-context";
import { WeaponImg } from "@/components/weapon-img";
import { EditableField } from "@/components/editable-field";
import type { Sequence, Status } from "@/lib/types";
import { K_PAL, kStyles } from "./styles";
import { KPanel, KScanlines } from "./primitives";

const SEQUENCES: readonly Sequence[] = ["S0", "S1", "S2", "S3", "S4", "S5", "S6"];
const STATUSES: readonly Status[] = ["green", "yellow", "red", "neutral"];

export function ConsoleResonator({ name }: { name: string }) {
  const { raw, roster, rosterByName, update } = useData();

  const r = getResonatorOrFirstOf(rosterByName, roster, name);
  const el = ELEMENTS[r.element];
  const teams = teamsFeaturingOf(raw, r.name);
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
      if (field === "_status") a.stats[statIdx]._status = value as Status;
      else if (field === "current") a.stats[statIdx].current = value;
      else a.stats[statIdx].optimal = value;
    });
  };

  return (
    <div style={kStyles.shell}>
      <KScanlines />
      <div style={{ position: "relative", padding: "24px 28px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
          <div style={{ display: "flex", gap: 8 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "440px 1fr", gap: 14 }}>
          <KPanel
            label={`PROFILE.${r.name.toUpperCase()}`}
            code={`UID.${String(idx + 1).padStart(3, "0")}`}
            accent={el.hex}
            style={{ padding: 0, overflow: "hidden" }}
          >
            <div
              style={{
                position: "relative",
                height: 580,
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
                  height: "100%",
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
                        }}
                      >
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    ...kStyles.display,
                    fontSize: 42,
                    color: K_PAL.text,
                    lineHeight: 1,
                    textShadow: `0 0 16px ${el.glow}`,
                  }}
                >
                  {r.name.toUpperCase()}
                </div>
              </div>
            </div>
          </KPanel>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {r.audit && (
              <KPanel
                label={`STATS_AUDIT · ${r.audit.buildType.toUpperCase()}`}
                code="AUDIT.001"
                accent={STATUS_HEX[r.audit.priorityStatus]}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
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
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 88,
                      height: 88,
                      background: `radial-gradient(circle at 50% 50%, ${el.hex}20, transparent 70%)`,
                      border: `1px solid ${el.hex}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <WeaponImg name={r.weapon} size={80} />
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
                  <div
                    style={{
                      ...kStyles.display,
                      fontSize: 16,
                      color: K_PAL.text,
                      marginTop: 6,
                    }}
                  >
                    <EditableField
                      value={r.echoSet}
                      onCommit={(v) => setResonatorField("echoSet", v)}
                    />
                  </div>
                </div>
              </div>
            </KPanel>

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
                      gridTemplateColumns: "30px 1fr 60px 60px",
                      gap: 10,
                      alignItems: "center",
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
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
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
                        textAlign: "right",
                      }}
                    >
                      {t.best}
                    </div>
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 10,
                        color: K_PAL.textDim,
                        textAlign: "right",
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

