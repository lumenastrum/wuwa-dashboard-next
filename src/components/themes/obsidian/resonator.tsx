/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useData, rosterIndexOf, rosterNeighborsOf, teamsFeaturingOf, cycleAppearancesOf, getResonatorOrFirstOf, signatureWeaponOf } from "@/lib/data-context";
import { useEffect } from "react";
import { ELEMENTS } from "@/lib/elements";
import { elementIcon, portrait, tallPortrait } from "@/lib/portraits";
import { STATUS_HEX } from "@/lib/elements";
import { useTheme } from "@/lib/theme-context";
import { WeaponImg } from "@/components/weapon-img";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import { O_PAL, oStyles } from "./styles";
import { OStatBar } from "./primitives";

export function ObsidianResonator({ name }: { name: string }) {
  const { raw, roster, rosterByName } = useData();
  const { isMobile, isTablet } = useDashboardViewport();

  const r = getResonatorOrFirstOf(rosterByName, roster, name);
  const el = ELEMENTS[r.element];
  const teams = teamsFeaturingOf(raw, r.name);
  const cycleTeams = cycleAppearancesOf(raw, r.name);
  const sw = signatureWeaponOf(raw, r.weapon);
  const swStats = [sw?.baseAtk && `ATK ${sw.baseAtk}`, sw?.mainStat && `${sw.mainStat}${sw.mainStatValue ? ` ${sw.mainStatValue}` : ""}`].filter(Boolean).join("  ·  ");
  const swHasDetail = Boolean(sw && (sw.passive || sw.synergy || sw.baseAtk || sw.mainStat));
  const idx = Math.max(0, rosterIndexOf(roster, r.name));
  const { prev, next } = rosterNeighborsOf(roster, r.name);
  const { setLastResonator } = useTheme();

  useEffect(() => {
    setLastResonator(r.name);
  }, [r.name, setLastResonator]);

  return (
    <div style={oStyles.shell}>
      <div style={{ padding: isMobile ? "18px 16px 24px" : isTablet ? "24px 24px" : "28px 32px" }}>
        <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row", gap: 14, marginBottom: 16 }}>
          <div
            style={{
              ...oStyles.mono,
              fontSize: 11,
              color: O_PAL.textMute,
              letterSpacing: 2,
            }}
          >
            roster → № {String(idx + 1).padStart(2, "0")} / {roster.length}
          </div>
          <div style={{ flex: isMobile ? "0 0 auto" : 1 }} />
          <Link
            href={`/r/${encodeURIComponent(prev.name)}`}
            style={{
              ...oStyles.mono,
              fontSize: 11,
              padding: "5px 12px",
              borderRadius: 999,
              border: `1px solid ${O_PAL.border}`,
              color: O_PAL.textDim,
              textDecoration: "none",
            }}
          >
            ← {prev.name}
          </Link>
          <Link
            href={`/r/${encodeURIComponent(next.name)}`}
            style={{
              ...oStyles.mono,
              fontSize: 11,
              padding: "5px 12px",
              borderRadius: 999,
              border: `1px solid ${O_PAL.border}`,
              color: O_PAL.textDim,
              textDecoration: "none",
            }}
          >
            {next.name} →
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "560px 1fr", gap: isMobile ? 22 : 32 }}>
          <div>
            <div
              style={{
                position: "relative",
                borderRadius: 18,
                overflow: "hidden",
                background: `linear-gradient(180deg, ${el.glow}, rgba(10,13,20,0.6))`,
                border: `1px solid ${O_PAL.border}`,
                height: isMobile ? 420 : isTablet ? 560 : 720,
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
                  border: `1px solid ${O_PAL.borderStrong}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.4)",
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
                  bottom: isMobile ? -12 : -20,
                  left: "50%",
                  transform: "translateX(-50%)",
                  height: isMobile ? "102%" : "105%",
                  width: "auto",
                  maxWidth: "none",
                  filter: `drop-shadow(0 30px 50px ${el.glow})`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 18,
                  left: 28,
                  ...oStyles.display,
                  fontSize: isMobile ? 110 : 180,
                  lineHeight: 0.8,
                  color: "rgba(255,255,255,0.04)",
                  letterSpacing: "-0.05em",
                  pointerEvents: "none",
                }}
              >
                {String(idx + 1).padStart(2, "0")}
              </div>
            </div>
          </div>

          <div>
            <div style={{ ...oStyles.display, fontSize: isMobile ? 58 : isTablet ? 76 : 96, lineHeight: 0.95 }}>{r.name}</div>
            <div
              style={{
                ...oStyles.display,
                fontSize: isMobile ? 20 : 24,
                fontStyle: "italic",
                color: O_PAL.textDim,
                marginTop: -4,
              }}
            >
              — &nbsp;{r.audit?.notes || `${r.role}, ${r.element}`}.
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: isMobile ? 18 : 32,
                marginTop: 28,
                paddingBottom: 22,
                borderBottom: `1px solid ${O_PAL.border}`,
              }}
            >
              {([
                ["Role", r.role],
                ["Weapon", r.weaponType],
                ["Sequence", r.sequence],
                ["Build", r.audit?.buildType || "—"],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <div
                    style={{
                      ...oStyles.mono,
                      fontSize: 10,
                      color: O_PAL.textMute,
                      letterSpacing: 1.5,
                    }}
                  >
                    {k.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 16, marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 22 }}>
              <div
                style={{
                  ...oStyles.mono,
                  fontSize: 10,
                  color: O_PAL.textMute,
                  letterSpacing: 1.5,
                  marginBottom: 8,
                }}
              >
                GEAR
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    background: O_PAL.surface,
                    border: `1px solid ${O_PAL.border}`,
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
                      borderRadius: 8,
                      overflow: "hidden",
                      background: `linear-gradient(135deg, ${el.glow}, rgba(0,0,0,0.4))`,
                      border: `1px solid ${O_PAL.border}`,
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
                        ...oStyles.mono,
                        fontSize: 10,
                        color: O_PAL.textMute,
                        letterSpacing: 1.5,
                      }}
                    >
                      SIGNATURE WEAPON
                    </div>
                    <div
                      style={{
                        ...oStyles.display,
                        fontSize: isMobile ? 24 : 26,
                        marginTop: 4,
                        lineHeight: 1.1,
                      }}
                    >
                      {r.weapon}
                    </div>
                    <div
                      style={{
                        ...oStyles.mono,
                        fontSize: 11,
                        color: O_PAL.textDim,
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
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: O_PAL.surface,
                    border: `1px solid ${O_PAL.border}`,
                  }}
                >
                  <div
                    style={{
                      ...oStyles.mono,
                      fontSize: 10,
                      color: O_PAL.textMute,
                      letterSpacing: 1,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <span>SIGNATURE PASSIVE{sw?.passiveName ? ` · ${sw.passiveName}` : ""}</span>
                    {swStats && <span style={{ color: O_PAL.textDim }}>{swStats}</span>}
                  </div>
                  {swHasDetail ? (
                    <>
                      {sw?.passive && (
                        <div style={{ fontSize: 14, marginTop: 6, lineHeight: 1.55, color: O_PAL.text }}>
                          {sw.passive}
                        </div>
                      )}
                      {sw?.synergy && (
                        <div style={{ marginTop: sw?.passive ? 12 : 6 }}>
                          <div style={{ ...oStyles.mono, fontSize: 10, color: O_PAL.accent, letterSpacing: 1 }}>
                            WHY IT&apos;S CRACKED
                          </div>
                          <div style={{ fontSize: 14, marginTop: 4, lineHeight: 1.55, color: O_PAL.textDim, fontStyle: "italic" }}>
                            {sw.synergy}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 13, marginTop: 6, color: O_PAL.textMute, fontStyle: "italic" }}>
                      Passive &amp; synergy not documented yet — add via Console edit mode or the CLI.
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: O_PAL.surface,
                    border: `1px solid ${O_PAL.border}`,
                  }}
                >
                  <div
                    style={{
                      ...oStyles.mono,
                      fontSize: 10,
                      color: O_PAL.textMute,
                      letterSpacing: 1,
                    }}
                  >
                    ECHO SET
                  </div>
                  <div style={{ fontSize: 14, marginTop: 2 }}>{r.echoSet}</div>
                </div>
              </div>
            </div>

            {r.audit && (
              <div style={{ marginTop: 26 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ ...oStyles.display, fontSize: 24 }}>The numbers</div>
                  <div
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      ...oStyles.mono,
                      fontSize: 10,
                      letterSpacing: 1.5,
                      background: `${STATUS_HEX[r.audit.priorityStatus]}1f`,
                      color: STATUS_HEX[r.audit.priorityStatus],
                    }}
                  >
                    ● {r.audit.buildType.toUpperCase()}
                  </div>
                </div>
                {r.audit.stats.map((s) => (
                  <OStatBar key={s.label} stat={s} />
                ))}
              </div>
            )}

            {teams.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div
                  style={{
                    ...oStyles.mono,
                    fontSize: 10,
                    color: O_PAL.textMute,
                    letterSpacing: 1.5,
                    marginBottom: 10,
                  }}
                >
                  FEATURED IN · {teams.length} TEAMS
                </div>
                {teams.slice(0, 4).map((t) => (
                  <div
                    key={t.rank}
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      alignItems: isMobile ? "stretch" : "center",
                      gap: 14,
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: O_PAL.surface,
                      border: `1px solid ${O_PAL.border}`,
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
                            border: `2px solid ${O_PAL.bg}`,
                            marginLeft: j > 0 ? -10 : 0,
                            background: O_PAL.bg,
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13 }}>
                        {t.team.filter((n) => n !== r.name).join(" · ")}
                        &nbsp;<span style={{ color: O_PAL.textMute }}>+ {r.name}</span>
                      </div>
                      <div style={{ fontSize: 11, color: O_PAL.textDim, marginTop: 2 }}>{t.notes}</div>
                    </div>
                    <div style={{ textAlign: isMobile ? "left" : "right" }}>
                      <div style={{ ...oStyles.display, fontSize: 22 }}>{t.best}</div>
                      <div
                        style={{
                          ...oStyles.mono,
                          fontSize: 9,
                          color: O_PAL.textMute,
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

            {cycleTeams.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <div
                  style={{
                    ...oStyles.mono,
                    fontSize: 10,
                    color: O_PAL.textMute,
                    letterSpacing: 1.5,
                    marginBottom: 10,
                  }}
                >
                  ENDSTATE APPEARANCES
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {cycleTeams.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: O_PAL.surface,
                        border: `1px solid ${O_PAL.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div style={{ ...oStyles.mono, fontSize: 10, color: O_PAL.textMute }}>
                        C{t.cycleId} · #{t.order}
                      </div>
                      <div style={{ fontSize: 12 }}>{t.score.toLocaleString()} pts</div>
                      {t.rating && (
                        <div style={{ ...oStyles.mono, fontSize: 10, color: O_PAL.accent }}>
                          {t.rating}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
