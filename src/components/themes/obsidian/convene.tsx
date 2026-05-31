/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, type ReactNode } from "react";
import { usePulls } from "@/lib/use-pulls";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import { type BannerStats, luckLabel, pityHistogram } from "@/lib/convene-analytics";
import { HARD_PITY, SOFT_PITY } from "@/lib/convene-types";
import { portrait } from "@/lib/portraits";
import { O_PAL, oStyles } from "./styles";
import { OCard } from "./primitives";

// Jewel-toned editorial "ledger" — distinct from Console's HUD. Quality/luck
// hues live local to this theme (the shared STATUS palette is too cool for the
// gold-leaf voice); the grade MATH still comes from the shared analytics libs.
const O_GREEN = "#5fe1b3";
const O_PINK = "#e2589d";
const O_GOLD = O_PAL.accent;

/** 5★ pity reads as fortune: low = green, soft-pity-band = gold, late = pink. */
function oPityColor(p: number): string {
  return p <= 48 ? O_GREEN : p <= SOFT_PITY ? O_GOLD : O_PINK;
}

const O_LUCK: Record<string, string> = {
  blessed: O_GREEN,
  lucky: O_GREEN,
  average: O_GOLD,
  cursed: O_PINK,
};

function StatusScreen({ text }: { text: string }) {
  return (
    <div style={oStyles.shell}>
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...oStyles.mono,
          fontSize: 12,
          letterSpacing: 2,
          color: O_PAL.textDim,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function ObsidianConvene() {
  const { summary, status } = usePulls();
  const { isMobile, isTablet } = useDashboardViewport();
  const [sel, setSel] = useState(0);

  if (status === "loading") return <StatusScreen text="Reading the ledger…" />;
  if (status === "error") return <StatusScreen text="Pull data unavailable" />;
  if (status === "empty" || !summary || summary.banners.length === 0) {
    return <StatusScreen text="No convene data — run  npm run convene  to sync" />;
  }

  const banners = summary.banners;
  const banner = banners[Math.min(sel, banners.length - 1)];
  const featured = banners.find((b) => b.cardPoolType === 1);
  const totalFourStars = banners.reduce((a, b) => a + b.fourStarCount, 0);

  return (
    <div style={oStyles.shell}>
      <div style={{ padding: isMobile ? "20px 16px 28px" : isTablet ? "24px 24px" : "28px 32px" }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...oStyles.mono, fontSize: 11, color: O_PAL.textMute, letterSpacing: 2, marginBottom: 6 }}>
            THE CONVENE LEDGER
          </div>
          <div style={{ ...oStyles.display, fontSize: isMobile ? 38 : 52, lineHeight: 1 }}>
            Fortune, <em style={{ fontStyle: "italic", color: O_GOLD }}>accounted for.</em>
          </div>
          <div style={{ fontSize: 14, color: O_PAL.textDim, marginTop: 8 }}>
            {summary.totalPulls.toLocaleString()} convenes across {banners.length} pools — {summary.totalFiveStars}{" "}
            five-stars, {totalFourStars} four-stars, and one honest pity table.
          </div>
        </div>

        {/* ── Global KPI strip ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <OConvKpi
            label="Total pulls"
            value={summary.totalPulls.toLocaleString()}
            sub={`${(summary.totalPulls / HARD_PITY).toFixed(1)} hard pities`}
            accent={O_PAL.text}
          />
          <OConvKpi label="Astrite spent" value={summary.totalAstrite.toLocaleString()} sub="in-game currency" accent={O_GOLD} />
          <OConvKpi label="Five-stars" value={String(summary.totalFiveStars)} sub={`${totalFourStars} × 4★`} accent={O_GREEN} />
          <OConvKpi
            label="Featured 50/50"
            value={featured?.winRate5050 != null ? `${Math.round(featured.winRate5050 * 100)}%` : "—"}
            sub={featured ? `${featured.wins5050} won · ${featured.losses5050} lost` : ""}
            accent={featured?.winRate5050 != null && featured.winRate5050 < 0.5 ? O_PINK : O_GREEN}
          />
        </div>

        {/* ── Banner selector ── */}
        <div
          style={{
            display: isMobile ? "flex" : "grid",
            gridTemplateColumns: `repeat(${banners.length}, 1fr)`,
            gap: 12,
            marginBottom: 20,
            overflowX: isMobile ? "auto" : "visible",
            paddingBottom: isMobile ? 2 : 0,
          }}
        >
          {banners.map((b, i) => {
            const active = i === sel;
            const pityCol = oPityColor(b.currentPity5);
            const pityPct = Math.min((b.currentPity5 / HARD_PITY) * 100, 100);
            return (
              <div
                key={b.cardPoolType}
                onClick={() => setSel(i)}
                style={{
                  flex: isMobile ? "0 0 220px" : undefined,
                  padding: "16px 20px",
                  borderRadius: 14,
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  background: active
                    ? `linear-gradient(180deg, ${pityCol}16, rgba(255,255,255,0.03)), ${O_PAL.surface}`
                    : O_PAL.surface,
                  border: `1px solid ${active ? `${pityCol}80` : O_PAL.border}`,
                  boxShadow: active ? `inset 0 0 0 1px ${pityCol}22, 0 18px 40px rgba(0,0,0,0.18)` : "none",
                }}
              >
                <div style={{ ...oStyles.mono, fontSize: 10, color: O_PAL.textMute, letterSpacing: 1.5 }}>
                  POOL {String(b.cardPoolType).padStart(2, "0")}
                </div>
                <div style={{ ...oStyles.display, fontSize: 22, marginTop: 2, color: active ? O_PAL.text : O_PAL.textDim }}>
                  {b.name}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 }}>
                  <div style={{ ...oStyles.display, fontSize: 30, color: active ? pityCol : O_PAL.text }}>
                    {b.currentPity5}
                    <span style={{ fontSize: 13, color: O_PAL.textMute }}> pity</span>
                  </div>
                  <div style={{ ...oStyles.mono, fontSize: 10, color: O_PAL.textMute }}>
                    {b.fiveStarCount}×5★ · {b.total}p
                  </div>
                </div>
                <div style={{ position: "relative", height: 5, marginTop: 14, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ width: `${pityPct}%`, height: "100%", borderRadius: 999, background: pityCol }} />
                  <div style={{ position: "absolute", left: `${(SOFT_PITY / HARD_PITY) * 100}%`, top: -3, bottom: -3, width: 1, background: O_GOLD, opacity: 0.8 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Selected banner detail ── */}
        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1.5fr 1fr", gap: 18 }}>
          {/* 5★ timeline */}
          <OCard>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <div style={{ ...oStyles.display, fontSize: 24 }}>Five-star history</div>
              <div style={{ ...oStyles.mono, fontSize: 10, color: O_PAL.textMute, letterSpacing: 1 }}>
                {banner.name.toUpperCase()} · {banner.fiveStarCount} HITS
              </div>
            </div>
            {banner.fiveStarCount === 0 ? (
              <div style={{ fontSize: 13, color: O_PAL.textDim, padding: "10px 0", fontStyle: "italic" }}>
                Nothing yet — {banner.currentPity5} pulls deep on this pool.
              </div>
            ) : (
              [...banner.fiveStars].reverse().map((f, i) => {
                const isReso = f.resourceType === "Resonator";
                const col = oPityColor(f.pity);
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "11px 0",
                      borderBottom: i < banner.fiveStars.length - 1 ? `1px solid ${O_PAL.border}` : "none",
                    }}
                  >
                    <div style={{ ...oStyles.display, fontSize: 28, color: col, minWidth: 42, textAlign: "right" }}>{f.pity}</div>
                    <OPullAvatar key={f.name} name={f.name} isReso={isReso} color={col} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                      <div style={{ ...oStyles.mono, fontSize: 10, color: O_PAL.textMute, letterSpacing: 0.5, marginTop: 1 }}>
                        {f.time.slice(0, 10)} · {isReso ? "RESONATOR" : "WEAPON"}
                      </div>
                    </div>
                    {f.won5050 != null && (
                      <div
                        style={{
                          ...oStyles.mono,
                          fontSize: 10,
                          letterSpacing: 1.5,
                          padding: "4px 10px",
                          borderRadius: 999,
                          flexShrink: 0,
                          background: f.guaranteed
                            ? "rgba(233,212,155,0.14)"
                            : f.won5050
                              ? "rgba(95,225,179,0.14)"
                              : "rgba(226,88,157,0.16)",
                          color: f.guaranteed ? O_GOLD : f.won5050 ? O_GREEN : O_PINK,
                        }}
                      >
                        {f.guaranteed ? "GUARANTEED" : f.won5050 ? "WON 50/50" : "LOST 50/50"}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </OCard>

          {/* stats + distribution */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <OBannerStats banner={banner} />
            <OHistogram banner={banner} />
          </div>
        </div>

        {summary.lastSync && (
          <div style={{ ...oStyles.mono, fontSize: 10, color: O_PAL.textMute, letterSpacing: 1.5, marginTop: 18, textAlign: "right" }}>
            LAST SYNC · {new Date(summary.lastSync).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

function OConvKpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div
      style={{
        padding: "18px 22px",
        borderRadius: 14,
        position: "relative",
        overflow: "hidden",
        background: O_PAL.surface,
        border: `1px solid ${O_PAL.border}`,
        backdropFilter: "blur(12px)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 100% 0%, ${accent}1f, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ ...oStyles.mono, fontSize: 10, color: O_PAL.textMute, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</div>
      <div style={{ ...oStyles.display, fontSize: 38, lineHeight: 1, marginTop: 6, color: accent }}>{value}</div>
      {sub && <div style={{ ...oStyles.mono, fontSize: 10, color: O_PAL.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/**
 * 5★ avatar: resonator portrait, falling back to an initial; weapons get a glyph.
 * Mounted with `key={name}` at the call site so the broken-image flag resets
 * naturally on banner switch (rather than poking state from an effect).
 */
function OPullAvatar({ name, isReso, color }: { name: string; isReso: boolean; color: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        flexShrink: 0,
        overflow: "hidden",
        border: `1px solid ${color}80`,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!isReso ? (
        <span style={{ color: O_GOLD, fontSize: 16 }}>◈</span>
      ) : broken ? (
        <span style={{ ...oStyles.display, fontSize: 18, color }}>{name.charAt(0)}</span>
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

function OConvStatRow({
  label,
  value,
  accent = O_PAL.text,
  tag,
  last,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
  tag?: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "11px 0",
        borderBottom: last ? "none" : `1px solid ${O_PAL.border}`,
      }}
    >
      <span style={{ ...oStyles.mono, fontSize: 11, color: O_PAL.textDim, letterSpacing: 1 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        {tag && <span style={{ ...oStyles.mono, fontSize: 9, color: O_PAL.textMute, letterSpacing: 1 }}>{tag}</span>}
        <span style={{ ...oStyles.display, fontSize: 20, color: accent }}>{value}</span>
      </span>
    </div>
  );
}

function OBannerStats({ banner }: { banner: BannerStats }) {
  const luck = luckLabel(banner.avgPity5);
  const luckCol = O_LUCK[luck.tone] ?? O_GOLD;
  const pityPct = Math.min((banner.currentPity5 / HARD_PITY) * 100, 100);
  const softPct = (SOFT_PITY / HARD_PITY) * 100;

  return (
    <OCard>
      <div style={{ ...oStyles.display, fontSize: 22, marginBottom: 16 }}>This pool</div>
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            ...oStyles.mono,
            fontSize: 10,
            color: O_PAL.textMute,
            letterSpacing: 1,
            marginBottom: 6,
          }}
        >
          <span>CURRENT PITY</span>
          <span style={{ color: oPityColor(banner.currentPity5) }}>
            {banner.currentPity5} / {HARD_PITY}
          </span>
        </div>
        <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${pityPct}%`, height: "100%", background: oPityColor(banner.currentPity5), borderRadius: 999 }} />
          <div style={{ position: "absolute", left: `${softPct}%`, top: -2, bottom: -2, width: 1, background: O_GOLD, opacity: 0.7 }} title="soft pity" />
        </div>
      </div>
      <OConvStatRow
        label="Average 5★ pity"
        value={banner.avgPity5 != null ? banner.avgPity5.toFixed(1) : "—"}
        accent={luckCol}
        tag={luck.label.toUpperCase()}
      />
      <OConvStatRow label="Longest dry streak" value={`${banner.longestDry}`} />
      <OConvStatRow label="Four-stars" value={String(banner.fourStarCount)} />
      {banner.cardPoolType === 1 ? (
        <OConvStatRow
          label="Next five-star"
          value={banner.nextGuaranteed ? "Guaranteed" : "50/50"}
          accent={banner.nextGuaranteed ? O_GOLD : O_PAL.textDim}
          last
        />
      ) : (
        <OConvStatRow label="Astrite on pool" value={banner.astrite.toLocaleString()} last />
      )}
    </OCard>
  );
}

function OHistogram({ banner }: { banner: BannerStats }) {
  const buckets = pityHistogram(banner.fiveStars);
  const bmax = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <OCard>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ ...oStyles.display, fontSize: 22 }}>Pity distribution</div>
        <div style={{ ...oStyles.mono, fontSize: 9, color: O_PAL.textMute, letterSpacing: 1 }}>1–{HARD_PITY}</div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 96 }}>
        {buckets.map((bk) => {
          const h = (bk.count / bmax) * 100;
          const col = bk.lo <= 40 ? O_GREEN : bk.lo <= 60 ? O_GOLD : O_PINK;
          return (
            <div
              key={bk.range}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}
            >
              {bk.count > 0 && <div style={{ ...oStyles.mono, fontSize: 10, color: col, marginBottom: 3 }}>{bk.count}</div>}
              <div
                style={{
                  width: "100%",
                  height: `${h}%`,
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
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {buckets.map((bk) => (
          <div key={bk.range} style={{ flex: 1, textAlign: "center", ...oStyles.mono, fontSize: 8, color: O_PAL.textMute }}>
            {bk.lo}
          </div>
        ))}
      </div>
    </OCard>
  );
}
