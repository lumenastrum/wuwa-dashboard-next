"use client";

import { useEffect, useRef, useState } from "react";
import { useData } from "@/lib/data-context";
import type { CycleTeamRow, Rating } from "@/lib/types";
import { portrait, splashArt, tallPortrait } from "@/lib/portraits";
import { gradeIcon } from "@/lib/game-icons";
import { E_PAL, eStyles } from "./styles";
import { EFooter, EKicker, ESectionTitle, EShell } from "./primitives";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";

// Bar scale ceiling for a single team score.
const SCORE_SCALE = 15000;

// The in-game IRIDESCENT badge is a prismatic rainbow — same stops as the
// old themes' port (2026-07-19), glow tuned for the abyssal ground.
const IRID_GRAD = "linear-gradient(100deg, #ffb3d9, #ffd36e 35%, #9fe8ff 68%, #c9a7ff)";
const GOLD_GRAD = `linear-gradient(90deg, ${E_PAL.gold}, ${E_PAL.emberSoft})`;

// Letter grades (B/A/S/SS/SSS) render as the ripped in-game medal art;
// CROWNED and IRIDESCENT have no medal file, so they keep the pill treatment.
function MedalBadge({ rating, size = 30 }: { rating: Rating; size?: number }) {
  if (!rating) return null;
  const icon = gradeIcon(rating);
  if (icon) {
    return (
      <img
        src={icon}
        alt={rating}
        style={{ width: size, height: size, objectFit: "contain", filter: `drop-shadow(0 0 6px ${E_PAL.gold}80)` }}
      />
    );
  }
  const iridescent = rating === "IRIDESCENT";
  const col = E_PAL.gold;
  return (
    <span
      style={{
        ...eStyles.mono,
        fontSize: 9,
        letterSpacing: 1.5,
        padding: "4px 10px",
        borderRadius: 999,
        flexShrink: 0,
        color: E_PAL.dark,
        background: iridescent ? IRID_GRAD : col,
        border: `1px solid ${iridescent ? "rgba(255,179,217,0.8)" : col}`,
        boxShadow: iridescent ? "0 0 12px rgba(255,179,217,0.55)" : `0 0 12px ${col}55`,
      }}
    >
      {rating}
    </span>
  );
}

// A note's first sentence (when short and punchy) becomes a bold kicker
// headline; the remainder renders as the clamped field-log body. Notes
// without an early sentence break render whole as the body.
function splitNote(note: string): [string | null, string] {
  const m = note.match(/^(.{4,90}?[.!])\s+([\s\S]*)$/);
  if (m) return [m[1], m[2]];
  return [null, note];
}

function teamFrame(t: CycleTeamRow) {
  const iridescent = t.rating === "IRIDESCENT";
  const crowned = t.rating === "CROWNED" || t.rating === "SSS";
  const over5k = t.over5k ?? t.score >= 5000;
  return {
    iridescent,
    crowned,
    over5k,
    border: crowned ? "rgba(245,201,122,0.4)" : iridescent ? "rgba(255,179,217,0.55)" : "rgba(140,220,225,0.1)",
    bg: crowned ? "rgba(245,201,122,0.045)" : iridescent ? "rgba(255,179,217,0.04)" : E_PAL.inset,
    bar: iridescent ? IRID_GRAD : crowned || t.rating === "SS" ? GOLD_GRAD : over5k ? E_PAL.green : E_PAL.textFaint,
    scoreColor: crowned ? E_PAL.gold : iridescent ? "#ffb3d9" : E_PAL.text,
  };
}

export function EmberlineCycles() {
  const { raw } = useData();
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

  if (!cycles.length) return null;

  // The cycle's headline team — drives the Hall of Records plaque + hero ghost.
  const topTeam = c.teams.reduce((a, b) => (b.score > a.score ? b : a), c.teams[0]);
  const [topKicker, topBody] = topTeam.notes ? splitNote(topTeam.notes) : [null, ""];
  const topCarry = topTeam.members[0];
  const topShare = c.totalPoints > 0 ? Math.round((topTeam.score / c.totalPoints) * 100) : 0;

  // Timeline geometry — scores (and the shared target, so the line always
  // has context) mapped into a vertical band with room for value/label text.
  const totals = cycles.map((cc) => cc.totalPoints);
  const rawLo = Math.min(...totals, c.target);
  const rawHi = Math.max(...totals, c.target);
  const pad = Math.max((rawHi - rawLo) * 0.18, 1200);
  const lo = rawLo - pad;
  const hi = rawHi + pad;
  const xOf = (i: number) => (cycles.length === 1 ? 50 : 8 + i * (84 / (cycles.length - 1)));
  const yOf = (v: number) => 66 - ((v - lo) / (hi - lo)) * 40; // 26%..66% band

  return (
    <EShell>
      {/* ── hero ─────────────────────────────────────────────── */}
      <div style={{ position: "relative", padding: isMobile ? "18px 16px 14px" : "28px 34px 22px", overflow: "hidden" }}>
        <img
          src={tallPortrait(topCarry)}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          style={{
            position: "absolute",
            right: isMobile ? -60 : -30,
            top: isMobile ? -40 : -70,
            height: isMobile ? 300 : 430,
            opacity: 0.16,
            filter: "saturate(0.9)",
            maskImage: "linear-gradient(90deg, transparent, #000 40%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 40%)",
            pointerEvents: "none",
          }}
        />
        <EKicker spacing={3} style={{ marginBottom: 8 }}>ENDSTATE MATRIX · WHIMPERING WASTES ARCHIVE</EKicker>
        <div style={{ ...eStyles.display, fontSize: isMobile ? 32 : 46, lineHeight: 1.05 }}>
          {c.teams.length} teams. One run each.{" "}
          <span style={{ fontStyle: "italic", color: E_PAL.emberSoft }}>No mulligans.</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
          <span
            style={{
              ...eStyles.mono,
              fontSize: 9,
              letterSpacing: 2,
              color: E_PAL.dark,
              background: GOLD_GRAD,
              padding: "5px 12px",
              borderRadius: 999,
              boxShadow: `0 0 14px ${E_PAL.gold}66`,
            }}
          >
            ⚔ {dayOneCount === cycles.length ? `DAY ONE CLEAR — ${dayOneCount}/${cycles.length} CYCLES` : `${dayOneCount}/${cycles.length} DAY ONE CLEARS`}
          </span>
          <span style={{ ...eStyles.mono, fontSize: 9, letterSpacing: 2, color: E_PAL.textMute }}>
            CAMPAIGN WINDOW {cycles[0].date} → {cycles[cycles.length - 1].date}
          </span>
        </div>
      </div>

      {/* ── campaign trajectory / selector ───────────────────── */}
      {isMobile ? (
        <div
          ref={stripRef}
          style={{ display: "flex", gap: 12, overflowX: "auto", WebkitOverflowScrolling: "touch", padding: "0 16px 16px" }}
        >
          {cycles.map((cc, i) => {
            const active = i === sel;
            const prev = i > 0 ? cycles[i - 1].totalPoints : null;
            const delta = prev != null ? cc.totalPoints - prev : null;
            return (
              <div
                key={cc.id}
                onClick={() => setSel(i)}
                style={{
                  flex: "0 0 230px",
                  padding: "14px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: active ? "linear-gradient(180deg, rgba(255,122,77,0.08), rgba(140,220,225,0.03))" : E_PAL.panel,
                  border: `1px solid ${active ? "rgba(255,122,77,0.55)" : E_PAL.border}`,
                }}
              >
                <EKicker size={9} spacing={2}>CYCLE {String(cc.id).padStart(2, "0")}</EKicker>
                <div style={{ ...eStyles.display, fontSize: 20, marginTop: 3, color: active ? E_PAL.text : E_PAL.textDim }}>{cc.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                  <span style={{ ...eStyles.display, fontSize: 24, lineHeight: 1, color: active ? E_PAL.emberSoft : E_PAL.text }}>
                    {cc.totalPoints.toLocaleString()}
                  </span>
                  {delta != null && (
                    <span style={{ ...eStyles.mono, fontSize: 9, color: delta >= 0 ? E_PAL.green : E_PAL.red }}>
                      {delta >= 0 ? "+" : "−"}
                      {Math.abs(delta).toLocaleString()}
                    </span>
                  )}
                </div>
                <EKicker size={8.5} spacing={0} style={{ marginTop: 4 }}>
                  {cc.date}
                  {cc.dayOne ? " · DAY ONE" : ""}
                </EKicker>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            height: 175,
            margin: isTablet ? "6px 20px 22px" : "6px 34px 22px",
            borderRadius: 12,
            background: E_PAL.panel,
            border: `1px solid ${E_PAL.border}`,
          }}
        >
          <div style={{ position: "absolute", left: 18, top: 12, ...eStyles.mono, fontSize: 8.5, letterSpacing: 2, color: E_PAL.textMute }}>
            CAMPAIGN TRAJECTORY · TOTAL POINTS BY CYCLE
          </div>
          <div
            style={{
              position: "absolute",
              left: 18,
              top: `${yOf(c.target)}%`,
              transform: "translateY(-130%)",
              ...eStyles.mono,
              fontSize: 8,
              letterSpacing: 1,
              color: E_PAL.gold,
            }}
          >
            - - {c.target.toLocaleString()} TARGET
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <line x1="0" y1={yOf(c.target)} x2="100" y2={yOf(c.target)} stroke={E_PAL.gold} strokeWidth="0.35" strokeDasharray="2 1.6" opacity="0.7" />
            {cycles.length > 1 && (
              <polyline
                points={cycles.map((cc, i) => `${xOf(i)},${yOf(cc.totalPoints)}`).join(" ")}
                fill="none"
                stroke="url(#emTlGrad)"
                strokeWidth="0.7"
              />
            )}
            <defs>
              <linearGradient id="emTlGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor={E_PAL.green} />
                <stop offset="1" stopColor={E_PAL.emberSoft} />
              </linearGradient>
            </defs>
          </svg>
          {cycles.map((cc, i) => {
            const active = i === sel;
            const prev = i > 0 ? cycles[i - 1].totalPoints : null;
            const delta = prev != null ? cc.totalPoints - prev : null;
            return (
              <div key={cc.id}>
                {delta != null && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${(xOf(i - 1) + xOf(i)) / 2}%`,
                      top: `${(yOf(cycles[i - 1].totalPoints) + yOf(cc.totalPoints)) / 2}%`,
                      transform: "translate(-50%,-50%)",
                      ...eStyles.mono,
                      fontSize: 8.5,
                      color: delta >= 0 ? E_PAL.green : E_PAL.red,
                      background: "rgba(5,15,21,0.85)",
                      border: `1px solid ${delta >= 0 ? E_PAL.green : E_PAL.red}44`,
                      padding: "2px 7px",
                      borderRadius: 999,
                      pointerEvents: "none",
                    }}
                  >
                    {delta >= 0 ? "+" : "−"}
                    {Math.abs(delta).toLocaleString()}
                  </div>
                )}
                <div
                  onClick={() => setSel(i)}
                  style={{ position: "absolute", left: `${xOf(i)}%`, top: `${yOf(cc.totalPoints)}%`, transform: "translate(-50%,-50%)", cursor: "pointer" }}
                  title={`${cc.label} · ${cc.date} · ${cc.totalPoints.toLocaleString()} pts`}
                >
                  <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: -42, whiteSpace: "nowrap", textAlign: "center" }}>
                    <div style={{ ...eStyles.display, fontSize: active ? 18 : 13, color: active ? E_PAL.emberSoft : E_PAL.textDim }}>
                      {cc.totalPoints.toLocaleString()}
                    </div>
                  </div>
                  <div
                    style={{
                      width: active ? 14 : 9,
                      height: active ? 14 : 9,
                      transform: "rotate(45deg)",
                      background: active ? E_PAL.emberSoft : E_PAL.bg,
                      border: `1.5px solid ${active ? E_PAL.ember : "rgba(147,224,211,0.55)"}`,
                      boxShadow: active ? "0 0 14px rgba(255,122,77,0.8)" : "none",
                      margin: "0 auto",
                    }}
                  />
                  <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: 14, whiteSpace: "nowrap", textAlign: "center" }}>
                    <div style={{ ...eStyles.mono, fontSize: 8, letterSpacing: 1.5, color: active ? E_PAL.text : E_PAL.textMute }}>
                      C{String(cc.id).padStart(2, "0")}
                    </div>
                    {!isTablet && (
                      <div style={{ ...eStyles.mono, fontSize: 7.5, letterSpacing: 1, color: active ? E_PAL.textDim : E_PAL.textFaint, marginTop: 2 }}>
                        {cc.label.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── hall of records plaque ───────────────────────────── */}
      <div style={{ padding: isMobile ? "0 16px" : isTablet ? "0 20px" : "0 34px" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            gap: isMobile ? 14 : 30,
            padding: isMobile ? "18px 18px" : "20px 30px",
            borderRadius: 12,
            overflow: "hidden",
            background: "linear-gradient(100deg, rgba(245,201,122,0.09), rgba(255,122,77,0.03) 55%, transparent)",
            border: `1px solid rgba(245,201,122,0.4)`,
            boxShadow: "0 0 34px rgba(245,201,122,0.08) inset",
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: GOLD_GRAD, opacity: 0.7 }} />
          <img
            src={splashArt(topCarry)}
            alt={topCarry}
            onError={(e) => {
              const im = e.currentTarget;
              if (!im.dataset.fbk) {
                im.dataset.fbk = "1";
                im.src = tallPortrait(topCarry);
              } else {
                im.style.display = "none";
              }
            }}
            style={{ height: isMobile ? 150 : 200, maxWidth: "100%", objectFit: "contain", filter: `drop-shadow(0 12px 28px rgba(245,201,122,0.3))` }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <EKicker size={9} spacing={3} style={{ color: E_PAL.gold }}>✦ CYCLE MVP — HALL OF RECORDS</EKicker>
            <div style={{ ...eStyles.display, fontSize: isMobile ? 22 : 30, marginTop: 7, color: E_PAL.gold, textShadow: `0 0 16px ${E_PAL.gold}77` }}>
              {topKicker ?? "CYCLE'S FINEST"}
            </div>
            <div style={{ ...eStyles.display, fontSize: isMobile ? 16 : 19, marginTop: 4 }}>
              {topTeam.members[0]}
              <span style={{ color: E_PAL.textDim, fontSize: isMobile ? 13 : 15 }}> · {topTeam.members.slice(1).join(" · ")}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 12, ...eStyles.mono, fontSize: 10 }}>
              <span style={{ color: E_PAL.textMute }}>
                #{String(topTeam.order).padStart(2, "0")} OF {c.teams.length} DEPLOYMENTS
              </span>
              <span style={{ color: E_PAL.green, border: `1px solid ${E_PAL.green}66`, padding: "2px 8px", borderRadius: 999 }}>
                {topShare}% OF CYCLE TOTAL
              </span>
              <MedalBadge rating={topTeam.rating} size={22} />
            </div>
            {topBody && (
              <div
                title={topTeam.notes}
                style={{
                  marginTop: 10,
                  ...eStyles.body,
                  fontSize: 12.5,
                  fontStyle: "italic",
                  color: "#c6d8d8",
                  maxWidth: 600,
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {topBody}
              </div>
            )}
          </div>
          <div style={{ textAlign: "center", padding: "0 6px", flexShrink: 0 }}>
            <MedalBadge rating={topTeam.rating} size={isMobile ? 44 : 60} />
            <div
              style={{
                ...eStyles.display,
                fontSize: isMobile ? 34 : 46,
                lineHeight: 1,
                color: E_PAL.gold,
                textShadow: `0 0 20px ${E_PAL.gold}99`,
                marginTop: 4,
              }}
            >
              {topTeam.score.toLocaleString()}
            </div>
            <EKicker size={8.5} spacing={1.5} style={{ marginTop: 5, color: E_PAL.textDim }}>CYCLE BEST</EKicker>
          </div>
        </div>
      </div>

      {/* ── deployments ──────────────────────────────────────── */}
      <div style={{ padding: isMobile ? "0 16px" : isTablet ? "0 20px" : "0 34px" }}>
        <ESectionTitle
          title="The Deployments"
          size={22}
          sub={
            <em>
              cycle {String(c.id).padStart(2, "0")} · {c.label.toLowerCase()} · {c.totalPoints.toLocaleString()} pts
            </em>
          }
          right={isMobile ? undefined : <EKicker size={8.5} spacing={0.5} style={{ whiteSpace: "nowrap" }}>BAR SCALE 0–{SCORE_SCALE.toLocaleString()} · TICK = 5K WALL</EKicker>}
          style={{ margin: "26px 4px 14px" }}
        />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 14 }}>
          {c.teams.map((t) => {
            const f = teamFrame(t);
            const [kicker, body] = t.notes ? splitNote(t.notes) : [null, ""];
            return (
              <div
                key={t.order}
                style={{ position: "relative", padding: "16px 18px 14px", borderRadius: 10, background: f.bg, border: `1px solid ${f.border}`, overflow: "hidden" }}
              >
                <div style={{ position: "absolute", right: 8, top: -16, ...eStyles.display, fontSize: 60, color: "rgba(140,220,225,0.045)" }}>
                  {String(t.order).padStart(2, "0")}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ display: "flex", paddingLeft: 10 }}>
                    {t.members.map((n) => (
                      <img
                        key={n}
                        src={portrait(n)}
                        alt={n}
                        onError={(e) => {
                          e.currentTarget.style.visibility = "hidden";
                        }}
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 9,
                          objectFit: "cover",
                          border: "1px solid rgba(140,220,225,0.25)",
                          marginRight: -10,
                          background: E_PAL.bg,
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <MedalBadge rating={t.rating} />
                    <span style={{ ...eStyles.display, fontSize: 26, color: f.scoreColor }}>{t.score.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ marginTop: 8, ...eStyles.mono, fontSize: 8, letterSpacing: 1.2, color: E_PAL.textMute }}>{t.buff.toUpperCase()}</div>
                <div style={{ marginTop: 9, position: "relative", height: 3, borderRadius: 999, background: E_PAL.track }}>
                  <div style={{ width: `${Math.min((t.score / SCORE_SCALE) * 100, 100)}%`, height: "100%", borderRadius: 999, background: f.bar }} />
                  <div
                    style={{
                      position: "absolute",
                      left: `${(5000 / SCORE_SCALE) * 100}%`,
                      top: -3,
                      bottom: -3,
                      width: 1,
                      background: "rgba(245,201,122,0.6)",
                    }}
                  />
                </div>
                {kicker && (
                  <div
                    style={{
                      marginTop: 8,
                      ...eStyles.display,
                      fontSize: 12.5,
                      letterSpacing: 0.4,
                      color: f.crowned ? E_PAL.gold : f.iridescent ? "#ffb3d9" : E_PAL.tide,
                    }}
                  >
                    {kicker}
                  </div>
                )}
                {body && (
                  <div
                    title={t.notes}
                    style={{
                      marginTop: kicker ? 5 : 9,
                      ...eStyles.body,
                      fontSize: 11.5,
                      fontStyle: "italic",
                      lineHeight: 1.45,
                      color: E_PAL.textDim,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── field doctrine + standing findings ───────────────── */}
      <div style={{ padding: isMobile ? "0 16px 24px" : isTablet ? "0 20px 28px" : "0 34px 28px" }}>
        {c.lessons.length > 0 && (
          <>
            <ESectionTitle
              title="Field Doctrine"
              size={22}
              sub={<em>lessons carved from {c.label.toLowerCase()}</em>}
              style={{ margin: "28px 4px 14px" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 12 }}>
              {c.lessons.map((l, i) => (
                <div key={i} style={{ position: "relative", padding: "14px 16px", borderRadius: 10, background: E_PAL.panel, border: `1px solid ${E_PAL.border}` }}>
                  <div style={{ position: "absolute", right: 12, top: 6, ...eStyles.display, fontSize: 26, color: "rgba(255,179,138,0.18)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <span style={{ color: E_PAL.emberSoft, ...eStyles.display, fontSize: 13 }}>✦</span>
                  <div style={{ marginTop: 6, ...eStyles.body, fontSize: 12.5, lineHeight: 1.5, color: "#c6d8d8" }}>{l}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {raw.keyFindings.length > 0 && (
          <>
            <ESectionTitle
              title="Standing Findings"
              size={18}
              right={<EKicker size={9} spacing={1}>TOP {Math.min(5, raw.keyFindings.length)} OF {raw.keyFindings.length}</EKicker>}
              style={{ margin: "26px 4px 12px" }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {raw.keyFindings.slice(0, 5).map((fText, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 9,
                    padding: "9px 13px",
                    borderRadius: 9,
                    background: E_PAL.panel,
                    border: `1px solid ${E_PAL.borderSoft}`,
                    flex: isMobile ? "1 1 100%" : "1 1 380px",
                    maxWidth: isMobile ? "100%" : 520,
                  }}
                >
                  <span style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.emberSoft, letterSpacing: 1, paddingTop: 2, flexShrink: 0 }}>
                    F.{String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ ...eStyles.body, fontSize: 12, lineHeight: 1.5, color: "#c6d8d8" }}>{fText}</span>
                </div>
              ))}
            </div>
          </>
        )}
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
