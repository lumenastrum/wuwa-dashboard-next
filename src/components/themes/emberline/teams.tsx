/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useData } from "@/lib/data-context";
import { ELEMENTS } from "@/lib/elements";
import { durationToSec } from "@/lib/duration";
import { elementBadge } from "@/lib/game-icons";
import type { ElementName } from "@/lib/types";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import { CoverPortrait } from "@/components/cover-portrait";
import { E_PAL, eStyles } from "./styles";
import { EDiamond, EFace, EFooter, EKicker, EShell } from "./primitives";

const GRID = "40px 1fr 70px 66px 60px 36px";

export function EmberlineTeams() {
  const { raw, rosterByName } = useData();
  const { isMobile, isTablet } = useDashboardViewport();
  const [sel, setSel] = useState(0);

  const benches = raw.benchmarks;
  const team = benches[Math.min(sel, benches.length - 1)];
  const minSec = Math.min(...benches.map((b) => durationToSec(b.best)));
  const meta = raw.benchmarkMeta;
  const totalDeaths = benches.reduce((acc, b) => acc + b.deaths, 0);

  return (
    <EShell>
      {/* header */}
      <div style={{ padding: isMobile ? "18px 16px 16px" : "28px 34px 22px" }}>
        <EKicker spacing={3} style={{ marginBottom: 8 }}>BENCHMARKS · OVERDRIVE</EKicker>
        <div style={{ ...eStyles.display, fontSize: isMobile ? 36 : 48, lineHeight: 1 }}>
          The hand against <span style={{ fontStyle: "italic", color: E_PAL.emberSoft }}>the dummy</span>.
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            rowGap: isMobile ? 6 : undefined,
            flexWrap: isMobile ? "wrap" : undefined,
            marginTop: 12,
            ...eStyles.mono,
            fontSize: 10,
            letterSpacing: 1,
            color: E_PAL.textDim,
          }}
        >
          <span>{meta.location.toUpperCase().replace(" - ", " — ")}</span>
          <span style={{ color: E_PAL.textFaint }}>✦</span>
          <span>{meta.runs.toUpperCase()} · {meta.timer} TIMER</span>
          <span style={{ color: E_PAL.textFaint }}>✦</span>
          <span>{meta.resistances.split("|").slice(0, 2).map((s) => s.trim().replace(/\s*\(([^)]+)\)/, " $1")).join(" · ").toUpperCase()}</span>
          {!isMobile && <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(140,220,225,0.15), transparent)" }} />}
          <span style={{ color: E_PAL.textFaint }}>{meta.date.toUpperCase()}</span>
        </div>
      </div>

      {/* table + featured */}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1.4fr 1fr", gap: isMobile ? 14 : 18, padding: isMobile ? "0 16px 24px" : "0 34px 28px" }}>
        {/* benchmark table */}
        <div
          style={{
            position: "relative",
            border: `1px solid ${E_PAL.border}`,
            borderRadius: 8,
            background: E_PAL.panel,
            overflow: "hidden",
            alignSelf: "start",
          }}
        >
          <EDiamond corner="tl" style={{ zIndex: 2 }} />
          {/* 1c in-card horizontal scroll: header + rows share one min-width track on mobile */}
          <div style={{ overflowX: isMobile ? "auto" : "visible" }}>
          <div style={{ minWidth: isMobile ? 560 : undefined }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: GRID,
              gap: 10,
              padding: "13px 20px",
              borderBottom: `1px solid ${E_PAL.border}`,
              ...eStyles.mono,
              fontSize: 9,
              letterSpacing: 2,
              color: E_PAL.textMute,
            }}
          >
            <span>#</span>
            <span>LINEUP</span>
            <span style={{ textAlign: "right" }}>BEST</span>
            <span style={{ textAlign: "right" }}>AVG</span>
            <span style={{ textAlign: "right" }}>SPREAD</span>
            <span style={{ textAlign: "right" }}>D</span>
          </div>
          {benches.map((b, i) => {
            const first = i === 0;
            const selected = i === Math.min(sel, benches.length - 1);
            return (
              <div
                key={i}
                onClick={() => setSel(i)}
                style={{
                  position: "relative",
                  padding: "11px 20px",
                  borderBottom: `1px solid rgba(140,220,225,0.07)`,
                  cursor: "pointer",
                  background: selected ? "rgba(255,179,138,0.06)" : "transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!selected) e.currentTarget.style.background = "rgba(140,220,225,0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!selected) e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: selected ? E_PAL.ember : "transparent",
                  }}
                />
                <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, alignItems: "center" }}>
                  <span style={{ ...eStyles.mono, fontSize: 10, color: first ? E_PAL.emberSoft : E_PAL.textMute }}>
                    #{String(b.rank).padStart(2, "0")}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {b.team.map((n) => (
                      <div key={n} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <EFace name={n} size={24} radius={5} border="rgba(140,220,225,0.18)" />
                        <span style={{ ...eStyles.body, fontSize: 12, color: rosterByName[n] ? E_PAL.text : E_PAL.textDim }}>
                          {n}
                        </span>
                      </div>
                    ))}
                  </div>
                  <span style={{ ...eStyles.mono, fontSize: 12, textAlign: "right", color: first ? E_PAL.emberSoft : E_PAL.text }}>
                    {b.best}
                  </span>
                  <span style={{ ...eStyles.mono, fontSize: 10, textAlign: "right", color: E_PAL.textDim }}>{b.average}</span>
                  <span style={{ ...eStyles.mono, fontSize: 10, textAlign: "right", color: E_PAL.textDim }}>{b.spread}</span>
                  <span style={{ ...eStyles.mono, fontSize: 10, textAlign: "right", color: b.deaths === 0 ? E_PAL.green : E_PAL.red }}>
                    {b.deaths}
                  </span>
                </div>
                <div style={{ height: 2, background: "rgba(140,220,225,0.06)", marginTop: 8, borderRadius: 999, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.round((minSec / durationToSec(b.best)) * 100)}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${first ? E_PAL.emberSoft : ELEMENTS.Aero.hex}, transparent)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
          </div>
          </div>
        </div>

        {/* featured team */}
        <div
          style={{
            position: "relative",
            border: `1px solid ${E_PAL.border}`,
            borderRadius: 8,
            background: E_PAL.panel,
            overflow: "hidden",
            alignSelf: "start",
          }}
        >
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: `repeat(${team.team.length}, 1fr)`, gap: 2, background: E_PAL.trackStrong }}>
            {team.team.map((n) => {
              const rr = rosterByName[n];
              const glow = rr ? ELEMENTS[rr.element].glow : "rgba(140,220,225,0.08)";
              return (
                <div
                  key={n}
                  style={{
                    position: "relative",
                    aspectRatio: "3 / 4",
                    overflow: "hidden",
                    background: `linear-gradient(180deg, ${glow}, rgba(5,15,21,0.9))`,
                  }}
                >
                  <CoverPortrait name={n} />
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 36%, transparent, #050f15 98%)" }} />
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      padding: "16px 6px 7px",
                      background: "linear-gradient(180deg, transparent, rgba(5,15,21,0.95))",
                      ...eStyles.mono,
                      fontSize: 9,
                      letterSpacing: 1,
                      textAlign: "center",
                      color: E_PAL.text,
                    }}
                  >
                    {n.toUpperCase()}
                  </div>
                </div>
              );
            })}
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                ...eStyles.mono,
                fontSize: 10,
                letterSpacing: 1.5,
                color: E_PAL.emberSoft,
                background: "rgba(5,15,21,0.75)",
                border: `1px solid ${E_PAL.borderStrong}`,
                padding: "4px 10px",
                borderRadius: 5,
              }}
            >
              #{String(team.rank).padStart(2, "0")} · {team.element.toUpperCase()}
            </div>
          </div>
          <div style={{ padding: "20px 22px 22px" }}>
            <div style={{ ...eStyles.display, fontSize: 28, lineHeight: 1.15 }}>{team.team.join(" · ")}</div>
            {team.notes && (
              <div style={{ ...eStyles.body, fontSize: 13, fontStyle: "italic", color: E_PAL.textDim, marginTop: 8 }}>
                {team.notes}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 18 }}>
              {[
                { label: "BEST", value: team.best, color: E_PAL.emberSoft },
                { label: "AVG", value: team.average, color: E_PAL.text },
                { label: "WORST", value: team.worst, color: E_PAL.text },
              ].map((t) => (
                <div
                  key={t.label}
                  style={{
                    border: `1px solid ${E_PAL.border}`,
                    borderRadius: 6,
                    background: E_PAL.insetStrong,
                    padding: isMobile ? "10px" : "12px 14px",
                  }}
                >
                  <EKicker size={9} spacing={2}>{t.label}</EKicker>
                  <div style={{ ...eStyles.display, fontSize: isMobile ? 22 : 26, marginTop: 3, color: t.color }}>{t.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 10px" }}>
              <EKicker size={9} spacing={2}>LINEUP</EKicker>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(147,224,211,0.3), transparent)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {team.team.map((n) => {
                const rr = rosterByName[n];
                return (
                  <div
                    key={n}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: isMobile ? "8px 10px" : "9px 12px",
                      borderRadius: 6,
                      background: E_PAL.inset,
                      border: `1px solid ${E_PAL.borderSoft}`,
                    }}
                  >
                    <EFace name={n} size={isMobile ? 34 : 38} radius={7} border="rgba(140,220,225,0.18)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...eStyles.body, fontSize: 13, fontWeight: 600 }}>{n}</div>
                      <div
                        style={{
                          ...eStyles.mono,
                          fontSize: 9,
                          color: E_PAL.textMute,
                          marginTop: 2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {rr ? `${rr.weapon} · ${rr.echoSet}`.toUpperCase() : "NOT IN ROSTER"}
                      </div>
                    </div>
                    {rr && (
                      <img
                        src={elementBadge(rr.element as ElementName)}
                        alt={rr.element}
                        style={{ width: 16, height: 16, flexShrink: 0 }}
                      />
                    )}
                    <span style={{ ...eStyles.mono, fontSize: 11, color: E_PAL.emberSoft }}>
                      {rr ? rr.sequence : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <EFooter
        factoid={`${benches.length} LINEUPS BENCHED · TOTAL DEATHS ${totalDeaths}`}
        updated={raw.meta.updated}
      />
    </EShell>
  );
}
