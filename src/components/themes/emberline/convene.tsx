/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
// (useEffect drives the constellation auto-scroll only)
import {
  luckLabel,
  pityHistogram,
  type BannerStats,
  type FiveStarPull,
} from "@/lib/convene-analytics";
import { HARD_PITY, SOFT_PITY, is5050Pool, PRIMARY_BANNERS } from "@/lib/convene-types";
import { portrait } from "@/lib/portraits";
import { usePulls } from "@/lib/use-pulls";
import { weaponImage } from "@/lib/weapons";
import { E_PAL, eStyles } from "./styles";
import { ECard, EDiamond, EFooter, EKicker, EKpi, ESectionTitle, EShell } from "./primitives";

const CONVENE_WASH =
  "radial-gradient(1100px 520px at 82% -8%, rgba(255,122,77,0.08), transparent 60%), radial-gradient(900px 500px at 10% 10%, rgba(64,168,178,0.10), transparent 55%)";

// Pools surfaced as selector cards (primary four + collab pools when present).
const SHOWN_POOLS = new Set([...PRIMARY_BANNERS, 10, 11]);
const LEDGER_CAP = 16;

const pityColor = (p: number) => (p <= 48 ? E_PAL.green : p <= 66 ? E_PAL.gold : E_PAL.pink);

type Outcome = "won" | "lost" | "guaranteed" | "plain";
const outcomeOf = (f: FiveStarPull): Outcome =>
  f.guaranteed ? "guaranteed" : f.won5050 === true ? "won" : f.won5050 === false ? "lost" : "plain";
const OUTCOME_COLOR: Record<Outcome, string> = {
  won: E_PAL.green,
  lost: E_PAL.pink,
  guaranteed: E_PAL.gold,
  plain: E_PAL.gold,
};
const OUTCOME_TAG: Record<Outcome, string> = {
  won: "WON 50/50",
  lost: "LOST 50/50",
  guaranteed: "GUARANTEED",
  plain: "FIVE-STAR",
};

// Circular face for a 5★ hit — portrait or weapon art, outcome-colored ring,
// letter fallback when the art is missing.
function ConvFace({ f, size }: { f: FiveStarPull; size: number }) {
  // Callers key this component per hit, so the failed flag resets by remount.
  const [failed, setFailed] = useState(false);
  const isWeapon = f.resourceType === "Weapon";
  const border = `1px solid ${OUTCOME_COLOR[outcomeOf(f)]}99`;
  if (failed) {
    return (
      <div
        title={`${f.name} · pity ${f.pity}`}
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.45)",
          border,
          ...eStyles.display,
          fontSize: size * 0.45,
          color: E_PAL.textDim,
        }}
      >
        {f.name.charAt(0)}
      </div>
    );
  }
  return (
    <img
      src={isWeapon ? weaponImage(f.name) : portrait(f.name)}
      alt={f.name}
      title={`${f.name} · pity ${f.pity}`}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        objectFit: "cover",
        objectPosition: "center 20%",
        flexShrink: 0,
        background: "rgba(0,0,0,0.45)",
        border,
        padding: isWeapon ? 3 : 0,
        boxSizing: "border-box",
      }}
    />
  );
}

function EStatusScreen({ text }: { text: string }) {
  return (
    <EShell wash={CONVENE_WASH}>
      <div
        style={{
          minHeight: "70dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <EDiamond color={E_PAL.ember} />
        <span style={{ ...eStyles.mono, fontSize: 11, letterSpacing: 3, color: E_PAL.textMute }}>
          {text.toUpperCase()}
        </span>
      </div>
    </EShell>
  );
}

// ── The Constellation ────────────────────────────────────────────────
// Every 5★ of the pool: x = chronological order, y = pity (0–80). Dense
// archives (50+ hits) scroll horizontally instead of overlapping — the strip
// keeps a minimum node spacing and starts scrolled to the newest hit.
function EConstellation({ banner }: { banner: BannerStats }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hits = banner.fiveStars;
  const n = hits.length;

  const H = 210;
  const PADL = 46;
  const PADR = 26;
  const SPACING = 46;
  const W = Math.max(700, PADL + PADR + Math.max(0, n - 1) * SPACING);
  const x = (i: number) => (n === 1 ? W / 2 : PADL + (i * (W - PADL - PADR)) / (n - 1));
  const y = (p: number) => H - 20 - (p / HARD_PITY) * (H - 44);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [banner.cardPoolType]);

  const grid: { p: number; color: string }[] = [
    { p: 80, color: E_PAL.pink },
    { p: 66, color: E_PAL.gold },
    { p: 40, color: E_PAL.green },
  ];

  return (
    <div ref={scrollRef} style={{ overflowX: "auto", marginTop: 14, scrollbarWidth: "thin" }}>
      <div style={{ position: "relative", height: H, width: W, minWidth: "100%" }}>
        {grid.map((g) => (
          <div key={g.p}>
            <div style={{ position: "absolute", left: 0, right: 0, top: y(g.p), height: 1, background: g.color, opacity: 0.25 }} />
            <div style={{ position: "absolute", left: 0, top: y(g.p) - 6, ...eStyles.mono, fontSize: 8, color: E_PAL.textMute }}>
              {g.p}
            </div>
          </div>
        ))}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
        >
          <polyline
            points={hits.map((h, i) => `${x(i)},${y(h.pity)}`).join(" ")}
            fill="none"
            stroke="rgba(255,179,138,0.35)"
            strokeWidth={1.5}
          />
        </svg>
        {hits.map((h, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x(i),
              top: y(h.pity),
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <span style={{ ...eStyles.mono, fontSize: 9, color: pityColor(h.pity) }}>{h.pity}</span>
            <ConvFace key={`${h.name}-${h.time}`} f={h} size={34} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pity ring gauge ──────────────────────────────────────────────────
function ERing({ banner }: { banner: BannerStats }) {
  const R = 84;
  const C = 2 * Math.PI * R;
  const pct = Math.min(banner.currentPity5 / HARD_PITY, 1);
  const col = pityColor(banner.currentPity5);
  const softAngle = ((SOFT_PITY / HARD_PITY) * 360 - 90) * (Math.PI / 180);
  return (
    <div style={{ position: "relative", width: 190, height: 190, flexShrink: 0 }}>
      <svg width={190} height={190} viewBox="0 0 190 190">
        <circle cx={95} cy={95} r={R} fill="none" stroke={E_PAL.trackStrong} strokeWidth={10} />
        <circle
          cx={95}
          cy={95}
          r={R}
          fill="none"
          stroke={col}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${pct * C} ${C}`}
          transform="rotate(-90 95 95)"
          style={{ filter: `drop-shadow(0 0 8px ${col}88)`, transition: "stroke-dasharray 0.6s ease" }}
        />
        <line
          x1={95 + (R - 9) * Math.cos(softAngle)}
          y1={95 + (R - 9) * Math.sin(softAngle)}
          x2={95 + (R + 9) * Math.cos(softAngle)}
          y2={95 + (R + 9) * Math.sin(softAngle)}
          stroke={E_PAL.gold}
          strokeWidth={1.5}
          opacity={0.9}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <span style={{ ...eStyles.display, fontSize: 46, lineHeight: 1, color: col }}>{banner.currentPity5}</span>
        <span style={{ ...eStyles.mono, fontSize: 9, letterSpacing: 2, color: E_PAL.textMute }}>OF {HARD_PITY} PITY</span>
      </div>
    </div>
  );
}

export function EmberlineConvene() {
  const { summary, status } = usePulls();
  const [selType, setSelType] = useState<number | null>(null);

  const banners = useMemo(
    () => (summary?.banners ?? []).filter((b) => SHOWN_POOLS.has(b.cardPoolType)),
    [summary],
  );

  if (status === "loading") return <EStatusScreen text="Reading the ledger…" />;
  if (status === "error") return <EStatusScreen text="Pull data unavailable" />;
  if (status === "empty" || !summary || banners.length === 0) {
    return <EStatusScreen text="No convene history — run npm run convene" />;
  }

  const banner = banners.find((b) => b.cardPoolType === selType) ?? banners[0];
  const featured = banners.find((b) => b.cardPoolType === 1) ?? banner;
  const totalFourStars = summary.banners.reduce((a, b) => a + b.fourStarCount, 0);

  // Coinflip panel reads the selected pool when it flips coins, else the featured
  // pool. Guaranteed pulls are NOT coinflips — the design excludes them.
  const flipSource = is5050Pool(banner.cardPoolType) ? banner : featured;
  const flips = flipSource.fiveStars.filter((f) => f.won5050 !== undefined && !f.guaranteed);
  const lastFlip = flips[flips.length - 1];
  const flipRate = flipSource.winRate5050;
  const flipRead = flipRate == null ? "" : flipRate >= 0.5 ? "the ledger says blessed" : flipRate >= 0.4 ? "the ledger says fair" : "the ledger says cursed";

  const luck = luckLabel(banner.avgPity5);
  const luckColor =
    luck.tone === "cursed" ? E_PAL.pink : luck.tone === "average" ? E_PAL.gold : E_PAL.green;

  const nextLabel = banner.nextGuaranteed
    ? "Guaranteed"
    : is5050Pool(banner.cardPoolType)
      ? "50/50"
      : banner.cardPoolType === 2 || banner.cardPoolType === 11
        ? "Featured"
        : "Any 5★";

  const ledgerAll = [...banner.fiveStars].reverse();
  const ledger = ledgerAll.slice(0, LEDGER_CAP);
  const buckets = pityHistogram(banner.fiveStars);
  const bmax = Math.max(1, ...buckets.map((b) => b.count));

  const poolKicker = (b: BannerStats, i: number) => {
    const mode = is5050Pool(b.cardPoolType)
      ? "50/50"
      : b.cardPoolType === 3 || b.cardPoolType === 4
        ? "STANDARD"
        : "NO COINFLIP";
    return `POOL ${String(i + 1).padStart(2, "0")} · ${mode}`;
  };

  return (
    <EShell wash={CONVENE_WASH}>
      {/* header + KPIs */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, padding: "28px 34px 22px" }}>
        <div>
          <EKicker spacing={3} style={{ marginBottom: 8 }}>THE CONVENE LEDGER</EKicker>
          <div style={{ ...eStyles.display, fontSize: 52, lineHeight: 1 }}>
            Fortune, <span style={{ fontStyle: "italic", color: E_PAL.emberSoft }}>accounted for</span>.
          </div>
          <div style={{ ...eStyles.body, fontSize: 14, color: E_PAL.textDim, marginTop: 10 }}>
            {summary.totalPulls.toLocaleString()} convenes across {banners.length} pools — {summary.totalFiveStars} five-stars,{" "}
            {totalFourStars} four-stars, and one honest pity table.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(140px, 1fr))", gap: 12 }}>
          <EKpi
            label="TOTAL PULLS"
            value={summary.totalPulls.toLocaleString()}
            sub={`${(summary.totalPulls / HARD_PITY).toFixed(1)} hard pities`}
            accent={E_PAL.tide}
          />
          <EKpi
            label="ASTRITE SPENT"
            value={summary.totalAstrite.toLocaleString()}
            sub="160 per convene"
            accent={E_PAL.gold}
          />
          <EKpi
            label="FIVE-STARS"
            value={String(summary.totalFiveStars)}
            sub={`${totalFourStars} × 4★`}
            accent={E_PAL.green}
          />
          <EKpi
            label="FEATURED 50/50"
            value={
              featured.winRate5050 != null ? `${Math.round(featured.winRate5050 * 100)}%` : "—"
            }
            valueColor={
              featured.winRate5050 != null && featured.winRate5050 >= 0.5 ? E_PAL.green : E_PAL.pink
            }
            sub={`${featured.wins5050} won · ${featured.losses5050} lost`}
            accent={E_PAL.ember}
          />
        </div>
      </div>

      {/* pool selector */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(banners.length, 3)}, 1fr)`,
          gap: 14,
          padding: "0 34px 18px",
        }}
      >
        {banners.map((b, i) => {
          const active = b.cardPoolType === banner.cardPoolType;
          const col = pityColor(b.currentPity5);
          return (
            <div
              key={b.cardPoolType}
              onClick={() => setSelType(b.cardPoolType)}
              style={{
                position: "relative",
                padding: "16px 20px 18px",
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
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <EKicker size={9} spacing={2}>{poolKicker(b, i)}</EKicker>
                <div style={{ flex: 1 }} />
                <span style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.textMute }}>
                  {b.fiveStarCount}×5★ · {b.total}P
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 4 }}>
                <span style={{ ...eStyles.display, fontSize: 22, color: active ? E_PAL.text : E_PAL.textDim }}>
                  {b.name}
                </span>
                <div style={{ flex: 1 }} />
                <span style={{ ...eStyles.display, fontSize: 30, lineHeight: 1, color: col }}>
                  {b.currentPity5}
                </span>
                <span style={{ ...eStyles.mono, fontSize: 9, color: E_PAL.textMute }}>PITY</span>
              </div>
              <div style={{ position: "relative", height: 4, marginTop: 12, borderRadius: 999, background: E_PAL.track, overflow: "visible" }}>
                <div
                  style={{
                    width: `${Math.min((b.currentPity5 / HARD_PITY) * 100, 100)}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: col,
                    boxShadow: `0 0 10px ${col}55`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `${(SOFT_PITY / HARD_PITY) * 100}%`,
                    top: -3,
                    bottom: -3,
                    width: 1,
                    background: E_PAL.gold,
                    opacity: 0.8,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* main grid — minWidth: 0 on both columns so the wide constellation
          strip scrolls inside its card instead of blowing the grid open */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)", gap: 18, padding: "0 34px 28px" }}>
        {/* left: constellation + ledger */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <ECard style={{ padding: "18px 22px" }}>
            <ESectionTitle
              title="The Constellation"
              sub="every five-star, by pity"
              right={
                <EKicker size={9} spacing={1}>
                  {banner.name.toUpperCase()} · {banner.fiveStars.length} HITS
                </EKicker>
              }
            />
            {banner.fiveStars.length > 0 ? (
              <EConstellation banner={banner} />
            ) : (
              <div style={{ ...eStyles.mono, fontSize: 10, letterSpacing: 2, color: E_PAL.textFaint, padding: "60px 0", textAlign: "center" }}>
                NO FIVE-STARS IN THIS POOL YET
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8, ...eStyles.mono, fontSize: 9, letterSpacing: 1, color: E_PAL.textMute }}>
              {([
                ["WON 50/50", E_PAL.green],
                ["LOST 50/50", E_PAL.pink],
                ["GUARANTEED", E_PAL.gold],
              ] as const).map(([label, col]) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, border: `1px solid ${col}` }} />
                  {label}
                </span>
              ))}
              <div style={{ flex: 1 }} />
              <span>SOFT PITY {SOFT_PITY} · HARD PITY {HARD_PITY}</span>
            </div>
          </ECard>

          <ECard style={{ padding: "18px 22px" }}>
            <ESectionTitle
              title="Five-Star Ledger"
              right={
                <EKicker size={9} spacing={1}>
                  {ledgerAll.length > LEDGER_CAP
                    ? `NEWEST ${LEDGER_CAP} OF ${ledgerAll.length}`
                    : "NEWEST FIRST"}
                </EKicker>
              }
              style={{ marginBottom: 10 }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 18px" }}>
              {ledger.map((f, i) => {
                const oc = outcomeOf(f);
                const col = OUTCOME_COLOR[oc];
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: E_PAL.inset,
                      border: "1px solid rgba(140,220,225,0.07)",
                    }}
                  >
                    <span style={{ ...eStyles.display, fontSize: 22, minWidth: 34, textAlign: "right", color: pityColor(f.pity) }}>
                      {f.pity}
                    </span>
                    <ConvFace key={`${f.name}-${f.time}`} f={f} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          ...eStyles.body,
                          fontSize: 12.5,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {f.name}
                      </div>
                      <div style={{ ...eStyles.mono, fontSize: 8.5, color: E_PAL.textMute, marginTop: 1 }}>
                        {f.time.slice(0, 10)} · {f.resourceType.toUpperCase()}
                      </div>
                    </div>
                    <span
                      style={{
                        ...eStyles.mono,
                        fontSize: 8.5,
                        letterSpacing: 1,
                        padding: "3px 8px",
                        borderRadius: 999,
                        flexShrink: 0,
                        color: col,
                        background: `${col}1a`,
                      }}
                    >
                      {OUTCOME_TAG[oc]}
                    </span>
                  </div>
                );
              })}
            </div>
          </ECard>
        </div>

        {/* right: gauge + histogram + coinflips */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <ECard style={{ padding: "18px 22px" }}>
            <ESectionTitle title={banner.name} style={{ marginBottom: 6 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <ERing banner={banner} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${E_PAL.borderSoft}` }}>
                  <span style={{ ...eStyles.mono, fontSize: 10, letterSpacing: 1, color: E_PAL.textDim }}>AVG 5★ PITY</span>
                  <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ ...eStyles.mono, fontSize: 8.5, letterSpacing: 1, color: luckColor }}>
                      {luck.label.toUpperCase()}
                    </span>
                    <span style={{ ...eStyles.display, fontSize: 19, color: luckColor }}>
                      {banner.avgPity5 != null ? banner.avgPity5.toFixed(1) : "—"}
                    </span>
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${E_PAL.borderSoft}` }}>
                  <span style={{ ...eStyles.mono, fontSize: 10, letterSpacing: 1, color: E_PAL.textDim }}>LONGEST DRY</span>
                  <span style={{ ...eStyles.display, fontSize: 19 }}>{banner.longestDry}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${E_PAL.borderSoft}` }}>
                  <span style={{ ...eStyles.mono, fontSize: 10, letterSpacing: 1, color: E_PAL.textDim }}>FOUR-STARS</span>
                  <span style={{ ...eStyles.display, fontSize: 19 }}>{banner.fourStarCount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0" }}>
                  <span style={{ ...eStyles.mono, fontSize: 10, letterSpacing: 1, color: E_PAL.textDim }}>NEXT FIVE-STAR</span>
                  <span style={{ ...eStyles.display, fontSize: 19, color: nextLabel === "Guaranteed" ? E_PAL.gold : E_PAL.textDim }}>
                    {nextLabel}
                  </span>
                </div>
              </div>
            </div>
          </ECard>

          <ECard style={{ padding: "18px 22px" }}>
            <ESectionTitle
              title="Pity Distribution"
              right={<EKicker size={9}>1–{HARD_PITY}</EKicker>}
              style={{ marginBottom: 14 }}
            />
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 88 }}>
              {buckets.map((bk) => {
                const col = bk.lo <= 40 ? E_PAL.green : bk.lo <= 60 ? E_PAL.gold : E_PAL.pink;
                return (
                  <div key={bk.lo} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                    {bk.count > 0 && (
                      <span style={{ ...eStyles.mono, fontSize: 9, color: col, marginBottom: 3 }}>{bk.count}</span>
                    )}
                    <div
                      style={{
                        width: "100%",
                        height: `${(bk.count / bmax) * 100}%`,
                        minHeight: bk.count > 0 ? 4 : 0,
                        background: col,
                        opacity: bk.count > 0 ? 0.85 : 0,
                        borderRadius: "3px 3px 0 0",
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
              {buckets.map((bk) => (
                <span key={bk.lo} style={{ flex: 1, textAlign: "center", ...eStyles.mono, fontSize: 8, color: E_PAL.textMute }}>
                  {bk.lo}
                </span>
              ))}
            </div>
          </ECard>

          <ECard style={{ padding: "18px 22px" }}>
            <ESectionTitle
              title="The Coinflips"
              right={<EKicker size={9} spacing={1}>{flipSource.name.toUpperCase()}</EKicker>}
              style={{ marginBottom: 12 }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              {flips.map((f, i) => {
                const col = f.won5050 ? E_PAL.green : E_PAL.pink;
                return (
                  <div
                    key={i}
                    title={`${f.name} · pity ${f.pity}`}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ...eStyles.display,
                      fontSize: 15,
                      color: col,
                      background: `${col}14`,
                      border: `1px solid ${col}77`,
                      boxShadow: `0 0 10px ${col}33`,
                    }}
                  >
                    {f.won5050 ? "W" : "L"}
                  </div>
                );
              })}
            </div>
            {lastFlip && (
              <div style={{ ...eStyles.body, fontSize: 12, fontStyle: "italic", color: E_PAL.textDim, marginTop: 12 }}>
                {flipSource.wins5050} wins in {flips.length} coinflips — {flipRead}. Last flip: {lastFlip.name},{" "}
                {lastFlip.won5050 ? "won" : "lost"} at {lastFlip.pity}.
              </div>
            )}
          </ECard>
        </div>
      </div>

      <EFooter
        factoid="PITY IS SEQUENTIAL PER POOL · 50/50 LOSSES GUARANTEE THE NEXT FEATURED"
        updated={summary.lastSync ? new Date(summary.lastSync).toLocaleString() : "—"}
      />
    </EShell>
  );
}
