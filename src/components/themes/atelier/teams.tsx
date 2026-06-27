/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useData } from "@/lib/data-context";
import { ELEMENTS } from "@/lib/elements";
import { elementIcon, portrait } from "@/lib/portraits";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import { A_PAL, aStyles } from "./styles";
import { ACard } from "./primitives";
import { CoverPortrait } from "@/components/cover-portrait";

export function AtelierTeams() {
  const { raw, roster, rosterByName } = useData();
  const { isMobile, isTablet } = useDashboardViewport();

  const [sel, setSel] = useState(0);
  const team = raw.benchmarks[sel];
  const meta = raw.benchmarkMeta;

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
            OVERDRIVE LEDGER
          </div>
          <div style={{ ...aStyles.display, fontSize: isMobile ? 46 : isTablet ? 60 : 72, lineHeight: 0.95 }}>
            The hand against the dummy
            <em style={{ fontStyle: "italic", color: A_PAL.textDim }}>.</em>
          </div>
          <div style={{ fontSize: 13, color: A_PAL.textDim, marginTop: 10, maxWidth: 720 }}>
            {meta.location}. {meta.runs}. {meta.resistances}.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1.5fr 1fr", gap: isMobile ? 22 : 36 }}>
          <div>
            <div
              style={{
                display: isMobile ? "none" : "grid",
                gridTemplateColumns: "30px 1fr 70px 70px 60px",
                gap: 14,
                padding: "8px 0",
                borderBottom: `1px solid ${A_PAL.borderStrong}`,
                ...aStyles.mono,
                fontSize: 10,
                color: A_PAL.textMute,
                letterSpacing: 1.5,
              }}
            >
              <div>№</div>
              <div>LINEUP &amp; NOTES</div>
              <div style={{ textAlign: "right" }}>BEST</div>
              <div style={{ textAlign: "right" }}>AVG</div>
              <div style={{ textAlign: "right" }}>SPREAD</div>
            </div>
            {raw.benchmarks.map((b, i) => {
              const selected = i === sel;
              return (
                <div
                  key={i}
                  onClick={() => setSel(i)}
                  style={{
                    padding: "14px 0",
                    borderBottom: `1px solid ${A_PAL.border}`,
                    cursor: "pointer",
                    background: selected ? "rgba(255,255,255,0.5)" : "transparent",
                    paddingLeft: selected ? 12 : 0,
                    transition: "all 0.15s",
                    margin: selected ? "0 -12px" : 0,
                    paddingRight: selected ? 12 : 0,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "30px 1fr 70px 70px 60px",
                      gap: 14,
                      alignItems: isMobile ? "stretch" : "center",
                    }}
                  >
                    <div
                      style={{
                        ...aStyles.display,
                        fontSize: 22,
                        color: i === 0 ? A_PAL.ink : A_PAL.textDim,
                      }}
                    >
                      {String(b.rank).padStart(2, "0")}
                    </div>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        {b.team.map((name) => {
                          const rr = rosterByName[name];
                          const el = rr ? ELEMENTS[rr.element] : null;
                          return (
                            <div
                              key={name}
                              style={{ display: "flex", alignItems: "center", gap: 5 }}
                            >
                              <div
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 5,
                                  overflow: "hidden",
                                  border: `1px solid ${el?.hex ?? A_PAL.border}80`,
                                  background: "white",
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
                              <div style={{ fontSize: 12, color: A_PAL.ink }}>{name}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: A_PAL.textDim,
                          fontStyle: "italic",
                        }}
                      >
                        {b.notes}
                      </div>
                    </div>
                    <div
                      style={{
                        ...aStyles.display,
                        fontSize: 22,
                        textAlign: isMobile ? "left" : "right",
                        color: i === 0 ? A_PAL.ink : A_PAL.text,
                      }}
                    >
                      {b.best}
                    </div>
                    <div
                      style={{
                        ...aStyles.mono,
                        fontSize: 11,
                        textAlign: isMobile ? "left" : "right",
                        color: A_PAL.textDim,
                      }}
                    >
                      {b.average}
                    </div>
                    <div
                      style={{
                        ...aStyles.mono,
                        fontSize: 11,
                        textAlign: isMobile ? "left" : "right",
                        color: A_PAL.textDim,
                      }}
                    >
                      {b.spread}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ position: isTablet ? "static" : "sticky", top: 80, alignSelf: "flex-start" }}>
            <ACard style={{ padding: isMobile ? 20 : 28, overflow: "hidden" }}>
              {/* magazine cover strip — the featured team, full-body */}
              <div
                data-coverstrip
                style={{
                  position: "relative",
                  margin: isMobile ? "-20px -20px 18px" : "-28px -28px 22px",
                  display: "grid",
                  gridTemplateColumns: `repeat(${team.team.length}, 1fr)`,
                  gap: 2,
                  background: A_PAL.border,
                }}
              >
                {team.team.map((name) => {
                  const rr = rosterByName[name];
                  const el = rr ? ELEMENTS[rr.element] : null;
                  return (
                    <div
                      key={name}
                      style={{
                        position: "relative",
                        aspectRatio: "3 / 4",
                        overflow: "hidden",
                        background: `linear-gradient(180deg, ${el?.glow ?? A_PAL.surface}, ${A_PAL.surfaceStrong})`,
                      }}
                    >
                      <CoverPortrait
                        name={name}
                        filter="drop-shadow(0 10px 20px rgba(60,70,100,0.25))"
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          padding: "14px 6px 6px",
                          background:
                            "linear-gradient(180deg, transparent, rgba(255,255,255,0.9))",
                          ...aStyles.mono,
                          fontSize: 9,
                          letterSpacing: 1,
                          color: A_PAL.ink,
                          textAlign: "center",
                        }}
                      >
                        {name}
                      </div>
                    </div>
                  );
                })}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    ...aStyles.mono,
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: A_PAL.ink,
                    background: "rgba(255,255,255,0.82)",
                    padding: "4px 9px",
                    borderRadius: 4,
                  }}
                >
                  № {String(team.rank).padStart(2, "0")} · {team.element.toUpperCase()}
                </div>
              </div>
              <div style={{ ...aStyles.display, fontSize: 36, lineHeight: 1.05 }}>
                {team.team.map((n, i) => (
                  <span key={n}>
                    {n}
                    {i < team.team.length - 1 && (
                      <span style={{ color: A_PAL.textMute }}> · </span>
                    )}
                  </span>
                ))}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: A_PAL.textDim,
                  marginTop: 14,
                  fontStyle: "italic",
                }}
              >
                {team.notes}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                  gap: 8,
                  marginTop: 20,
                  padding: "14px 0",
                  borderTop: `1px solid ${A_PAL.border}`,
                  borderBottom: `1px solid ${A_PAL.border}`,
                }}
              >
                {([
                  ["BEST", team.best],
                  ["AVG", team.average],
                  ["WORST", team.worst],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <div
                      style={{
                        ...aStyles.mono,
                        fontSize: 10,
                        color: A_PAL.textMute,
                        letterSpacing: 1.5,
                      }}
                    >
                      {k}
                    </div>
                    <div style={{ ...aStyles.display, fontSize: 26, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    ...aStyles.mono,
                    fontSize: 10,
                    color: A_PAL.textMute,
                    letterSpacing: 1.5,
                    marginBottom: 10,
                  }}
                >
                  LINEUP
                </div>
                {team.team.map((name) => {
                  const rr = rosterByName[name];
                  if (!rr) return null;
                  const el = ELEMENTS[rr.element];
                  return (
                    <div
                      key={name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 0",
                        borderBottom: `1px solid ${A_PAL.border}`,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          overflow: "hidden",
                          background: "white",
                          border: `1px solid ${A_PAL.border}`,
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
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: A_PAL.ink }}>{rr.name}</div>
                        <div style={{ fontSize: 11, color: A_PAL.textDim, marginTop: 2 }}>
                          {rr.weapon}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <img
                          src={elementIcon(rr.element)}
                          alt=""
                          style={{ width: 14, height: 14 }}
                        />
                        <div
                          style={{
                            ...aStyles.mono,
                            fontSize: 10,
                            color: el.hex,
                          }}
                        >
                          {rr.sequence}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ACard>
          </div>
        </div>
      </div>
    </div>
  );
}
