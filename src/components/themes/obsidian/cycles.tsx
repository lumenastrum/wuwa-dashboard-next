/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useData } from "@/lib/data-context";
import { ELEMENTS } from "@/lib/elements";
import { portrait } from "@/lib/portraits";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import { O_PAL, oStyles } from "./styles";
import { OCard } from "./primitives";

export function ObsidianCycles() {
  const { raw, roster, rosterByName } = useData();
  const { isMobile, isTablet } = useDashboardViewport();

  const cycles = raw.endstateMatrix.cycles;
  const [sel, setSel] = useState(cycles.length - 1);
  const c = cycles[sel];

  return (
    <div style={oStyles.shell}>
      <div style={{ padding: isMobile ? "18px 16px calc(48px + env(safe-area-inset-bottom))" : isTablet ? "24px 24px calc(48px + env(safe-area-inset-bottom))" : "28px 32px 56px" }}>
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              ...oStyles.mono,
              fontSize: 11,
              color: O_PAL.textMute,
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            ENDSTATE MATRIX
          </div>
          <div style={{ ...oStyles.display, fontSize: isMobile ? 40 : 48, lineHeight: 1 }}>
            Eight teams. One run each.{" "}
            <em style={{ fontStyle: "italic", color: O_PAL.accent }}>No mulligans.</em>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 22, overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? 2 : 0 }}>
          {cycles.map((cc, i) => (
            <div
              key={cc.id}
              onClick={() => setSel(i)}
              style={{
                padding: "14px 22px",
                borderRadius: 14,
                cursor: "pointer",
                background: i === sel ? "rgba(233,212,155,0.08)" : O_PAL.surface,
                border: `1px solid ${i === sel ? O_PAL.borderStrong : O_PAL.border}`,
                flex: isMobile ? "0 0 280px" : 1,
              }}
            >
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "baseline", gap: isMobile ? 10 : 0 }}>
                <div>
                  <div
                    style={{
                      ...oStyles.mono,
                      fontSize: 10,
                      color: O_PAL.textMute,
                      letterSpacing: 2,
                    }}
                  >
                    CYCLE {String(cc.id).padStart(2, "0")}
                  </div>
                  <div style={{ ...oStyles.display, fontSize: 26, marginTop: 2 }}>{cc.label}</div>
                  <div style={{ fontSize: 12, color: O_PAL.textDim, marginTop: 4 }}>{cc.date}</div>
                </div>
                <div style={{ textAlign: isMobile ? "left" : "right" }}>
                  <div
                    style={{
                      ...oStyles.display,
                      fontSize: 32,
                      color: i === sel ? O_PAL.accent : O_PAL.text,
                    }}
                  >
                    {cc.totalPoints.toLocaleString()}
                  </div>
                  <div
                    style={{
                      ...oStyles.mono,
                      fontSize: 10,
                      color: O_PAL.textMute,
                      letterSpacing: 1,
                    }}
                  >
                    / {cc.target.toLocaleString()} TARGET
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1.4fr 1fr", gap: 18 }}>
          <OCard>
            <div style={{ ...oStyles.display, fontSize: 24, marginBottom: 14 }}>
              The Run · {c.label}
            </div>
            {c.teams.map((t, i) => {
              const maxScore = 15000;
              const w = (t.score / maxScore) * 100;
              const crowned = t.rating === "CROWNED" || t.rating === "SSS";
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      alignItems: isMobile ? "stretch" : "center",
                      gap: 12,
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        ...oStyles.mono,
                        fontSize: 11,
                        color: O_PAL.textMute,
                        width: 24,
                      }}
                    >
                      0{t.order}
                    </div>
                    <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
                      {t.members.map((name) => {
                        const rr = rosterByName[name];
                        const el = rr ? ELEMENTS[rr.element] : null;
                        return (
                          <div key={name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 5,
                                overflow: "hidden",
                                border: `1px solid ${el?.hex ?? O_PAL.border}80`,
                                background: "rgba(0,0,0,0.4)",
                              }}
                            >
                              <img
                                src={portrait(name)}
                                alt={name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  objectPosition: "center 20%",
                                }}
                              />
                            </div>
                            <div style={{ fontSize: 11, color: O_PAL.textDim }}>{name}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div
                      style={{
                        ...oStyles.mono,
                        fontSize: 10,
                        color: O_PAL.textMute,
                        letterSpacing: 1,
                      }}
                    >
                      {t.buff.toUpperCase()}
                    </div>
                    {t.rating && (
                      <div
                        style={{
                          ...oStyles.mono,
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: crowned ? O_PAL.accent : "rgba(255,255,255,0.05)",
                          color: crowned ? "#0a0d14" : O_PAL.text,
                        }}
                      >
                        {t.rating}
                      </div>
                    )}
                    <div
                      style={{
                        ...oStyles.display,
                        fontSize: 22,
                        color: t.over5k ? O_PAL.text : O_PAL.textDim,
                        width: isMobile ? "auto" : 80,
                        textAlign: isMobile ? "left" : "right",
                      }}
                    >
                      {t.score.toLocaleString()}
                    </div>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${w}%`,
                        height: "100%",
                        background: crowned ? O_PAL.accent : t.over5k ? "#5fe1b3" : O_PAL.textMute,
                        boxShadow: crowned ? `0 0 8px ${O_PAL.accent}80` : "none",
                      }}
                    />
                  </div>
                  {t.notes && (
                    <div
                      style={{
                        fontSize: 11,
                        color: O_PAL.textDim,
                        marginTop: 4,
                        marginLeft: 36,
                      }}
                    >
                      {t.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </OCard>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <OCard>
              <div style={{ ...oStyles.display, fontSize: 22, marginBottom: 12 }}>Lessons</div>
              {c.lessons.map((l, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: i < c.lessons.length - 1 ? `1px solid ${O_PAL.border}` : "none",
                  }}
                >
                  <div
                    style={{
                      ...oStyles.display,
                      fontStyle: "italic",
                      fontSize: 18,
                      color: O_PAL.accent,
                      width: 22,
                      lineHeight: 1,
                      paddingTop: 2,
                    }}
                  >
                    ·
                  </div>
                  <div style={{ fontSize: 13, color: O_PAL.text, lineHeight: 1.45 }}>{l}</div>
                </div>
              ))}
            </OCard>
            <OCard>
              <div style={{ ...oStyles.display, fontSize: 22, marginBottom: 12 }}>Key Findings</div>
              {raw.keyFindings.slice(0, 5).map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: i < 4 ? `1px solid ${O_PAL.border}` : "none",
                  }}
                >
                  <div
                    style={{
                      ...oStyles.mono,
                      fontSize: 10,
                      color: O_PAL.textMute,
                      width: 24,
                      paddingTop: 2,
                    }}
                  >
                    F.{String(i + 1).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: 12, color: O_PAL.textDim, lineHeight: 1.5 }}>{f}</div>
                </div>
              ))}
            </OCard>
          </div>
        </div>
      </div>
    </div>
  );
}
