/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useData } from "@/lib/data-context";
import { useState } from "react";
import { ELEMENTS } from "@/lib/elements";
import { elementIcon, tallPortrait } from "@/lib/portraits";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import type { ElementName } from "@/lib/types";
import { A_PAL, aStyles } from "./styles";
import { APill } from "./primitives";
import { resonatorPath } from "@/lib/route-name";

const FILTERS: (ElementName | "All")[] = ["All", "Fusion", "Glacio", "Electro", "Spectro", "Havoc", "Aero"];

export function AtelierRoster() {
  const { raw, roster, rosterByName } = useData();
  const { isMobile, isTablet } = useDashboardViewport();

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const filtered = filter === "All" ? roster : roster.filter((r) => r.element === filter);
  const cycle = raw.endstateMatrix.cycles[1];

  return (
    <div style={aStyles.shell}>
      <div style={{ padding: isMobile ? "20px 16px 26px" : isTablet ? "28px 28px" : "32px 48px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "flex-end",
            gap: isMobile ? 18 : 24,
            marginBottom: 32,
          }}
        >
          <div>
            <div
              style={{
                ...aStyles.mono,
                fontSize: 10,
                color: A_PAL.textMute,
                letterSpacing: 2,
                marginBottom: 4,
              }}
            >
              VOLUME II · ISSUE 02 · MAY MMXXVI
            </div>
            <div style={{ ...aStyles.display, fontSize: isMobile ? 48 : isTablet ? 64 : 80, lineHeight: 0.95 }}>
              The Roster{" "}
              <em style={{ fontStyle: "italic", color: A_PAL.textDim }}>— annotated.</em>
            </div>
            <div
              style={{
                fontSize: 14,
                color: A_PAL.textDim,
                marginTop: 10,
                maxWidth: 640,
              }}
            >
              {roster.length} resonators, all at level {raw.meta.maxLevel}. Cycle II closed at{" "}
              {cycle.totalPoints.toLocaleString()} points with {cycle.teamsOver5k} of 8 teams
              clearing five thousand.
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(120px, 1fr))", gap: 12 }}>
            {([
              ["Resonators", roster.length],
              ["Crowned", cycle.teams.filter((t) => t.rating === "CROWNED" || t.rating === "SSS").length],
              ["Cycle II", cycle.totalPoints.toLocaleString()],
            ] as [string, number | string][]).map(([k, v]) => (
              <div
                key={k}
                style={{
                  padding: "16px 22px",
                  borderRadius: 12,
                  background: A_PAL.surfaceStrong,
                  border: `1px solid ${A_PAL.border}`,
                  minWidth: 120,
                }}
              >
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
                    ...aStyles.display,
                    fontSize: 38,
                    lineHeight: 1,
                    marginTop: 6,
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            gap: isMobile ? 12 : 0,
            paddingBottom: 18,
            marginBottom: 18,
            borderBottom: `1px solid ${A_PAL.borderStrong}`,
          }}
        >
          <div style={{ display: "flex", gap: 6, overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? 2 : 0 }}>
            {FILTERS.map((f) => {
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "6px 14px 6px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    border: `1px solid ${isActive ? A_PAL.ink : A_PAL.border}`,
                    background: isActive ? A_PAL.ink : "transparent",
                    color: isActive ? "#fff" : A_PAL.textDim,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    ...aStyles.mono,
                    letterSpacing: 1,
                  }}
                >
                  {f !== "All" && (
                    <img
                      src={elementIcon(f as ElementName)}
                      alt=""
                      style={{
                        width: 12,
                        height: 12,
                        opacity: isActive ? 1 : 0.85,
                        filter: isActive ? "brightness(1.4)" : "none",
                      }}
                    />
                  )}
                  {f.toUpperCase()}
                </button>
              );
            })}
          </div>
          <div
            style={{
              ...aStyles.mono,
              fontSize: 11,
              color: A_PAL.textMute,
              letterSpacing: 1.5,
            }}
          >
            {filtered.length} {filtered.length === 1 ? "ENTRY" : "ENTRIES"}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 18 : 22 }}>
          {filtered.map((r) => {
            const el = ELEMENTS[r.element];
            const num = roster.findIndex((x) => x.name === r.name) + 1;
            return (
              <Link
                key={r.name}
                href={resonatorPath(r.name)}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  transition: "transform 0.2s",
                  display: "block",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <div
                  style={{
                    position: "relative",
                    borderRadius: 14,
                    overflow: "hidden",
                    aspectRatio: "3 / 4",
                    background: `linear-gradient(180deg, ${el.glow}, ${A_PAL.surfaceStrong})`,
                    border: `1px solid ${A_PAL.border}`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      ...aStyles.mono,
                      fontSize: 11,
                      color: A_PAL.ink,
                      letterSpacing: 1.5,
                      background: "rgba(255,255,255,0.8)",
                      padding: "3px 8px",
                      borderRadius: 4,
                    }}
                  >
                    № {String(num).padStart(2, "0")}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.85)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={elementIcon(r.element)}
                      alt=""
                      style={{ width: 18, height: 18 }}
                    />
                  </div>
                  <img
                    src={tallPortrait(r.name)}
                    alt={r.name}
                    style={{
                      position: "absolute",
                      bottom: -10,
                      left: "50%",
                      transform: "translateX(-50%)",
                      height: "100%",
                      width: "auto",
                      maxWidth: "none",
                      filter: "drop-shadow(0 12px 24px rgba(60,70,100,0.2))",
                    }}
                  />
                </div>
                <div
                  style={{
                    paddingTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <div>
                    <div style={{ ...aStyles.display, fontSize: isMobile ? 28 : 24, lineHeight: 1 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: A_PAL.textDim, marginTop: 4 }}>
                      {r.role} · {r.sequence}
                    </div>
                  </div>
                  {r.audit && (
                    <APill status={r.audit.priorityStatus}>
                      {r.audit.priorityStatus.toUpperCase()}
                    </APill>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
