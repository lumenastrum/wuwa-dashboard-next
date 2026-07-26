/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { useData } from "@/lib/data-context";
import type { WastesSeason, WastesStageRow, WastesWaters } from "@/lib/types";
import { tokenIcon, wastesAsset, wastesGradeIcon } from "@/lib/game-icons";
import { splitNote } from "@/lib/notes";
import { E_PAL, eStyles } from "./styles";
import { EFace, EFooter, EKicker, ESectionTitle, EShell } from "./primitives";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";

const GOLD_GRAD = `linear-gradient(90deg, ${E_PAL.gold}, ${E_PAL.emberSoft})`;

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
      <div style={{ display: "flex", paddingLeft: 7, flexShrink: 0 }}>
        {members.length ? (
          members.map((n) => <EFace key={n} name={n} size={26} radius={7} style={{ marginLeft: -7 }} />)
        ) : (
          <span style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.textFaint, marginLeft: -7 }}>—</span>
        )}
      </div>
      {(token || art) && (
        <span
          title={token}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginLeft: "auto",
            padding: "2px 8px 2px 3px",
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
              style={{ width: 18, height: 18, objectFit: "contain" }}
            />
          )}
          <span
            style={{
              ...eStyles.mono,
              fontSize: 7.5,
              letterSpacing: 0.5,
              color: E_PAL.textDim,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 110,
            }}
          >
            {(token || "TOKEN").toUpperCase()}
          </span>
        </span>
      )}
    </div>
  );
}

function StageCard({ s, torrents, isMobile }: { s: WastesStageRow; torrents?: boolean; isMobile: boolean }) {
  const [kicker, body] = s.notes ? splitNote(s.notes) : [null, ""];
  const { points } = stageTiers(s.stage);
  const sGrade = s.score >= points[2];
  return (
    <div
      style={{
        position: "relative",
        padding: torrents ? (isMobile ? "18px 18px 16px" : "20px 24px 18px") : "15px 17px 13px",
        borderRadius: 10,
        overflow: "hidden",
        background: torrents
          ? "linear-gradient(100deg, rgba(245,201,122,0.07), rgba(94,180,211,0.04) 60%, transparent)"
          : sGrade
            ? "rgba(245,201,122,0.04)"
            : E_PAL.inset,
        border: `1px solid ${torrents ? "rgba(245,201,122,0.4)" : sGrade ? "rgba(245,201,122,0.3)" : "rgba(140,220,225,0.1)"}`,
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
      <div style={{ position: "absolute", right: 8, top: -14, ...eStyles.display, fontSize: 54, color: "rgba(140,220,225,0.05)" }}>
        {String(s.stage).padStart(2, "0")}
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <EKicker size={8} spacing={1.5}>STAGE {String(s.stage).padStart(2, "0")}{torrents ? " · ENDLESS" : ""}</EKicker>
          <div style={{ ...eStyles.display, fontSize: torrents ? (isMobile ? 22 : 28) : 17, marginTop: 2, color: sGrade ? E_PAL.gold : E_PAL.text }}>
            {s.name}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <GradeBadge grade={s.grade} size={torrents ? 42 : 30} />
          <span style={{ ...eStyles.display, fontSize: torrents ? (isMobile ? 30 : 40) : 24, color: sGrade ? E_PAL.gold : E_PAL.text }}>
            {s.score.toLocaleString()}
          </span>
        </div>
      </div>
      <div style={{ marginTop: torrents ? 12 : 9 }}>
        <TierBar stage={s.stage} score={s.score} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
        <FleetRow label="I" members={s.teamA} token={s.tokenA} icon={s.tokenAIcon} />
        <FleetRow label="II" members={s.teamB} token={s.tokenB} icon={s.tokenBIcon} />
      </div>
      {kicker && (
        <div style={{ marginTop: 9, ...eStyles.display, fontSize: torrents ? 14 : 12, letterSpacing: 0.4, color: sGrade ? E_PAL.gold : E_PAL.tide }}>
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

export function EmberlineWastes() {
  const { raw } = useData();
  const { isMobile, isTablet } = useDashboardViewport();
  const seasons = raw.whimperingWastes?.seasons ?? [];
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
                  background: E_PAL.panel,
                  border: `1px solid ${made ? "rgba(245,201,122,0.4)" : E_PAL.border}`,
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
                <StageCard key={x.stage} s={x} isMobile={isMobile} />
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
