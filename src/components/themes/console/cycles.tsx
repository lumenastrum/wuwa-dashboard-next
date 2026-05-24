/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useData } from "@/lib/data-context";
import { ELEMENTS, STATUS_HEX } from "@/lib/elements";
import { portrait } from "@/lib/portraits";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import { K_PAL, kStyles } from "./styles";
import { KPanel, KScanlines } from "./primitives";

export function ConsoleCycles() {
  const { raw, roster, rosterByName } = useData();
  const { isMobile, isTablet } = useDashboardViewport();

  const cycles = raw.endstateMatrix.cycles;
  const [sel, setSel] = useState(cycles.length - 1);
  const c = cycles[sel];

  return (
    <div style={kStyles.shell}>
      <KScanlines />
      <div style={{ position: "relative", padding: isMobile ? "18px 16px calc(48px + env(safe-area-inset-bottom))" : isTablet ? "22px 22px calc(48px + env(safe-area-inset-bottom))" : "24px 28px 56px" }}>
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              ...kStyles.mono,
              fontSize: 10,
              color: K_PAL.cyan,
              letterSpacing: 3,
              marginBottom: 4,
            }}
          >
            ◢ MODULE / ENDSTATE_MATRIX
          </div>
          <div style={{ ...kStyles.display, fontSize: isMobile ? 30 : 38, letterSpacing: 0 }}>
            Endstate Matrix &nbsp;<span style={{ color: K_PAL.cyan }}>//</span>&nbsp;{" "}
            <span style={{ color: K_PAL.textDim, fontSize: isMobile ? 18 : 22 }}>cycles={cycles.length}</span>
          </div>
        </div>

        <div
          style={{
            display: isMobile ? "flex" : "grid",
            gridTemplateColumns: `repeat(${cycles.length}, 1fr)`,
            gap: 12,
            marginBottom: 14,
            overflowX: isMobile ? "auto" : "visible",
            paddingBottom: isMobile ? 2 : 0,
          }}
        >
          {cycles.map((cc, i) => {
            const active = i === sel;
            return (
              <KPanel
                key={cc.id}
                accent={active ? K_PAL.magenta : K_PAL.border}
                style={{ padding: 14, cursor: "pointer", flex: isMobile ? "0 0 290px" : undefined }}
                label={`CYCLE.${String(cc.id).padStart(2, "0")}`}
                code={cc.date}
              >
                <div onClick={() => setSel(i)}>
                  <div
                    style={{
                      ...kStyles.display,
                      fontSize: 22,
                      color: active ? K_PAL.text : K_PAL.textDim,
                    }}
                  >
                    {cc.label}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      justifyContent: "space-between",
                      alignItems: isMobile ? "flex-start" : "baseline",
                      gap: isMobile ? 8 : 0,
                      marginTop: 8,
                    }}
                  >
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 32,
                        color: active ? K_PAL.amber : K_PAL.text,
                        letterSpacing: -1,
                      }}
                    >
                      {cc.totalPoints.toLocaleString()}
                    </div>
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 10,
                        color: K_PAL.textMute,
                        letterSpacing: 1.5,
                      }}
                    >
                      / {cc.target.toLocaleString()} TGT · {cc.teamsOver5k}/8 5K+
                    </div>
                  </div>
                </div>
              </KPanel>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1.5fr 1fr", gap: 14 }}>
          <KPanel
            label={`RUN_LOG · ${c.label.toUpperCase()}`}
            code={`C.${String(c.id).padStart(2, "0")}`}
            accent={K_PAL.magenta}
          >
            <div
              style={{
                display: isMobile ? "none" : "grid",
                gridTemplateColumns: "24px 1fr 90px 70px",
                gap: 12,
                padding: "0 4px 8px 4px",
                borderBottom: `1px solid ${K_PAL.border}`,
                ...kStyles.mono,
                fontSize: 9,
                color: K_PAL.textMute,
                letterSpacing: 1.5,
              }}
            >
              <div>#</div>
              <div>LINEUP · BUFF</div>
              <div style={{ textAlign: "right" }}>SCORE</div>
              <div style={{ textAlign: "right" }}>RATING</div>
            </div>
            {c.teams.map((t, i) => {
              const crowned = t.rating === "CROWNED" || t.rating === "SSS";
              const maxScore = 15000;
              const w = (t.score / maxScore) * 100;
              return (
                <div
                  key={i}
                  style={{
                    padding: "10px 4px",
                    borderBottom: i < c.teams.length - 1 ? `1px solid ${K_PAL.border}` : "none",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "24px 1fr 90px 70px",
                      gap: 12,
                      alignItems: isMobile ? "stretch" : "center",
                    }}
                  >
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 11,
                        color: K_PAL.textDim,
                      }}
                    >
                      0{t.order}
                    </div>
                    <div>
                      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                        {t.members.map((n) => {
                          const rr = rosterByName[n];
                          const el = rr ? ELEMENTS[rr.element] : null;
                          return (
                            <div
                              key={n}
                              style={{
                                width: 20,
                                height: 20,
                                overflow: "hidden",
                                border: `1px solid ${el?.hex ?? K_PAL.border}60`,
                                background: "rgba(0,0,0,0.4)",
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
                        <div style={{ fontSize: 11, color: K_PAL.text, marginLeft: 4 }}>
                          {t.members.join(" · ")}
                        </div>
                      </div>
                      <div
                        style={{
                          ...kStyles.mono,
                          fontSize: 9,
                          color: K_PAL.textMute,
                          marginTop: 4,
                          letterSpacing: 1,
                        }}
                      >
                        {t.buff.toUpperCase()}
                      </div>
                    </div>
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 14,
                        color: t.over5k ? (crowned ? K_PAL.amber : K_PAL.text) : K_PAL.textDim,
                        textAlign: isMobile ? "left" : "right",
                      }}
                    >
                      {t.score.toLocaleString()}
                    </div>
                    <div style={{ textAlign: isMobile ? "left" : "right" }}>
                      {t.rating ? (
                        <div
                          style={{
                            ...kStyles.mono,
                            fontSize: 10,
                            padding: "2px 6px",
                            background: crowned ? K_PAL.amber : "rgba(126,224,255,0.1)",
                            color: crowned ? K_PAL.ink : K_PAL.cyan,
                            letterSpacing: 1.5,
                            display: "inline-block",
                          }}
                        >
                          {t.rating}
                        </div>
                      ) : (
                        <div
                          style={{ ...kStyles.mono, fontSize: 10, color: K_PAL.textMute }}
                        >
                          —
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ height: 3, background: "rgba(120,220,255,0.04)", marginTop: 6 }}>
                    <div
                      style={{
                        width: `${w}%`,
                        height: "100%",
                        background: crowned ? K_PAL.amber : t.over5k ? K_PAL.cyan : K_PAL.textMute,
                      }}
                    />
                  </div>
                  {t.notes && (
                    <div
                      style={{
                        fontSize: 10,
                        color: K_PAL.textDim,
                        marginTop: 4,
                        fontStyle: "italic",
                      }}
                    >
                      // {t.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </KPanel>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <KPanel label="LESSONS_LEARNED" code="LSN.001" accent={K_PAL.amber}>
              {c.lessons.map((l, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: i < c.lessons.length - 1 ? `1px solid ${K_PAL.border}` : "none",
                  }}
                >
                  <div
                    style={{
                      ...kStyles.mono,
                      fontSize: 9,
                      color: K_PAL.amber,
                      paddingTop: 3,
                      minWidth: 28,
                      letterSpacing: 1,
                    }}
                  >
                    L.{String(i + 1).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: 12, color: K_PAL.text, lineHeight: 1.45 }}>{l}</div>
                </div>
              ))}
            </KPanel>
            <KPanel label="ACTION_ITEMS" code="ACT.001" accent={K_PAL.cyan}>
              {raw.actionItems.slice(0, 6).map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: i < 5 ? `1px solid ${K_PAL.border}` : "none",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      marginTop: 6,
                      flexShrink: 0,
                      background: STATUS_HEX[a.status],
                      boxShadow: `0 0 8px ${STATUS_HEX[a.status]}`,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 11,
                        color: K_PAL.text,
                        letterSpacing: 0.5,
                      }}
                    >
                      {a.task.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 11, color: K_PAL.textDim, marginTop: 2 }}>
                      {a.detail}
                    </div>
                  </div>
                </div>
              ))}
            </KPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
