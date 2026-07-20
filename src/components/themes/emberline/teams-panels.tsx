"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  cycleAppearancesOf,
  getResonatorOrFirstOf,
  teamsFeaturingOf,
  useData,
} from "@/lib/data-context";
import { ELEMENTS, type ElementPalette } from "@/lib/elements";
import type { Rating } from "@/lib/types";
import { EFace, EKicker, EStatusDot } from "./primitives";
import { E_PAL, eStyles } from "./styles";

const BENCHMARK_GRID = "44px minmax(310px, 1fr) 72px 72px 72px 52px minmax(190px, 0.7fr)";
const CYCLE_GRID = "minmax(190px, 0.85fr) 54px minmax(170px, 1fr) 92px 92px 70px minmax(220px, 1.25fr)";

function tintRule(el: ElementPalette): CSSProperties {
  return {
    flex: 1,
    height: 1,
    background: `linear-gradient(90deg, ${el.glow}, transparent)`,
  };
}

function EPanel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${E_PAL.border}`,
        borderRadius: 6,
        background: E_PAL.panel,
        padding: "16px 18px",
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function EPanelTitle({
  title,
  el,
  count,
}: {
  title: string;
  el: ElementPalette;
  count: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ ...eStyles.display, fontSize: 17, color: el.soft, whiteSpace: "nowrap" }}>
        {title}
      </span>
      <div style={tintRule(el)} />
      <EKicker size={8.5} spacing={1} style={{ whiteSpace: "nowrap" }}>
        {count} {count === 1 ? "ENTRY" : "ENTRIES"}
      </EKicker>
    </div>
  );
}

// The in-game IRIDESCENT badge is a prismatic rainbow — same stops as the
// old themes' port (2026-07-19), glow tuned for the abyssal ground.
const IRID_GRAD = "linear-gradient(100deg, #ffb3d9, #ffd36e 35%, #9fe8ff 68%, #c9a7ff)";

function RatingBadge({ rating }: { rating: Rating }) {
  if (!rating) {
    return (
      <span style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.textFaint }}>
        —
      </span>
    );
  }

  const iridescent = rating === "IRIDESCENT";
  const crowned = rating === "CROWNED";
  const sss = rating === "SSS";
  const color = crowned || sss ? E_PAL.gold : rating === "SS" ? E_PAL.emberSoft : E_PAL.green;

  return (
    <span
      style={{
        ...eStyles.mono,
        fontSize: 8,
        letterSpacing: 1,
        padding: "3px 7px",
        borderRadius: 999,
        color: iridescent || crowned ? E_PAL.dark : color,
        background: iridescent ? IRID_GRAD : crowned ? E_PAL.gold : `${color}14`,
        border: `1px solid ${iridescent ? "rgba(255,179,217,0.8)" : crowned ? E_PAL.gold : `${color}77`}`,
        boxShadow: iridescent ? "0 0 10px rgba(255,179,217,0.55)" : crowned || sss ? `0 0 10px ${E_PAL.gold}55` : "none",
        whiteSpace: "nowrap",
      }}
    >
      {rating}
    </span>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        ...eStyles.mono,
        fontSize: 10,
        letterSpacing: 2,
        color: E_PAL.textFaint,
        padding: "30px 0",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

export function EmberlineTeamsPanels({ name }: { name: string }) {
  const { raw, roster, rosterByName } = useData();
  const r = getResonatorOrFirstOf(rosterByName, roster, name);
  const el = ELEMENTS[r.element];
  const teams = teamsFeaturingOf(raw, name);
  const cycleAppearances = cycleAppearancesOf(raw, name);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minWidth: 0,
        maxWidth: "100%",
      }}
    >
      <EPanel>
        <EPanelTitle title="BATTLE-TESTED TEAMS" el={el} count={teams.length} />
        {teams.length === 0 ? (
          <EmptyState>NO BENCHMARK TEAMS FEATURE {r.name.toUpperCase()}</EmptyState>
        ) : (
          <div style={{ overflowX: "auto", maxWidth: "100%", marginTop: 12 }}>
            <div style={{ minWidth: 860 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: BENCHMARK_GRID,
                  gap: 10,
                  padding: "0 10px 8px",
                  borderBottom: `1px solid ${E_PAL.border}`,
                  ...eStyles.mono,
                  fontSize: 8,
                  letterSpacing: 1.5,
                  color: E_PAL.textMute,
                  alignItems: "center",
                }}
              >
                <span>RANK</span>
                <span>LINEUP</span>
                <span style={{ textAlign: "right" }}>BEST</span>
                <span style={{ textAlign: "right" }}>AVG</span>
                <span style={{ textAlign: "right" }}>WORST</span>
                <span style={{ textAlign: "right" }}>DEATHS</span>
                <span>FIELD NOTE</span>
              </div>

              {teams.map((team, index) => (
                <div
                  key={`${team.rank}-${team.team.join("-")}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: BENCHMARK_GRID,
                    gap: 10,
                    alignItems: "center",
                    padding: "10px",
                    marginTop: 6,
                    borderRadius: 5,
                    background: index === 0 ? `${el.hex}0D` : E_PAL.inset,
                    border: `1px solid ${index === 0 ? `${el.hex}38` : E_PAL.borderSoft}`,
                  }}
                >
                  <span
                    style={{
                      ...eStyles.mono,
                      fontSize: 9,
                      color: index === 0 ? el.soft : E_PAL.textMute,
                    }}
                  >
                    #{String(team.rank).padStart(2, "0")}
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    {team.team.map((member) => (
                      <div key={member} style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                        <EFace name={member} size={26} radius={5} border="rgba(140,220,225,0.18)" />
                        <span
                          style={{
                            ...eStyles.body,
                            fontSize: 11,
                            color: rosterByName[member] ? E_PAL.text : E_PAL.textDim,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {member}
                        </span>
                      </div>
                    ))}
                  </div>

                  <span style={{ ...eStyles.mono, fontSize: 10, textAlign: "right", color: index === 0 ? el.soft : E_PAL.text }}>
                    {team.best}
                  </span>
                  <span style={{ ...eStyles.mono, fontSize: 9, textAlign: "right", color: E_PAL.textDim }}>
                    {team.average}
                  </span>
                  <span style={{ ...eStyles.mono, fontSize: 9, textAlign: "right", color: E_PAL.textDim }}>
                    {team.worst}
                  </span>
                  <span style={{ ...eStyles.mono, fontSize: 9, textAlign: "right", color: team.deaths === 0 ? E_PAL.green : E_PAL.red }}>
                    {team.deaths}
                  </span>

                  <div style={{ minWidth: 0 }}>
                    {team.element && (
                      <div style={{ ...eStyles.mono, fontSize: 8, letterSpacing: 1, color: el.soft }}>
                        {team.element.toUpperCase()}
                      </div>
                    )}
                    {team.notes && (
                      <div style={{ ...eStyles.body, fontSize: 10.5, lineHeight: 1.3, color: E_PAL.textDim, marginTop: team.element ? 2 : 0 }}>
                        {team.notes}
                      </div>
                    )}
                    {!team.element && !team.notes && (
                      <span style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.textFaint }}>—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </EPanel>

      <EPanel>
        <EPanelTitle title="ENDSTATE CYCLE RECORD" el={el} count={cycleAppearances.length} />
        {cycleAppearances.length === 0 ? (
          <EmptyState>NO CYCLE APPEARANCES</EmptyState>
        ) : (
          <div style={{ overflowX: "auto", maxWidth: "100%", marginTop: 12 }}>
            <div style={{ minWidth: 940 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: CYCLE_GRID,
                  gap: 10,
                  padding: "0 10px 8px",
                  borderBottom: `1px solid ${E_PAL.border}`,
                  ...eStyles.mono,
                  fontSize: 8,
                  letterSpacing: 1.5,
                  color: E_PAL.textMute,
                  alignItems: "center",
                }}
              >
                <span>CYCLE</span>
                <span>TEAM</span>
                <span>BUFF</span>
                <span style={{ textAlign: "right" }}>SCORE</span>
                <span style={{ textAlign: "center" }}>RATING</span>
                <span>5K+</span>
                <span>NOTES</span>
              </div>

              {cycleAppearances.map((appearance) => {
                const prestige =
                  appearance.rating === "IRIDESCENT" || appearance.rating === "CROWNED" || appearance.rating === "SSS";
                return (
                  <div
                    key={`${appearance.cycleId}-${appearance.order}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: CYCLE_GRID,
                      gap: 10,
                      alignItems: "center",
                      padding: "10px",
                      marginTop: 6,
                      borderRadius: 5,
                      background: prestige ? "rgba(245,201,122,0.05)" : E_PAL.inset,
                      border: `1px solid ${prestige ? "rgba(245,201,122,0.30)" : E_PAL.borderSoft}`,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ ...eStyles.mono, fontSize: 8, letterSpacing: 1, color: el.soft }}>
                        CYCLE {String(appearance.cycleId).padStart(2, "0")}
                      </div>
                      <div style={{ ...eStyles.body, fontSize: 11, color: E_PAL.text, marginTop: 2 }}>
                        {appearance.cycleLabel}
                      </div>
                    </div>

                    <span style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.textMute }}>
                      #{String(appearance.order).padStart(2, "0")}
                    </span>
                    <span style={{ ...eStyles.body, fontSize: 10.5, lineHeight: 1.3, color: E_PAL.textDim }}>
                      {appearance.buff || "—"}
                    </span>
                    <span
                      style={{
                        ...eStyles.display,
                        fontSize: 18,
                        textAlign: "right",
                        color: prestige ? E_PAL.gold : appearance.over5k ? E_PAL.text : E_PAL.textMute,
                      }}
                    >
                      {appearance.score.toLocaleString()}
                    </span>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <RatingBadge rating={appearance.rating} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <EStatusDot status={appearance.over5k ? "green" : "neutral"} size={6} glow={appearance.over5k} />
                      <span style={{ ...eStyles.mono, fontSize: 8, letterSpacing: 0.5, color: appearance.over5k ? E_PAL.green : E_PAL.textFaint }}>
                        {appearance.over5k ? "OVER" : "UNDER"}
                      </span>
                    </div>
                    <span style={{ ...eStyles.body, fontSize: 10.5, lineHeight: 1.3, color: E_PAL.textDim }}>
                      {appearance.notes || "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </EPanel>
    </div>
  );
}
