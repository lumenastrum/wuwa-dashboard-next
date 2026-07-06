/* eslint-disable @next/next/no-img-element */
"use client";

// The FLEX card — a fixed-size (1520×880) shareable build card composed from
// the same jewel components as the resonator page, snapshotted client-side
// with html-to-image. Static-export safe: no server, same-origin assets only.

import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { ELEMENTS, STATUS_HEX } from "@/lib/elements";
import { tallPortrait, fiveStarIcon } from "@/lib/portraits";
import { elementBadge } from "@/lib/game-icons";
import { WeaponImg } from "@/components/weapon-img";
import type { EchoBuild, Resonator, SignatureWeapon } from "@/lib/types";
import { scoreBuild, scoreEcho } from "@/lib/echo-audit";
import type { rateResonator } from "@/lib/resonator-rating";
import { O_PAL, oStyles } from "./styles";
import { OStatBar } from "./primitives";
import type { AuditStat } from "@/lib/types";

// Re-exported privates from resonator.tsx live here to avoid a circular import.
import { OEchoCard, OForteDisc, OGrade, OSequenceChain } from "./resonator";
import { FORTE_SLOTS } from "@/lib/game-icons";

const CARD_W = 1520;
const CARD_H = 880;

export function ObsidianFlexCard({
  r, sw, echoBuild, rating, stats, onClose,
}: {
  r: Resonator & { audit?: { notes?: string; buildType?: string } };
  sw: SignatureWeapon | undefined;
  echoBuild: EchoBuild | undefined;
  rating: ReturnType<typeof rateResonator>;
  stats: AuditStat[];
  onClose: () => void;
}) {
  const node = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerWidth - 64) / CARD_W, (window.innerHeight - 150) / CARD_H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  const el = ELEMENTS[r.element];
  const echoVerdict = echoBuild ? scoreBuild(echoBuild.echoes, echoBuild.weights) : null;
  const gradedEchoes = echoBuild
    ? echoBuild.echoes.map((echo) => ({ echo, ev: scoreEcho(echo, echoBuild.weights) })).filter((x) => x.ev.score != null)
    : [];

  const [err, setErr] = useState<string | null>(null);
  const download = useCallback(async () => {
    if (!node.current || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const png = await toPng(node.current, {
        pixelRatio: 2,
        backgroundColor: "#0a0d14",
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
        background: "rgba(4,6,10,0.88)",
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
      <div
        style={{
          width: CARD_W * scale,
          height: CARD_H * scale,
          flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {/* ── the card itself ── */}
        <div
          ref={node}
          style={{
            width: CARD_W,
            height: CARD_H,
            background: O_PAL.bgGrad,
            border: `1px solid ${O_PAL.borderStrong}`,
            borderRadius: 22,
            overflow: "hidden",
            color: O_PAL.text,
            fontFamily: "var(--font-geist), system-ui, sans-serif",
            display: "flex",
            flexDirection: "column",
            padding: 30,
            gap: 18,
          }}
        >
          <div style={{ display: "flex", gap: 26, flex: 1, minHeight: 0 }}>
            {/* portrait column */}
            <div
              style={{
                position: "relative",
                width: 340,
                borderRadius: 16,
                overflow: "hidden",
                background: `linear-gradient(180deg, ${el.glow}, rgba(10,13,20,0.6))`,
                border: `1px solid ${O_PAL.border}`,
                flexShrink: 0,
              }}
            >
              <img
                src={tallPortrait(r.name)}
                alt={r.name}
                style={{
                  position: "absolute",
                  bottom: -10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  height: "104%",
                  width: "auto",
                  maxWidth: "none",
                  filter: `drop-shadow(0 24px 40px ${el.glow})`,
                }}
              />
              <img
                src={elementBadge(r.element)}
                alt={r.element}
                style={{ position: "absolute", top: 14, right: 14, width: 46, height: 46 }}
              />
            </div>

            {/* identity + stats + gear */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <img src={fiveStarIcon()} alt="5★" style={{ height: 15, width: "auto" }} />
                <div style={{ ...oStyles.display, fontSize: 62, lineHeight: 0.95 }}>{r.name}</div>
                <div style={{ flex: 1 }} />
                <OSequenceChain sequence={r.sequence} />
              </div>
              <div style={{ ...oStyles.display, fontSize: 19, fontStyle: "italic", color: O_PAL.textDim, marginTop: -6 }}>
                — {r.audit?.notes || `${r.role}, ${r.element}`}. &nbsp;
                <span style={{ ...oStyles.mono, fontSize: 11, fontStyle: "normal", color: O_PAL.textMute, letterSpacing: 1 }}>
                  {r.role.toUpperCase()} · {r.audit?.buildType?.toUpperCase() || ""} · LV.{r.level}
                </span>
              </div>

              <div style={{ display: "flex", gap: 22, flex: 1, minHeight: 0 }}>
                {/* numbers */}
                <div style={{ flex: 1.15, minWidth: 0 }}>
                  {stats.map((s) => (
                    <OStatBar key={s.label} stat={s} />
                  ))}
                  {rating.score != null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
                      <OGrade grade={rating.grade} status={rating.status} score={null} size="md" />
                      <div>
                        <div style={{ ...oStyles.display, fontSize: 20 }}>Resonator Rating</div>
                        <div style={{ ...oStyles.mono, fontSize: 9, color: O_PAL.textMute, letterSpacing: 1.5 }}>
                          ECHO 35 · STATS 35 · SIG 15 · SEQ 15
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* weapon + forte */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                      padding: 12,
                      borderRadius: 12,
                      background: O_PAL.surface,
                      border: `1px solid ${O_PAL.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 8,
                        overflow: "hidden",
                        background: `linear-gradient(135deg, ${el.glow}, rgba(0,0,0,0.4))`,
                        border: `1px solid ${O_PAL.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <WeaponImg name={r.weapon} size={58} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ ...oStyles.display, fontSize: 21, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.weapon}
                      </div>
                      <div style={{ ...oStyles.mono, fontSize: 10, color: O_PAL.textDim, letterSpacing: 1, marginTop: 2 }}>
                        {r.weaponRank}
                        {sw?.baseAtk ? ` · ATK ${sw.baseAtk}` : ""}
                        {sw?.mainStat ? ` · ${sw.mainStat.toUpperCase()} ${sw.mainStatValue}` : ""}
                      </div>
                      {sw?.passiveName && (
                        <div style={{ ...oStyles.display, fontSize: 14, color: O_PAL.accent, marginTop: 3 }}>{sw.passiveName}</div>
                      )}
                    </div>
                  </div>
                  {r.forte && (
                    <div
                      style={{
                        padding: "14px 12px 10px",
                        borderRadius: 12,
                        background: O_PAL.surface,
                        border: `1px solid ${O_PAL.border}`,
                        flex: 1,
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                        {FORTE_SLOTS.map(({ key, label }) => (
                          <OForteDisc key={key} r={r} slot={key} label={label} level={r.forte![key]} />
                        ))}
                      </div>
                      <div style={{ ...oStyles.mono, fontSize: 8.5, color: r.forte.nodes >= 8 ? O_PAL.accent : O_PAL.textMute, letterSpacing: 1.2, textAlign: "center", marginTop: 8 }}>
                        FORTE · {r.forte.nodes}/8 BONUS NODES
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* echo band */}
          {echoVerdict && echoVerdict.score != null && gradedEchoes.length > 0 && (
            <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, width: 86, flexShrink: 0 }}>
                <OGrade grade={echoVerdict.grade} status={echoVerdict.status} score={echoVerdict.score} size="md" />
                <div style={{ ...oStyles.mono, fontSize: 8, color: O_PAL.textMute, letterSpacing: 1.5, textAlign: "center" }}>
                  ECHO
                  <br />
                  AUDIT
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, flex: 1 }}>
                {gradedEchoes.slice(0, 5).map(({ echo, ev }, i) => (
                  <OEchoCard key={i} echo={echo} ev={ev} el={el} />
                ))}
              </div>
            </div>
          )}

          {/* footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ ...oStyles.mono, fontSize: 9, color: O_PAL.textMute, letterSpacing: 2 }}>
              RESONANCE ATELIER · OBSIDIAN
            </div>
            <div style={{ ...oStyles.mono, fontSize: 9, color: STATUS_HEX.neutral, letterSpacing: 1.5 }}>
              {r.echoSet.toUpperCase()}
            </div>
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
            ...oStyles.mono,
            fontSize: 12,
            letterSpacing: 1.5,
            padding: "10px 22px",
            borderRadius: 999,
            border: `1px solid ${err ? STATUS_HEX.red : O_PAL.accent}`,
            background: err ? "rgba(255,122,138,0.10)" : "rgba(233,212,155,0.12)",
            color: err ? STATUS_HEX.red : O_PAL.accent,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? "RENDERING…" : err ?? "✦ DOWNLOAD PNG"}
        </button>
        <button
          onClick={onClose}
          style={{
            ...oStyles.mono,
            fontSize: 12,
            letterSpacing: 1.5,
            padding: "10px 22px",
            borderRadius: 999,
            border: `1px solid ${O_PAL.border}`,
            background: "transparent",
            color: O_PAL.textDim,
            cursor: "pointer",
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
