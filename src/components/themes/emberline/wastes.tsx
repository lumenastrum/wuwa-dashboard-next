/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { useData } from "@/lib/data-context";
import type { TorrentsRecord, WastesSeason, WastesStageRow, WastesWaters } from "@/lib/types";
import { tokenIcon, wastesAsset, wastesGradeIcon } from "@/lib/game-icons";
import { splitNote } from "@/lib/notes";
import { E_PAL, eStyles } from "./styles";
import { EFace, EFooter, EKicker, ESectionTitle, EShell } from "./primitives";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";

const GOLD_GRAD = `linear-gradient(90deg, ${E_PAL.gold}, ${E_PAL.emberSoft})`;

// Forbidden Waters wears the sea-blue of the ghost-ship glows (94,180,211) —
// gold on its cards is reserved for the score, the grade badge, and the bar.
const WATERS_BLUE = "#5eb4d3";
const WATERS_BLUE_PALE = "#b7e0f0";

// Per-stage grade thresholds (points → B/A/S; Infinite Torrents alone extends
// to SS/SSS) — the 3.5 ladder from the in-game challenge goals. Render-side
// truth only; scores above the ladder simply overflow the bar.
function stageTiers(stage: number): { grades: string[]; points: number[] } {
  if (stage <= 6) return { grades: ["B", "A", "S"], points: [800, 1200, 1600] };
  if (stage <= 8) return { grades: ["B", "A", "S"], points: [1500, 2000, 2500] };
  if (stage <= 11) return { grades: ["B", "A", "S"], points: [1500, 2500, 3500] };
  return { grades: ["B", "A", "S", "SS", "SSS"], points: [3500, 4000, 4500, 5000, 5500] };
}

const WATERS_TITLE: Record<WastesWaters, string> = {
  Forbidden: "Forbidden Waters",
  Chasm: "Respawning Waters: Chasm",
  Torrents: "Respawning Waters: Torrents",
};

const WATERS_TAG: Record<WastesWaters, string> = {
  Forbidden: "STAGES 1-6 · PERMANENT · ONE-TIME BOUNTY",
  Chasm: "STAGES 7-11 · RESETS EVERY 4 WEEKS",
  Torrents: "STAGE 12 · ENDLESS · THE SSS LADDER",
};

// Forbidden Waters' reward ladder tops out at 9,600 points (6 stages × 1,600
// S-ceiling) — it's a fixed one-time ladder, so unlike the per-season Chasm /
// Torrents targets it isn't stored in data.
const FORBIDDEN_MAX = 9600;

// Stage grade in the game's own settlement art; empty grade renders nothing,
// missing file degrades to a mono pill.
function GradeBadge({ grade, size = 30 }: { grade: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const [prevGrade, setPrevGrade] = useState(grade);
  if (prevGrade !== grade) {
    // Season switches reuse instances — reset the failure flag during render
    // (the React-endorsed adjust-on-prop-change pattern; effects can't setState).
    setPrevGrade(grade);
    setFailed(false);
  }
  if (!grade) return null;
  const icon = wastesGradeIcon(grade);
  if (!icon || failed) {
    return (
      <span style={{ ...eStyles.mono, fontSize: 9, letterSpacing: 1.5, padding: "3px 9px", borderRadius: 999, color: E_PAL.dark, background: E_PAL.gold }}>
        {grade}
      </span>
    );
  }
  const prestige = grade.startsWith("S");
  return (
    <img
      src={icon}
      alt={grade}
      title={grade}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        filter: prestige ? `drop-shadow(0 0 7px ${E_PAL.gold}90)` : "drop-shadow(0 0 5px rgba(147,224,211,0.5))",
      }}
    />
  );
}

// Score bar with the stage's own grade ladder as ticks.
function TierBar({ stage, score }: { stage: number; score: number }) {
  const { grades, points } = stageTiers(stage);
  const scale = points[points.length - 1] * 1.18;
  const reached = points.filter((p) => score >= p).length;
  const sGrade = reached >= 3;
  return (
    <div>
      <div style={{ position: "relative", height: 3, borderRadius: 999, background: E_PAL.track }}>
        <div
          style={{
            width: `${Math.min((score / scale) * 100, 100)}%`,
            height: "100%",
            borderRadius: 999,
            background: sGrade ? GOLD_GRAD : reached >= 1 ? E_PAL.green : E_PAL.textFaint,
          }}
        />
        {points.map((p, i) => (
          <div
            key={p}
            style={{
              position: "absolute",
              left: `${(p / scale) * 100}%`,
              top: -3,
              bottom: -3,
              width: 1,
              background: score >= p ? "rgba(245,201,122,0.75)" : "rgba(140,220,225,0.25)",
            }}
            title={`${grades[i]} · ${p.toLocaleString()}`}
          />
        ))}
      </div>
      <div style={{ position: "relative", height: 11, marginTop: 3 }}>
        {points.map((p, i) => (
          <span
            key={p}
            style={{
              position: "absolute",
              left: `${(p / scale) * 100}%`,
              transform: "translateX(-50%)",
              ...eStyles.mono,
              fontSize: 7,
              letterSpacing: 0.5,
              color: score >= p ? E_PAL.gold : E_PAL.textFaint,
            }}
          >
            {grades[i]}
          </span>
        ))}
      </div>
    </div>
  );
}

// One half-fleet row: numeral · trio faces · token chip (painted icon when
// the rip id is recorded).
function FleetRow({ label, members, token, icon }: { label: string; members: string[]; token: string; icon?: number }) {
  const art = tokenIcon(icon);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <span style={{ ...eStyles.mono, fontSize: 8.5, color: E_PAL.textMute, width: 12, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", paddingLeft: 8, flexShrink: 0 }}>
        {members.length ? (
          members.map((n) => <EFace key={n} name={n} size={34} radius={8} style={{ marginLeft: -8 }} />)
        ) : (
          <span style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.textFaint, marginLeft: -8 }}>—</span>
        )}
      </div>
      {(token || art) && (
        <span
          title={token}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginLeft: "auto",
            padding: "3px 10px 3px 4px",
            borderRadius: 999,
            border: `1px solid ${E_PAL.borderSoft}`,
            background: "rgba(140,220,225,0.05)",
            minWidth: 0,
          }}
        >
          {art && (
            <img
              src={art}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              style={{ width: 26, height: 26, objectFit: "contain" }}
            />
          )}
          <span
            style={{
              ...eStyles.mono,
              fontSize: 8.5,
              letterSpacing: 0.5,
              color: E_PAL.textDim,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 150,
            }}
          >
            {(token || "TOKEN").toUpperCase()}
          </span>
        </span>
      )}
    </div>
  );
}

function StageCard({ s, torrents, blue, isMobile }: { s: WastesStageRow; torrents?: boolean; blue?: boolean; isMobile: boolean }) {
  const [kicker, body] = s.notes ? splitNote(s.notes) : [null, ""];
  const { points } = stageTiers(s.stage);
  const sGrade = s.score >= points[2];
  // Gold on standard cards is reserved for the score, the grade badge, and the
  // tier bar — the chrome stays sea-toned (blue for Forbidden, teal elsewhere).
  const nameColor = torrents && sGrade ? E_PAL.gold : blue ? WATERS_BLUE_PALE : E_PAL.text;
  const kickerColor = torrents && sGrade ? E_PAL.gold : blue ? WATERS_BLUE : E_PAL.tide;
  return (
    <div
      style={{
        position: "relative",
        padding: torrents ? (isMobile ? "18px 18px 16px" : "20px 24px 18px") : "15px 17px 13px",
        borderRadius: 10,
        overflow: "hidden",
        background: torrents
          ? "linear-gradient(100deg, rgba(245,201,122,0.07), rgba(94,180,211,0.04) 60%, transparent)"
          : blue
            ? "rgba(94,180,211,0.06)"
            : E_PAL.inset,
        border: `1px solid ${torrents ? "rgba(245,201,122,0.4)" : blue ? "rgba(94,180,211,0.35)" : "rgba(140,220,225,0.14)"}`,
      }}
    >
      {torrents && (
        <img
          src={wastesAsset("flame-max")}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          style={{ position: "absolute", right: 10, bottom: -18, height: 130, opacity: 0.14, pointerEvents: "none" }}
        />
      )}
      <div style={{ position: "absolute", right: 8, top: -14, ...eStyles.display, fontSize: 54, color: blue ? "rgba(94,180,211,0.1)" : "rgba(140,220,225,0.05)" }}>
        {String(s.stage).padStart(2, "0")}
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <EKicker size={8} spacing={1.5}>STAGE {String(s.stage).padStart(2, "0")}{torrents ? " · ENDLESS" : ""}</EKicker>
          <div style={{ ...eStyles.display, fontSize: torrents ? (isMobile ? 22 : 28) : 17, marginTop: 2, color: nameColor }}>
            {s.name}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <GradeBadge grade={s.grade} size={torrents ? 42 : 34} />
          <span style={{ ...eStyles.display, fontSize: torrents ? (isMobile ? 30 : 40) : 24, color: sGrade ? E_PAL.gold : E_PAL.text }}>
            {s.score.toLocaleString()}
          </span>
        </div>
      </div>
      <div style={{ marginTop: torrents ? 12 : 9 }}>
        <TierBar stage={s.stage} score={s.score} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 9 }}>
        <FleetRow label="I" members={s.teamA} token={s.tokenA} icon={s.tokenAIcon} />
        <FleetRow label="II" members={s.teamB} token={s.tokenB} icon={s.tokenBIcon} />
      </div>
      {kicker && (
        <div style={{ marginTop: 9, ...eStyles.display, fontSize: torrents ? 14 : 12, letterSpacing: 0.4, color: kickerColor }}>
          {kicker}
        </div>
      )}
      {body && (
        <div
          title={s.notes}
          style={{
            marginTop: kicker ? 4 : 8,
            ...eStyles.body,
            fontSize: 11.5,
            fontStyle: "italic",
            lineHeight: 1.45,
            color: E_PAL.textDim,
            display: "-webkit-box",
            WebkitLineClamp: torrents ? 3 : 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {body}
        </div>
      )}
    </div>
  );
}


// ── Infinite Torrents record ledger ──────────────────────────────────────
// The game keeps exactly one Wastes card across rotations: the Torrents high
// score with its lineup, halves, rounds, and the date. Stage rows evaporate
// every 28 days; this is the part the sea remembers. The plaque mirrors that
// card; the history keeps every card the game has already overwritten.

const TORRENTS_CEILING = 5500; // SSS line — the ladder's top rung

function fmtDate(iso: string): string {
  // "2026-08-04" → "2026/08/04", the card's own Time Achieved format.
  return iso.replace(/-/g, "/");
}

// One half of the lineup on the plaque: numeral · trio · points · rounds ·
// token chip. Points wear gold when the half alone clears the SSS ceiling —
// the "one half did the whole ladder" moment.
function RecordHalf({ label, members, points, rounds, token, icon, isMobile }: {
  label: string; members: string[]; points: number; rounds: number | null; token: string; icon?: number; isMobile: boolean;
}) {
  const art = tokenIcon(icon);
  const solo = points >= TORRENTS_CEILING;
  return (
    <div
      style={{
        display: "grid",
        // label+faces · points/rounds · token chip. The chip owns the only
        // flexible column and ellipsizes, so the stats never get overrun.
        gridTemplateColumns: isMobile ? "auto 1fr" : "auto auto minmax(0, 1fr)",
        alignItems: "center",
        columnGap: isMobile ? 10 : 16,
        rowGap: 8,
        padding: "10px 12px",
        borderRadius: 8,
        background: E_PAL.inset,
        border: `1px solid ${solo ? "rgba(245,201,122,0.35)" : E_PAL.borderSoft}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ ...eStyles.mono, fontSize: 8.5, letterSpacing: 1.5, color: E_PAL.textMute, width: 44, flexShrink: 0 }}>TEAM {label}</span>
        <div style={{ display: "flex", paddingLeft: 10 }}>
          {members.length ? (
            members.map((n) => <EFace key={n} name={n} size={40} radius={9} style={{ marginLeft: -10 }} />)
          ) : (
            <span style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.textFaint, marginLeft: -10 }}>—</span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, whiteSpace: "nowrap", justifySelf: isMobile ? "end" : "start" }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ ...eStyles.display, fontSize: 22, lineHeight: 1, color: solo ? E_PAL.gold : E_PAL.text }}>{points.toLocaleString()}</span>
          <span style={{ ...eStyles.mono, fontSize: 7.5, letterSpacing: 1, color: E_PAL.textMute }}>PTS</span>
        </span>
        <span style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ ...eStyles.display, fontSize: 16, lineHeight: 1, color: rounds != null ? E_PAL.textDim : E_PAL.textFaint }}>{rounds ?? "—"}</span>
          <span style={{ ...eStyles.mono, fontSize: 7.5, letterSpacing: 1, color: E_PAL.textMute }}>ROUNDS</span>
        </span>
      </div>
      {(token || art) && (
        <span
          title={token}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px 3px 4px",
            borderRadius: 999,
            border: `1px solid ${E_PAL.borderSoft}`,
            background: "rgba(140,220,225,0.05)",
            minWidth: 0,
            maxWidth: "100%",
            gridColumn: isMobile ? "1 / -1" : undefined,
            justifySelf: isMobile ? "start" : "end",
          }}
        >
          {art && (
            <img
              src={art}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              style={{ width: 26, height: 26, objectFit: "contain" }}
            />
          )}
          <span
            style={{
              ...eStyles.mono,
              fontSize: 8.5,
              letterSpacing: 0.5,
              color: E_PAL.textDim,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {(token || "TOKEN").toUpperCase()}
          </span>
        </span>
      )}
    </div>
  );
}

// The standing card — the highest score on the ledger, laid out like the
// game's own settlement card: score + grade + round on the left, lineup on
// the right, Time Achieved along the bottom.
function RecordPlaque({ r, prev, isMobile }: { r: TorrentsRecord; prev?: TorrentsRecord; isMobile: boolean }) {
  const [kicker, body] = r.notes ? splitNote(r.notes) : [null, ""];
  const delta = prev ? r.score - prev.score : null;
  return (
    <div
      style={{
        position: "relative",
        padding: isMobile ? "18px 16px 16px" : "22px 26px 20px",
        borderRadius: 12,
        overflow: "hidden",
        background: "linear-gradient(110deg, rgba(245,201,122,0.09), rgba(94,180,211,0.05) 55%, rgba(4,13,18,0.5))",
        border: "1px solid rgba(245,201,122,0.45)",
        boxShadow: "0 0 34px rgba(245,201,122,0.08)",
      }}
    >
      <img
        src={wastesAsset("tide")}
        alt=""
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
        style={{
          position: "absolute",
          right: -40,
          bottom: -60,
          width: 520,
          opacity: 0.14,
          pointerEvents: "none",
          maskImage: "linear-gradient(90deg, transparent, #000 40%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 40%)",
        }}
      />
      <img
        src={wastesAsset("flame-max")}
        alt=""
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
        style={{ position: "absolute", left: isMobile ? -30 : 210, top: -30, height: 150, opacity: 0.12, pointerEvents: "none" }}
      />
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 230px) minmax(0, 1fr)", gap: isMobile ? 16 : 26 }}>
        {/* ── score column ── */}
        <div>
          <EKicker size={8} spacing={1.5} color={E_PAL.gold}>HIGHEST SCORE · STANDING CARD</EKicker>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
            <span style={{ ...eStyles.display, fontSize: isMobile ? 46 : 58, lineHeight: 1, color: E_PAL.gold, textShadow: "0 0 18px rgba(245,201,122,0.45)" }}>
              {r.score.toLocaleString()}
            </span>
            <GradeBadge grade={r.grade} size={isMobile ? 48 : 60} />
          </div>
          <div style={{ display: "flex", gap: 22, marginTop: 14, flexWrap: "wrap" }}>
            <div>
              <EKicker size={7.5} spacing={1.5}>HIGHEST ROUND</EKicker>
              <div style={{ ...eStyles.display, fontSize: 24, lineHeight: 1.1, color: r.rounds != null ? E_PAL.text : E_PAL.textFaint }}>{r.rounds ?? "—"}</div>
            </div>
            <div>
              <EKicker size={7.5} spacing={1.5}>OVER SSS LINE</EKicker>
              <div style={{ ...eStyles.display, fontSize: 24, lineHeight: 1.1, color: r.score >= TORRENTS_CEILING ? E_PAL.emberSoft : E_PAL.textDim }}>
                {r.score >= TORRENTS_CEILING ? `+${(r.score - TORRENTS_CEILING).toLocaleString()}` : `−${(TORRENTS_CEILING - r.score).toLocaleString()}`}
              </div>
            </div>
            {delta != null && (
              <div>
                <EKicker size={7.5} spacing={1.5}>VS PRIOR CARD</EKicker>
                <div style={{ ...eStyles.display, fontSize: 24, lineHeight: 1.1, color: delta >= 0 ? E_PAL.green : E_PAL.red }}>
                  {delta >= 0 ? "+" : "−"}{Math.abs(delta).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          <div style={{ marginTop: 14 }}>
            <EKicker size={7.5} spacing={1.5}>TIME ACHIEVED</EKicker>
            <div style={{ ...eStyles.mono, fontSize: 11, letterSpacing: 1, color: E_PAL.textDim, marginTop: 2 }}>{fmtDate(r.date)}</div>
          </div>
        </div>
        {/* ── lineup column ── */}
        <div style={{ minWidth: 0 }}>
          <EKicker size={8} spacing={1.5}>BATTLE LINEUP</EKicker>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            <RecordHalf label="I" members={r.teamA} points={r.pointsA} rounds={r.roundsA} token={r.tokenA} icon={r.tokenAIcon} isMobile={isMobile} />
            <RecordHalf label="II" members={r.teamB} points={r.pointsB} rounds={r.roundsB} token={r.tokenB} icon={r.tokenBIcon} isMobile={isMobile} />
          </div>
        </div>
      </div>
      {kicker && (
        <div style={{ position: "relative", marginTop: 14, ...eStyles.display, fontSize: 15, letterSpacing: 0.4, color: E_PAL.gold }}>
          {kicker}
        </div>
      )}
      {body && (
        <div style={{ position: "relative", marginTop: kicker ? 4 : 12, ...eStyles.body, fontSize: 12, fontStyle: "italic", lineHeight: 1.5, color: E_PAL.textDim }}>
          {body}
        </div>
      )}
    </div>
  );
}

// Every card ever logged, newest first. The standing card is lit gold; each
// row carries its delta against the card before it, so the ledger reads as
// the climb the game itself refuses to show.
function RecordHistory({ records, bestId, isMobile }: { records: TorrentsRecord[]; bestId: number; isMobile: boolean }) {
  const chrono = [...records].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  const rows = [...chrono].reverse();
  return (
    <div style={{ padding: isMobile ? "14px 14px 12px" : "16px 18px 14px", borderRadius: 12, background: E_PAL.panel, border: `1px solid ${E_PAL.border}`, display: "flex", flexDirection: "column" }}>
      <EKicker size={8} spacing={1.5}>EVERY CARD LOGGED · {records.length} RUN{records.length === 1 ? "" : "S"}</EKicker>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
        {rows.map((r) => {
          const i = chrono.indexOf(r);
          const prev = i > 0 ? chrono[i - 1] : undefined;
          const delta = prev ? r.score - prev.score : null;
          const standing = r.id === bestId;
          return (
            <div
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 8,
                background: standing ? "rgba(245,201,122,0.07)" : E_PAL.inset,
                border: `1px solid ${standing ? "rgba(245,201,122,0.35)" : E_PAL.borderSoft}`,
              }}
            >
              <GradeBadge grade={r.grade} size={26} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ ...eStyles.display, fontSize: 20, lineHeight: 1, color: standing ? E_PAL.gold : E_PAL.text }}>{r.score.toLocaleString()}</span>
                  {delta != null && (
                    <span style={{ ...eStyles.mono, fontSize: 8.5, color: delta >= 0 ? E_PAL.green : E_PAL.red }}>
                      {delta >= 0 ? "+" : "−"}{Math.abs(delta).toLocaleString()}
                    </span>
                  )}
                  {standing && <span style={{ ...eStyles.mono, fontSize: 7.5, letterSpacing: 1.5, color: E_PAL.gold }}>STANDING</span>}
                </div>
                <div style={{ ...eStyles.mono, fontSize: 8.5, letterSpacing: 0.5, color: E_PAL.textMute, marginTop: 3 }}>
                  {fmtDate(r.date)} · {r.pointsA.toLocaleString()} / {r.pointsB.toLocaleString()}{r.rounds != null ? ` · ROUND ${r.rounds}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", paddingLeft: 7 }}>
                {[...r.teamA, ...r.teamB].map((n, k) => (
                  <EFace key={`${n}-${k}`} name={n} size={22} radius={6} style={{ marginLeft: -7, ...(k === 3 ? { marginLeft: 2 } : {}) }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ ...eStyles.mono, fontSize: 8, letterSpacing: 0.5, color: E_PAL.textFaint, marginTop: "auto", paddingTop: 12, lineHeight: 1.5 }}>
        THE GAME KEEPS ONE CARD AND OVERWRITES IT. WE KEEP ALL OF THEM.
      </div>
    </div>
  );
}

export function EmberlineWastes() {
  const { raw } = useData();
  const { isMobile, isTablet } = useDashboardViewport();
  const seasons = raw.whimperingWastes?.seasons ?? [];
  const records = raw.whimperingWastes?.torrents ?? [];
  // Standing card = the highest score on the ledger (ties → the earlier run
  // holds, the way the game only overwrites on a strict beat).
  const standing = records.reduce<TorrentsRecord | undefined>((best, r) => (!best || r.score > best.score ? r : best), undefined);
  const standingPrev = standing
    ? [...records].filter((r) => r.date < standing.date || (r.date === standing.date && r.id < standing.id)).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)[0]
    : undefined;
  const [selRaw, setSel] = useState(seasons.length - 1);
  const sel = Math.max(0, Math.min(selRaw, seasons.length - 1));
  const s: WastesSeason | undefined = seasons[sel];

  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const card = stripRef.current?.children[sel] as HTMLElement | undefined;
    card?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [sel]);

  const pad = isMobile ? "0 16px" : isTablet ? "0 20px" : "0 34px";

  // ── empty state — becalmed ──────────────────────────────────────────
  if (!s) {
    return (
      <EShell>
        <div style={{ position: "relative", minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <div style={{ position: "relative", textAlign: "center", padding: 24 }}>
            <img
              src={wastesAsset("ship-b")}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              style={{ height: 170, width: "auto", filter: "drop-shadow(0 0 26px rgba(94,180,211,0.55))" }}
            />
            <EKicker spacing={3} style={{ marginTop: 18 }}>WHIMPERING WASTES · THE GHOST SHIP LEDGER</EKicker>
            <div style={{ ...eStyles.display, fontSize: isMobile ? 26 : 36, marginTop: 8 }}>
              Becalmed. <span style={{ fontStyle: "italic", color: E_PAL.emberSoft }}>No voyages on record.</span>
            </div>
            <div style={{ ...eStyles.mono, fontSize: 10, letterSpacing: 1, color: E_PAL.textMute, marginTop: 14 }}>
              npm run update -- addwastes --file scripts/wastes/season-1.json
            </div>
          </div>
        </div>
        <EFooter factoid="WHIMPERING WASTES · NO SEASONS RECORDED" updated={raw.meta.updated} />
      </EShell>
    );
  }

  const stagesOf = (w: WastesWaters) => s.stages.filter((x) => x.waters === w).sort((a, b) => a.stage - b.stage);
  const torrentsStages = stagesOf("Torrents");
  const torrentsStage = torrentsStages[0];
  const sCount = s.stages.filter((x) => x.grade.startsWith("S")).length;

  const watersMeta: { w: WastesWaters; pts: number; target: number; icon: string }[] = [
    { w: "Forbidden", pts: s.forbiddenPoints, target: FORBIDDEN_MAX, icon: "anchor" },
    { w: "Chasm", pts: s.chasmPoints, target: s.chasmTarget, icon: "wheel-alt" },
    { w: "Torrents", pts: s.torrentsPoints, target: s.torrentsTarget, icon: "flame" },
  ];

  return (
    <EShell>
      {/* ── hero — the ghost ship on the tide ────────────────── */}
      <div style={{ position: "relative", padding: isMobile ? "18px 16px 14px" : "30px 34px 24px", overflow: "hidden" }}>
        <img
          src={wastesAsset("tide")}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          style={{
            position: "absolute",
            right: 0,
            bottom: -30,
            width: isMobile ? 420 : 720,
            opacity: 0.2,
            pointerEvents: "none",
            maskImage: "linear-gradient(90deg, transparent, #000 35%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 35%)",
          }}
        />
        <img
          src={wastesAsset("ship-b")}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          style={{
            position: "absolute",
            right: isMobile ? -20 : 60,
            top: isMobile ? 4 : -6,
            height: isMobile ? 180 : 250,
            width: "auto",
            opacity: 0.55,
            filter: "drop-shadow(0 0 22px rgba(94,180,211,0.5))",
            pointerEvents: "none",
          }}
        />
        <EKicker spacing={3} style={{ marginBottom: 8 }}>WHIMPERING WASTES · THE GHOST SHIP LEDGER</EKicker>
        <div style={{ ...eStyles.display, fontSize: isMobile ? 32 : 46, lineHeight: 1.05, position: "relative" }}>
          Twelve stages. Two fleets each.{" "}
          <span style={{ fontStyle: "italic", color: E_PAL.emberSoft }}>The sea keeps score.</span>
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
            ⚓ CHASM {s.chasmPoints.toLocaleString()}/{s.chasmTarget.toLocaleString()} — {s.label.toUpperCase()}
          </span>
          <span style={{ ...eStyles.mono, fontSize: 9, letterSpacing: 2, color: E_PAL.textMute }}>
            TORRENTS {s.torrentsPoints.toLocaleString()}{torrentsStage?.grade ? ` · ${torrentsStage.grade}` : ""} · {sCount} S-GRADE STAGE{sCount === 1 ? "" : "S"}
            {s.window ? ` · ${s.window.toUpperCase()}` : ""}
          </span>
        </div>
      </div>

      {/* ── the record — the one card the game keeps ─────────── */}
      {standing && (
        <div style={{ padding: pad, marginBottom: 20 }}>
          <ESectionTitle
            title="Infinite Torrents · The Record"
            size={20}
            sub={<em>the one card the sea keeps</em>}
            right={!isMobile ? <EKicker size={8.5} spacing={0.5} style={{ whiteSpace: "nowrap" }}>PERSISTS ACROSS ROTATIONS</EKicker> : undefined}
            style={{ margin: "0 4px 12px" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "minmax(0, 1.7fr) minmax(0, 1fr)", gap: 13, alignItems: "stretch" }}>
            <RecordPlaque r={standing} prev={standingPrev} isMobile={isMobile} />
            <RecordHistory records={records} bestId={standing.id} isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* ── season selector strip ────────────────────────────── */}
      {seasons.length > 1 && (
        <div
          ref={stripRef}
          style={{ display: "flex", gap: 12, overflowX: "auto", WebkitOverflowScrolling: "touch", padding: isMobile ? "0 16px 16px" : "0 34px 18px" }}
        >
          {seasons.map((ss, i) => {
            const active = i === sel;
            const prev = i > 0 ? seasons[i - 1].chasmPoints + seasons[i - 1].torrentsPoints : null;
            const total = ss.chasmPoints + ss.torrentsPoints;
            const delta = prev != null ? total - prev : null;
            return (
              <div
                key={ss.id}
                onClick={() => setSel(i)}
                style={{
                  flex: "0 0 230px",
                  padding: "12px 15px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: active ? "linear-gradient(180deg, rgba(255,122,77,0.08), rgba(140,220,225,0.03))" : E_PAL.panel,
                  border: `1px solid ${active ? "rgba(255,122,77,0.55)" : E_PAL.border}`,
                }}
              >
                <EKicker size={9} spacing={2}>VOYAGE {String(ss.id).padStart(2, "0")}</EKicker>
                <div style={{ ...eStyles.display, fontSize: 17, marginTop: 3, color: active ? E_PAL.text : E_PAL.textDim }}>{ss.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 5 }}>
                  <span style={{ ...eStyles.display, fontSize: 22, lineHeight: 1, color: active ? E_PAL.emberSoft : E_PAL.text }}>
                    {total.toLocaleString()}
                  </span>
                  {delta != null && (
                    <span style={{ ...eStyles.mono, fontSize: 9, color: delta >= 0 ? E_PAL.green : E_PAL.red }}>
                      {delta >= 0 ? "+" : "−"}{Math.abs(delta).toLocaleString()}
                    </span>
                  )}
                </div>
                <EKicker size={8.5} spacing={0} style={{ marginTop: 4 }}>{ss.date}{ss.window ? ` · ${ss.window}` : ""}</EKicker>
              </div>
            );
          })}
        </div>
      )}

      {/* ── the three waters ─────────────────────────────────── */}
      <div style={{ padding: pad }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
          {watersMeta.map(({ w, pts, target, icon }) => {
            const made = pts >= target && pts > 0;
            const logged = stagesOf(w).length > 0;
            return (
              <div
                key={w}
                style={{
                  position: "relative",
                  padding: "13px 16px 14px",
                  borderRadius: 10,
                  overflow: "hidden",
                  opacity: logged ? 1 : 0.5,
                  background: w === "Forbidden" ? "rgba(94,180,211,0.05)" : E_PAL.panel,
                  border: `1px solid ${w === "Forbidden" ? "rgba(94,180,211,0.4)" : made ? "rgba(245,201,122,0.4)" : E_PAL.border}`,
                }}
              >
                <img
                  src={wastesAsset(icon)}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  style={{ position: "absolute", right: 8, top: 8, height: 44, opacity: 0.35, pointerEvents: "none" }}
                />
                <EKicker size={8} spacing={1.5}>{WATERS_TAG[w]}</EKicker>
                <div style={{ ...eStyles.display, fontSize: 16, marginTop: 3 }}>{WATERS_TITLE[w]}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 6 }}>
                  <span style={{ ...eStyles.display, fontSize: 26, lineHeight: 1, color: made ? E_PAL.gold : logged ? E_PAL.text : E_PAL.textMute }}>
                    {logged ? pts.toLocaleString() : "—"}
                  </span>
                  <span style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.textMute }}>/ {target.toLocaleString()}</span>
                </div>
                <div style={{ marginTop: 8, position: "relative", height: 3, borderRadius: 999, background: E_PAL.track }}>
                  <div
                    style={{
                      // Guard the degenerate target (a season file CAN say 0):
                      // an empty bar beats an Infinity-fueled 100% lie.
                      width: `${target > 0 ? Math.min((pts / (target * 1.1)) * 100, 100) : 0}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: made ? GOLD_GRAD : E_PAL.green,
                    }}
                  />
                  {target > 0 && (
                    <div style={{ position: "absolute", left: `${(1 / 1.1) * 100}%`, top: -3, bottom: -3, width: 1, background: "rgba(245,201,122,0.6)" }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── the voyage, waters by waters ─────────────────────── */}
      {(["Forbidden", "Chasm"] as WastesWaters[]).map((w) => {
        const rows = stagesOf(w);
        if (!rows.length) return null;
        const pts = rows.reduce((acc, x) => acc + x.score, 0);
        return (
          <div key={w} style={{ padding: pad }}>
            <ESectionTitle
              title={WATERS_TITLE[w]}
              size={20}
              sub={<em>{rows.length} stage{rows.length === 1 ? "" : "s"} · {pts.toLocaleString()} pts</em>}
              style={{ margin: "24px 4px 12px" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 13 }}>
              {rows.map((x) => (
                <StageCard key={x.stage} s={x} blue={w === "Forbidden"} isMobile={isMobile} />
              ))}
            </div>
          </div>
        );
      })}

      {torrentsStages.length > 0 && (
        <div style={{ padding: pad }}>
          <ESectionTitle
            title={WATERS_TITLE.Torrents}
            size={20}
            sub={<em>the endless stage · burning waves</em>}
            right={!isMobile ? <EKicker size={8.5} spacing={0.5} style={{ whiteSpace: "nowrap" }}>ONLY STAGE WITH SS/SSS</EKicker> : undefined}
            style={{ margin: "24px 4px 12px" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {torrentsStages.map((x) => (
              <StageCard key={x.stage} s={x} torrents isMobile={isMobile} />
            ))}
          </div>
        </div>
      )}

      {/* ── field doctrine ───────────────────────────────────── */}
      <div style={{ padding: isMobile ? "0 16px 24px" : isTablet ? "0 20px 28px" : "0 34px 28px" }}>
        {s.lessons.length > 0 && (
          <>
            <ESectionTitle
              title="Field Doctrine"
              size={22}
              sub={<em>lessons dredged from {s.label.toLowerCase()}</em>}
              style={{ margin: "28px 4px 14px" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 12 }}>
              {s.lessons.map((l, i) => (
                <div key={i} style={{ position: "relative", padding: "14px 16px", borderRadius: 10, background: E_PAL.panel, border: `1px solid ${E_PAL.border}` }}>
                  <div style={{ position: "absolute", right: 12, top: 6, ...eStyles.display, fontSize: 26, color: "rgba(255,179,138,0.18)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <span style={{ color: E_PAL.emberSoft, ...eStyles.display, fontSize: 13 }}>⚓</span>
                  <div style={{ marginTop: 6, ...eStyles.body, fontSize: 12.5, lineHeight: 1.5, color: "#c6d8d8" }}>{l}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <EFooter
        factoid={`WHIMPERING WASTES · ${s.stages.length} STAGES LOGGED · CHASM ${s.chasmPoints.toLocaleString()} · TORRENTS ${s.torrentsPoints.toLocaleString()}`}
        updated={raw.meta.updated}
      />
    </EShell>
  );
}
