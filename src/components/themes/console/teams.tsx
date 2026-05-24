/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useData } from "@/lib/data-context";
import { ELEMENTS } from "@/lib/elements";
import { durationToSec } from "@/lib/duration";
import { portrait } from "@/lib/portraits";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import type { Benchmark } from "@/lib/types";
import { K_PAL, kStyles } from "./styles";
import { KPanel, KScanlines } from "./primitives";

function KTeamRow({
  b,
  idx,
  maxSec,
  selected,
  onClick,
}: {
  b: Benchmark;
  idx: number;
  maxSec: number;
  selected: boolean;
  onClick: () => void;
}) {
  const { rosterByName } = useData();
  const { isMobile } = useDashboardViewport();
  const sec = durationToSec(b.best);
  const w = (1 - (sec - 30) / (maxSec - 30)) * 100;
  const isRank1 = idx === 0;
  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "36px 220px 1fr 70px 80px 60px",
        gap: 14,
        alignItems: isMobile ? "stretch" : "center",
        padding: "10px 8px",
        borderBottom: `1px solid ${K_PAL.border}`,
        background: selected ? "rgba(126,224,255,0.05)" : "transparent",
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
            background: K_PAL.cyan,
          }}
        />
      )}
      <div
        style={{
          ...kStyles.mono,
          fontSize: 11,
          color: isRank1 ? K_PAL.amber : K_PAL.textDim,
          letterSpacing: 1,
        }}
      >
        #{String(idx + 1).padStart(2, "0")}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {b.team.map((name) => {
          const rr = rosterByName[name];
          const el = rr ? ELEMENTS[rr.element] : null;
          return (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "2px 6px 2px 2px",
                background: "rgba(0,0,0,0.3)",
                border: `1px solid ${el?.hex ?? K_PAL.border}40`,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  overflow: "hidden",
                  background: "rgba(0,0,0,0.5)",
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
              <div
                style={{
                  ...kStyles.mono,
                  fontSize: 9,
                  color: el?.hex ?? K_PAL.text,
                  letterSpacing: 0.5,
                }}
              >
                {name.slice(0, 4).toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "relative", height: 16, background: "rgba(120,220,255,0.04)" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${w}%`,
            background: `linear-gradient(90deg, ${isRank1 ? K_PAL.amber : K_PAL.cyan}, ${isRank1 ? K_PAL.amber : K_PAL.cyan}40)`,
            boxShadow: `0 0 10px ${isRank1 ? K_PAL.amber : K_PAL.cyan}40`,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            ...kStyles.mono,
            fontSize: 9,
            color: K_PAL.ink,
            letterSpacing: 1,
            fontWeight: 600,
          }}
        >
          {b.spread}
        </div>
      </div>
      <div
        style={{
          ...kStyles.mono,
          fontSize: 13,
          color: isRank1 ? K_PAL.amber : K_PAL.text,
          textAlign: isMobile ? "left" : "right",
        }}
      >
        {b.best}
      </div>
      <div
        style={{
          ...kStyles.mono,
          fontSize: 11,
          color: K_PAL.textDim,
          textAlign: isMobile ? "left" : "right",
        }}
      >
        ~{b.average}
      </div>
      <div
        style={{
          ...kStyles.mono,
          fontSize: 10,
          color: b.deaths === 0 ? K_PAL.cyan : K_PAL.magenta,
          textAlign: isMobile ? "left" : "right",
        }}
      >
        {b.deaths === 0 ? "CLEAN" : `D${b.deaths}`}
      </div>
    </div>
  );
}

export function ConsoleTeams() {
  const { raw, roster, rosterByName } = useData();
  const { isMobile, isTablet } = useDashboardViewport();

  const [sel, setSel] = useState(0);
  const team = raw.benchmarks[sel];
  const meta = raw.benchmarkMeta;
  const maxSec = Math.max(...raw.benchmarks.map((b) => durationToSec(b.best)));

  return (
    <div style={kStyles.shell}>
      <KScanlines />
      <div style={{ position: "relative", padding: isMobile ? "18px 16px 24px" : isTablet ? "22px 22px" : "24px 28px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "flex-end",
            gap: isMobile ? 12 : 18,
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                ...kStyles.mono,
                fontSize: 10,
                color: K_PAL.cyan,
                letterSpacing: 3,
                marginBottom: 4,
              }}
            >
              ◢ MODULE / BENCHMARK_TELEMETRY
            </div>
            <div style={{ ...kStyles.display, fontSize: isMobile ? 30 : 38, letterSpacing: 0 }}>
              Combat Telemetry &nbsp;<span style={{ color: K_PAL.cyan }}>//</span>&nbsp;{" "}
              <span style={{ color: K_PAL.textDim, fontSize: isMobile ? 18 : 22 }}>q2_2026</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 18,
              ...kStyles.mono,
              fontSize: 10,
              color: K_PAL.textDim,
              letterSpacing: 1.5,
            }}
          >
            <span>
              ZONE&nbsp;
              <span style={{ color: K_PAL.text }}>
                {meta.location.replace("Overdrive Zone - ", "")}
              </span>
            </span>
            <span>
              TIMER&nbsp;<span style={{ color: K_PAL.text }}>{meta.timer}</span>
            </span>
            <span>
              RUNS&nbsp;<span style={{ color: K_PAL.text }}>{meta.runs}</span>
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1.6fr 1fr", gap: 14 }}>
          <KPanel
            label="LINEUP_TELEMETRY · BEST × AVG × SPREAD"
            code="TBL.001"
            style={{ padding: isMobile ? 14 : 20 }}
          >
            <div
              style={{
                display: isMobile ? "none" : "grid",
                gridTemplateColumns: "36px 220px 1fr 70px 80px 60px",
                gap: 14,
                padding: "0 8px 8px 8px",
                borderBottom: `1px solid ${K_PAL.border}`,
                ...kStyles.mono,
                fontSize: 9,
                color: K_PAL.textMute,
                letterSpacing: 1.5,
              }}
            >
              <div>RANK</div>
              <div>LINEUP</div>
              <div style={{ textAlign: "center" }}>SPEED &amp; SPREAD</div>
              <div style={{ textAlign: "right" }}>BEST</div>
              <div style={{ textAlign: "right" }}>AVG</div>
              <div style={{ textAlign: "right" }}>RUN</div>
            </div>
            {raw.benchmarks.map((b, i) => (
              <KTeamRow
                key={i}
                b={b}
                idx={i}
                maxSec={maxSec}
                selected={i === sel}
                onClick={() => setSel(i)}
              />
            ))}
          </KPanel>

          <KPanel
            label={`LINEUP_DETAIL · #${String(team.rank).padStart(2, "0")}`}
            code="DTL.001"
            accent={K_PAL.amber}
          >
            <div style={{ ...kStyles.display, fontSize: 26, color: K_PAL.text }}>
              {team.team.join(" · ")}
            </div>
            <div style={{ fontSize: 12, color: K_PAL.textDim, marginTop: 8, fontStyle: "italic" }}>
              {team.notes}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: 6,
                marginTop: 16,
              }}
            >
              {([
                ["BEST", team.best, K_PAL.amber],
                ["AVG", team.average, K_PAL.cyan],
                ["WORST", team.worst, K_PAL.textDim],
              ] as [string, string, string][]).map(([k, v, c]) => (
                <div
                  key={k}
                  style={{
                    padding: 10,
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${c}40`,
                  }}
                >
                  <div
                    style={{ ...kStyles.mono, fontSize: 9, color: c, letterSpacing: 1.5 }}
                  >
                    {k}
                  </div>
                  <div
                    style={{
                      ...kStyles.mono,
                      fontSize: 22,
                      color: K_PAL.text,
                      marginTop: 4,
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  ...kStyles.mono,
                  fontSize: 9,
                  color: K_PAL.cyan,
                  letterSpacing: 2,
                  marginBottom: 8,
                }}
              >
                ▸ LINEUP_BREAKDOWN
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
                      gap: 10,
                      padding: "8px 0",
                      borderBottom: `1px solid ${K_PAL.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        overflow: "hidden",
                        background: "rgba(0,0,0,0.4)",
                        border: `1px solid ${el.hex}60`,
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
                      <div style={{ fontSize: 12, color: K_PAL.text }}>{rr.name}</div>
                      <div
                        style={{
                          ...kStyles.mono,
                          fontSize: 9,
                          color: K_PAL.textDim,
                          marginTop: 1,
                          letterSpacing: 0.5,
                        }}
                      >
                        {rr.weapon}
                      </div>
                    </div>
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 10,
                        color: el.hex,
                        letterSpacing: 1,
                      }}
                    >
                      {rr.sequence}
                    </div>
                  </div>
                );
              })}
            </div>
          </KPanel>
        </div>
      </div>
    </div>
  );
}
