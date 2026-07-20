/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  echoBuildOf,
  getResonatorOrFirstOf,
  rosterIndexOf,
  rosterNeighborsOf,
  signatureWeaponOf,
  useData,
} from "@/lib/data-context";
import { ELEMENTS, type ElementPalette } from "@/lib/elements";
import { highlightStats } from "@/lib/highlight";
import { isPercentStat, scoreBuild, scoreEcho } from "@/lib/echo-audit";
import type { EchoGrade, EchoVerdict } from "@/lib/echo-audit";
import {
  echoIcon,
  elementBadge,
  gradeIcon,
  statAbbrev,
  statIcon,
  FORTE_SLOTS,
  forteIcon,
  forteIconFallback,
  type ForteSlot,
} from "@/lib/game-icons";
import { fiveStarIcon, tallPortrait } from "@/lib/portraits";
import { rateResonator, type RatingSub } from "@/lib/resonator-rating";
import { resonatorPath } from "@/lib/route-name";
import { parseEchoSets, sonataIcon } from "@/lib/sonata";
import { useTheme } from "@/lib/theme-context";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import { weaponImage } from "@/lib/weapons";
import type { Echo, ResonatorForte, RosterEntry } from "@/lib/types";
import { E_PAL, E_STATUS, eStyles } from "./styles";
import { EDiamond, EFooter, EKicker } from "./primitives";
import { EmberlineTeamsPanels } from "./teams-panels";
import { EmberlineFlexCard } from "./flex-card";

// Element-tinted hairline rule for section titles.
function tintRule(el: ElementPalette) {
  return { flex: 1, height: 1, background: `linear-gradient(90deg, ${el.glow}, transparent)` } as const;
}

export function gradeColor(grade: EchoGrade, status: string): { color: string; textShadow?: string } {
  if (grade === "S" || grade === "SSS" || grade === "✦") {
    return { color: E_PAL.gold, textShadow: "0 0 10px rgba(245,201,122,0.5)" };
  }
  return { color: E_STATUS[status] ?? E_PAL.text };
}

// Panel shell shared by the three overview columns (6px radius per prototype).
function EPanel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        border: `1px solid ${E_PAL.border}`,
        borderRadius: 6,
        background: E_PAL.panel,
        padding: "16px 18px",
        alignSelf: "start",
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function EPanelTitle({
  title,
  el,
  right,
  extra,
}: {
  title: string;
  el: ElementPalette;
  right?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ ...eStyles.display, fontSize: 17, color: el.soft }}>{title}</span>
      {extra}
      <div style={tintRule(el)} />
      {right}
    </div>
  );
}

// Grade medal on a plate — the rating sub-scores wear the game's own
// settlement-screen letters (public/game/grades/, per-tier neon halo baked in).
// ✦ has no in-game art on purpose: the one tier the game can't award renders
// as our pink→gold sparkle. A missing sub (no echoes entered, no weapon)
// shows an em-dash plate rather than being hidden — absence is information.
export function EGradeMedal({ sub, accent }: { sub: RatingSub; accent: string }) {
  const icon = gradeIcon(sub.grade);
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        minWidth: 66,
        padding: "10px 10px 7px",
        borderRadius: 6,
        border: `1px solid ${E_PAL.borderSoft}`,
        background: "rgba(4,13,18,0.55)",
      }}
    >
      <EDiamond corner="tl" size={5} color={accent} />
      <div style={{ height: 30, display: "flex", alignItems: "center" }}>
        {icon ? (
          <img src={icon} alt={sub.grade} style={{ height: 30, width: "auto" }} />
        ) : sub.grade === "✦" ? (
          <span
            style={{
              ...eStyles.display,
              fontSize: 26,
              lineHeight: 1,
              background: `linear-gradient(180deg, #f9a8d4, ${E_PAL.gold})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 8px rgba(245,201,122,0.55))",
            }}
          >
            ✦
          </span>
        ) : (
          <span style={{ ...eStyles.display, fontSize: 22, color: E_PAL.textMute }}>—</span>
        )}
      </div>
      <EKicker size={8} spacing={1.5}>{sub.key.toUpperCase()}</EKicker>
      <span style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.textDim }}>
        {sub.score != null ? Math.round(sub.score) : "—"}
      </span>
    </div>
  );
}

// Forte icon with the repo fallback chain: per-char file → (basic only) shared
// per-weapon glyph → hide. Repo glyphs are white — ink them on light discs.
export function EForteIcon({
  r,
  slot,
  size,
  maxed,
}: {
  r: RosterEntry;
  slot: ForteSlot;
  size: number;
  maxed: boolean;
}) {
  // Callers key this component on the resonator name, so state resets by remount.
  const [src, setSrc] = useState(forteIcon(r.name, slot));
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <img
      src={src}
      alt={slot}
      onError={() => {
        const fb = forteIconFallback(slot, r.weaponType);
        if (fb && src !== fb) setSrc(fb);
        else setHidden(true);
      }}
      style={{
        width: size,
        height: size,
        filter: maxed ? "brightness(0) opacity(0.82)" : "opacity(0.85)",
      }}
    />
  );
}

const FORTE_ARC_LABEL: Record<ForteSlot, string> = {
  basic: "BASIC",
  skill: "SKILL",
  circuit: "FORTE CIRCUIT",
  liberation: "LIBERATION",
  intro: "INTRO",
};

// Disc positions along the arc: basic left-low, skill mid-left-high, circuit
// top-center (emphasized), liberation mid-right-high, intro right-low.
const FORTE_ARC_POS: Record<ForteSlot, React.CSSProperties> = {
  basic: { left: "6%", bottom: 6 },
  skill: { left: "26%", top: 26 },
  circuit: { left: "50%", top: 0, transform: "translateX(-50%)" },
  liberation: { right: "26%", top: 26 },
  intro: { right: "6%", bottom: 6 },
};

// `flow` swaps the absolute arc placement for an in-flow disc (mobile chain per
// 1c): position relative, no arc offset, and slightly smaller so 5 fit a phone
// row. The EForteIcon remount key is preserved on both layouts.
function EForteDisc({ r, slot, el, forte, flow = false }: { r: RosterEntry; slot: ForteSlot; el: ElementPalette; forte: ResonatorForte; flow?: boolean }) {
  const level = forte[slot];
  const maxed = level >= 10;
  const emphasized = slot === "circuit";
  const disc = flow ? (emphasized ? 50 : 44) : emphasized ? 60 : 52;
  const iconSize = flow ? (emphasized ? 30 : 26) : emphasized ? 36 : 30;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        ...(flow ? { position: "relative", flexShrink: 0 } : { position: "absolute", ...FORTE_ARC_POS[slot] }),
      }}
    >
      <div
        style={{
          width: disc,
          height: disc,
          borderRadius: 999,
          border: `1px solid ${maxed ? el.hex : "rgba(140,220,225,0.3)"}`,
          background: maxed ? `rgba(234,246,243,${emphasized ? 0.95 : 0.9})` : "rgba(140,220,225,0.08)",
          boxShadow: maxed ? `0 0 ${emphasized ? 20 : 14}px ${el.glow}` : undefined,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <EForteIcon key={`${r.name}-${slot}`} r={r} slot={slot} size={iconSize} maxed={maxed} />
      </div>
      <span style={{ ...eStyles.mono, fontSize: 10, color: maxed ? el.soft : E_PAL.yellow }}>
        {level}/10
      </span>
      <span style={{ ...eStyles.mono, fontSize: flow ? 7.5 : 8, letterSpacing: flow ? 0.5 : 1, color: E_PAL.textDim }}>
        {flow && slot === "circuit" ? "CIRCUIT" : FORTE_ARC_LABEL[slot]}
      </span>
    </div>
  );
}

function fortePriorityNotes(forte: ResonatorForte): string[] {
  const maxed = FORTE_SLOTS.filter((s) => forte[s.key] >= 10).map((s) => FORTE_ARC_LABEL[s.key]);
  const unmaxed = FORTE_SLOTS.filter((s) => forte[s.key] < 10).sort((a, b) => forte[b.key] - forte[a.key]);
  const notes: string[] = [];
  if (maxed.length) notes.push(`${maxed.join(" & ").toLowerCase()} maxed`);
  for (const s of unmaxed.slice(0, 2)) {
    notes.push(`${FORTE_ARC_LABEL[s.key].toLowerCase()} Lv.${forte[s.key]} → 10`);
  }
  return notes;
}

function EEchoRow({ echo, ev }: { echo: Echo; ev: EchoVerdict }) {
  const icon = echoIcon(echo.name);
  const gc = gradeColor(ev.grade, ev.status);
  const mainLine = `${echo.cost}C · ${echo.mainStat} ${echo.mainValue}${isPercentStat(echo.mainStat) ? "%" : ""}`;
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: 5,
        background: E_PAL.inset,
        border: `1px solid ${E_PAL.borderSoft}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {icon && (
          <img
            src={icon}
            alt={echo.name ?? ""}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            style={{ width: 34, height: 34, borderRadius: 4, objectFit: "cover", objectPosition: "center 20%" }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              ...eStyles.body,
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {echo.name || `${echo.cost}-cost echo`}
          </div>
          <div style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.textDim }}>{mainLine}</div>
        </div>
        <span style={{ ...eStyles.display, fontSize: 13, ...gc }}>{ev.grade}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", marginTop: 6, ...eStyles.mono, fontSize: 8.5 }}>
        {ev.substatVerdicts
          .filter((sv) => sv.stat)
          .map((sv, i) => (
            <span
              key={i}
              style={
                sv.dead
                  ? { color: E_PAL.textMute, textDecoration: "line-through" }
                  : { color: sv.quality >= 0.75 ? E_PAL.green : E_PAL.yellow }
              }
            >
              {statAbbrev(sv.stat)} {sv.value}
            </span>
          ))}
      </div>
    </div>
  );
}

// OVERVIEW and TEAMS are live; the rest of the strip is static chrome until
// their content exists (per the migration runway).
type LiveTab = "OVERVIEW" | "TEAMS";
const TAB_STRIP = ["OVERVIEW", "STATS", "FORTE", "ECHOES", "WEAPON", "TEAMS"] as const;
const LIVE_TABS: ReadonlySet<string> = new Set(["OVERVIEW", "TEAMS"]);

export function EmberlineResonator({ name }: { name: string }) {
  const { raw, roster, rosterByName } = useData();
  const { setLastResonator } = useTheme();
  const { isMobile, isTablet } = useDashboardViewport();
  const [tab, setTab] = useState<LiveTab>("OVERVIEW");
  const [flexOpen, setFlexOpen] = useState(false);

  const r = getResonatorOrFirstOf(rosterByName, roster, name);
  const el = ELEMENTS[r.element];
  const idx = Math.max(0, rosterIndexOf(roster, r.name));
  const { prev, next } = rosterNeighborsOf(roster, r.name);

  const sw = signatureWeaponOf(raw, r.weapon);
  const swHasDetail = Boolean(sw && (sw.passive || sw.synergy || sw.baseAtk || sw.mainStat));
  const echoBuild = echoBuildOf(raw, r.name);
  const echoVerdict = echoBuild ? scoreBuild(echoBuild.echoes, echoBuild.weights) : null;
  const gradedEchoes = echoBuild
    ? echoBuild.echoes
        .map((echo) => ({ echo, ev: scoreEcho(echo, echoBuild.weights) }))
        .filter((x) => x.ev.score != null)
    : [];
  const rating = rateResonator({
    sequence: r.sequence,
    weaponRank: r.weaponRank,
    hasWeapon: !!r.weapon,
    onSignature: !!sw && sw.wearer === r.name,
    stats: r.audit?.stats ?? [],
    echoScore: echoVerdict?.score ?? null,
  });

  const seqNum = parseInt(r.sequence.slice(1), 10) || 0;
  const sonatas = parseEchoSets(r.echoSet);
  const overallGc = echoVerdict ? gradeColor(echoVerdict.grade, echoVerdict.status) : null;
  const statusHex = E_STATUS[r.audit?.priorityStatus ?? "neutral"];

  useEffect(() => {
    setLastResonator(r.name);
  }, [r.name, setLastResonator]);

  return (
    <div style={{ ...eStyles.shell, minWidth: (isMobile || isTablet) ? 0 : 1280, background: E_PAL.bgGrad, display: "flex", flexDirection: "column" }}>
      {/* hero band */}
      <div
        style={{
          position: "relative",
          height: 420,
          overflow: "hidden",
          background: isMobile
            ? `radial-gradient(320px 260px at 50% 28%, ${el.glow}, transparent 65%), linear-gradient(180deg, rgba(140,220,225,0.05), transparent)`
            : `radial-gradient(1000px 460px at 78% 30%, ${el.glow}, transparent 62%), linear-gradient(180deg, rgba(140,220,225,0.05), transparent)`,
        }}
      >
        <img
          src={tallPortrait(r.name)}
          alt={r.name}
          style={{
            position: "absolute",
            ...(isMobile
              ? { left: "50%", transform: "translateX(-50%)", right: "auto", top: "auto", bottom: -16, height: "110%" }
              : { right: 110, top: 14, height: "172%" }),
            width: "auto",
            maxWidth: "none",
            filter: `drop-shadow(0 24px 50px ${el.glow})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isMobile
              ? "linear-gradient(180deg, transparent 55%, rgba(5,15,21,0.95) 88%)"
              : "linear-gradient(90deg, rgba(5,15,21,0.9) 34%, transparent 66%), linear-gradient(0deg, rgba(5,15,21,0.95) 4%, transparent 34%)",
          }}
        />

        {/* mobile: element badge lifts to a top-right circle */}
        {isMobile && (
          <div
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              zIndex: 4,
              width: 46,
              height: 46,
              borderRadius: 999,
              border: `1px solid ${el.hex}`,
              background: "rgba(4,13,18,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 14px ${el.glow}`,
            }}
          >
            <img src={elementBadge(r.element)} alt={r.element} style={{ width: 34, height: 34 }} />
          </div>
        )}

        {/* mobile: RATING plate top-left (the big grade lives here, not in a bottom block) */}
        {isMobile && rating.score != null && (
          <div
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              zIndex: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              border: "1px solid rgba(245,201,122,0.4)",
              borderRadius: 8,
              padding: "6px 10px",
              background: "rgba(4,13,18,0.55)",
            }}
          >
            <div style={{ ...eStyles.display, fontSize: 26, lineHeight: 1, color: E_PAL.gold, textShadow: "0 0 14px rgba(245,201,122,0.55)" }}>
              {rating.grade}
            </div>
            <EKicker size={7} spacing={1.5} color={E_PAL.textDim}>RATING</EKicker>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            zIndex: 4,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            ...(isMobile
              ? { left: 16, right: 16, bottom: 16, alignItems: "center", textAlign: "center" }
              : { left: 34, bottom: 28, maxWidth: 640 }),
          }}
        >
          <EKicker spacing={isMobile ? 2 : 3} size={isMobile ? 8 : 10}>
            № {String(idx + 1).padStart(2, "0")} / {roster.length} · RESONATOR CODEX
          </EKicker>
          {isMobile ? (
            <div style={{ ...eStyles.display, fontSize: 40, lineHeight: 0.98, letterSpacing: 1 }}>{r.name}</div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ ...eStyles.display, fontSize: 80, lineHeight: 0.95, letterSpacing: 1 }}>{r.name}</div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  border: `1px solid ${el.hex}`,
                  background: "rgba(4,13,18,0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 18px ${el.glow}`,
                  flexShrink: 0,
                }}
              >
                <img src={elementBadge(r.element)} alt={r.element} style={{ width: 42, height: 42 }} />
              </div>
            </div>
          )}
          {isMobile ? (
            <img src={fiveStarIcon()} alt="5★" style={{ height: 13, width: "auto" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={fiveStarIcon()} alt="5★" style={{ height: 14, width: "auto" }} />
              {r.audit?.notes && (
                <span style={{ ...eStyles.body, fontSize: 14, fontStyle: "italic", color: E_PAL.textDim }}>
                  — {r.audit.notes}
                </span>
              )}
            </div>
          )}
          {isMobile ? (
            <div style={{ ...eStyles.mono, fontSize: 9, letterSpacing: 2, color: E_PAL.textDim }}>
              {r.role.toUpperCase()} · {r.element.toUpperCase()} · {r.sequence} · LV.{r.level}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                ...eStyles.mono,
                fontSize: 10,
                letterSpacing: 1,
              }}
            >
              {[r.role.toUpperCase(), r.weaponType.toUpperCase()].map((chip) => (
                <span key={chip} style={{ padding: "4px 12px", border: `1px solid ${E_PAL.borderStrong}`, borderRadius: 4, color: E_PAL.textDim }}>
                  {chip}
                </span>
              ))}
              <span style={{ padding: "4px 12px", border: `1px solid ${el.hex}`, borderRadius: 4, color: el.soft }}>
                {r.sequence}
              </span>
              <span style={{ padding: "4px 12px", border: `1px solid ${E_PAL.borderStrong}`, borderRadius: 4, color: E_PAL.textDim }}>
                LV.{r.level}
              </span>
              {r.audit?.buildType && (
                <span style={{ padding: "4px 12px", border: `1px solid ${E_PAL.borderStrong}`, borderRadius: 4, color: E_PAL.textDim }}>
                  {r.audit.buildType.toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>

        {!isMobile && rating.score != null && (
          <div
            style={{
              position: "absolute",
              right: 34,
              bottom: 28,
              zIndex: 4,
              display: "flex",
              alignItems: "flex-end",
              gap: 9,
            }}
          >
            {rating.subs.map((sub) => (
              <EGradeMedal key={sub.key} sub={sub} accent={el.hex} />
            ))}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                marginLeft: 10,
              }}
            >
              <div style={{ ...eStyles.display, fontSize: 64, lineHeight: 1, color: E_PAL.gold, textShadow: "0 0 28px rgba(245,201,122,0.6)" }}>
                {rating.grade}
              </div>
              <EKicker size={9} spacing={2} color={E_PAL.textDim}>
                PROFICIENCY · {Math.round(rating.score)}
              </EKicker>
            </div>
          </div>
        )}
      </div>

      {/* tab strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isTablet ? 18 : 34,
          padding: isMobile ? "0 16px" : "0 34px",
          borderBottom: `1px solid ${E_PAL.border}`,
          ...(isTablet && { overflowX: "auto", scrollbarWidth: "none" }),
          ...eStyles.mono,
          fontSize: 10,
          letterSpacing: 2,
        }}
      >
        {TAB_STRIP.map((t) => {
          const live = LIVE_TABS.has(t);
          const active = tab === t;
          return (
            <span
              key={t}
              onClick={live ? () => setTab(t as LiveTab) : undefined}
              style={{
                padding: "13px 2px",
                color: active ? el.hex : E_PAL.textMute,
                borderBottom: active ? `2px solid ${el.hex}` : "2px solid transparent",
                cursor: live ? "pointer" : "default",
                userSelect: "none",
                ...(isTablet && { flexShrink: 0, whiteSpace: "nowrap" }),
              }}
            >
              {t}
            </span>
          );
        })}
        {!isTablet && <div style={{ flex: 1 }} />}
        {!isMobile && (
          <span
            onClick={() => setFlexOpen(true)}
            style={{
              padding: "4px 12px",
              border: `1px solid ${el.hex}66`,
              borderRadius: 4,
              background: "rgba(140,220,225,0.05)",
              color: el.soft,
              cursor: "pointer",
              userSelect: "none",
              ...(isTablet && { flexShrink: 0, whiteSpace: "nowrap" }),
            }}
          >
            ✦ FLEX CARD
          </span>
        )}
        {prev && (
          <Link
            href={resonatorPath(prev.name)}
            style={{ color: E_PAL.textMute, textDecoration: "none", ...(isTablet && { flexShrink: 0 }) }}
          >
            {isTablet ? "←" : `← ${prev.name.toUpperCase()}`}
          </Link>
        )}
        {next && (
          <Link
            href={resonatorPath(next.name)}
            style={{ color: E_PAL.textMute, textDecoration: "none", ...(isTablet && { flexShrink: 0 }) }}
          >
            {isTablet ? "→" : `${next.name.toUpperCase()} →`}
          </Link>
        )}
        {!isTablet && (
          <span style={{ color: E_PAL.textFaint }}>
            SEQ {r.sequence} {"◆".repeat(seqNum)}{"◇".repeat(Math.max(0, 6 - seqNum))}
          </span>
        )}
      </div>

      {/* TEAMS tab — Codex-built panels (teams-panels.tsx) */}
      {tab === "TEAMS" && (
        <div style={{ padding: isMobile ? "18px 16px 10px" : "22px 34px 10px", flex: 1 }}>
          <EmberlineTeamsPanels name={r.name} />
        </div>
      )}

      {/* content grid */}
      {tab === "OVERVIEW" && (
      <>
      {/* mobile: the 4 sub-medals leave the hero and sit under the tab strip */}
      {isMobile && rating.score != null && (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 9, padding: "16px 16px 0" }}>
          {rating.subs.map((sub) => (
            <EGradeMedal key={sub.key} sub={sub} accent={el.hex} />
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "400px 1fr 360px", gap: 18, padding: isMobile ? "18px 16px 10px" : "22px 34px 10px", flex: 1 }}>
        {/* stats + weapon column */}
        <EPanel>
          <EPanelTitle
            title="Stat Audit"
            el={el}
            right={
              <span style={{ ...eStyles.mono, fontSize: 9, color: statusHex }}>
                ● {(r.audit?.priorityStatus ?? "neutral").toUpperCase()}
              </span>
            }
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
            {(r.audit?.stats ?? []).map((s) => {
              const num = parseFloat(String(s.current).replace(/[,%]/g, "")) || 0;
              const ceiling = s.max || (s.min || 1) * 1.4;
              const pct = Math.min(100, (num / ceiling) * 100);
              const hex = E_STATUS[s._status] ?? E_PAL.text;
              const glyph = statIcon(s.label);
              return (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  {glyph && (
                    <img
                      src={glyph}
                      alt=""
                      onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
                      style={{ width: 15, height: 15 }}
                    />
                  )}
                  <span style={{ ...eStyles.mono, fontSize: 10, color: E_PAL.textDim, width: 26 }}>{s.label}</span>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: E_PAL.trackStrong, position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${pct}%`,
                        borderRadius: 2,
                        background: hex,
                      }}
                    />
                  </div>
                  <span style={{ ...eStyles.mono, fontSize: 12, color: hex, width: 52, textAlign: "right" }}>{s.current}</span>
                  <span style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.textMute, width: 78, textAlign: "right" }}>{s.optimal}</span>
                </div>
              );
            })}
          </div>

          {r.weapon && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 10px" }}>
                <span style={{ ...eStyles.display, fontSize: 17, color: el.soft }}>Signature Weapon</span>
                <div style={tintRule(el)} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 5,
                    border: "1px solid rgba(140,220,225,0.18)",
                    background: `radial-gradient(40px 40px at 50% 40%, ${el.glow}, rgba(4,13,18,0.6))`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={weaponImage(r.weapon)}
                    alt={r.weapon}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    style={{ width: 48, height: 48, objectFit: "contain" }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ ...eStyles.display, fontSize: 16, lineHeight: 1.15 }}>{r.weapon}</div>
                  <div style={{ ...eStyles.mono, fontSize: 10, color: E_PAL.textDim, marginTop: 3 }}>
                    {r.weaponType.toUpperCase()} · {r.weaponRank}
                    {r.level > 0 ? ` · LV.${r.level}` : ""}
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                {sonatas.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {sonatas.map((s) => (
                      <span key={s.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <img
                          src={sonataIcon(s.name)}
                          alt={s.name}
                          title={s.name}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          style={{ width: 30, height: 30 }}
                        />
                        <span style={{ ...eStyles.mono, fontSize: 9, color: el.soft }}>
                          {s.pieces ? `${s.pieces}/5` : ""}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {(sw?.baseAtk || sw?.mainStat) && (
                <div style={{ display: "flex", gap: 28, marginTop: 13 }}>
                  {sw?.baseAtk && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ ...eStyles.mono, fontSize: 9, letterSpacing: 1.5, color: E_PAL.textMute }}>BASE ATK</span>
                      <span style={{ ...eStyles.mono, fontSize: 16, color: el.soft }}>{sw.baseAtk}</span>
                    </div>
                  )}
                  {sw?.mainStat && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ ...eStyles.mono, fontSize: 9, letterSpacing: 1.5, color: E_PAL.textMute }}>{sw.mainStat.toUpperCase()}</span>
                      <span style={{ ...eStyles.mono, fontSize: 16, color: el.soft }}>{sw.mainStatValue || "—"}</span>
                    </div>
                  )}
                </div>
              )}
              {sw?.passive && (
                <div
                  style={{
                    marginTop: 13,
                    padding: "11px 13px",
                    borderRadius: 5,
                    background: E_PAL.inset,
                    border: `1px solid ${E_PAL.borderSoft}`,
                  }}
                >
                  <div style={{ ...eStyles.mono, fontSize: 9, letterSpacing: 2, color: E_PAL.textMute }}>PASSIVE</div>
                  {sw.passiveName && (
                    <div style={{ ...eStyles.display, fontSize: 16, color: el.soft, marginTop: 3, lineHeight: 1.15 }}>
                      {sw.passiveName}
                    </div>
                  )}
                  <div style={{ ...eStyles.body, fontSize: 12.5, marginTop: 6, lineHeight: 1.6, color: E_PAL.textDim }}>
                    {highlightStats(sw.passive, { ...eStyles.mono, color: el.soft, fontWeight: 600 })}
                  </div>
                </div>
              )}
              {sw?.synergy && (
                <div style={{ marginTop: 13, borderLeft: `2px solid ${el.hex}`, paddingLeft: 12 }}>
                  <div style={{ ...eStyles.mono, fontSize: 9, letterSpacing: 2, color: el.soft }}>WHY IT&apos;S CRACKED</div>
                  <div style={{ ...eStyles.body, fontSize: 12.5, marginTop: 5, lineHeight: 1.6, color: E_PAL.text, fontStyle: "italic" }}>
                    {highlightStats(sw.synergy, { ...eStyles.mono, color: el.soft, fontWeight: 600, fontStyle: "normal" })}
                  </div>
                </div>
              )}
              {!swHasDetail && (
                <div style={{ ...eStyles.mono, marginTop: 12, fontSize: 9, letterSpacing: 1.5, color: E_PAL.textFaint }}>
                  PASSIVE &amp; SYNERGY NOT DOCUMENTED — `npm run update -- sigweapon`
                </div>
              )}
            </>
          )}
        </EPanel>

        {/* forte arc panel */}
        {r.forte ? (
          <EPanel style={{ position: "relative", overflow: "hidden" }}>
            <EPanelTitle
              title="Forte · Skill Upgrade Priority"
              el={el}
              right={
                <span style={{ ...eStyles.mono, fontSize: 9, color: el.soft }}>
                  {r.forte.nodes}/8 NODES
                </span>
              }
            />
            {!isMobile && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 88,
                  transform: "translateX(-50%)",
                  width: 420,
                  height: 300,
                  border: "1px solid rgba(140,220,225,0.14)",
                  borderRadius: "50%",
                  pointerEvents: "none",
                }}
              />
            )}
            {isMobile ? (
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px 8px", marginTop: 14 }}>
                {FORTE_SLOTS.map((s) => (
                  <EForteDisc key={s.key} r={r} slot={s.key} el={el} forte={r.forte!} flow />
                ))}
              </div>
            ) : (
              <div style={{ position: "relative", height: 196, marginTop: 10 }}>
                {FORTE_SLOTS.map((s) => (
                  <EForteDisc key={s.key} r={r} slot={s.key} el={el} forte={r.forte!} />
                ))}
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: isMobile ? "wrap" : undefined,
                borderTop: "1px solid rgba(140,220,225,0.1)",
                paddingTop: 11,
                marginTop: isMobile ? 14 : 0,
                ...eStyles.mono,
                fontSize: 9,
                letterSpacing: 1,
                color: E_PAL.textDim,
              }}
            >
              {fortePriorityNotes(r.forte).map((note, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: el.soft }}>✦</span>
                  <span>{note}</span>
                </span>
              ))}
            </div>
          </EPanel>
        ) : (
          <EPanel style={{ display: "flex", flexDirection: "column" }}>
            <EPanelTitle title="Forte · Skill Upgrade Priority" el={el} />
            <div
              style={{
                flex: 1,
                minHeight: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...eStyles.mono,
                fontSize: 10,
                letterSpacing: 2,
                color: E_PAL.textFaint,
              }}
            >
              FORTE DATA NOT ENTERED — `npm run update -- forte`
            </div>
          </EPanel>
        )}

        {/* echoes column */}
        <EPanel>
          <EPanelTitle
            title="Echo Audit"
            el={el}
            extra={
              echoVerdict && echoVerdict.score != null ? (
                <span
                  style={{
                    ...eStyles.display,
                    fontSize: 14,
                    ...overallGc,
                    border: `1px solid ${(overallGc?.color ?? E_PAL.green)}80`,
                    borderRadius: 5,
                    padding: "1px 7px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {echoVerdict.grade} · {Math.round(echoVerdict.score)}
                </span>
              ) : undefined
            }
            right={
              sonatas.length > 0 ? (
                <img
                  src={sonataIcon(sonatas[0].name)}
                  alt={sonatas[0].name}
                  title={sonatas[0].name}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  style={{ width: 18, height: 18 }}
                />
              ) : undefined
            }
          />
          {echoVerdict && (
            <div style={{ ...eStyles.body, fontSize: 11, fontStyle: "italic", color: E_PAL.textDim, margin: "4px 0 11px" }}>
              {echoVerdict.headline}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {gradedEchoes.length > 0 ? (
              gradedEchoes.map(({ echo, ev }, i) => <EEchoRow key={i} echo={echo} ev={ev} />)
            ) : (
              <div style={{ ...eStyles.mono, fontSize: 10, letterSpacing: 2, color: E_PAL.textFaint, padding: "30px 0", textAlign: "center" }}>
                NO ECHOES ENTERED
              </div>
            )}
          </div>
        </EPanel>
      </div>
      </>
      )}

      <EFooter factoid="STAT GRADE ONLY — SET BONUS NOT SCORED" updated={raw.meta.updated} />

      {flexOpen && (
        <EmberlineFlexCard
          r={r}
          sw={sw}
          echoBuild={echoBuild}
          rating={rating}
          stats={r.audit?.stats ?? []}
          idx={idx}
          total={roster.length}
          onClose={() => setFlexOpen(false)}
        />
      )}
    </div>
  );
}
