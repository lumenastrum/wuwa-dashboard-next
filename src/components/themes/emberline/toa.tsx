/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { useData } from "@/lib/data-context";
import type { ToaFloorRow, ToaSeason, ToaTower, ToaZone } from "@/lib/types";
import { TOA_CRESTS_PER_FLOOR, TOA_TOWERS, TOA_ZONES } from "@/lib/types";
import { toaAsset, toaZoneBanner } from "@/lib/game-icons";
import { splitNote } from "@/lib/notes";
import { E_PAL, eStyles } from "./styles";
import { EFace, EFooter, EKicker, ESectionTitle, EShell } from "./primitives";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";

const GOLD_GRAD = `linear-gradient(90deg, ${E_PAL.gold}, ${E_PAL.emberSoft})`;

// Crest ceilings per zone in the current game (Hazard = 36 since v2.6; the
// permanent zones are one-time ladders). Render-side truth only — the CLI
// never caps a zone, so a future patch just changes these numbers.
const ZONE_MAX: Record<ToaZone, number> = { Stable: 12, Experiment: 24, Hazard: 36, Overdrive: 18 };
const ZONE_TAG: Record<ToaZone, string> = {
  Stable: "PERMANENT · LV 35-50",
  Experiment: "PERMANENT · LV 50-70",
  Hazard: "28-DAY ROTATION · LV 70-100",
  Overdrive: "PERMANENT · LV 100 · NO-DEATH CREST",
};

// A tower's canonical crest ceiling depends on its zone: Overdrive towers run
// 2 stages (6 crests), every other zone's towers run 4 floors (12 crests).
// Never derive this from how many floors happen to be LOGGED — a partial
// climb must read as partial, matching the zone rail's ZONE_MAX framing.
function towerMax(zone: ToaZone): number {
  return (zone === "Overdrive" ? 2 : 4) * TOA_CRESTS_PER_FLOOR;
}

// Three crest pips in the game's own star art — earned pips glow, missed pips
// sit as dark sockets (star-bg). A perfect floor gets the gold halo.
function CrestPips({ crests, size = 22 }: { crests: number; size?: number }) {
  const perfect = crests >= TOA_CRESTS_PER_FLOOR;
  return (
    <div style={{ display: "flex", gap: 3, flexShrink: 0 }} title={`${crests}/${TOA_CRESTS_PER_FLOOR} crests`}>
      {Array.from({ length: TOA_CRESTS_PER_FLOOR }, (_, i) => {
        const earned = i < crests;
        return (
          <img
            key={i}
            src={toaAsset(earned ? "star" : "star-bg")}
            alt={earned ? "crest" : "no crest"}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            style={{
              width: size,
              height: size,
              opacity: earned ? 1 : 0.35,
              filter: earned
                ? `drop-shadow(0 0 5px ${perfect ? E_PAL.gold : "rgba(147,224,211,0.8)"})`
                : "grayscale(1)",
            }}
          />
        );
      })}
    </div>
  );
}

function FloorCard({ f, isMobile }: { f: ToaFloorRow; isMobile: boolean }) {
  const [kicker, body] = f.notes ? splitNote(f.notes) : [null, ""];
  const perfect = f.crests >= TOA_CRESTS_PER_FLOOR;
  return (
    <div
      style={{
        position: "relative",
        padding: "13px 15px 12px",
        borderRadius: 10,
        overflow: "hidden",
        background: perfect ? "rgba(245,201,122,0.045)" : E_PAL.inset,
        border: `1px solid ${perfect ? "rgba(245,201,122,0.35)" : "rgba(140,220,225,0.1)"}`,
      }}
    >
      <div style={{ position: "absolute", right: 6, top: -14, ...eStyles.display, fontSize: 52, color: "rgba(140,220,225,0.05)" }}>
        F{f.floor}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <span style={{ ...eStyles.display, fontSize: 17, color: perfect ? E_PAL.gold : E_PAL.text, flexShrink: 0 }}>
            F{f.floor}
          </span>
          {f.boss && (
            <span
              style={{
                ...eStyles.mono,
                fontSize: 8.5,
                letterSpacing: 1,
                color: E_PAL.textMute,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {f.boss.toUpperCase()}
            </span>
          )}
        </div>
        <CrestPips crests={f.crests} size={isMobile ? 19 : 22} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 9 }}>
        <div style={{ display: "flex", paddingLeft: 8 }}>
          {f.members.map((n) => (
            <EFace key={n} name={n} size={30} radius={8} style={{ marginLeft: -8 }} />
          ))}
        </div>
        {f.time && (
          <span
            style={{
              ...eStyles.mono,
              fontSize: 8.5,
              letterSpacing: 1,
              padding: "3px 8px",
              borderRadius: 999,
              flexShrink: 0,
              color: perfect ? E_PAL.dark : E_PAL.textDim,
              background: perfect ? GOLD_GRAD : "rgba(140,220,225,0.07)",
              border: perfect ? "none" : `1px solid ${E_PAL.borderSoft}`,
            }}
          >
            {f.time} LEFT
          </span>
        )}
      </div>
      {kicker && (
        <div style={{ marginTop: 8, ...eStyles.display, fontSize: 12, letterSpacing: 0.4, color: perfect ? E_PAL.gold : E_PAL.tide }}>
          {kicker}
        </div>
      )}
      {body && (
        <div
          title={f.notes}
          style={{
            marginTop: kicker ? 4 : 8,
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
}

// One tower column — floors stacked summit-first with a faint spine rail, the
// climb read top-down the way the in-game tower select draws it.
function TowerColumn({ tower, zone, floors, isMobile }: { tower: ToaTower; zone: ToaZone; floors: ToaFloorRow[]; isMobile: boolean }) {
  const sorted = [...floors].sort((a, b) => b.floor - a.floor);
  const crests = floors.reduce((acc, f) => acc + f.crests, 0);
  const max = towerMax(zone);
  const full = crests >= max;
  return (
    <div style={{ position: "relative", minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 10,
          marginBottom: 10,
          background: "linear-gradient(180deg, rgba(140,220,225,0.06), rgba(140,220,225,0.02))",
          border: `1px solid ${full ? "rgba(245,201,122,0.4)" : E_PAL.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <img
            src={toaAsset(tower === "Hazard" ? "crest-red" : "crest")}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            style={{ height: 26, width: "auto", filter: "drop-shadow(0 0 6px rgba(147,224,211,0.4))" }}
          />
          <span style={{ ...eStyles.display, fontSize: 15, whiteSpace: "nowrap" }}>{tower} Tower</span>
        </div>
        <span style={{ ...eStyles.mono, fontSize: 9.5, letterSpacing: 1, color: full ? E_PAL.gold : E_PAL.textDim, flexShrink: 0 }}>
          ✦ {crests}/{max}
        </span>
      </div>
      {/* spine rail behind the floor stack */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 4,
            bottom: 4,
            width: 1,
            background: "linear-gradient(180deg, rgba(245,201,122,0.35), rgba(140,220,225,0.08))",
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: isMobile ? 8 : 10 }}>
          {sorted.map((f) => (
            <FloorCard key={`${f.tower}-${f.floor}`} f={f} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function EmberlineToa() {
  const { raw } = useData();
  const { isMobile, isTablet } = useDashboardViewport();
  const seasons = raw.towerOfAdversity?.seasons ?? [];
  const [selRaw, setSel] = useState(seasons.length - 1);
  const sel = Math.max(0, Math.min(selRaw, seasons.length - 1));
  const s: ToaSeason | undefined = seasons[sel];
  const [zoneRaw, setZone] = useState<ToaZone | null>(null);

  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const card = stripRef.current?.children[sel] as HTMLElement | undefined;
    card?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [sel]);

  const pad = isMobile ? "0 16px" : isTablet ? "0 20px" : "0 34px";

  // ── empty state — the well before the first record ──────────────────
  if (!s) {
    return (
      <EShell>
        <div style={{ position: "relative", minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <img
            src={toaAsset("bg-1")}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.22 }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,15,21,0.3), rgba(5,15,21,0.95))" }} />
          <div style={{ position: "relative", textAlign: "center", padding: 24 }}>
            <img
              src={toaAsset("crest")}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              style={{ height: 150, width: "auto", filter: "drop-shadow(0 0 30px rgba(147,224,211,0.5))" }}
            />
            <EKicker spacing={3} style={{ marginTop: 18, justifySelf: "center" }}>TOWER OF ADVERSITY · THE DEEP WELL</EKicker>
            <div style={{ ...eStyles.display, fontSize: isMobile ? 26 : 36, marginTop: 8 }}>
              The well is quiet. <span style={{ fontStyle: "italic", color: E_PAL.emberSoft }}>For now.</span>
            </div>
            <div style={{ ...eStyles.mono, fontSize: 10, letterSpacing: 1, color: E_PAL.textMute, marginTop: 14 }}>
              npm run update -- addtoa --file scripts/toa/season-1.json
            </div>
          </div>
        </div>
        <EFooter factoid="TOWER OF ADVERSITY · NO SEASONS RECORDED" updated={raw.meta.updated} />
      </EShell>
    );
  }

  const zonesLogged = TOA_ZONES.filter((z) => s.floors.some((f) => f.zone === z));
  // Default to the rotating Hazard Zone when it's logged — that's the chase;
  // the permanent zones shouldn't bury it just by sorting earlier.
  const defaultZone = zonesLogged.includes("Hazard") ? "Hazard" : zonesLogged[0];
  const zone = zoneRaw && zonesLogged.includes(zoneRaw) ? zoneRaw : defaultZone;
  const zoneFloors = s.floors.filter((f) => f.zone === zone);
  const towers = TOA_TOWERS.filter((t) => zoneFloors.some((f) => f.tower === t));
  const perfectFloors = s.floors.filter((f) => f.crests >= TOA_CRESTS_PER_FLOOR).length;

  return (
    <EShell>
      {/* ── hero — backed by the ripped tower hall ───────────── */}
      <div style={{ position: "relative", padding: isMobile ? "18px 16px 14px" : "30px 34px 24px", overflow: "hidden" }}>
        <img
          src={toaAsset("bg-1")}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 30%",
            opacity: 0.16,
            maskImage: "linear-gradient(180deg, #000 30%, transparent)",
            WebkitMaskImage: "linear-gradient(180deg, #000 30%, transparent)",
            pointerEvents: "none",
          }}
        />
        <img
          src={toaAsset("crest")}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          style={{
            position: "absolute",
            right: isMobile ? -14 : 40,
            top: isMobile ? 0 : -18,
            height: isMobile ? 210 : 300,
            width: "auto",
            opacity: 0.5,
            filter: "drop-shadow(0 0 26px rgba(147,224,211,0.45))",
            pointerEvents: "none",
          }}
        />
        <EKicker spacing={3} style={{ marginBottom: 8 }}>TOWER OF ADVERSITY · THE DEEP WELL ARCHIVE</EKicker>
        <div style={{ ...eStyles.display, fontSize: isMobile ? 32 : 46, lineHeight: 1.05, position: "relative" }}>
          Three towers. Twelve floors.{" "}
          <span style={{ fontStyle: "italic", color: E_PAL.emberSoft }}>The well keeps count.</span>
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
            ✦ {s.totalCrests}/{s.crestTarget} CRESTS — {s.label.toUpperCase()}
          </span>
          <span style={{ ...eStyles.mono, fontSize: 9, letterSpacing: 2, color: E_PAL.textMute }}>
            {perfectFloors} PERFECT FLOORS{s.window ? ` · ${s.window.toUpperCase()}` : ""} · {s.date}
          </span>
        </div>
      </div>

      {/* ── season selector strip ────────────────────────────── */}
      {seasons.length > 1 && (
        <div
          ref={stripRef}
          style={{ display: "flex", gap: 12, overflowX: "auto", WebkitOverflowScrolling: "touch", padding: isMobile ? "0 16px 16px" : isTablet ? "0 20px 18px" : "0 34px 18px" }}
        >
          {seasons.map((ss, i) => {
            const active = i === sel;
            const prev = i > 0 ? seasons[i - 1].totalCrests : null;
            const delta = prev != null ? ss.totalCrests - prev : null;
            return (
              <div
                key={ss.id}
                onClick={() => setSel(i)}
                style={{
                  flex: "0 0 210px",
                  padding: "12px 15px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: active ? "linear-gradient(180deg, rgba(255,122,77,0.08), rgba(140,220,225,0.03))" : E_PAL.panel,
                  border: `1px solid ${active ? "rgba(255,122,77,0.55)" : E_PAL.border}`,
                }}
              >
                <EKicker size={9} spacing={2}>SEASON {String(ss.id).padStart(2, "0")}</EKicker>
                <div style={{ ...eStyles.display, fontSize: 17, marginTop: 3, color: active ? E_PAL.text : E_PAL.textDim }}>{ss.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 5 }}>
                  <span style={{ ...eStyles.display, fontSize: 22, lineHeight: 1, color: active ? E_PAL.emberSoft : E_PAL.text }}>
                    {ss.totalCrests}/{ss.crestTarget}
                  </span>
                  {delta != null && (
                    <span style={{ ...eStyles.mono, fontSize: 9, color: delta >= 0 ? E_PAL.green : E_PAL.red }}>
                      {delta >= 0 ? "+" : "−"}{Math.abs(delta)}
                    </span>
                  )}
                </div>
                <EKicker size={8.5} spacing={0} style={{ marginTop: 4 }}>{ss.date}</EKicker>
              </div>
            );
          })}
        </div>
      )}

      {/* ── zone rail — banner cards in the game's own art ───── */}
      <div style={{ padding: pad }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
          {TOA_ZONES.map((z) => {
            const logged = zonesLogged.includes(z);
            const zc = s.floors.filter((f) => f.zone === z).reduce((acc, f) => acc + f.crests, 0);
            const active = z === zone;
            const banner = toaZoneBanner(z);
            return (
              <div
                key={z}
                onClick={() => logged && setZone(z)}
                style={{
                  position: "relative",
                  borderRadius: 10,
                  overflow: "hidden",
                  cursor: logged ? "pointer" : "default",
                  opacity: logged ? 1 : 0.45,
                  background: E_PAL.panel,
                  border: `1px solid ${active ? "rgba(255,122,77,0.55)" : E_PAL.border}`,
                }}
              >
                {banner && (
                  <img
                    src={banner}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    style={{ width: "100%", height: isMobile ? 44 : 56, objectFit: "cover", display: "block", filter: active ? "none" : "saturate(0.75)" }}
                  />
                )}
                <div style={{ padding: "9px 12px 10px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
                    <span style={{ ...eStyles.display, fontSize: isMobile ? 13 : 15, color: active ? E_PAL.emberSoft : E_PAL.text, whiteSpace: "nowrap" }}>
                      {z} Zone
                    </span>
                    <span style={{ ...eStyles.mono, fontSize: 9.5, color: zc >= ZONE_MAX[z] && logged ? E_PAL.gold : E_PAL.textDim, flexShrink: 0 }}>
                      {logged ? `✦ ${zc}/${ZONE_MAX[z]}` : "NOT LOGGED"}
                    </span>
                  </div>
                  {!isMobile && (
                    <EKicker size={7.5} spacing={1} style={{ marginTop: 4 }}>{ZONE_TAG[z]}</EKicker>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── the climb ────────────────────────────────────────── */}
      <div style={{ padding: pad }}>
        <ESectionTitle
          title="The Climb"
          size={22}
          sub={
            <em>
              {zone?.toLowerCase()} zone · {zoneFloors.reduce((acc, f) => acc + f.crests, 0)} crests over {zoneFloors.length} floors
            </em>
          }
          right={!isMobile ? <EKicker size={8.5} spacing={0.5} style={{ whiteSpace: "nowrap" }}>✦ = CREST · SUMMIT FIRST</EKicker> : undefined}
          style={{ margin: "26px 4px 14px" }}
        />
        {/* Tablet collapses to a single stacked column (three ~320px columns
            read cramped); a lone tower on desktop stays card-width instead of
            stretching the full 1200px shell. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              isMobile || isTablet || towers.length === 1
                ? "minmax(0, 640px)"
                : `repeat(${towers.length}, 1fr)`,
            justifyContent: "center",
            gap: isMobile ? 18 : 16,
          }}
        >
          {towers.map((t) => (
            <TowerColumn key={t} tower={t} zone={zone} floors={zoneFloors.filter((f) => f.tower === t)} isMobile={isMobile} />
          ))}
        </div>
      </div>

      {/* ── field doctrine ───────────────────────────────────── */}
      <div style={{ padding: isMobile ? "0 16px 24px" : isTablet ? "0 20px 28px" : "0 34px 28px" }}>
        {s.lessons.length > 0 && (
          <>
            <ESectionTitle
              title="Field Doctrine"
              size={22}
              sub={<em>lessons carved from {s.label.toLowerCase()}</em>}
              style={{ margin: "28px 4px 14px" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 12 }}>
              {s.lessons.map((l, i) => (
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
      </div>

      <EFooter
        factoid={`TOWER OF ADVERSITY · ${zonesLogged.length}/${TOA_ZONES.length} ZONES LOGGED · ${s.totalCrests}/${s.crestTarget} CRESTS · ${perfectFloors} PERFECT FLOOR${perfectFloors === 1 ? "" : "S"}`}
        updated={raw.meta.updated}
      />
    </EShell>
  );
}
