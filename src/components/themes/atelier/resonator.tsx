/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useData, rosterIndexOf, rosterNeighborsOf, teamsFeaturingOf, getResonatorOrFirstOf, signatureWeaponOf } from "@/lib/data-context";
import { useEffect } from "react";
import { ELEMENTS, STATUS_HEX } from "@/lib/elements";
import { elementIcon, fiveStarIcon, portrait, tallPortrait, weaponTypeIcon } from "@/lib/portraits";
import { useTheme } from "@/lib/theme-context";
import { WeaponImg } from "@/components/weapon-img";
import { highlightStats } from "@/lib/highlight";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
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
  const { isMobile, isTablet } = useDashboardViewport();

  const r = getResonatorOrFirstOf(rosterByName, roster, name);
  const el = ELEMENTS[r.element];
  const teams = teamsFeaturingOf(raw, r.name);
  const sw = signatureWeaponOf(raw, r.weapon);
  const swHasDetail = Boolean(sw && (sw.passive || sw.synergy || sw.baseAtk || sw.mainStat));
  const idx = Math.max(0, rosterIndexOf(roster, r.name));
  const { prev, next } = rosterNeighborsOf(roster, r.name);
  const { setLastResonator } = useTheme();

  useEffect(() => {
    setLastResonator(r.name);
  }, [r.name, setLastResonator]);

  return (
    <div style={aStyles.shell}>
      <div style={{ display: "flex" }}>
        {!isMobile && <ARosterStrip activeName={r.name} />}
        <div style={{ flex: 1, padding: isMobile ? "20px 16px 26px" : isTablet ? "28px 28px" : "32px 48px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row", gap: 14, marginBottom: 12 }}>
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
            <div style={{ flex: isMobile ? "0 0 auto" : 1 }} />
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

          <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "520px 1fr", gap: isMobile ? 22 : isTablet ? 34 : 56 }}>
            <div>
              <div
                style={{
                  position: "relative",
                  borderRadius: 24,
                  overflow: "hidden",
                  background: `linear-gradient(180deg, ${el.glow}, rgba(255,255,255,0.6))`,
                  border: `1px solid ${A_PAL.border}`,
                  height: isMobile ? 430 : isTablet ? 560 : 700,
                  boxShadow: "0 30px 60px -20px rgba(60,70,100,0.25)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: isMobile ? 16 : 24,
                    right: isMobile ? 16 : 24,
                    width: isMobile ? 56 : 76,
                    height: isMobile ? 56 : 76,
                    borderRadius: 999,
                    border: `1px solid ${A_PAL.borderStrong}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.6)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <img src={elementIcon(r.element)} alt="" style={{ width: isMobile ? 28 : 36, height: isMobile ? 28 : 36 }} />
                </div>
                <img
                  src={tallPortrait(r.name)}
                  alt={r.name}
                  style={{
                    position: "absolute",
                    bottom: isMobile ? -14 : -30,
                    left: "50%",
                    transform: "translateX(-50%)",
                    height: isMobile ? "102%" : "105%",
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
                    fontSize: isMobile ? 110 : 180,
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
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{el.label.toUpperCase()} ·</span>
                  <img
                    src={weaponTypeIcon(r.weaponType)}
                    alt={r.weaponType}
                    style={{ width: 14, height: 14, opacity: 0.85 }}
                  />
                  <span>{r.weaponType.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 18 }}>
                <img
                  src={fiveStarIcon()}
                  alt="5★"
                  title="5★ Resonator"
                  style={{ height: isMobile ? 16 : 20, width: "auto", flexShrink: 0 }}
                />
                <div style={{ ...aStyles.display, fontSize: isMobile ? 58 : isTablet ? 76 : 92, lineHeight: 0.95 }}>{r.name}</div>
              </div>
              <div
                style={{
                  ...aStyles.display,
                  fontSize: isMobile ? 20 : 24,
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
                  flexWrap: "wrap",
                  gap: isMobile ? 18 : 36,
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
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {k === "Weapon" && (
                        <img
                          src={weaponTypeIcon(r.weaponType)}
                          alt={r.weaponType}
                          style={{ width: 18, height: 18 }}
                        />
                      )}
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
                      flexDirection: isMobile ? "column" : "row",
                      gap: 16,
                      alignItems: isMobile ? "stretch" : "center",
                    }}
                  >
                    <div
                      style={{
                        width: isMobile ? 76 : 88,
                        height: isMobile ? 76 : 88,
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
                      <WeaponImg name={r.weapon} size={isMobile ? 68 : 80} />
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
                          fontSize: isMobile ? 24 : 28,
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
                      padding: "13px 16px",
                      borderRadius: 10,
                      background: A_PAL.surfaceStrong,
                      border: `1px solid ${A_PAL.border}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    {(sw?.baseAtk || sw?.mainStat) && (
                      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                        {sw?.baseAtk && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ ...aStyles.mono, fontSize: 9, color: A_PAL.textMute, letterSpacing: 1.5 }}>BASE ATK</span>
                            <span style={{ ...aStyles.mono, fontSize: 17, color: A_PAL.accent, fontWeight: 600 }}>{sw.baseAtk}</span>
                          </div>
                        )}
                        {sw?.mainStat && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ ...aStyles.mono, fontSize: 9, color: A_PAL.textMute, letterSpacing: 1.5 }}>{sw.mainStat.toUpperCase()}</span>
                            <span style={{ ...aStyles.mono, fontSize: 17, color: A_PAL.accent, fontWeight: 600 }}>{sw.mainStatValue || "—"}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {sw?.passive && (
                      <div>
                        <div style={{ ...aStyles.mono, fontSize: 9, color: A_PAL.textMute, letterSpacing: 2 }}>PASSIVE</div>
                        {sw.passiveName && (
                          <div style={{ ...aStyles.display, fontSize: 22, color: A_PAL.ink, marginTop: 1, lineHeight: 1.05 }}>
                            {sw.passiveName}
                          </div>
                        )}
                        <div style={{ fontSize: 14, marginTop: 6, lineHeight: 1.6, color: A_PAL.textDim }}>
                          {highlightStats(sw.passive, { color: A_PAL.accent, fontWeight: 700, fontFamily: "var(--font-jetbrains), ui-monospace, monospace" })}
                        </div>
                      </div>
                    )}
                    {sw?.synergy && (
                      <div style={{ borderLeft: `2px solid ${A_PAL.accent}`, paddingLeft: 13 }}>
                        <div style={{ ...aStyles.mono, fontSize: 9, color: A_PAL.accent, letterSpacing: 2 }}>WHY IT&apos;S CRACKED</div>
                        <div style={{ fontSize: 14, marginTop: 4, lineHeight: 1.6, color: A_PAL.ink, fontStyle: "italic" }}>
                          {highlightStats(sw.synergy, { color: A_PAL.accent, fontWeight: 700, fontStyle: "normal", fontFamily: "var(--font-jetbrains), ui-monospace, monospace" })}
                        </div>
                      </div>
                    )}
                    {!swHasDetail && (
                      <div style={{ fontSize: 13, color: A_PAL.textMute, fontStyle: "italic" }}>
                        Passive &amp; synergy not documented yet — add via Console edit mode or the CLI.
                      </div>
                    )}
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
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: isMobile ? "stretch" : "center",
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
                      <div style={{ textAlign: isMobile ? "left" : "right" }}>
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
