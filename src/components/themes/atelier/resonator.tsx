/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useData, rosterIndexOf, rosterNeighborsOf, teamsFeaturingOf, getResonatorOrFirstOf } from "@/lib/data-context";
import { useEffect } from "react";
import { ELEMENTS, STATUS_HEX } from "@/lib/elements";
import { elementIcon, portrait, tallPortrait } from "@/lib/portraits";
import { useTheme } from "@/lib/theme-context";
import { WeaponImg } from "@/components/weapon-img";
import type { AuditStat } from "@/lib/types";
import { A_PAL, aStyles } from "./styles";
import { APill, ARosterStrip } from "./primitives";

function AStatBar({ stat }: { stat: AuditStat }) {
  const num = parseFloat(String(stat.current).replace(/[,%]/g, "")) || 0;
  const ceiling = stat.max || (stat.min || 1) * 1.4;
  const pct = Math.min(100, (num / ceiling) * 100);
  const minPct = stat.min ? Math.min(100, (stat.min / ceiling) * 100) : 0;
  const maxPct = stat.max ? Math.min(100, (stat.max / ceiling) * 100) : 0;
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            ...aStyles.mono,
            fontSize: 11,
            letterSpacing: 1.5,
            color: A_PAL.textDim,
          }}
        >
          {stat.label}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ ...aStyles.display, fontSize: 28, color: A_PAL.ink }}>{stat.current}</div>
          <div style={{ ...aStyles.mono, fontSize: 10, color: A_PAL.textMute }}>
            target {stat.optimal}
          </div>
        </div>
      </div>
      <div
        style={{
          position: "relative",
          height: 6,
          background: "rgba(60,70,100,0.08)",
          borderRadius: 999,
        }}
      >
        {stat.min && stat.max && (
          <div
            style={{
              position: "absolute",
              left: `${minPct}%`,
              top: 0,
              height: "100%",
              width: `${maxPct - minPct}%`,
              background: "rgba(95,225,179,0.25)",
              borderLeft: "1px solid rgba(95,225,179,0.5)",
              borderRight: "1px solid rgba(95,225,179,0.5)",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct}%`,
            background: STATUS_HEX[stat._status] ?? A_PAL.ink,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

export function AtelierResonator({ name }: { name: string }) {
  const { raw, roster, rosterByName } = useData();

  const r = getResonatorOrFirstOf(rosterByName, roster, name);
  const el = ELEMENTS[r.element];
  const teams = teamsFeaturingOf(raw, r.name);
  const idx = Math.max(0, rosterIndexOf(roster, r.name));
  const { prev, next } = rosterNeighborsOf(roster, r.name);
  const { setLastResonator } = useTheme();

  useEffect(() => {
    setLastResonator(r.name);
  }, [r.name, setLastResonator]);

  return (
    <div style={aStyles.shell}>
      <div style={{ display: "flex" }}>
        <ARosterStrip activeName={r.name} />
        <div style={{ flex: 1, padding: "32px 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div
              style={{
                ...aStyles.mono,
                fontSize: 10,
                color: A_PAL.textMute,
                letterSpacing: 2,
              }}
            >
              roster → RESONATOR № {String(idx + 1).padStart(2, "0")} / {roster.length}
            </div>
            <div style={{ flex: 1 }} />
            <Link
              href={`/r/${encodeURIComponent(prev.name)}`}
              style={{
                ...aStyles.mono,
                fontSize: 11,
                padding: "5px 12px",
                borderRadius: 999,
                border: `1px solid ${A_PAL.border}`,
                color: A_PAL.textDim,
                textDecoration: "none",
              }}
            >
              ← {prev.name}
            </Link>
            <Link
              href={`/r/${encodeURIComponent(next.name)}`}
              style={{
                ...aStyles.mono,
                fontSize: 11,
                padding: "5px 12px",
                borderRadius: 999,
                border: `1px solid ${A_PAL.border}`,
                color: A_PAL.textDim,
                textDecoration: "none",
              }}
            >
              {next.name} →
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "520px 1fr", gap: 56 }}>
            <div>
              <div
                style={{
                  position: "relative",
                  borderRadius: 24,
                  overflow: "hidden",
                  background: `linear-gradient(180deg, ${el.glow}, rgba(255,255,255,0.6))`,
                  border: `1px solid ${A_PAL.border}`,
                  height: 700,
                  boxShadow: "0 30px 60px -20px rgba(60,70,100,0.25)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 24,
                    right: 24,
                    width: 76,
                    height: 76,
                    borderRadius: 999,
                    border: `1px solid ${A_PAL.borderStrong}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.6)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <img src={elementIcon(r.element)} alt="" style={{ width: 36, height: 36 }} />
                </div>
                <img
                  src={tallPortrait(r.name)}
                  alt={r.name}
                  style={{
                    position: "absolute",
                    bottom: -30,
                    left: "50%",
                    transform: "translateX(-50%)",
                    height: "105%",
                    width: "auto",
                    maxWidth: "none",
                    filter: "drop-shadow(0 30px 50px rgba(60,70,100,0.25))",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 20,
                    left: 26,
                    ...aStyles.display,
                    fontSize: 180,
                    lineHeight: 0.8,
                    color: "rgba(60,70,100,0.06)",
                    letterSpacing: "-0.05em",
                    pointerEvents: "none",
                  }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 12,
                  padding: "0 4px",
                }}
              >
                <div
                  style={{
                    ...aStyles.mono,
                    fontSize: 10,
                    color: A_PAL.textMute,
                    letterSpacing: 1.5,
                  }}
                >
                  OFFICIAL ART
                </div>
                <div
                  style={{
                    ...aStyles.mono,
                    fontSize: 10,
                    color: A_PAL.textMute,
                    letterSpacing: 1.5,
                  }}
                >
                  {el.label.toUpperCase()} · {r.weaponType.toUpperCase()}
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 4 }}>
              <div style={{ ...aStyles.display, fontSize: 92, lineHeight: 0.95 }}>{r.name}</div>
              <div
                style={{
                  ...aStyles.display,
                  fontSize: 24,
                  fontStyle: "italic",
                  color: A_PAL.textDim,
                  marginTop: -4,
                }}
              >
                — &nbsp;{r.audit?.notes || `${r.role}, ${r.element}.`}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 36,
                  marginTop: 26,
                  paddingBottom: 20,
                  borderBottom: `1px solid ${A_PAL.border}`,
                }}
              >
                {([
                  ["Role", r.role],
                  ["Weapon", r.weaponType],
                  ["Sequence", r.sequence],
                  ["Level", r.level],
                ] as [string, string | number][]).map(([k, v]) => (
                  <div key={k}>
                    <div
                      style={{
                        ...aStyles.mono,
                        fontSize: 10,
                        color: A_PAL.textMute,
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                      }}
                    >
                      {k}
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        color: A_PAL.ink,
                        marginTop: 4,
                        fontWeight: 500,
                      }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    ...aStyles.mono,
                    fontSize: 10,
                    color: A_PAL.textMute,
                    letterSpacing: 1.5,
                    marginBottom: 8,
                  }}
                >
                  BUILD · {r.audit?.buildType?.toUpperCase() ?? "—"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: A_PAL.surfaceStrong,
                      border: `1px solid ${A_PAL.border}`,
                      display: "flex",
                      gap: 16,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: 10,
                        overflow: "hidden",
                        background: `linear-gradient(135deg, ${el.glow}, rgba(255,255,255,0.6))`,
                        border: `1px solid ${A_PAL.border}`,
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
                          ...aStyles.mono,
                          fontSize: 10,
                          color: A_PAL.textMute,
                          letterSpacing: 1.5,
                        }}
                      >
                        SIGNATURE WEAPON
                      </div>
                      <div
                        style={{
                          ...aStyles.display,
                          fontSize: 28,
                          color: A_PAL.ink,
                          marginTop: 4,
                          lineHeight: 1.05,
                        }}
                      >
                        {r.weapon}
                      </div>
                      <div
                        style={{
                          ...aStyles.mono,
                          fontSize: 11,
                          color: A_PAL.textDim,
                          marginTop: 4,
                          letterSpacing: 1,
                        }}
                      >
                        {r.weaponRank} · LV.{r.level}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: A_PAL.surfaceStrong,
                      border: `1px solid ${A_PAL.border}`,
                    }}
                  >
                    <div
                      style={{
                        ...aStyles.mono,
                        fontSize: 10,
                        color: A_PAL.textMute,
                        letterSpacing: 1,
                      }}
                    >
                      ECHO SET
                    </div>
                    <div style={{ fontSize: 14, color: A_PAL.ink, marginTop: 2 }}>{r.echoSet}</div>
                  </div>
                </div>
              </div>

              {r.audit && (
                <div style={{ marginTop: 24 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ ...aStyles.display, fontSize: 28 }}>The numbers</div>
                    <APill status={r.audit.priorityStatus}>{r.audit.buildType}</APill>
                  </div>
                  {r.audit.stats.map((s) => (
                    <AStatBar key={s.label} stat={s} />
                  ))}
                </div>
              )}

              {teams.length > 0 && (
                <div style={{ marginTop: 22 }}>
                  <div
                    style={{
                      ...aStyles.mono,
                      fontSize: 10,
                      color: A_PAL.textMute,
                      letterSpacing: 1.5,
                      marginBottom: 10,
                    }}
                  >
                    FEATURED IN · {teams.length} TEAMS
                  </div>
                  {teams.slice(0, 3).map((t) => (
                    <div
                      key={t.rank}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: A_PAL.surfaceStrong,
                        border: `1px solid ${A_PAL.border}`,
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ display: "flex" }}>
                        {t.team.map((n, j) => (
                          <div
                            key={n}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 999,
                              overflow: "hidden",
                              border: "2px solid white",
                              marginLeft: j > 0 ? -10 : 0,
                              background: "white",
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
                        ))}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            color: A_PAL.ink,
                            fontWeight: 500,
                          }}
                        >
                          {t.team.join(" · ")}
                        </div>
                        <div style={{ fontSize: 11, color: A_PAL.textDim, marginTop: 2 }}>
                          {t.notes}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ ...aStyles.display, fontSize: 22 }}>{t.best}</div>
                        <div
                          style={{
                            ...aStyles.mono,
                            fontSize: 9,
                            color: A_PAL.textMute,
                            letterSpacing: 1,
                          }}
                        >
                          RANK #{t.rank}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
