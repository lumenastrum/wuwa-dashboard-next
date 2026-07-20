"use client";

import { useEffect, useRef, useState } from "react";
import { useData } from "@/lib/data-context";
import type { Rating } from "@/lib/types";
import { E_PAL, eStyles } from "./styles";
import { ECard, EFace, EFooter, EKicker, ESectionTitle, EShell } from "./primitives";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";

// Bar + histogram scale ceiling for a single team score.
const SCORE_SCALE = 15000;
// Selector progress bars normalize against this fixed ceiling so cycles stay
// comparable to each other (not to their own target).
const CYCLE_SCALE = 65000;

// The in-game IRIDESCENT badge is a prismatic rainbow — same stops as the
// old themes' port (2026-07-19), glow tuned for the abyssal ground.
const IRID_GRAD = "linear-gradient(100deg, #ffb3d9, #ffd36e 35%, #9fe8ff 68%, #c9a7ff)";

function EMedal({ rating }: { rating: Rating }) {
  if (!rating) return null;
  const iridescent = rating === "IRIDESCENT";
  const crowned = rating === "CROWNED";
  const sss = rating === "SSS";
  const col = crowned || sss ? E_PAL.gold : rating === "SS" ? E_PAL.emberSoft : E_PAL.green;
  return (
    <span
      style={{
        ...eStyles.mono,
        fontSize: 9,
        letterSpacing: 1.5,
        padding: "3px 9px",
        borderRadius: 999,
        flexShrink: 0,
        color: iridescent || crowned ? E_PAL.dark : col,
        background: iridescent ? IRID_GRAD : crowned ? E_PAL.gold : `${col}14`,
        border: `1px solid ${iridescent ? "rgba(255,179,217,0.8)" : crowned ? E_PAL.gold : `${col}77`}`,
        boxShadow: iridescent ? "0 0 12px rgba(255,179,217,0.55)" : crowned || sss ? `0 0 12px ${E_PAL.gold}55` : "none",
      }}
    >
      {rating}
    </span>
  );
}

export function EmberlineCycles() {
  const { raw, rosterByName } = useData();
  const { isMobile, isTablet } = useDashboardViewport();
  const cycles = raw.endstateMatrix.cycles;
  const [selRaw, setSel] = useState(cycles.length - 1);
  const sel = Math.min(selRaw, cycles.length - 1);
  const c = cycles[sel];
  const dayOneCount = cycles.filter((cc) => cc.dayOne).length;

  // Mobile selector is a horizontal scroll strip — park it on the selected
  // card (latest cycle by default), same idea as the constellation auto-park.
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isMobile) return;
    const card = stripRef.current?.children[sel] as HTMLElement | undefined;
    card?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [isMobile, sel]);

  return (
    <EShell>
      {/* header */}
      <div style={{ padding: isMobile ? "18px 16px 14px" : "28px 34px 20px" }}>
        <EKicker spacing={3} style={{ marginBottom: 8 }}>ENDSTATE MATRIX</EKicker>
        <div style={{ ...eStyles.display, fontSize: isMobile ? 34 : 48, lineHeight: 1 }}>
          Eight teams. One run each.{" "}
          <span style={{ fontStyle: "italic", color: E_PAL.emberSoft }}>No mulligans.</span>
        </div>
      </div>

      {/* cycle selector */}
      <div
        ref={stripRef}
        style={
          isMobile
            ? {
                display: "flex",
                gap: 12,
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                padding: "0 16px 16px",
              }
            : {
                display: "grid",
                gridTemplateColumns: `repeat(${Math.max(cycles.length, 2)}, 1fr)`,
                gap: 14,
                padding: "0 34px 18px",
              }
        }
      >
        {cycles.map((cc, i) => {
          const active = i === sel;
          return (
            <div
              key={cc.id}
              onClick={() => setSel(i)}
              style={{
                position: "relative",
                flex: isMobile ? "0 0 300px" : undefined,
                padding: "18px 22px",
                borderRadius: 8,
                cursor: "pointer",
                overflow: "hidden",
                background: active
                  ? "linear-gradient(180deg, rgba(255,122,77,0.08), rgba(140,220,225,0.03))"
                  : E_PAL.panel,
                border: `1px solid ${active ? "rgba(255,122,77,0.55)" : E_PAL.border}`,
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.borderColor = "rgba(140,220,225,0.45)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.borderColor = E_PAL.border;
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <EKicker size={9} spacing={2}>CYCLE {String(cc.id).padStart(2, "0")}</EKicker>
                  <div style={{ ...eStyles.display, fontSize: 26, marginTop: 3, color: active ? E_PAL.text : E_PAL.textDim }}>
                    {cc.label}
                  </div>
                  <EKicker size={9} spacing={0} style={{ marginTop: 4 }}>
                    {cc.date}
                    {cc.dayOne ? " · DAY ONE CLEAR" : ""}
                  </EKicker>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ ...eStyles.display, fontSize: 34, lineHeight: 1, color: active ? E_PAL.emberSoft : E_PAL.text }}>
                    {cc.totalPoints.toLocaleString()}
                  </div>
                  <EKicker size={9} spacing={1} style={{ marginTop: 3 }}>
                    / {cc.target.toLocaleString()} TARGET
                  </EKicker>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", flexWrap: isMobile ? "wrap" : "nowrap", gap: 12, marginTop: 14 }}>
                <div style={{ flex: 1, flexBasis: isMobile ? "100%" : undefined, position: "relative", height: 4, borderRadius: 999, background: E_PAL.track }}>
                  <div
                    style={{
                      width: `${Math.min((cc.totalPoints / CYCLE_SCALE) * 100, 100)}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${E_PAL.green}, ${E_PAL.emberSoft})`,
                      boxShadow: "0 0 10px rgba(255,179,138,0.35)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: `${Math.min((cc.target / CYCLE_SCALE) * 100, 100)}%`,
                      top: -3,
                      bottom: -3,
                      width: 1,
                      background: E_PAL.gold,
                      opacity: 0.8,
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {cc.teams.map((t, j) => (
                    <span
                      key={j}
                      title={`#${t.order} · ${t.score.toLocaleString()}`}
                      style={{
                        width: 7,
                        height: 7,
                        transform: "rotate(45deg)",
                        background: t.over5k ? E_PAL.green : "transparent",
                        border: `1px solid ${t.over5k ? E_PAL.green : "rgba(140,220,225,0.3)"}`,
                        display: "inline-block",
                      }}
                    />
                  ))}
                </div>
                <span style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.textDim }}>
                  {cc.teamsOver5k}/{cc.teamTarget} OVER 5K
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* main grid */}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1.5fr 1fr", gap: isMobile ? 16 : 18, padding: isMobile ? "0 16px 24px" : "0 34px 28px" }}>
        {/* the run */}
        <ECard diamonds="both" style={{ padding: "18px 22px", alignSelf: "start" }}>
          <ESectionTitle
            title="The Run"
            size={24}
            sub={<em>{c.label} · {c.totalPoints.toLocaleString()} points</em>}
            right={isMobile ? undefined : <EKicker size={8.5} spacing={0.5} style={{ whiteSpace: "nowrap" }}>SCALE 0–{SCORE_SCALE.toLocaleString()}</EKicker>}
            style={{ marginBottom: 14 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {c.teams.map((t) => {
              const iridescent = t.rating === "IRIDESCENT";
              const crowned = iridescent || t.rating === "CROWNED" || t.rating === "SSS";
              return (
                <div
                  key={t.order}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 6,
                    background: crowned ? "rgba(245,201,122,0.05)" : E_PAL.inset,
                    border: `1px solid ${crowned ? "rgba(245,201,122,0.30)" : "rgba(140,220,225,0.07)"}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      alignItems: isMobile ? "stretch" : "center",
                      gap: isMobile ? 8 : 12,
                    }}
                  >
                    {/* line 1 (mobile): order + members — display:contents on desktop keeps the flat row */}
                    <div style={{ display: isMobile ? "flex" : "contents", alignItems: "center", gap: 12 }}>
                      <span style={{ ...eStyles.mono, fontSize: 10, color: E_PAL.textMute, width: 20 }}>
                        {String(t.order).padStart(2, "0")}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" }}>
                        {t.members.map((n) => (
                          <div key={n} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <EFace name={n} size={24} radius={5} border="rgba(140,220,225,0.18)" />
                            <span style={{ ...eStyles.body, fontSize: 12, color: rosterByName[n] ? E_PAL.text : E_PAL.textDim }}>
                              {n}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* line 2 (mobile): buff + medal + score */}
                    <div style={{ display: isMobile ? "flex" : "contents", alignItems: "center", gap: 12 }}>
                      <span style={{ ...eStyles.mono, fontSize: 8.5, letterSpacing: 1, color: E_PAL.textMute, flexShrink: 0 }}>
                        {t.buff.toUpperCase()}
                      </span>
                      <EMedal rating={t.rating} />
                      <span
                        style={{
                          ...eStyles.display,
                          fontSize: 22,
                          width: isMobile ? "auto" : 74,
                          textAlign: isMobile ? "left" : "right",
                          color: crowned ? E_PAL.gold : t.over5k ? E_PAL.text : E_PAL.textMute,
                        }}
                      >
                        {t.score.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 0 : 12, marginTop: 7 }}>
                    <span style={{ width: isMobile ? 0 : 20 }} />
                    <div style={{ flex: 1, height: 3, borderRadius: 999, background: "rgba(140,220,225,0.07)", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.min((t.score / SCORE_SCALE) * 100, 100)}%`,
                          height: "100%",
                          background: iridescent
                            ? IRID_GRAD
                            : crowned
                              ? `linear-gradient(90deg, ${E_PAL.gold}, ${E_PAL.emberSoft})`
                              : t.over5k
                                ? E_PAL.green
                                : E_PAL.textMute,
                          boxShadow: iridescent ? "0 0 8px rgba(255,179,217,0.6)" : crowned ? `0 0 8px ${E_PAL.gold}66` : "none",
                        }}
                      />
                    </div>
                  </div>
                  {t.notes && (
                    <div style={{ ...eStyles.body, fontSize: 11, fontStyle: "italic", color: E_PAL.textDim, margin: "5px 0 0 32px" }}>
                      {t.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ECard>

        {/* lessons + findings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignSelf: "start" }}>
          <ECard style={{ padding: "18px 22px" }}>
            <ESectionTitle
              title="Lessons"
              sub={<em>from {c.label.toLowerCase()}</em>}
              style={{ marginBottom: 8 }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {c.lessons.map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${E_PAL.borderSoft}` }}>
                  <span style={{ color: E_PAL.emberSoft, ...eStyles.display, fontSize: 14, lineHeight: 1.4 }}>✦</span>
                  <span style={{ ...eStyles.body, fontSize: 13, lineHeight: 1.45 }}>{l}</span>
                </div>
              ))}
            </div>
          </ECard>

          <ECard style={{ padding: "18px 22px" }}>
            <ESectionTitle
              title="Key Findings"
              right={<EKicker size={9} spacing={1}>TOP 5 OF {raw.keyFindings.length}</EKicker>}
              style={{ marginBottom: 8 }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {raw.keyFindings.slice(0, 5).map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${E_PAL.borderSoft}` }}>
                  <span style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.emberSoft, letterSpacing: 1, paddingTop: 3, flexShrink: 0 }}>
                    F.{String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ ...eStyles.body, fontSize: 12, lineHeight: 1.5, color: "#c6d8d8" }}>{f}</span>
                </div>
              ))}
            </div>
          </ECard>
        </div>
      </div>

      <EFooter
        factoid={`WHIMPERING WASTES · ${c.teams.length} STAGES · ONE ATTEMPT PER TEAM · ${
          dayOneCount === cycles.length ? "ALL CYCLES CLEARED DAY ONE" : `${dayOneCount}/${cycles.length} CYCLES CLEARED DAY ONE`
        }`}
        updated={raw.meta.updated}
      />
    </EShell>
  );
}
