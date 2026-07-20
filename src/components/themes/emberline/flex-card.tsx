/* eslint-disable @next/next/no-img-element */
"use client";

// The FLEX card, Emberline edition — a fixed 1520×880 shareable build card
// composed in the theme's own language (abyssal wash, hero-band portrait bleed,
// grade medals on plates, corner diamonds), snapshotted client-side with
// html-to-image. Static-export safe: no server, same-origin assets only.

import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { ELEMENTS, type ElementPalette } from "@/lib/elements";
import { splashArt, tallPortrait } from "@/lib/portraits";
import {
  echoIcon,
  elementBadge,
  statAbbrev,
  statIcon,
  FORTE_SLOTS,
  type ForteSlot,
} from "@/lib/game-icons";
import { weaponImage } from "@/lib/weapons";
import { parseEchoSets, sonataIcon } from "@/lib/sonata";
import { isPercentStat, scoreBuild, scoreEcho } from "@/lib/echo-audit";
import type { EchoVerdict } from "@/lib/echo-audit";
import type { rateResonator } from "@/lib/resonator-rating";
import type { AuditStat, Echo, EchoBuild, RosterEntry, SignatureWeapon } from "@/lib/types";
import { E_PAL, E_STATUS, eStyles } from "./styles";
import { EDiamond, EKicker, ERarityPips } from "./primitives";
// Shared privates exported from resonator.tsx (same pattern obsidian uses) —
// the card must wear the exact same medals/icons as the live page.
import { EGradeMedal, EForteIcon, gradeColor } from "./resonator";

const CARD_W = 1520;
const CARD_H = 880;

function tintRule(el: ElementPalette) {
  return { flex: 1, height: 1, background: `linear-gradient(90deg, ${el.glow}, transparent)` } as const;
}

function EFlexTitle({ title, el, right }: { title: string; el: ElementPalette; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ ...eStyles.display, fontSize: 15, color: el.soft }}>{title}</span>
      <div style={tintRule(el)} />
      {right}
    </div>
  );
}

// Sequence chain in the theme's own ornament — six rotated squares, lit in the
// element tint. (The page renders this as ◆◇ text in the tab strip; the card
// gets the real geometry.)
function EFlexSeqChain({ sequence, el }: { sequence: string; el: ElementPalette }) {
  const owned = parseInt(sequence.slice(1), 10) || 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ ...eStyles.mono, fontSize: 11, color: owned === 6 ? el.soft : E_PAL.textDim }}>{sequence}</span>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <span
          key={n}
          style={{
            width: 7,
            height: 7,
            transform: "rotate(45deg)",
            background: n <= owned ? el.hex : "transparent",
            border: `1px solid ${n <= owned ? el.hex : E_PAL.borderStrong}`,
            boxShadow: n <= owned ? `0 0 6px ${el.glow}` : "none",
            flexShrink: 0,
          }}
        />
      ))}
    </span>
  );
}

// Compact forte disc for the card — same maxed treatment as the page's arc
// (light disc, inked glyph, element ring + glow), laid out in a row.
function EFlexForteDisc({ r, slot, label, el }: { r: RosterEntry; slot: ForteSlot; label: string; el: ElementPalette }) {
  const level = r.forte![slot];
  const maxed = level >= 10;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 0 }}>
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: 999,
          border: `1px solid ${maxed ? el.hex : "rgba(140,220,225,0.3)"}`,
          background: maxed ? "rgba(234,246,243,0.92)" : "rgba(140,220,225,0.08)",
          boxShadow: maxed ? `0 0 14px ${el.glow}` : undefined,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <EForteIcon key={`${r.name}-${slot}`} r={r} slot={slot} size={28} maxed={maxed} />
      </div>
      <span style={{ ...eStyles.mono, fontSize: 9, color: maxed ? el.soft : E_PAL.yellow }}>{level}/10</span>
      <span style={{ ...eStyles.mono, fontSize: 7, letterSpacing: 0.8, color: E_PAL.textDim }}>{label}</span>
    </div>
  );
}

const FORTE_SHORT: Record<ForteSlot, string> = {
  basic: "BASIC",
  skill: "SKILL",
  circuit: "CIRCUIT",
  liberation: "LIB",
  intro: "INTRO",
};

// One echo tile: monster-portrait band (cost chip + per-slot sonata icon),
// then the same graded readout as the page's EEchoRow.
function EFlexEchoTile({ echo, ev, el }: { echo: Echo; ev: EchoVerdict; el: ElementPalette }) {
  const face = echoIcon(echo.name);
  const gc = gradeColor(ev.grade, ev.status);
  const mainGlyph = statIcon(echo.mainStat);
  const sonata = echo.sonata ? sonataIcon(echo.sonata) : null;
  return (
    <div
      style={{
        border: `1px solid ${E_PAL.borderSoft}`,
        borderRadius: 6,
        background: E_PAL.inset,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      {/* portrait band */}
      <div style={{ position: "relative", height: 58, background: `linear-gradient(160deg, ${el.glow}, rgba(4,13,18,0.25) 70%)`, flexShrink: 0 }}>
        {face && (
          <img
            src={face}
            alt={echo.name ?? ""}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 18%" }}
          />
        )}
        <span
          style={{
            ...eStyles.mono,
            position: "absolute",
            top: 6,
            left: 6,
            fontSize: 8,
            padding: "1px 5px",
            borderRadius: 3,
            background: "rgba(4,13,18,0.8)",
            border: `1px solid ${E_PAL.borderSoft}`,
            color: E_PAL.textDim,
          }}
        >
          {echo.cost}C
        </span>
        {sonata && (
          <img
            src={sonata}
            alt={echo.sonata ?? ""}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            style={{ position: "absolute", top: 5, right: 5, width: 18, height: 18 }}
          />
        )}
      </div>
      {/* graded readout */}
      <div style={{ padding: "7px 9px 9px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...eStyles.body, fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
            {echo.name || `${echo.cost}-cost echo`}
          </span>
          <span style={{ ...eStyles.display, fontSize: 12, ...gc }}>{ev.grade}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {mainGlyph && (
            <img
              src={mainGlyph}
              alt=""
              onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
              style={{ width: 11, height: 11 }}
            />
          )}
          <span style={{ ...eStyles.mono, fontSize: 8.5, color: el.soft }}>
            {statAbbrev(echo.mainStat)} {echo.mainValue}{isPercentStat(echo.mainStat) ? "%" : ""}
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 8px", ...eStyles.mono, fontSize: 7.5 }}>
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
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: "relative",
  border: `1px solid ${E_PAL.border}`,
  borderRadius: 6,
  background: "rgba(4,12,17,0.82)",
  padding: "13px 15px",
  minWidth: 0,
};

// Official splash art as the vanity canvas. The splashes are composed
// medallion pieces (sun disc, moon, orrery) over transparency — cropping a
// wide band out of them kills the composition, so the piece renders WHOLE:
// contain-by-height, right-anchored, element-glow drop shadow, with a
// blurred+dimmed copy of itself washing the zone behind it. Falls back to
// the tall-sprite cut-out when a resonator's splash isn't in public/splash/
// yet (new adds land art-less until the wiki rip). Callers key this per
// resonator so the failed state resets by remount.
function EFlexArt({ r, el }: { r: RosterEntry; el: ElementPalette }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <img
        src={tallPortrait(r.name)}
        alt={r.name}
        style={{
          position: "absolute",
          right: 140,
          bottom: 0,
          height: "126%",
          width: "auto",
          maxWidth: "none",
          filter: `drop-shadow(0 24px 50px ${el.glow})`,
        }}
      />
    );
  }
  const src = splashArt(r.name);
  return (
    <>
      {/* ambiance backdrop — the art's own palette washed across the zone */}
      <img
        src={src}
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          right: -160,
          top: "50%",
          transform: "translateY(-50%)",
          height: "230%",
          width: "auto",
          maxWidth: "none",
          filter: "blur(30px) saturate(1.2)",
          opacity: 0.3,
        }}
      />
      {/* scrims: left for panel readability, top to blend under the header */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(5,15,21,0.85) 28%, transparent 55%), linear-gradient(180deg, rgba(5,15,21,0.7), transparent 18%)",
        }}
      />
      {/* the piece itself, whole, right-anchored */}
      <img
        src={src}
        alt={r.name}
        onError={() => setFailed(true)}
        style={{
          position: "absolute",
          right: 44,
          bottom: 2,
          height: "104%",
          width: "auto",
          maxWidth: "none",
          filter: `drop-shadow(0 18px 44px ${el.glow})`,
        }}
      />
    </>
  );
}

export function EmberlineFlexCard({
  r, sw, echoBuild, rating, stats, idx, total, onClose,
}: {
  r: RosterEntry;
  sw: SignatureWeapon | undefined;
  echoBuild: EchoBuild | undefined;
  rating: ReturnType<typeof rateResonator>;
  stats: AuditStat[];
  idx: number;
  total: number;
  onClose: () => void;
}) {
  const node = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerWidth - 64) / CARD_W, (window.innerHeight - 150) / CARD_H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const el = ELEMENTS[r.element];
  const statusHex = E_STATUS[r.audit?.priorityStatus ?? "neutral"];
  const sonatas = parseEchoSets(r.echoSet);
  const echoVerdict = echoBuild ? scoreBuild(echoBuild.echoes, echoBuild.weights) : null;
  const overallGc = echoVerdict && echoVerdict.score != null ? gradeColor(echoVerdict.grade, echoVerdict.status) : null;
  const gradedEchoes = echoBuild
    ? echoBuild.echoes.map((echo) => ({ echo, ev: scoreEcho(echo, echoBuild.weights) })).filter((x) => x.ev.score != null)
    : [];

  const download = useCallback(async () => {
    if (!node.current || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const png = await toPng(node.current, {
        pixelRatio: 2,
        backgroundColor: E_PAL.bg,
        width: CARD_W,
        height: CARD_H,
      });
      const a = document.createElement("a");
      a.href = png;
      a.download = `${r.name.toLowerCase().replace(/\s+/g, "-")}-flex.png`;
      a.click();
    } catch {
      // html-to-image chokes on Firefox — the snapshot path is Chromium-happy.
      setErr("EXPORT FAILED — TRY A CHROMIUM BROWSER");
    } finally {
      setBusy(false);
    }
  }, [busy, r.name]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(3,9,12,0.9)",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div style={{ width: CARD_W * scale, height: CARD_H * scale, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {/* ── the card itself ── */}
          <div
            ref={node}
            style={{
              position: "relative",
              width: CARD_W,
              height: CARD_H,
              background: `radial-gradient(950px 520px at 74% 24%, ${el.glow}, transparent 62%), ${E_PAL.bgGrad}`,
              border: `1px solid ${E_PAL.borderStrong}`,
              borderRadius: 8,
              overflow: "hidden",
              color: E_PAL.text,
              ...eStyles.body,
              display: "flex",
              flexDirection: "column",
              padding: "22px 28px 16px",
              gap: 14,
            }}
          >
            {/* header */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <EDiamond color={el.hex} />
                <EKicker spacing={3}>
                  № {String(idx + 1).padStart(2, "0")} / {total} · RESONATOR CODEX
                </EKicker>
                <div style={tintRule(el)} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ ...eStyles.display, fontSize: 54, lineHeight: 0.95, letterSpacing: 1 }}>{r.name}</div>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 999,
                    border: `1px solid ${el.hex}`,
                    background: "rgba(4,13,18,0.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 16px ${el.glow}`,
                    flexShrink: 0,
                  }}
                >
                  <img src={elementBadge(r.element)} alt={r.element} style={{ width: 34, height: 34 }} />
                </div>
                <EFlexSeqChain sequence={r.sequence} el={el} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ERarityPips rarity={r.rarity} height={12} />
                {r.audit?.notes && (
                  <span style={{ ...eStyles.body, fontSize: 13, fontStyle: "italic", color: E_PAL.textDim }}>— {r.audit.notes}</span>
                )}
                <span style={{ ...eStyles.mono, fontSize: 9, letterSpacing: 1, color: E_PAL.textMute }}>
                  {r.role.toUpperCase()} · {r.weaponType.toUpperCase()} · LV.{r.level}
                  {r.audit?.buildType ? ` · ${r.audit.buildType.toUpperCase()}` : ""}
                </span>
              </div>
            </div>

            {/* top region: panels left, portrait bleed right */}
            <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
              <EFlexArt key={r.name} r={r} el={el} />
              {/* bottom scrim — the portrait's feet fade before the echo band */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -1,
                  height: 120,
                  background: "linear-gradient(0deg, rgba(5,15,21,0.92), transparent)",
                }}
              />

              <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 12, width: 400 }}>
                {/* stats + weapon panel */}
                <div style={panelStyle}>
                  <EDiamond corner="tl" size={5} color={el.hex} />
                  <EFlexTitle
                    title="Stat Audit"
                    el={el}
                    right={
                      <span style={{ ...eStyles.mono, fontSize: 8.5, color: statusHex }}>
                        ● {(r.audit?.priorityStatus ?? "neutral").toUpperCase()}
                      </span>
                    }
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 11 }}>
                    {stats.map((s) => {
                      const num = parseFloat(String(s.current).replace(/[,%]/g, "")) || 0;
                      const ceiling = s.max || (s.min || 1) * 1.4;
                      const pct = Math.min(100, (num / ceiling) * 100);
                      const hex = E_STATUS[s._status] ?? E_PAL.text;
                      const glyph = statIcon(s.label);
                      return (
                        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {glyph && (
                            <img
                              src={glyph}
                              alt=""
                              onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
                              style={{ width: 14, height: 14 }}
                            />
                          )}
                          <span style={{ ...eStyles.mono, fontSize: 9.5, color: E_PAL.textDim, width: 26 }}>{s.label}</span>
                          <div style={{ flex: 1, height: 3, borderRadius: 2, background: E_PAL.trackStrong, position: "relative" }}>
                            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, borderRadius: 2, background: hex }} />
                          </div>
                          <span style={{ ...eStyles.mono, fontSize: 11, color: hex, width: 50, textAlign: "right" }}>{s.current}</span>
                          <span style={{ ...eStyles.mono, fontSize: 8.5, color: E_PAL.textMute, width: 72, textAlign: "right" }}>{s.optimal}</span>
                        </div>
                      );
                    })}
                  </div>

                  {r.weapon && (
                    <>
                      <div style={{ marginTop: 14, marginBottom: 10 }}>
                        <EFlexTitle title={sw?.isSignature === false ? "Equipped Weapon" : "Signature Weapon"} el={el} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 5,
                            border: "1px solid rgba(140,220,225,0.18)",
                            background: `radial-gradient(36px 36px at 50% 40%, ${el.glow}, rgba(4,13,18,0.6))`,
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
                            style={{ width: 44, height: 44, objectFit: "contain" }}
                          />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ ...eStyles.display, fontSize: 15, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {r.weapon}
                          </div>
                          <div style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.textDim, marginTop: 3 }}>
                            {r.weaponRank}
                            {sw?.baseAtk ? ` · ATK ${sw.baseAtk}` : ""}
                            {sw?.mainStat ? ` · ${sw.mainStat.toUpperCase()} ${sw.mainStatValue}` : ""}
                          </div>
                          {sw?.passiveName && (
                            <div style={{ ...eStyles.display, fontSize: 12.5, color: el.soft, marginTop: 3 }}>{sw.passiveName}</div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* forte + sonata panel */}
                <div style={panelStyle}>
                  <EDiamond corner="tl" size={5} color={el.hex} />
                  {r.forte ? (
                    <>
                      <EFlexTitle
                        title="Forte"
                        el={el}
                        right={
                          <span style={{ ...eStyles.mono, fontSize: 8.5, color: r.forte.nodes >= 8 ? el.soft : E_PAL.textMute }}>
                            {r.forte.nodes}/8 NODES
                          </span>
                        }
                      />
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 7, marginTop: 13 }}>
                        {FORTE_SLOTS.map(({ key }) => (
                          <EFlexForteDisc key={key} r={r} slot={key} label={FORTE_SHORT[key]} el={el} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <EFlexTitle title="Forte" el={el} />
                      <div style={{ ...eStyles.mono, fontSize: 9, letterSpacing: 2, color: E_PAL.textFaint, textAlign: "center", padding: "38px 0" }}>
                        FORTE DATA NOT ENTERED
                      </div>
                    </>
                  )}

                  {sonatas.length > 0 && (
                    <>
                      <div style={{ marginTop: 14, marginBottom: 10 }}>
                        <EFlexTitle title="Sonata Resonance" el={el} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        {sonatas.map((s) => (
                          <span key={s.name} style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                            <img
                              src={sonataIcon(s.name)}
                              alt={s.name}
                              title={s.name}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              style={{ width: 26, height: 26, flexShrink: 0 }}
                            />
                            <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                              <span style={{ ...eStyles.body, fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {s.name}
                              </span>
                              {s.pieces ? (
                                <span style={{ ...eStyles.mono, fontSize: 8.5, color: el.soft }}>{s.pieces}/5</span>
                              ) : null}
                            </span>
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* rating cluster — hero-band language, over the scrim */}
              {rating.score != null && (
                <div style={{ position: "absolute", right: 10, bottom: 6, zIndex: 3, display: "flex", alignItems: "flex-end", gap: 9 }}>
                  {rating.subs.map((sub) => (
                    <EGradeMedal key={sub.key} sub={sub} accent={el.hex} />
                  ))}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, marginLeft: 10 }}>
                    <div style={{ ...eStyles.display, fontSize: 56, lineHeight: 1, color: E_PAL.gold, textShadow: "0 0 26px rgba(245,201,122,0.6)" }}>
                      {rating.grade}
                    </div>
                    <EKicker size={8.5} spacing={2} color={E_PAL.textDim}>
                      PROFICIENCY · {Math.round(rating.score)}
                    </EKicker>
                    <EKicker size={7} spacing={1.2} color={E_PAL.textMute}>
                      ECHO 35 · STATS 35 · SIG 15 · SEQ 15
                    </EKicker>
                  </div>
                </div>
              )}
            </div>

            {/* echo band */}
            {echoVerdict && echoVerdict.score != null && gradedEchoes.length > 0 && (
              <div style={{ display: "flex", gap: 10, alignItems: "stretch", flexShrink: 0 }}>
                <div
                  style={{
                    ...panelStyle,
                    width: 118,
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                >
                  <EDiamond corner="tl" size={5} color={el.hex} />
                  <span style={{ ...eStyles.display, fontSize: 30, lineHeight: 1, ...overallGc }}>{echoVerdict.grade}</span>
                  <span style={{ ...eStyles.mono, fontSize: 10, color: overallGc?.color }}>{Math.round(echoVerdict.score)}</span>
                  <EKicker size={7.5} spacing={1.5} style={{ textAlign: "center" }}>
                    ECHO AUDIT
                  </EKicker>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, flex: 1, minWidth: 0 }}>
                  {gradedEchoes.slice(0, 5).map(({ echo, ev }, i) => (
                    <EFlexEchoTile key={i} echo={echo} ev={ev} el={el} />
                  ))}
                </div>
              </div>
            )}

            {/* footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
                ...eStyles.mono,
                fontSize: 8.5,
                letterSpacing: 2,
                color: E_PAL.textFaint,
              }}
            >
              <span>RESONATOR CODEX · EMBERLINE</span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(140,220,225,0.12), transparent)" }} />
              <span style={{ color: E_PAL.textMute }}>{r.echoSet.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div style={{ display: "flex", gap: 10 }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={download}
          disabled={busy}
          style={{
            ...eStyles.mono,
            fontSize: 11,
            letterSpacing: 1.5,
            padding: "9px 20px",
            borderRadius: 5,
            border: `1px solid ${err ? E_PAL.red : el.hex}`,
            background: err ? "rgba(255,122,138,0.10)" : "rgba(140,220,225,0.06)",
            color: err ? E_PAL.red : el.soft,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? "RENDERING…" : err ?? "✦ DOWNLOAD PNG"}
        </button>
        <button
          onClick={onClose}
          style={{
            ...eStyles.mono,
            fontSize: 11,
            letterSpacing: 1.5,
            padding: "9px 20px",
            borderRadius: 5,
            border: `1px solid ${E_PAL.border}`,
            background: "transparent",
            color: E_PAL.textDim,
            cursor: "pointer",
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
