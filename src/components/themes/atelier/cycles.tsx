"use client";

import { useState } from "react";
import { useData } from "@/lib/data-context";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import { A_PAL, aStyles } from "./styles";
import { ACard } from "./primitives";

export function AtelierCycles() {
  const { raw, roster, rosterByName } = useData();
  const { isMobile, isTablet } = useDashboardViewport();

  const cycles = raw.endstateMatrix.cycles;
  const [sel, setSel] = useState(cycles.length - 1);
  const c = cycles[sel];

  return (
    <div style={aStyles.shell}>
      <div style={{ padding: isMobile ? "20px 16px calc(48px + env(safe-area-inset-bottom))" : isTablet ? "28px 28px calc(48px + env(safe-area-inset-bottom))" : "32px 48px 56px" }}>
        <div style={{ marginBottom: 26 }}>
          <div
            style={{
              ...aStyles.mono,
              fontSize: 10,
              color: A_PAL.textMute,
              letterSpacing: 2,
              marginBottom: 4,
            }}
          >
            ENDSTATE · MATRIX
          </div>
          <div style={{ ...aStyles.display, fontSize: isMobile ? 46 : isTablet ? 60 : 72, lineHeight: 0.95 }}>
            Eight teams.{" "}
            <em style={{ fontStyle: "italic", color: A_PAL.textDim }}>One run each.</em>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 26, overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? 2 : 0 }}>
          {cycles.map((cc, i) => (
            <div
              key={cc.id}
              onClick={() => setSel(i)}
              style={{
                padding: "18px 22px",
                borderRadius: 16,
                cursor: "pointer",
                flex: isMobile ? "0 0 290px" : 1,
                background: i === sel ? A_PAL.surfaceStrong : A_PAL.surface,
                border: `1px solid ${i === sel ? A_PAL.ink : A_PAL.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "baseline",
                  gap: isMobile ? 10 : 0,
                }}
              >
                <div>
                  <div
                    style={{
                      ...aStyles.mono,
                      fontSize: 10,
                      color: A_PAL.textMute,
                      letterSpacing: 2,
                    }}
                  >
                    CYCLE {String(cc.id).padStart(2, "0")} · {cc.date}
                  </div>
                  <div
                    style={{
                      ...aStyles.display,
                      fontSize: 28,
                      fontStyle: "italic",
                      marginTop: 2,
                    }}
                  >
                    {cc.label}
                  </div>
                </div>
                <div style={{ textAlign: isMobile ? "left" : "right" }}>
                  <div style={{ ...aStyles.display, fontSize: 40, lineHeight: 1 }}>
                    {cc.totalPoints.toLocaleString()}
                  </div>
                  <div
                    style={{
                      ...aStyles.mono,
                      fontSize: 10,
                      color: A_PAL.textMute,
                    }}
                  >
                    {cc.teamsOver5k}/8 · {cc.dayOne ? "DAY ONE" : "—"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1.4fr 1fr", gap: isMobile ? 22 : 36 }}>
          <div>
            {c.teams.map((t, i) => {
              const w = (t.score / 15000) * 100;
              const iridescent = t.rating === "IRIDESCENT";
              const crowned = iridescent || t.rating === "CROWNED" || t.rating === "SSS";
              // Deeper stops than the dark themes — legible-on-light hues local to the file.
              const iridGrad = "linear-gradient(100deg, #d4437e, #b98600 35%, #0f8fb3 68%, #7b4fd6)";
              return (
                <div
                  key={i}
                  style={{
                    marginBottom: 22,
                    paddingBottom: 18,
                    borderBottom: `1px solid ${A_PAL.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      alignItems: isMobile ? "stretch" : "baseline",
                      gap: 16,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ ...aStyles.display, fontSize: 30, color: A_PAL.textDim }}>
                      0{t.order}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          ...aStyles.display,
                          fontSize: 24,
                          fontStyle: crowned ? "italic" : "normal",
                        }}
                      >
                        {t.members.join(" · ")}
                      </div>
                      <div
                        style={{
                          ...aStyles.mono,
                          fontSize: 10,
                          color: A_PAL.textMute,
                          letterSpacing: 1.5,
                          marginTop: 2,
                        }}
                      >
                        {t.buff.toUpperCase()}
                        {t.rating && (
                          <>
                            {" · "}
                            <span
                              style={
                                iridescent
                                  ? {
                                      backgroundImage: iridGrad,
                                      WebkitBackgroundClip: "text",
                                      backgroundClip: "text",
                                      color: "transparent",
                                    }
                                  : undefined
                              }
                            >
                              {t.rating}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ ...aStyles.display, fontSize: 32 }}>
                        {t.score.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      height: 3,
                      background: "rgba(60,70,100,0.08)",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${w}%`,
                        height: "100%",
                        background: iridescent ? iridGrad : crowned ? A_PAL.ink : t.over5k ? "#5fe1b3" : A_PAL.textMute,
                      }}
                    />
                  </div>
                  {t.notes && (
                    <div
                      style={{
                        fontSize: 12,
                        color: A_PAL.textDim,
                        marginTop: 8,
                        fontStyle: "italic",
                      }}
                    >
                      {t.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              position: isTablet ? "static" : "sticky",
              top: 80,
              alignSelf: "flex-start",
            }}
          >
            <ACard>
              <div style={{ ...aStyles.display, fontSize: 26, marginBottom: 14 }}>
                Lessons learned
              </div>
              {c.lessons.map((l, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: i < c.lessons.length - 1 ? `1px solid ${A_PAL.border}` : "none",
                  }}
                >
                  <div
                    style={{
                      ...aStyles.display,
                      fontSize: 18,
                      fontStyle: "italic",
                      color: A_PAL.accent,
                      width: 16,
                    }}
                  >
                    —
                  </div>
                  <div style={{ fontSize: 13, color: A_PAL.text, lineHeight: 1.45 }}>{l}</div>
                </div>
              ))}
            </ACard>
            <ACard>
              <div style={{ ...aStyles.display, fontSize: 26, marginBottom: 14 }}>
                Key findings
              </div>
              {raw.keyFindings.slice(0, 4).map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: i < 3 ? `1px solid ${A_PAL.border}` : "none",
                  }}
                >
                  <div
                    style={{
                      ...aStyles.mono,
                      fontSize: 10,
                      color: A_PAL.textMute,
                      width: 26,
                      paddingTop: 3,
                    }}
                  >
                    F.{String(i + 1).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: 12, color: A_PAL.textDim, lineHeight: 1.5 }}>{f}</div>
                </div>
              ))}
            </ACard>
          </div>
        </div>
      </div>
    </div>
  );
}
