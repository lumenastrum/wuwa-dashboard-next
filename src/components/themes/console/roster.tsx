/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useData } from "@/lib/data-context";
import { useState } from "react";
import { ELEMENTS, STATUS_HEX } from "@/lib/elements";
import { elementIcon, portrait, weaponTypeIcon } from "@/lib/portraits";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import type { ElementName } from "@/lib/types";
import { K_PAL, kStyles } from "./styles";
import { KPanel, KScanlines } from "./primitives";
import { resonatorPath } from "@/lib/route-name";

const FILTERS: (ElementName | "All")[] = ["All", "Fusion", "Glacio", "Electro", "Spectro", "Havoc", "Aero"];

export function ConsoleRoster() {
  const { raw, roster, rosterByName } = useData();
  const { isMobile, isTablet } = useDashboardViewport();

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const filtered = filter === "All" ? roster : roster.filter((r) => r.element === filter);
  const cycle = raw.endstateMatrix.cycles[1];

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
            marginBottom: 20,
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
              ◢ MODULE / ROSTER_INDEX
            </div>
            <div style={{ ...kStyles.display, fontSize: isMobile ? 30 : 38, letterSpacing: 0 }}>
              Roster Index &nbsp;<span style={{ color: K_PAL.cyan }}>//</span>&nbsp;
              <span style={{ color: K_PAL.textDim, fontSize: isMobile ? 18 : 22 }}>n={roster.length}</span>
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
              BUILD&nbsp;<span style={{ color: K_PAL.text }}>2026.05.23</span>
            </span>
            <span>
              CYCLE&nbsp;<span style={{ color: K_PAL.text }}>02</span>
            </span>
            <span>
              SCORE&nbsp;<span style={{ color: K_PAL.amber }}>{cycle.totalPoints.toLocaleString()}</span>
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 14 }}>
          {([
            ["roster LV.90", `${roster.length}/20`, "FULL CAPACITY", K_PAL.cyan],
            ["PEAK CLEAR", raw.benchmarks[0].best, "FUSION ALPHA", K_PAL.amber],
            ["WHIMPERING PEAK", "7220", "SS · 23 MAY", K_PAL.magenta],
            ["BUFF CAPS", "2/2", "SK SATURATED", K_PAL.cyan],
          ] as [string, string, string, string][]).map(([l, v, sub, c]) => (
            <KPanel key={l} accent={c} style={{ padding: 14 }}>
              <div style={{ ...kStyles.mono, fontSize: 10, color: c, letterSpacing: 2 }}>▸ {l}</div>
              <div
                style={{
                  ...kStyles.mono,
                  fontSize: 32,
                  color: K_PAL.text,
                  marginTop: 6,
                  letterSpacing: -1,
                }}
              >
                {v}
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
                {sub}
              </div>
            </KPanel>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginTop: 18, marginBottom: 14, overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? 2 : 0 }}>
          {FILTERS.map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "4px 10px 4px 8px",
                  cursor: "pointer",
                  border: `1px solid ${isActive ? K_PAL.borderStrong : K_PAL.border}`,
                  background: isActive ? "rgba(126,224,255,0.1)" : "transparent",
                  color: isActive ? K_PAL.cyan : K_PAL.textDim,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  ...kStyles.mono,
                  fontSize: 10,
                  letterSpacing: 1.5,
                }}
              >
                {f !== "All" && (
                  <img
                    src={elementIcon(f as ElementName)}
                    alt=""
                    style={{ width: 12, height: 12, opacity: 0.9 }}
                  />
                )}
                {f.toUpperCase()}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <div
            style={{
              ...kStyles.mono,
              fontSize: 10,
              color: K_PAL.textMute,
              letterSpacing: 1.5,
              alignSelf: "center",
            }}
          >
            {filtered.length}/{roster.length} ENTRIES
          </div>
        </div>

        <KPanel label="RESONATOR_GRID" code="GRD.001" style={{ padding: isMobile ? 14 : 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 10 }}>
            {filtered.map((r, idx) => {
              const el = ELEMENTS[r.element];
              const status = r.audit?.priorityStatus ?? "neutral";
              return (
                <Link
                  key={r.name}
                  href={resonatorPath(r.name)}
                  style={{
                    position: "relative",
                    padding: 12,
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${el.hex}30`,
                    transition: "all 0.15s",
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = el.hex;
                    e.currentTarget.style.background = `${el.hex}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${el.hex}30`;
                    e.currentTarget.style.background = "rgba(0,0,0,0.3)";
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: 2,
                      background: el.hex,
                      boxShadow: `0 0 6px ${el.hex}`,
                    }}
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        overflow: "hidden",
                        background: "rgba(0,0,0,0.5)",
                        border: `1px solid ${el.hex}40`,
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={portrait(r.name)}
                        alt={r.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center 20%",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          ...kStyles.mono,
                          fontSize: 9,
                          color: K_PAL.textMute,
                          letterSpacing: 1.5,
                        }}
                      >
                        № {String(idx + 1).padStart(2, "0")}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: K_PAL.text,
                          marginTop: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.name}
                      </div>
                      <div
                        style={{
                          ...kStyles.mono,
                          fontSize: 9,
                          color: el.hex,
                          marginTop: 2,
                          letterSpacing: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span>{r.sequence} ·</span>
                        <img
                          src={weaponTypeIcon(r.weaponType)}
                          alt={r.weaponType}
                          title={r.weaponType}
                          style={{ width: 12, height: 12, opacity: 0.9 }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: STATUS_HEX[status],
                        boxShadow: `0 0 6px ${STATUS_HEX[status]}`,
                      }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </KPanel>
      </div>
    </div>
  );
}
