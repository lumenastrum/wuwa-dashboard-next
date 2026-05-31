/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { usePulls } from "@/lib/use-pulls";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import {
  type BannerStats,
  luckLabel,
  pityHistogram,
} from "@/lib/convene-analytics";
import { HARD_PITY, SOFT_PITY } from "@/lib/convene-types";
import { portrait } from "@/lib/portraits";
import { K_PAL, kStyles } from "./styles";
import { KPanel, KScanlines } from "./primitives";

/** 5★ pity is "good" when low (cyan), warns mid (amber), hurts late (magenta). */
function pityColor(pity: number): string {
  if (pity <= 48) return K_PAL.cyan;
  if (pity <= SOFT_PITY) return K_PAL.amber;
  return K_PAL.magenta;
}

const LUCK_TONE: Record<string, string> = {
  blessed: K_PAL.cyan,
  lucky: K_PAL.cyan,
  average: K_PAL.amber,
  cursed: K_PAL.magenta,
};

function dayOf(time: string): string {
  return time.slice(0, 10);
}

function StatusScreen({ text }: { text: string }) {
  return (
    <div style={kStyles.shell}>
      <KScanlines />
      <div
        style={{
          position: "relative",
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...kStyles.mono,
          fontSize: 12,
          letterSpacing: 2,
          color: K_PAL.textDim,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function ConsoleConvene() {
  const { summary, status } = usePulls();
  const { isMobile, isTablet } = useDashboardViewport();
  const [sel, setSel] = useState(0);

  if (status === "loading") return <StatusScreen text="SYNCING CONVENE…" />;
  if (status === "error") return <StatusScreen text="PULL DATA UNAVAILABLE" />;
  if (status === "empty" || !summary || summary.banners.length === 0) {
    return (
      <StatusScreen text="NO CONVENE DATA — RUN  npm run convene  TO SYNC" />
    );
  }

  const banners = summary.banners;
  const banner = banners[Math.min(sel, banners.length - 1)];
  const featured = banners.find((b) => b.cardPoolType === 1);
  const totalFourStars = banners.reduce((a, b) => a + b.fourStarCount, 0);

  return (
    <div style={kStyles.shell}>
      <KScanlines />
      <div
        style={{
          position: "relative",
          padding: isMobile ? "18px 16px 24px" : isTablet ? "22px 22px" : "24px 28px",
        }}
      >
        {/* ── Header ── */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ ...kStyles.mono, fontSize: 10, color: K_PAL.cyan, letterSpacing: 3, marginBottom: 4 }}>
            ◢ MODULE / CONVENE_HISTORY
          </div>
          <div style={{ ...kStyles.display, fontSize: isMobile ? 30 : 38, letterSpacing: 0 }}>
            Convene History &nbsp;<span style={{ color: K_PAL.cyan }}>{"//"}</span>&nbsp;{" "}
            <span style={{ color: K_PAL.textDim, fontSize: isMobile ? 18 : 22 }}>
              pulls={summary.totalPulls}
            </span>
          </div>
        </div>

        {/* ── Global KPI strip ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <KpiTile label="TOTAL PULLS" value={summary.totalPulls.toLocaleString()} accent={K_PAL.cyan} />
          <KpiTile label="ASTRITE" value={summary.totalAstrite.toLocaleString()} sub="in-game" accent={K_PAL.amber} />
          <KpiTile label="5★ PULLED" value={String(summary.totalFiveStars)} sub={`${totalFourStars} × 4★`} accent={K_PAL.cyan} />
          <KpiTile
            label="FEATURED 50/50"
            value={featured?.winRate5050 != null ? `${Math.round(featured.winRate5050 * 100)}%` : "—"}
            sub={featured ? `${featured.wins5050}W · ${featured.losses5050}L` : ""}
            accent={
              featured?.winRate5050 != null && featured.winRate5050 < 0.5
                ? K_PAL.magenta
                : K_PAL.cyan
            }
          />
        </div>

        {/* ── Banner selector ── */}
        <div
          style={{
            display: isMobile ? "flex" : "grid",
            gridTemplateColumns: `repeat(${banners.length}, 1fr)`,
            gap: 12,
            marginBottom: 14,
            overflowX: isMobile ? "auto" : "visible",
            paddingBottom: isMobile ? 2 : 0,
          }}
        >
          {banners.map((b, i) => {
            const active = i === sel;
            const pityCol = pityColor(b.currentPity5);
            const pityPct = Math.min((b.currentPity5 / HARD_PITY) * 100, 100);
            return (
              <KPanel
                key={b.cardPoolType}
                accent={active ? pityCol : K_PAL.border}
                style={{
                  padding: 14,
                  cursor: "pointer",
                  flex: isMobile ? "0 0 230px" : undefined,
                  background: active ? K_PAL.panelStrong : K_PAL.panel,
                  boxShadow: active ? `0 0 24px ${pityCol}18 inset, 0 0 22px rgba(0,0,0,0.28)` : "none",
                }}
                label={`POOL.${String(b.cardPoolType).padStart(2, "0")}`}
                code={`${b.total}p`}
              >
                <div onClick={() => setSel(i)}>
                  <div style={{ ...kStyles.display, fontSize: 18, color: active ? K_PAL.text : K_PAL.textDim }}>
                    {b.name}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 }}>
                    <div style={{ ...kStyles.mono, fontSize: 26, color: active ? pityCol : K_PAL.text, letterSpacing: 0 }}>
                      {b.currentPity5}
                    </div>
                    <div style={{ ...kStyles.mono, fontSize: 9, color: K_PAL.textMute, letterSpacing: 1.5 }}>
                      PITY · {b.fiveStarCount}×5★
                    </div>
                  </div>
                  <div style={{ position: "relative", height: 4, marginTop: 12, background: "rgba(120,220,255,0.08)", overflow: "hidden" }}>
                    <div style={{ width: `${pityPct}%`, height: "100%", background: pityCol, boxShadow: `0 0 10px ${pityCol}80` }} />
                    <div style={{ position: "absolute", left: `${(SOFT_PITY / HARD_PITY) * 100}%`, top: -3, bottom: -3, width: 1, background: K_PAL.amber, opacity: 0.85 }} />
                  </div>
                </div>
              </KPanel>
            );
          })}
        </div>

        {/* ── Selected banner detail ── */}
        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1.5fr 1fr", gap: 14 }}>
          {/* LEFT — 5★ timeline */}
          <KPanel label={`FIVE_STAR_LOG · ${banner.name.toUpperCase()}`} code={`${banner.fiveStarCount} HITS`} accent={K_PAL.magenta}>
            {banner.fiveStarCount === 0 ? (
              <div style={{ ...kStyles.mono, fontSize: 11, color: K_PAL.textDim, padding: "8px 0" }}>
                No 5★ on this banner yet · {banner.currentPity5} pulls deep
              </div>
            ) : (
              [...banner.fiveStars].reverse().map((f, i) => {
                const isReso = f.resourceType === "Resonator";
                const col = pityColor(f.pity);
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "9px 2px",
                      borderBottom: i < banner.fiveStars.length - 1 ? `1px solid ${K_PAL.border}` : "none",
                    }}
                  >
                    {/* pity badge */}
                    <div
                      style={{
                        ...kStyles.mono,
                        fontSize: 15,
                        color: col,
                        minWidth: 34,
                        textAlign: "right",
                        textShadow: `0 0 8px ${col}40`,
                      }}
                    >
                      {f.pity}
                    </div>
                    {/* portrait / glyph */}
                    <PullAvatar key={`${f.name}-${f.time}-${f.pity}`} name={f.name} isReso={isReso} color={col} />
                    {/* name + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: K_PAL.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {f.name}
                      </div>
                      <div style={{ ...kStyles.mono, fontSize: 9, color: K_PAL.textMute, letterSpacing: 1, marginTop: 1 }}>
                        {dayOf(f.time)} · {isReso ? "RESONATOR" : "WEAPON"}
                      </div>
                    </div>
                    {/* 50/50 tag */}
                    {f.won5050 != null && (
                      <div
                        style={{
                          ...kStyles.mono,
                          fontSize: 9,
                          letterSpacing: 1.5,
                          padding: "2px 7px",
                          flexShrink: 0,
                          background: f.guaranteed
                            ? "rgba(255,201,122,0.12)"
                            : f.won5050
                              ? "rgba(126,224,255,0.12)"
                              : "rgba(255,109,184,0.14)",
                          color: f.guaranteed ? K_PAL.amber : f.won5050 ? K_PAL.cyan : K_PAL.magenta,
                        }}
                      >
                        {f.guaranteed ? "GUAR" : f.won5050 ? "WIN" : "LOSS"}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </KPanel>

          {/* RIGHT — stats + distribution */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <BannerStatsPanel banner={banner} />
            <HistogramPanel banner={banner} />
          </div>
        </div>

        {summary.lastSync && (
          <div style={{ ...kStyles.mono, fontSize: 9, color: K_PAL.textMute, letterSpacing: 1.5, marginTop: 14, textAlign: "right" }}>
            LAST SYNC · {new Date(summary.lastSync).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

/** 5★ avatar: resonator portrait, falling back to an initial; weapons get a glyph. */
function PullAvatar({ name, isReso, color }: { name: string; isReso: boolean; color: string }) {
  const [broken, setBroken] = useState(false);

  return (
    <div
      style={{
        width: 30,
        height: 30,
        flexShrink: 0,
        overflow: "hidden",
        border: `1px solid ${color}50`,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!isReso ? (
        <span style={{ color: K_PAL.amber, fontSize: 13 }}>◈</span>
      ) : broken ? (
        <span style={{ ...kStyles.mono, fontSize: 13, color }}>{name.charAt(0)}</span>
      ) : (
        <img
          src={portrait(name)}
          alt={name}
          onError={() => setBroken(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
        />
      )}
    </div>
  );
}

function KpiTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <KPanel accent={accent} style={{ padding: 14 }}>
      <div style={{ ...kStyles.mono, fontSize: 9, color: K_PAL.textMute, letterSpacing: 2, marginBottom: 6 }}>{label}</div>
      <div style={{ ...kStyles.mono, fontSize: 26, color: accent, letterSpacing: 0, textShadow: `0 0 10px ${accent}30` }}>{value}</div>
      {sub && <div style={{ ...kStyles.mono, fontSize: 9, color: K_PAL.textDim, letterSpacing: 1, marginTop: 3 }}>{sub}</div>}
    </KPanel>
  );
}

function BannerStatsPanel({ banner }: { banner: BannerStats }) {
  const luck = luckLabel(banner.avgPity5);
  const luckCol = LUCK_TONE[luck.tone] ?? K_PAL.amber;
  const pityPct = Math.min((banner.currentPity5 / HARD_PITY) * 100, 100);
  const softPct = (SOFT_PITY / HARD_PITY) * 100;

  return (
    <KPanel label="BANNER_STATS" code={`P.${String(banner.cardPoolType).padStart(2, "0")}`} accent={K_PAL.cyan}>
      {/* current pity bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", ...kStyles.mono, fontSize: 9, color: K_PAL.textMute, letterSpacing: 1.5, marginBottom: 5 }}>
          <span>CURRENT PITY</span>
          <span style={{ color: pityColor(banner.currentPity5) }}>{banner.currentPity5} / {HARD_PITY}</span>
        </div>
        <div style={{ position: "relative", height: 6, background: "rgba(120,220,255,0.06)" }}>
          <div style={{ width: `${pityPct}%`, height: "100%", background: pityColor(banner.currentPity5) }} />
          <div style={{ position: "absolute", left: `${softPct}%`, top: -2, bottom: -2, width: 1, background: K_PAL.amber, opacity: 0.6 }} title="soft pity" />
        </div>
      </div>

      {/* stat rows */}
      <StatRow label="AVG 5★ PITY" value={banner.avgPity5 != null ? banner.avgPity5.toFixed(1) : "—"} accent={luckCol} tag={luck.label} />
      <StatRow label="LONGEST DRY" value={`${banner.longestDry} pulls`} />
      <StatRow label="4★ COUNT" value={String(banner.fourStarCount)} />
      <StatRow label="TOTAL / ASTRITE" value={`${banner.total} · ${banner.astrite.toLocaleString()}`} />
      {banner.cardPoolType === 1 && (
        <>
          <StatRow
            label="50/50 WIN RATE"
            value={banner.winRate5050 != null ? `${Math.round(banner.winRate5050 * 100)}%` : "—"}
            accent={banner.winRate5050 != null && banner.winRate5050 < 0.5 ? K_PAL.magenta : K_PAL.cyan}
            tag={`${banner.wins5050}W·${banner.losses5050}L`}
          />
          <StatRow
            label="NEXT 5★"
            value={banner.nextGuaranteed ? "GUARANTEED" : "50/50"}
            accent={banner.nextGuaranteed ? K_PAL.amber : K_PAL.textDim}
            last
          />
        </>
      )}
    </KPanel>
  );
}

function StatRow({ label, value, accent = K_PAL.text, tag, last }: { label: string; value: string; accent?: string; tag?: string; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "7px 0",
        borderBottom: last ? "none" : `1px solid ${K_PAL.border}`,
      }}
    >
      <div style={{ ...kStyles.mono, fontSize: 10, color: K_PAL.textDim, letterSpacing: 1 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {tag && <span style={{ ...kStyles.mono, fontSize: 9, color: K_PAL.textMute, letterSpacing: 1 }}>{tag}</span>}
        <span style={{ ...kStyles.mono, fontSize: 13, color: accent }}>{value}</span>
      </div>
    </div>
  );
}

function HistogramPanel({ banner }: { banner: BannerStats }) {
  const buckets = pityHistogram(banner.fiveStars);
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <KPanel label="PITY_DISTRIBUTION" code="1–80" accent={K_PAL.amber}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 110, paddingTop: 6 }}>
        {buckets.map((bk) => {
          const h = (bk.count / max) * 100;
          const lo = bk.lo;
          const col = lo <= 40 ? K_PAL.cyan : lo <= 60 ? K_PAL.amber : K_PAL.magenta;
          return (
            <div key={bk.range} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
              {bk.count > 0 && (
                <div style={{ ...kStyles.mono, fontSize: 9, color: col, marginBottom: 3 }}>{bk.count}</div>
              )}
              <div
                style={{
                  width: "100%",
                  height: `${h}%`,
                  minHeight: bk.count > 0 ? 3 : 0,
                  background: col,
                  opacity: bk.count > 0 ? 0.85 : 0,
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
        {buckets.map((bk) => (
          <div key={bk.range} style={{ flex: 1, textAlign: "center", ...kStyles.mono, fontSize: 7.5, color: K_PAL.textMute, letterSpacing: -0.5 }}>
            {bk.lo}
          </div>
        ))}
      </div>
    </KPanel>
  );
}
