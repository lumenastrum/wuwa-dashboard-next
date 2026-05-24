/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useData, roleAccent } from "@/lib/data-context";
import { useState } from "react";
import { ELEMENTS, STATUS_HEX } from "@/lib/elements";
import { durationToSec } from "@/lib/duration";
import { elementIcon, portrait, tallPortrait } from "@/lib/portraits";
import { useTheme } from "@/lib/theme-context";
import type { ElementName, RosterEntry } from "@/lib/types";
import { O_PAL, oStyles } from "./styles";
import { OCard, OElementPill, OKpi, OStatusDot } from "./primitives";

const FILTERS: (ElementName | "All")[] = ["All", "Fusion", "Glacio", "Electro", "Spectro", "Havoc", "Aero"];

function ORosterTile({ r }: { r: RosterEntry }) {
  const el = ELEMENTS[r.element];
  return (
    <Link
      href={`/r/${encodeURIComponent(r.name)}`}
      style={{
        borderRadius: 12,
        overflow: "hidden",
        background: O_PAL.surface,
        border: `1px solid ${O_PAL.border}`,
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.15s",
        display: "block",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = O_PAL.borderStrong;
        e.currentTarget.style.background = O_PAL.surfaceStrong;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = O_PAL.border;
        e.currentTarget.style.background = O_PAL.surface;
      }}
    >
      <div style={{ height: 2, background: `linear-gradient(90deg, ${el.hex}, transparent 80%)` }} />
      <div style={{ display: "flex", gap: 12, padding: 12 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            overflow: "hidden",
            background: "rgba(0,0,0,0.4)",
            flexShrink: 0,
            border: `1px solid ${O_PAL.border}`,
          }}
        >
          <img
            src={portrait(r.name)}
            alt={r.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.name}
            </div>
            {r.audit && <OStatusDot status={r.audit.priorityStatus} />}
          </div>
          <div
            style={{
              ...oStyles.mono,
              fontSize: 10,
              color: O_PAL.textMute,
              marginTop: 2,
              letterSpacing: 0.5,
            }}
          >
            {r.sequence} · {roleAccent(r.role)} · Lv{r.level}
          </div>
          <div style={{ marginTop: 8 }}>
            <OElementPill el={r.element} weapon={r.weaponType} small />
          </div>
        </div>
      </div>
    </Link>
  );
}

function OFeaturedHero({ r }: { r: RosterEntry }) {
  const { raw, roster, rosterByName } = useData();

  const el = ELEMENTS[r.element];
  const bench = raw.benchmarks.find((b) => b.team.includes(r.name));
  return (
    <div
      style={{
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
        background: `linear-gradient(135deg, ${el.glow}, rgba(10,13,20,0.6) 60%)`,
        border: `1px solid ${O_PAL.border}`,
        height: 380,
        display: "flex",
      }}
    >
      <div style={{ flex: "0 0 360px", position: "relative", overflow: "hidden" }}>
        <img
          src={tallPortrait(r.name)}
          alt={r.name}
          style={{
            position: "absolute",
            top: -20,
            left: -20,
            height: "115%",
            width: "auto",
            maxWidth: "none",
            filter: `drop-shadow(0 20px 40px ${el.glow})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 40% 50%, transparent, ${O_PAL.bg} 90%)`,
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          padding: "36px 40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <OElementPill el={r.element} weapon={r.weaponType} />
          <div style={{ ...oStyles.display, fontSize: 64, marginTop: 8, lineHeight: 1 }}>{r.name}</div>
          <div style={{ fontSize: 14, color: O_PAL.textDim, marginTop: 10, maxWidth: 480 }}>
            Sequence {r.sequence} · {r.role}{r.audit?.notes ? ` — ${r.audit.notes}` : ""}.
          </div>
        </div>
        {r.audit && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {r.audit.stats.map((s) => (
              <div
                key={s.label}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.025)",
                  border: `1px solid ${O_PAL.border}`,
                }}
              >
                <div style={{ fontSize: 10, letterSpacing: 1.5, color: O_PAL.textMute }}>{s.label}</div>
                <div
                  style={{
                    ...oStyles.display,
                    fontSize: 22,
                    marginTop: 2,
                    color: STATUS_HEX[s._status] ?? O_PAL.text,
                  }}
                >
                  {s.current}
                </div>
                <div style={{ ...oStyles.mono, fontSize: 10, color: O_PAL.textMute, marginTop: 2 }}>{s.optimal}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link
            href={`/r/${encodeURIComponent(r.name)}`}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              background: O_PAL.accent,
              color: "#0a0d14",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: 0.5,
            }}
          >
            Open build
          </Link>
          {bench && (
            <div
              style={{
                ...oStyles.mono,
                fontSize: 11,
                color: O_PAL.textMute,
                marginLeft: "auto",
              }}
            >
              BEST {bench.best} · AVG {bench.average} · DEATHS {bench.deaths}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OSidePanel() {
  const { raw, roster, rosterByName } = useData();

  const top = raw.benchmarks.slice(0, 5);
  const topBest = durationToSec(top[0].best);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <OCard>
        <div style={{ ...oStyles.display, fontSize: 22, marginBottom: 4 }}>Top Lineups</div>
        <div
          style={{
            fontSize: 11,
            color: O_PAL.textMute,
            marginBottom: 16,
            ...oStyles.mono,
            letterSpacing: 1,
          }}
        >
          OVERDRIVE · CROWNLESS LV.100
        </div>
        {top.map((b, idx) => {
          const w = (topBest / durationToSec(b.best)) * 100;
          return (
            <div key={idx} style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 5,
                }}
              >
                <div style={{ display: "flex", gap: 6 }}>
                  {b.team.map((name) => {
                    const r = rosterByName[name];
                    const el = r ? ELEMENTS[r.element] : null;
                    return (
                      <div
                        key={name}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          overflow: "hidden",
                          border: `1px solid ${el?.hex ?? O_PAL.border}`,
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
                    );
                  })}
                </div>
                <div
                  style={{
                    ...oStyles.mono,
                    fontSize: 13,
                    color: idx === 0 ? O_PAL.accent : O_PAL.text,
                  }}
                >
                  {b.best}
                </div>
              </div>
              <div
                style={{
                  height: 3,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${w}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${idx === 0 ? O_PAL.accent : "#5fe1b3"}, transparent)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </OCard>
      <OCard style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 14,
          }}
        >
          <div style={{ ...oStyles.display, fontSize: 22 }}>Open Threads</div>
          <div
            style={{
              ...oStyles.mono,
              fontSize: 10,
              color: O_PAL.textMute,
              letterSpacing: 1,
            }}
          >
            {raw.actionItems.length} ITEMS
          </div>
        </div>
        {raw.actionItems.slice(0, 6).map((a, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              padding: "10px 0",
              borderBottom: i < 5 ? `1px solid ${O_PAL.border}` : "none",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                marginTop: 7,
                flexShrink: 0,
                background: STATUS_HEX[a.status],
                boxShadow: `0 0 8px ${STATUS_HEX[a.status]}80`,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13 }}>{a.task}</div>
              <div style={{ fontSize: 11, color: O_PAL.textDim, marginTop: 2 }}>{a.detail}</div>
            </div>
          </div>
        ))}
      </OCard>
    </div>
  );
}

export function ObsidianRoster() {
  const { raw, roster, rosterByName } = useData();

  const { lastResonator } = useTheme();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const featured = rosterByName[lastResonator] ?? roster[0];
  const filtered = filter === "All" ? roster : roster.filter((r) => r.element === filter);
  const cycle = raw.endstateMatrix.cycles[1];

  return (
    <div style={oStyles.shell}>
      <div style={{ padding: "28px 32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                ...oStyles.mono,
                fontSize: 11,
                color: O_PAL.textMute,
                letterSpacing: 2,
                marginBottom: 6,
              }}
            >
              CYCLE 002 · CLOSED 2026.05.23
            </div>
            <div style={{ ...oStyles.display, fontSize: 52, lineHeight: 1 }}>
              Good evening,{" "}
              <em style={{ fontStyle: "italic", color: O_PAL.accent }}>Rover</em>.
            </div>
            <div style={{ fontSize: 14, color: O_PAL.textDim, marginTop: 8 }}>
              The atelier closed strong — {cycle.totalPoints.toLocaleString()} points, {cycle.teamsOver5k} teams over five thousand.
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <OKpi
              label="Resonators"
              value={`${roster.length}`}
              delta="all Lv.90"
              accent={ELEMENTS.Aero.hex}
            />
            <OKpi
              label="5K+ teams"
              value={`${cycle.teamsOver5k}/8`}
              delta="target met"
              accent={ELEMENTS.Spectro.hex}
            />
            <OKpi
              label="Cycle score"
              value={cycle.totalPoints.toLocaleString()}
              delta={`+${cycle.totalPoints - raw.endstateMatrix.cycles[0].totalPoints} vs prev`}
              accent={ELEMENTS.Fusion.hex}
            />
          </div>
        </div>
        <OFeaturedHero r={featured} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr",
            gap: 18,
            marginTop: 18,
          }}
        >
          <OCard>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ ...oStyles.display, fontSize: 24 }}>The Roster</div>
                <div style={{ fontSize: 12, color: O_PAL.textDim, marginTop: 2 }}>
                  {roster.length} resonators · all max level · click any to inspect
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {FILTERS.map((f) => {
                  const isActive = filter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      style={{
                        padding: "4px 10px 4px 8px",
                        borderRadius: 999,
                        fontSize: 11,
                        border: `1px solid ${isActive ? O_PAL.borderStrong : O_PAL.border}`,
                        background: isActive ? "rgba(233,212,155,0.08)" : "transparent",
                        color: isActive ? O_PAL.accent : O_PAL.textDim,
                        ...oStyles.mono,
                        letterSpacing: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
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
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {filtered.map((r) => (
                <ORosterTile key={r.name} r={r} />
              ))}
            </div>
          </OCard>
          <OSidePanel />
        </div>
      </div>
    </div>
  );
}
