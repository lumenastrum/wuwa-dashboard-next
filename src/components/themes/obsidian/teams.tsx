/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useData } from "@/lib/data-context";
import { ELEMENTS } from "@/lib/elements";
import { durationToSec } from "@/lib/duration";
import { portrait } from "@/lib/portraits";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import { O_PAL, oStyles } from "./styles";
import { OCard, OElementPill } from "./primitives";

export function ObsidianTeams() {
  const { raw, roster, rosterByName } = useData();
  const { isMobile, isTablet } = useDashboardViewport();

  const [sel, setSel] = useState(0);
  const team = raw.benchmarks[sel];
  const meta = raw.benchmarkMeta;
  const minSec = durationToSec(raw.benchmarks[0].best);

  return (
    <div style={oStyles.shell}>
      <div style={{ padding: isMobile ? "18px 16px calc(48px + env(safe-area-inset-bottom))" : isTablet ? "24px 24px calc(48px + env(safe-area-inset-bottom))" : "28px 32px 56px" }}>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              ...oStyles.mono,
              fontSize: 11,
              color: O_PAL.textMute,
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            BENCHMARKS · OVERDRIVE
          </div>
          <div style={{ ...oStyles.display, fontSize: isMobile ? 42 : 48, lineHeight: 1 }}>
            The hand against the dummy.
          </div>
          <div style={{ fontSize: 13, color: O_PAL.textDim, marginTop: 8 }}>
            {meta.location} · {meta.runs} · {meta.resistances}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1.4fr 1fr", gap: 18 }}>
          <OCard style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                display: isMobile ? "none" : "grid",
                padding: "14px 22px",
                borderBottom: `1px solid ${O_PAL.border}`,
                gridTemplateColumns: "36px 1fr 90px 80px 60px 60px",
                gap: 12,
                ...oStyles.mono,
                fontSize: 10,
                color: O_PAL.textMute,
                letterSpacing: 1.5,
              }}
            >
              <div>#</div>
              <div>LINEUP</div>
              <div style={{ textAlign: "right" }}>BEST</div>
              <div style={{ textAlign: "right" }}>AVG</div>
              <div style={{ textAlign: "right" }}>SPREAD</div>
              <div style={{ textAlign: "right" }}>D</div>
            </div>
            {raw.benchmarks.map((b, i) => {
              const w = (minSec / durationToSec(b.best)) * 100;
              const selected = i === sel;
              return (
                <div
                  key={i}
                  onClick={() => setSel(i)}
                  style={{
                    padding: "12px 22px",
                    borderBottom: i < raw.benchmarks.length - 1 ? `1px solid ${O_PAL.border}` : "none",
                    background: selected ? "rgba(233,212,155,0.06)" : "transparent",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  {selected && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        background: O_PAL.accent,
                      }}
                    />
                  )}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "36px 1fr 90px 80px 60px 60px",
                      gap: 12,
                      alignItems: isMobile ? "stretch" : "center",
                    }}
                  >
                    <div
                      style={{
                        ...oStyles.mono,
                        fontSize: 11,
                        color: i === 0 ? O_PAL.accent : O_PAL.textDim,
                      }}
                    >
                      #{String(b.rank).padStart(2, "0")}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      {b.team.map((name) => {
                        const rr = rosterByName[name];
                        const el = rr ? ELEMENTS[rr.element] : null;
                        return (
                          <div key={name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 6,
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
                            <div style={{ fontSize: 12 }}>{name}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div
                      style={{
                        ...oStyles.mono,
                        fontSize: 13,
                        textAlign: isMobile ? "left" : "right",
                        color: i === 0 ? O_PAL.accent : O_PAL.text,
                      }}
                    >
                      {b.best}
                    </div>
                    <div
                      style={{
                        ...oStyles.mono,
                        fontSize: 11,
                        textAlign: isMobile ? "left" : "right",
                        color: O_PAL.textDim,
                      }}
                    >
                      {b.average}
                    </div>
                    <div
                      style={{
                        ...oStyles.mono,
                        fontSize: 11,
                        textAlign: isMobile ? "left" : "right",
                        color: O_PAL.textDim,
                      }}
                    >
                      {b.spread}
                    </div>
                    <div
                      style={{
                        ...oStyles.mono,
                        fontSize: 11,
                        textAlign: isMobile ? "left" : "right",
                        color: b.deaths === 0 ? "#5fe1b3" : "#ff7a8a",
                      }}
                    >
                      {b.deaths}
                    </div>
                  </div>
                  <div
                    style={{
                      height: 2,
                      background: "rgba(255,255,255,0.04)",
                      marginTop: 8,
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${w}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, ${i === 0 ? O_PAL.accent : "#5fe1b3"}, transparent)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </OCard>

          <OCard>
            <div
              style={{
                ...oStyles.mono,
                fontSize: 10,
                color: O_PAL.textMute,
                letterSpacing: 2,
                marginBottom: 6,
              }}
            >
              RANK #{String(team.rank).padStart(2, "0")} · {team.element.toUpperCase()}
            </div>
            <div style={{ ...oStyles.display, fontSize: 32, lineHeight: 1.1 }}>
              {team.team.join(" · ")}
            </div>
            <div style={{ fontSize: 13, color: O_PAL.textDim, marginTop: 12 }}>{team.notes}</div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: 10,
                marginTop: 22,
              }}
            >
              {([
                ["BEST", team.best],
                ["AVG", team.average],
                ["WORST", team.worst],
              ] as [string, string][]).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    padding: "14px 16px",
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
                      letterSpacing: 1.5,
                    }}
                  >
                    {k}
                  </div>
                  <div style={{ ...oStyles.display, fontSize: 28, marginTop: 4 }}>{v}</div>
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
                  marginBottom: 10,
                }}
              >
                LINEUP
              </div>
              {team.team.map((name) => {
                const rr = rosterByName[name];
                if (!rr) return null;
                return (
                  <div
                    key={name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: O_PAL.surface,
                      border: `1px solid ${O_PAL.border}`,
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        overflow: "hidden",
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
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14 }}>{rr.name}</div>
                      <div style={{ fontSize: 11, color: O_PAL.textDim, marginTop: 2 }}>
                        {rr.weapon} · {rr.echoSet}
                      </div>
                    </div>
                    <OElementPill el={rr.element} small />
                    <div style={{ ...oStyles.mono, fontSize: 11, color: O_PAL.accent }}>{rr.sequence}</div>
                  </div>
                );
              })}
            </div>
          </OCard>
        </div>
      </div>
    </div>
  );
}
