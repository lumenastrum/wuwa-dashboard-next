/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useData, rosterIndexOf, rosterNeighborsOf, teamsFeaturingOf, getResonatorOrFirstOf, signatureWeaponOf, echoBuildOf } from "@/lib/data-context";
import { useEffect } from "react";
import { ELEMENTS, STATUS_HEX } from "@/lib/elements";
import { elementIcon, fiveStarIcon, portrait, tallPortrait, weaponTypeIcon } from "@/lib/portraits";
import { useTheme } from "@/lib/theme-context";
import { WeaponImg } from "@/components/weapon-img";
import { highlightStats } from "@/lib/highlight";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import type { AuditStat, Status } from "@/lib/types";
import { scoreBuild, scoreEcho, statusOf, isPercentStat, type EchoGrade } from "@/lib/echo-audit";
import { rateResonator } from "@/lib/resonator-rating";
import { A_PAL, aStyles } from "./styles";
import { APill, ARosterStrip } from "./primitives";

// Legible-on-light grade hues. The shared STATUS greens/golds wash out on the
// paper background, so the editorial theme keeps the grade MEANING but restyles
// the chrome with darker, print-friendly inks.
const A_GOLD = "#a9801a";
const A_GREEN = "#1f9e6e";
const A_PINK = "#c8478a";
const A_VIOLET = "#6f55c9";
const A_STATUS: Record<Status, string> = { green: A_GREEN, yellow: A_GOLD, red: "#cf445c", neutral: A_PAL.textMute };
const A_PRESTIGE: Partial<Record<EchoGrade, string>> = { S: A_GOLD, SSS: A_VIOLET, "✦": A_PINK };

function aGradeHex(grade: EchoGrade, status: Status): string {
  return A_PRESTIGE[grade] ?? A_STATUS[status];
}

// roll-quality 0..1 → a status tier for the substat dot color.
function aQualityStatus(q: number): Status {
  return q >= 0.66 ? "green" : q >= 0.33 ? "yellow" : "red";
}

// Ink-outlined grade square with a serif glyph. Prestige tiers swap the ink
// outline for their own hue + a faint wash. `hero` is the Resonator Rating size.
function AGrade({ grade, status, score, size = "sm" }: { grade: EchoGrade; status: Status; score: number | null; size?: "sm" | "md" | "hero" }) {
  const hex = aGradeHex(grade, status);
  const prestige = !!A_PRESTIGE[grade];
  const sparkle = grade === "✦";
  const dim = size === "hero" ? 62 : size === "md" ? 40 : 26;
  const fs = size === "hero" ? 34 : size === "md" ? 22 : 15;
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: dim,
        height: dim,
        borderRadius: size === "hero" ? 4 : 3,
        border: `1px solid ${prestige ? hex : A_PAL.ink}`,
        background: prestige ? `${hex}12` : "transparent",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          ...aStyles.display,
          fontSize: fs,
          lineHeight: 1,
          color: sparkle ? "transparent" : prestige ? hex : A_PAL.ink,
          backgroundImage: sparkle ? "linear-gradient(120deg,#c8478a,#a9801a)" : "none",
          WebkitBackgroundClip: sparkle ? "text" : "initial",
          backgroundClip: sparkle ? "text" : "initial",
        }}
      >
        {grade}
      </div>
      {score != null && size !== "sm" && (
        <div style={{ ...aStyles.mono, fontSize: size === "hero" ? 10 : 9, color: prestige ? hex : A_PAL.textDim, marginTop: 1 }}>{Math.round(score)}</div>
      )}
    </div>
  );
}

// One input bar in the Resonator Rating breakdown: sub-score + effective weight.
function ARatingBar({ label, score, weight }: { label: string; score: number | null; weight: number }) {
  const hex = A_STATUS[statusOf(score)];
  const fill = score == null ? 0 : Math.min(100, score);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <span style={{ ...aStyles.mono, fontSize: 10, color: A_PAL.textMute, letterSpacing: 1.5 }}>{label}</span>
        <span style={{ ...aStyles.mono, fontSize: 10, color: score == null ? A_PAL.textMute : hex }}>
          {score == null ? "—" : Math.round(score)}
          <span style={{ color: A_PAL.textMute }}> · {Math.round(weight * 100)}%</span>
        </span>
      </div>
      <div style={{ height: 3, background: "rgba(60,70,100,0.10)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${fill}%`, height: "100%", background: hex }} />
      </div>
    </div>
  );
}

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

              {rating.score != null && (
                <div style={{ marginTop: 24, paddingTop: 22, borderTop: `1px solid ${A_PAL.borderStrong}` }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      gap: isMobile ? 16 : 24,
                      alignItems: isMobile ? "stretch" : "center",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: "center", gap: 6 }}>
                      <AGrade grade={rating.grade} status={rating.status} score={rating.score} size="hero" />
                      <div style={{ ...aStyles.mono, fontSize: 9, color: A_PAL.textMute, letterSpacing: 2 }}>RATING</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
                        <div style={{ ...aStyles.display, fontSize: 28 }}>Resonator rating</div>
                        <div style={{ ...aStyles.mono, fontSize: 9, color: A_PAL.textMute, letterSpacing: 1, textAlign: "right" }}>
                          {rating.partial ? "PARTIAL · " : ""}OPTIMIZER 35/35/15/15
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 16 }}>
                        {rating.subs.map((s) => (
                          <ARatingBar key={s.key} label={s.label} score={s.score} weight={s.weight} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

              {echoVerdict && echoVerdict.score != null && gradedEchoes.length > 0 && (
                <div style={{ marginTop: 26 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                    <AGrade grade={echoVerdict.grade} status={echoVerdict.status} score={echoVerdict.score} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                        <div style={{ ...aStyles.display, fontSize: 28 }}>Echo audit</div>
                        <div style={{ ...aStyles.mono, fontSize: 9, color: A_PAL.textMute, letterSpacing: 1, textAlign: "right" }}>
                          {echoVerdict.graded} GRADED · STAT GRADE ONLY
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: A_PAL.textDim, marginTop: 2, fontStyle: "italic" }}>{echoVerdict.headline}</div>
                    </div>
                  </div>
                  {gradedEchoes.map(({ echo, ev }, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "36px 1fr 32px" : "40px 140px 1fr 36px",
                        gap: 14,
                        alignItems: "center",
                        padding: "12px 0",
                        borderTop: `1px solid ${A_PAL.border}`,
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <div style={{ ...aStyles.display, fontSize: 28, lineHeight: 1, color: A_PAL.ink }}>{echo.cost}</div>
                        <div style={{ ...aStyles.mono, fontSize: 8, color: A_PAL.textMute, letterSpacing: 1 }}>COST</div>
                      </div>
                      {!isMobile && (
                        <div>
                          <div style={{ ...aStyles.mono, fontSize: 9, color: A_PAL.textMute, letterSpacing: 1 }}>MAIN</div>
                          <div style={{ fontSize: 13, color: A_PAL.ink, marginTop: 1 }}>{echo.mainStat || "—"}</div>
                          <div style={{ ...aStyles.mono, fontSize: 10, color: A_PAL.textDim }}>
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
                          const qhex = dead ? A_PAL.textMute : A_STATUS[aQualityStatus(sv?.quality ?? 0)];
                          return (
                            <div
                              key={j}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "4px 9px",
                                borderRadius: 999,
                                background: A_PAL.surface,
                                border: `1px solid ${A_PAL.border}`,
                              }}
                            >
                              <span style={{ width: 5, height: 5, borderRadius: 999, background: qhex }} />
                              <span
                                style={{
                                  ...aStyles.mono,
                                  fontSize: 10,
                                  color: dead ? A_PAL.textMute : A_PAL.text,
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
                        <AGrade grade={ev.grade} status={ev.status} score={null} size="sm" />
                      </div>
                    </div>
                  ))}
                  <div style={{ ...aStyles.mono, fontSize: 9, color: A_PAL.textMute, letterSpacing: 1, marginTop: 14 }}>
                    STAT GRADE ONLY — SET BONUS NOT SCORED · edit in the Console theme
                  </div>
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
