/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState } from "react";
import { echoBuildOf, isSignatureWeaponFor, signatureWeaponOf, rosterIndexOf, useData } from "@/lib/data-context";
import { ELEMENTS } from "@/lib/elements";
import { durationToSec } from "@/lib/duration";
import { elementBadge } from "@/lib/game-icons";
import { tallPortrait } from "@/lib/portraits";
import { resonatorPath } from "@/lib/route-name";
import { scoreBuild } from "@/lib/echo-audit";
import { rateResonator } from "@/lib/resonator-rating";
import { useTheme } from "@/lib/theme-context";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import type { ElementName, RosterEntry } from "@/lib/types";
import { E_PAL, E_STATUS, eStyles, goldGlow } from "./styles";
import { ECard, EDiamond, EFace, EFooter, EKicker, EKpi, ERarityPips, ESectionTitle, EShell, EStatusDot } from "./primitives";

const FILTERS: (ElementName | "All")[] = ["All", "Fusion", "Glacio", "Electro", "Spectro", "Havoc", "Aero"];

function ERosterTile({ r }: { r: RosterEntry }) {
  const el = ELEMENTS[r.element];
  return (
    <Link
      href={resonatorPath(r.name)}
      style={{
        borderRadius: 8,
        overflow: "hidden",
        background: E_PAL.inset,
        border: `1px solid rgba(140,220,225,0.09)`,
        opacity: r.level === 0 ? 0.55 : 1,
        textDecoration: "none",
        color: "inherit",
        display: "block",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(140,220,225,0.3)";
        e.currentTarget.style.background = "rgba(140,220,225,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(140,220,225,0.09)";
        e.currentTarget.style.background = E_PAL.inset;
      }}
    >
      <div style={{ height: 2, background: `linear-gradient(90deg, ${el.hex}, transparent 80%)` }} />
      <div style={{ display: "flex", gap: 11, padding: 11 }}>
        <EFace name={r.name} size={52} radius={6} border="rgba(140,220,225,0.15)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                ...eStyles.body,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {r.name}
            </div>
            <EStatusDot status={r.audit?.priorityStatus ?? "neutral"} glow={false} />
          </div>
          <EKicker size={8} spacing={0.5} style={{ marginTop: 3 }}>
            {/* role's replacement char is U+00A0 (nbsp): "Main DPS" must not wrap mid-phrase */}
            {`${r.sequence} · ${r.role.replace(/ /g, " ")} · Lv${r.level}`}
          </EKicker>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7 }}>
            <img src={elementBadge(r.element)} alt={r.element} style={{ width: 12, height: 12, flexShrink: 0 }} />
            <span style={{ ...eStyles.mono, fontSize: 8, letterSpacing: 0.5, color: E_PAL.textDim }}>
              {(r.element + " · " + r.weaponType).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EFeaturedHero({ r }: { r: RosterEntry }) {
  const { raw, roster } = useData();
  const { isMobile } = useDashboardViewport();
  const el = ELEMENTS[r.element];
  const bench = raw.benchmarks.find((b) => b.team.includes(r.name));
  const idx = Math.max(0, rosterIndexOf(roster, r.name));

  const sw = signatureWeaponOf(raw, r.weapon);
  const echoBuild = echoBuildOf(raw, r.name);
  const echoVerdict = echoBuild ? scoreBuild(echoBuild.echoes, echoBuild.weights) : null;
  const rating = rateResonator({
    sequence: r.sequence,
    weaponRank: r.weaponRank,
    hasWeapon: !!r.weapon,
    onSignature: isSignatureWeaponFor(sw, r.name),
    stats: r.audit?.stats ?? [],
    echoScore: echoVerdict?.score ?? null,
  });

  return (
    <div
      style={{
        position: "relative",
        margin: isMobile ? "0 16px" : "0 34px",
        height: isMobile ? undefined : 330,
        border: `1px solid ${E_PAL.borderKpi}`,
        borderRadius: 8,
        overflow: "hidden",
        background: `radial-gradient(760px 400px at ${isMobile ? "50% 35%" : "16% 40%"}, ${el.glow}, transparent 60%), linear-gradient(180deg, rgba(140,220,225,0.04), rgba(4,13,18,0.5))`,
      }}
    >
      <img
        src={tallPortrait(r.name)}
        alt={r.name}
        style={{
          position: "absolute",
          left: isMobile ? "50%" : 30,
          transform: isMobile ? "translateX(-50%)" : undefined,
          top: isMobile ? 0 : -6,
          height: isMobile ? 400 : "150%",
          width: "auto",
          maxWidth: "none",
          filter: `drop-shadow(0 20px 44px ${el.glow})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          ...(isMobile ? { left: 0, right: 0, top: 0, height: 400 } : { inset: 0 }),
          background: isMobile
            ? "linear-gradient(180deg, transparent 48%, rgba(5,15,21,0.6) 74%, rgba(5,15,21,0.97) 96%)"
            : "linear-gradient(90deg, transparent 22%, rgba(5,15,21,0.88) 44%)",
        }}
      />
      <div
        style={
          isMobile
            ? {
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 14,
                padding: "0 14px 16px",
                zIndex: 2,
              }
            : {
                position: "absolute",
                left: 420,
                right: 34,
                top: 34,
                bottom: 30,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                zIndex: 2,
              }
        }
      >
        {isMobile ? (
          <div style={{ height: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 8, paddingBottom: 8 }}>
            <div style={{ ...eStyles.display, fontSize: 36, lineHeight: 1, textShadow: "0 2px 18px rgba(5,15,21,0.9)" }}>{r.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ERarityPips rarity={r.rarity} height={14} />
              {rating.grade !== "—" && (
                <div style={{ ...eStyles.display, fontSize: 24, ...goldGlow(16) }}>{rating.grade}</div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <EKicker spacing={3}>LAST VIEWED · № {String(idx + 1).padStart(2, "0")}</EKicker>
              <EDiamond color={el.hex} size={6} />
              <EKicker spacing={2} color={E_PAL.emberSoft}>
                {(r.element + " · " + r.weaponType).toUpperCase()}
              </EKicker>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
              <div style={{ ...eStyles.display, fontSize: 54, lineHeight: 1 }}>{r.name}</div>
              <ERarityPips rarity={r.rarity} height={15} />
              {rating.grade !== "—" && (
                <div style={{ ...eStyles.display, fontSize: 30, ...goldGlow(18) }}>{rating.grade}</div>
              )}
            </div>
            <div style={{ ...eStyles.body, fontSize: 13, fontStyle: "italic", color: E_PAL.textDim, marginTop: 6 }}>
              Sequence {r.sequence} · {r.role}
              {r.audit?.notes ? ` — ${r.audit.notes}` : ""}
            </div>
          </div>
        )}
        {r.audit && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, 1fr)", gap: 12, width: isMobile ? "100%" : undefined }}>
            {r.audit.stats.map((s) => (
              <div
                key={s.label}
                style={{
                  border: `1px solid ${E_PAL.border}`,
                  borderRadius: 6,
                  background: E_PAL.insetStrong,
                  padding: "11px 14px",
                }}
              >
                <EKicker size={9} spacing={2}>{s.label === "CR" ? "CRIT RATE" : s.label === "CD" ? "CRIT DMG" : s.label === "ER" ? "ENERGY REGEN" : s.label}</EKicker>
                <div
                  style={{
                    ...eStyles.display,
                    fontSize: isMobile ? 20 : 24,
                    marginTop: 2,
                    color: E_STATUS[s._status] ?? E_PAL.text,
                  }}
                >
                  {s.current}
                </div>
                <EKicker size={9} spacing={0} style={{ marginTop: 2 }}>{s.optimal}</EKicker>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: isMobile ? "wrap" : "nowrap", justifyContent: isMobile ? "center" : "flex-start", width: isMobile ? "100%" : undefined }}>
          <Link
            href={resonatorPath(r.name)}
            style={{
              ...eStyles.mono,
              fontSize: 11,
              letterSpacing: 1,
              padding: "8px 18px",
              borderRadius: 999,
              background: E_PAL.ember,
              color: E_PAL.dark,
              textDecoration: "none",
            }}
          >
            OPEN BUILD →
          </Link>
          {!isMobile && <div style={{ flex: 1 }} />}
          {bench && (
            <EKicker size={10} spacing={1}>
              BEST {bench.best} · AVG {bench.average} · DEATHS {bench.deaths}
            </EKicker>
          )}
        </div>
      </div>
    </div>
  );
}

function ESidePanel() {
  const { raw } = useData();
  const top = raw.benchmarks.slice(0, 5);
  const topBest = top.length ? durationToSec(top[0].best) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignSelf: "start" }}>
      <ECard>
        <ESectionTitle title="Top Lineups" />
        <EKicker size={9} spacing={2} style={{ margin: "4px 0 16px" }}>
          OVERDRIVE · CROWNLESS LV.100 · BEST OF 3
        </EKicker>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {top.map((b, i) => (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 5,
                }}
              >
                <div style={{ display: "flex", gap: 6 }}>
                  {b.team.map((n) => (
                    <EFace key={n} name={n} size={24} />
                  ))}
                </div>
                <span style={{ ...eStyles.mono, fontSize: 12, color: i === 0 ? E_PAL.emberSoft : E_PAL.text }}>
                  {b.best}
                </span>
              </div>
              <div style={{ height: 3, background: E_PAL.track, borderRadius: 999, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${(topBest / durationToSec(b.best)) * 100}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${i === 0 ? E_PAL.emberSoft : ELEMENTS.Aero.hex}, transparent)`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </ECard>

      <ECard>
        <ESectionTitle
          title="Open Threads"
          right={<EKicker size={9} spacing={1}>{raw.actionItems.length} ITEMS</EKicker>}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          {raw.actionItems.slice(0, 6).map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 12,
                padding: "10px 0",
                borderBottom: `1px solid ${E_PAL.borderSoft}`,
              }}
            >
              <span style={{ marginTop: 6 }}>
                <EStatusDot status={a.status} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...eStyles.body, fontSize: 13, fontWeight: 600 }}>{a.task}</div>
                <div style={{ ...eStyles.body, fontSize: 11, color: E_PAL.textDim, marginTop: 2 }}>{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </ECard>
    </div>
  );
}

export function EmberlineRoster() {
  const { raw, roster, rosterByName } = useData();
  const { lastResonator } = useTheme();
  const { isMobile, isTablet } = useDashboardViewport();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const featured = rosterByName[lastResonator] ?? roster[0];
  const filtered = filter === "All" ? roster : roster.filter((r) => r.element === filter);
  const cycles = raw.endstateMatrix.cycles;
  const cycle = cycles[cycles.length - 1];
  const prev = cycles.length > 1 ? cycles[cycles.length - 2] : null;
  const built = roster.filter((r) => r.level > 0).length;

  return (
    <EShell>
      {/* header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "flex-end", justifyContent: "space-between", gap: isMobile ? 16 : 24, padding: isMobile ? "18px 16px 16px" : "28px 34px 24px" }}>
        <div>
          <EKicker spacing={3} style={{ marginBottom: 8 }}>
            CYCLE {String(cycle.id).padStart(3, "0")} · {cycle.label.toUpperCase()} · CLOSED {cycle.date.replace(/-/g, ".")}
          </EKicker>
          <div style={{ ...eStyles.display, fontSize: isMobile ? 36 : 52, lineHeight: 1 }}>
            Good evening, <span style={{ fontStyle: "italic", color: E_PAL.emberSoft }}>Rover</span>.
          </div>
          <div style={{ ...eStyles.body, fontSize: 14, color: E_PAL.textDim, marginTop: 10 }}>
            The atelier closed strong — {cycle.totalPoints.toLocaleString()} points, {cycle.teamsOver5k} teams over five thousand.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(150px, 1fr))", gap: 12 }}>
          <EKpi
            label="RESONATORS"
            value={roster.length}
            sub={`${built} built · Lv.${raw.meta.maxLevel}`}
            accent={ELEMENTS.Aero.hex}
          />
          <EKpi
            label="5K+ TEAMS"
            value={`${cycle.teamsOver5k}/${cycle.teams.length}`}
            sub={cycle.teamsOver5k >= cycle.teamTarget ? "target met" : `target ${cycle.teamTarget}`}
            accent={ELEMENTS.Spectro.hex}
          />
          <EKpi
            label="CYCLE SCORE"
            value={cycle.totalPoints.toLocaleString()}
            sub={prev ? `${cycle.totalPoints - prev.totalPoints >= 0 ? "+" : ""}${(cycle.totalPoints - prev.totalPoints).toLocaleString()} vs prev` : cycle.date}
            accent={ELEMENTS.Fusion.hex}
          />
        </div>
      </div>

      <EFeaturedHero r={featured} />

      {/* roster grid + side panel */}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1.65fr 1fr", gap: 18, padding: isMobile ? "16px 16px 24px" : "18px 34px 28px" }}>
        <ECard diamonds="both" style={{ alignSelf: "start" }}>
          <ESectionTitle
            title="The Roster"
            size={24}
            sub={`${filtered.length} of ${roster.length} shown · click any to inspect`}
            style={{ marginBottom: 6 }}
          />
          <div style={{ display: "flex", gap: 6, flexWrap: isMobile ? "nowrap" : "wrap", overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? 2 : 0, margin: "10px 0 16px" }}>
            {FILTERS.map((f) => {
              const active = filter === f;
              const hex = f === "All" ? E_PAL.tide : ELEMENTS[f as ElementName].hex;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 11px",
                    borderRadius: 999,
                    cursor: "pointer",
                    ...eStyles.mono,
                    fontSize: 10,
                    letterSpacing: 1,
                    color: active ? hex : E_PAL.textDim,
                    background: active ? "rgba(140,220,225,0.08)" : "transparent",
                    border: `1px solid ${active ? hex : E_PAL.borderKpi}`,
                    transition: "border-color 0.15s",
                  }}
                >
                  {f !== "All" && (
                    <img src={elementBadge(f as ElementName)} alt="" style={{ width: 12, height: 12 }} />
                  )}
                  <span>{f.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 10 }}>
            {filtered.map((r) => (
              <ERosterTile key={r.name} r={r} />
            ))}
          </div>
        </ECard>
        <ESidePanel />
      </div>

      <EFooter
        factoid={raw.benchmarkMeta.resistances.replace(/\s*\|\s*/g, " · ").replace(/[()]/g, "").toUpperCase()}
        updated={raw.meta.updated}
      />
    </EShell>
  );
}
