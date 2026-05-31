/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useData, rosterIndexOf, rosterNeighborsOf, teamsFeaturingOf, cycleAppearancesOf, getResonatorOrFirstOf, signatureWeaponOf, echoBuildOf } from "@/lib/data-context";
import { useEffect } from "react";
import { ELEMENTS } from "@/lib/elements";
import { elementIcon, fiveStarIcon, portrait, tallPortrait, weaponTypeIcon } from "@/lib/portraits";
import { STATUS_HEX } from "@/lib/elements";
import { useTheme } from "@/lib/theme-context";
import { WeaponImg } from "@/components/weapon-img";
import { highlightStats } from "@/lib/highlight";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import type { Status } from "@/lib/types";
import { scoreBuild, scoreEcho, isPercentStat, type EchoGrade } from "@/lib/echo-audit";
import { rateResonator } from "@/lib/resonator-rating";
import { SonataIcons } from "@/components/sonata-icons";
import { O_PAL, oStyles } from "./styles";
import { OCard, OStatBar } from "./primitives";

// Prestige tiers earn their own glow on the dark canvas: S gold, SSS violet,
// ✦ a pink→gold gradient glyph. Everything below S rides the shared Status hue.
const O_PRESTIGE_HEX: Partial<Record<EchoGrade, string>> = { S: "#fbbf24", SSS: "#a78bfa", "✦": "#f9a8d4" };

// roll-quality 0..1 → a status tier for the substat dot color.
function oQualityStatus(q: number): Status {
  return q >= 0.66 ? "green" : q >= 0.33 ? "yellow" : "red";
}

// Jewel grade medallion — serif glyph in a hairline-bordered tile. `hero` is the
// Resonator Rating size, `md` the echo-build header, `sm` the per-echo chip.
function OGrade({ grade, status, score, size = "sm" }: { grade: EchoGrade; status: Status; score: number | null; size?: "sm" | "md" | "hero" }) {
  const glow = O_PRESTIGE_HEX[grade];
  const hex = glow ?? STATUS_HEX[status];
  const sparkle = grade === "✦";
  const dim = size === "hero" ? 104 : size === "md" ? 40 : 26;
  const fs = size === "hero" ? 58 : size === "md" ? 21 : 14;
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: dim,
        height: dim,
        borderRadius: size === "hero" ? 20 : 8,
        border: `1px solid ${hex}`,
        background: `${hex}14`,
        boxShadow: glow ? `0 0 ${size === "hero" ? 40 : 12}px ${hex}55, inset 0 0 18px ${hex}10` : "none",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          ...oStyles.display,
          fontSize: fs,
          lineHeight: 1,
          fontWeight: 600,
          color: sparkle ? "transparent" : hex,
          backgroundImage: sparkle ? "linear-gradient(120deg,#f9a8d4,#fcd34d)" : "none",
          WebkitBackgroundClip: sparkle ? "text" : "border-box",
          backgroundClip: sparkle ? "text" : "border-box",
        }}
      >
        {grade}
      </div>
      {score != null && size !== "sm" && (
        <div style={{ ...oStyles.mono, fontSize: size === "hero" ? 11 : 9, color: hex, opacity: 0.75, marginTop: 2 }}>{Math.round(score)}</div>
      )}
    </div>
  );
}

export function ObsidianResonator({ name }: { name: string }) {
  const { raw, roster, rosterByName } = useData();
  const { isMobile, isTablet } = useDashboardViewport();

  const r = getResonatorOrFirstOf(rosterByName, roster, name);
  const el = ELEMENTS[r.element];
  const teams = teamsFeaturingOf(raw, r.name);
  const cycleTeams = cycleAppearancesOf(raw, r.name);
  const sw = signatureWeaponOf(raw, r.weapon);
  const swHasDetail = Boolean(sw && (sw.passive || sw.synergy || sw.baseAtk || sw.mainStat));
  const echoBuild = echoBuildOf(raw, r.name);
  const echoVerdict = echoBuild ? scoreBuild(echoBuild.echoes, echoBuild.weights) : null;
  // Read view: only show slots that actually grade (skip blank stubs).
  const gradedEchoes = echoBuild
    ? echoBuild.echoes.map((echo) => ({ echo, ev: scoreEcho(echo, echoBuild.weights) })).filter((x) => x.ev.score != null)
    : [];
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
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 18 }}>
              <img
                src={fiveStarIcon()}
                alt="5★"
                title="5★ Resonator"
                style={{ height: isMobile ? 16 : 20, width: "auto", flexShrink: 0 }}
              />
              <div style={{ ...oStyles.display, fontSize: isMobile ? 58 : isTablet ? 76 : 96, lineHeight: 0.95 }}>{r.name}</div>
            </div>
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
                  <div style={{ fontSize: 16, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
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

            {rating.score != null && (
              <OCard
                style={{
                  marginTop: 22,
                  padding: 20,
                  background: "rgba(233,212,155,0.035)",
                  border: "1px solid rgba(233,212,155,0.22)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: isMobile ? 16 : 28,
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <OGrade grade={rating.grade} status={rating.status} score={null} size="hero" />
                    <div style={{ ...oStyles.mono, fontSize: 9, color: O_PAL.textMute, letterSpacing: 2 }}>RATING</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: isMobile ? "center" : "left" }}>
                    <div style={{ ...oStyles.display, fontSize: 30, lineHeight: 1.05 }}>Resonator Rating</div>
                    {rating.partial && (
                      <div style={{ ...oStyles.mono, fontSize: 9, color: O_PAL.textMute, letterSpacing: 1.5, marginTop: 8 }}>
                        PARTIAL · SOME INPUTS MISSING
                      </div>
                    )}
                  </div>
                </div>
              </OCard>
            )}

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
                    padding: "15px 17px",
                    borderRadius: 10,
                    background: O_PAL.surface,
                    border: `1px solid ${O_PAL.border}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 15,
                  }}
                >
                  {(sw?.baseAtk || sw?.mainStat) && (
                    <div style={{ display: "flex", gap: 30, flexWrap: "wrap" }}>
                      {sw?.baseAtk && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ ...oStyles.mono, fontSize: 9, color: O_PAL.textMute, letterSpacing: 1.5 }}>BASE ATK</span>
                          <span style={{ ...oStyles.mono, fontSize: 18, color: O_PAL.accent, fontWeight: 600 }}>{sw.baseAtk}</span>
                        </div>
                      )}
                      {sw?.mainStat && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ ...oStyles.mono, fontSize: 9, color: O_PAL.textMute, letterSpacing: 1.5 }}>{sw.mainStat.toUpperCase()}</span>
                          <span style={{ ...oStyles.mono, fontSize: 18, color: O_PAL.accent, fontWeight: 600 }}>{sw.mainStatValue || "—"}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {sw?.passive && (
                    <div>
                      <div style={{ ...oStyles.mono, fontSize: 9, color: O_PAL.textMute, letterSpacing: 2 }}>PASSIVE</div>
                      {sw.passiveName && (
                        <div style={{ ...oStyles.display, fontSize: 21, color: O_PAL.accent, marginTop: 1, lineHeight: 1.1 }}>
                          {sw.passiveName}
                        </div>
                      )}
                      <div style={{ fontSize: 13.5, marginTop: 7, lineHeight: 1.62, color: O_PAL.textDim }}>
                        {highlightStats(sw.passive, { color: O_PAL.accent, fontWeight: 600, fontFamily: "var(--font-jetbrains), ui-monospace, monospace" })}
                      </div>
                    </div>
                  )}
                  {sw?.synergy && (
                    <div style={{ borderLeft: `2px solid ${O_PAL.accent}`, paddingLeft: 13 }}>
                      <div style={{ ...oStyles.mono, fontSize: 9, color: O_PAL.accent, letterSpacing: 2 }}>WHY IT&apos;S CRACKED</div>
                      <div style={{ fontSize: 13.5, marginTop: 5, lineHeight: 1.62, color: O_PAL.text, fontStyle: "italic" }}>
                        {highlightStats(sw.synergy, { color: O_PAL.accent, fontWeight: 600, fontStyle: "normal", fontFamily: "var(--font-jetbrains), ui-monospace, monospace" })}
                      </div>
                    </div>
                  )}
                  {!swHasDetail && (
                    <div style={{ fontSize: 13, color: O_PAL.textMute, fontStyle: "italic" }}>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <SonataIcons set={r.echoSet} size={22} badgeBg={O_PAL.accent} badgeColor="#0a0d14" />
                    <span style={{ fontSize: 14 }}>{r.echoSet}</span>
                  </div>
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

            {echoVerdict && echoVerdict.score != null && gradedEchoes.length > 0 && (
              <OCard style={{ marginTop: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
                  <OGrade grade={echoVerdict.grade} status={echoVerdict.status} score={echoVerdict.score} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                      <div style={{ ...oStyles.display, fontSize: 24 }}>Echo Audit</div>
                      <div style={{ ...oStyles.mono, fontSize: 9, color: O_PAL.textMute, letterSpacing: 1, textAlign: "right" }}>
                        {echoVerdict.graded} GRADED · STAT GRADE ONLY
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: O_PAL.textDim, marginTop: 3, fontStyle: "italic" }}>{echoVerdict.headline}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {gradedEchoes.map(({ echo, ev }, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "36px 1fr 34px" : "44px 150px 1fr 40px",
                        gap: 14,
                        alignItems: "center",
                        padding: "12px 0",
                        borderTop: i > 0 ? `1px solid ${O_PAL.border}` : "none",
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <div style={{ ...oStyles.display, fontSize: 26, lineHeight: 1, color: O_PAL.accent }}>{echo.cost}</div>
                        <div style={{ ...oStyles.mono, fontSize: 8, color: O_PAL.textMute, letterSpacing: 1 }}>COST</div>
                      </div>
                      {!isMobile && (
                        <div>
                          <div style={{ ...oStyles.mono, fontSize: 9, color: O_PAL.textMute, letterSpacing: 1 }}>MAIN</div>
                          <div style={{ fontSize: 13, marginTop: 1 }}>{echo.mainStat || "—"}</div>
                          <div style={{ ...oStyles.mono, fontSize: 10, color: O_PAL.textDim }}>
                            {echo.mainValue || ""}
                            {echo.mainStat && isPercentStat(echo.mainStat) ? "%" : ""}
                          </div>
                        </div>
                      )}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {echo.substats.map((sub, j) => {
                          if (!sub.stat) return null;
                          const sv = ev.substatVerdicts[j];
                          const dead = sv?.dead;
                          const qhex = dead ? O_PAL.textMute : STATUS_HEX[oQualityStatus(sv?.quality ?? 0)];
                          return (
                            <div
                              key={j}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "4px 9px",
                                borderRadius: 999,
                                background: "rgba(255,255,255,0.03)",
                                border: `1px solid ${O_PAL.border}`,
                              }}
                            >
                              <span style={{ width: 5, height: 5, borderRadius: 999, background: qhex }} />
                              <span
                                style={{
                                  ...oStyles.mono,
                                  fontSize: 10,
                                  color: dead ? O_PAL.textMute : O_PAL.text,
                                  textDecoration: dead ? "line-through" : "none",
                                }}
                              >
                                {sub.stat} {sub.value}
                                {isPercentStat(sub.stat) ? "%" : ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <OGrade grade={ev.grade} status={ev.status} score={null} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ ...oStyles.mono, fontSize: 9, color: O_PAL.textMute, letterSpacing: 1, marginTop: 14 }}>
                  STAT GRADE ONLY — SET BONUS NOT SCORED · edit in the Console theme
                </div>
              </OCard>
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
