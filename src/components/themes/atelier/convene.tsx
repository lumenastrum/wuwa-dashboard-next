/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, type ReactNode } from "react";
import { usePulls } from "@/lib/use-pulls";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import { type BannerStats, luckLabel, pityHistogram } from "@/lib/convene-analytics";
import { HARD_PITY, SOFT_PITY } from "@/lib/convene-types";
import { portrait } from "@/lib/portraits";
import { A_PAL, aStyles } from "./styles";
import { ACard } from "./primitives";

// Light, editorial "almanac" spread. Legible-on-light hues (the shared STATUS
// greens/golds wash out on the paper background); the grade MATH still comes
// from the shared analytics libs — only the chrome is restyled.
const A_GOLD = "#a9801a";
const A_GREEN = "#1f9e6e";
const A_PINK = "#c8478a";

/** 5★ pity reads as fortune: low = green, soft-pity-band = gold, late = pink. */
function aPityColor(p: number): string {
  return p <= 48 ? A_GREEN : p <= SOFT_PITY ? A_GOLD : A_PINK;
}

const A_LUCK: Record<string, string> = {
  blessed: A_GREEN,
  lucky: A_GREEN,
  average: A_GOLD,
  cursed: A_PINK,
};

function StatusScreen({ text }: { text: string }) {
  return (
    <div style={aStyles.shell}>
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...aStyles.mono,
          fontSize: 12,
          letterSpacing: 2,
          color: A_PAL.textDim,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function AtelierConvene() {
  const { summary, status } = usePulls();
  const { isMobile, isTablet } = useDashboardViewport();
  const [sel, setSel] = useState(0);

  if (status === "loading") return <StatusScreen text="Reading the almanac…" />;
  if (status === "error") return <StatusScreen text="Pull data unavailable" />;
  if (status === "empty" || !summary || summary.banners.length === 0) {
    return <StatusScreen text="No convene data — run  npm run convene  to sync" />;
  }

  const banners = summary.banners;
  const banner = banners[Math.min(sel, banners.length - 1)];
  const featured = banners.find((b) => b.cardPoolType === 1);
  const totalFourStars = banners.reduce((a, b) => a + b.fourStarCount, 0);

  return (
    <div style={aStyles.shell}>
      <div style={{ padding: isMobile ? "22px 16px 30px" : isTablet ? "28px 28px" : "32px 48px" }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ ...aStyles.mono, fontSize: 10, color: A_PAL.textMute, letterSpacing: 2, marginBottom: 4 }}>
            THE CONVENE ALMANAC
          </div>
          <div style={{ ...aStyles.display, fontSize: isMobile ? 48 : 72, lineHeight: 0.95 }}>
            A complete ledger of <em style={{ fontStyle: "italic", color: A_PAL.textDim }}>luck.</em>
          </div>
          <div style={{ fontSize: 14, color: A_PAL.textDim, marginTop: 10, maxWidth: 720 }}>
            {summary.totalPulls.toLocaleString()} convenes across {banners.length} pools — {summary.totalFiveStars}{" "}
            five-stars, {totalFourStars} four-stars, {summary.totalAstrite.toLocaleString()} astrite, and no rounding up.
          </div>
        </div>

        {/* ── KPI band ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 0,
            marginBottom: 28,
            borderTop: `1px solid ${A_PAL.borderStrong}`,
            borderBottom: `1px solid ${A_PAL.borderStrong}`,
          }}
        >
          <AConvKpi
            i={0}
            isMobile={isMobile}
            label="Total pulls"
            value={summary.totalPulls.toLocaleString()}
            sub={`${(summary.totalPulls / HARD_PITY).toFixed(1)} hard pities`}
            accent={A_PAL.ink}
          />
          <AConvKpi i={1} isMobile={isMobile} label="Astrite spent" value={summary.totalAstrite.toLocaleString()} sub="in-game" accent={A_GOLD} />
          <AConvKpi i={2} isMobile={isMobile} label="Five-stars" value={String(summary.totalFiveStars)} sub={`${totalFourStars} × 4★`} accent={A_GREEN} />
          <AConvKpi
            i={3}
            isMobile={isMobile}
            label="Featured 50/50"
            value={featured?.winRate5050 != null ? `${Math.round(featured.winRate5050 * 100)}%` : "—"}
            sub={featured ? `${featured.wins5050} won · ${featured.losses5050} lost` : ""}
            accent={featured?.winRate5050 != null && featured.winRate5050 < 0.5 ? A_PINK : A_GREEN}
          />
        </div>

        {/* ── Banner selector ── */}
        <div
          style={{
            display: isMobile ? "flex" : "grid",
            gridTemplateColumns: `repeat(${banners.length}, 1fr)`,
            gap: 12,
            marginBottom: 28,
            overflowX: isMobile ? "auto" : "visible",
            paddingBottom: isMobile ? 2 : 0,
          }}
        >
          {banners.map((b, i) => {
            const active = i === sel;
            return (
              <div
                key={b.cardPoolType}
                onClick={() => setSel(i)}
                style={{
                  flex: isMobile ? "0 0 220px" : undefined,
                  padding: "16px 20px",
                  borderRadius: 14,
                  cursor: "pointer",
                  background: active ? A_PAL.surfaceStrong : A_PAL.surface,
                  border: `1px solid ${active ? A_PAL.ink : A_PAL.border}`,
                }}
              >
                <div style={{ ...aStyles.mono, fontSize: 10, color: A_PAL.textMute, letterSpacing: 1.5 }}>
                  POOL {String(b.cardPoolType).padStart(2, "0")}
                </div>
                <div style={{ ...aStyles.display, fontSize: 24, fontStyle: "italic", marginTop: 2, color: active ? A_PAL.ink : A_PAL.textDim }}>
                  {b.name}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 }}>
                  <div style={{ ...aStyles.display, fontSize: 32, color: active ? aPityColor(b.currentPity5) : A_PAL.ink }}>
                    {b.currentPity5}
                    <span style={{ ...aStyles.mono, fontSize: 11, color: A_PAL.textMute }}> pity</span>
                  </div>
                  <div style={{ ...aStyles.mono, fontSize: 10, color: A_PAL.textMute }}>
                    {b.fiveStarCount}×5★ · {b.total}p
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Selected banner detail ── */}
        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1.5fr 1fr", gap: isTablet ? 24 : 36 }}>
          {/* timeline */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 6,
                paddingBottom: 10,
                borderBottom: `1px solid ${A_PAL.borderStrong}`,
              }}
            >
              <div style={{ ...aStyles.display, fontSize: 30 }}>Five-star history</div>
              <div style={{ ...aStyles.mono, fontSize: 10, color: A_PAL.textMute, letterSpacing: 1 }}>
                {banner.name.toUpperCase()} · {banner.fiveStarCount} HITS
              </div>
            </div>
            {banner.fiveStarCount === 0 ? (
              <div style={{ fontSize: 13, color: A_PAL.textDim, padding: "12px 0", fontStyle: "italic" }}>
                Nothing yet — {banner.currentPity5} pulls deep on this pool.
              </div>
            ) : (
              [...banner.fiveStars].reverse().map((f, i) => {
                const isReso = f.resourceType === "Resonator";
                const col = aPityColor(f.pity);
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "13px 0",
                      borderBottom: `1px solid ${A_PAL.border}`,
                    }}
                  >
                    <div style={{ ...aStyles.display, fontSize: 30, color: col, minWidth: 42, textAlign: "right" }}>{f.pity}</div>
                    <APullAvatar key={f.name} name={f.name} isReso={isReso} color={col} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, color: A_PAL.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                      <div style={{ ...aStyles.mono, fontSize: 10, color: A_PAL.textMute, letterSpacing: 0.5, marginTop: 1 }}>
                        {f.time.slice(0, 10)} · {isReso ? "RESONATOR" : "WEAPON"}
                      </div>
                    </div>
                    {f.won5050 != null && (
                      <div
                        style={{
                          ...aStyles.mono,
                          fontSize: 10,
                          letterSpacing: 1.5,
                          padding: "4px 10px",
                          borderRadius: 999,
                          flexShrink: 0,
                          background: f.guaranteed ? `${A_GOLD}1c` : f.won5050 ? `${A_GREEN}1c` : `${A_PINK}1c`,
                          color: f.guaranteed ? A_GOLD : f.won5050 ? A_GREEN : A_PINK,
                        }}
                      >
                        {f.guaranteed ? "GUARANTEED" : f.won5050 ? "WON 50/50" : "LOST 50/50"}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* stats + distribution */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <ABannerStats banner={banner} />
            <AHistogram banner={banner} />
          </div>
        </div>

        {summary.lastSync && (
          <div style={{ ...aStyles.mono, fontSize: 10, color: A_PAL.textMute, letterSpacing: 1.5, marginTop: 20, textAlign: "right" }}>
            LAST SYNC · {new Date(summary.lastSync).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

function AConvKpi({
  label,
  value,
  sub,
  accent,
  i,
  isMobile,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  i: number;
  isMobile: boolean;
}) {
  // On the desktop band, every cell after the first gets a vertical rule. On
  // mobile the 2-col wrap means only the right column (odd index) needs one.
  const leftBorder = isMobile ? i % 2 === 1 : i > 0;
  return (
    <div style={{ padding: "18px 22px", borderLeft: leftBorder ? `1px solid ${A_PAL.border}` : "none", minWidth: 0 }}>
      <div style={{ ...aStyles.mono, fontSize: 10, color: A_PAL.textMute, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</div>
      <div style={{ ...aStyles.display, fontSize: 40, lineHeight: 1, marginTop: 6, color: accent }}>{value}</div>
      {sub && <div style={{ ...aStyles.mono, fontSize: 10, color: A_PAL.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/**
 * 5★ avatar: resonator portrait, falling back to an initial; weapons get a glyph.
 * Mounted with `key={name}` at the call site so the broken-image flag resets
 * naturally on banner switch (rather than poking state from an effect).
 */
function APullAvatar({ name, isReso, color }: { name: string; isReso: boolean; color: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        flexShrink: 0,
        overflow: "hidden",
        border: `1px solid ${color}`,
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!isReso ? (
        <span style={{ color: A_GOLD, fontSize: 16 }}>◈</span>
      ) : broken ? (
        <span style={{ ...aStyles.display, fontSize: 18, color }}>{name.charAt(0)}</span>
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

function AConvStatRow({
  label,
  value,
  accent = A_PAL.ink,
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
        borderBottom: last ? "none" : `1px solid ${A_PAL.border}`,
      }}
    >
      <span style={{ ...aStyles.mono, fontSize: 11, color: A_PAL.textDim, letterSpacing: 1 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        {tag && <span style={{ ...aStyles.mono, fontSize: 9, color: A_PAL.textMute, letterSpacing: 1 }}>{tag}</span>}
        <span style={{ ...aStyles.display, fontSize: 22, color: accent }}>{value}</span>
      </span>
    </div>
  );
}

function ABannerStats({ banner }: { banner: BannerStats }) {
  const luck = luckLabel(banner.avgPity5);
  const luckCol = A_LUCK[luck.tone] ?? A_GOLD;
  const pityPct = Math.min((banner.currentPity5 / HARD_PITY) * 100, 100);
  const softPct = (SOFT_PITY / HARD_PITY) * 100;

  return (
    <ACard>
      <div style={{ ...aStyles.display, fontSize: 26, marginBottom: 16 }}>This pool</div>
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            ...aStyles.mono,
            fontSize: 10,
            color: A_PAL.textMute,
            letterSpacing: 1,
            marginBottom: 6,
          }}
        >
          <span>CURRENT PITY</span>
          <span style={{ color: aPityColor(banner.currentPity5) }}>
            {banner.currentPity5} / {HARD_PITY}
          </span>
        </div>
        <div style={{ position: "relative", height: 6, background: "rgba(60,70,100,0.10)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${pityPct}%`, height: "100%", background: aPityColor(banner.currentPity5), borderRadius: 999 }} />
          <div style={{ position: "absolute", left: `${softPct}%`, top: -2, bottom: -2, width: 1, background: A_GOLD, opacity: 0.7 }} title="soft pity" />
        </div>
      </div>
      <AConvStatRow
        label="Average 5★ pity"
        value={banner.avgPity5 != null ? banner.avgPity5.toFixed(1) : "—"}
        accent={luckCol}
        tag={luck.label.toUpperCase()}
      />
      <AConvStatRow label="Longest dry streak" value={`${banner.longestDry}`} />
      <AConvStatRow label="Four-stars" value={String(banner.fourStarCount)} />
      {banner.cardPoolType === 1 ? (
        <AConvStatRow
          label="Next five-star"
          value={banner.nextGuaranteed ? "Guaranteed" : "50/50"}
          accent={banner.nextGuaranteed ? A_GOLD : A_PAL.textDim}
          last
        />
      ) : (
        <AConvStatRow label="Astrite on pool" value={banner.astrite.toLocaleString()} last />
      )}
    </ACard>
  );
}

function AHistogram({ banner }: { banner: BannerStats }) {
  const buckets = pityHistogram(banner.fiveStars);
  const bmax = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <ACard>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ ...aStyles.display, fontSize: 26 }}>Pity spread</div>
        <div style={{ ...aStyles.mono, fontSize: 9, color: A_PAL.textMute, letterSpacing: 1 }}>1–{HARD_PITY}</div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 96 }}>
        {buckets.map((bk) => {
          const h = (bk.count / bmax) * 100;
          const col = bk.lo <= 40 ? A_GREEN : bk.lo <= 60 ? A_GOLD : A_PINK;
          return (
            <div
              key={bk.range}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}
            >
              {bk.count > 0 && <div style={{ ...aStyles.mono, fontSize: 10, color: col, marginBottom: 3 }}>{bk.count}</div>}
              <div
                style={{
                  width: "100%",
                  height: `${h}%`,
                  minHeight: bk.count > 0 ? 4 : 0,
                  background: col,
                  opacity: bk.count > 0 ? 0.8 : 0,
                  borderRadius: "3px 3px 0 0",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {buckets.map((bk) => (
          <div key={bk.range} style={{ flex: 1, textAlign: "center", ...aStyles.mono, fontSize: 8, color: A_PAL.textMute }}>
            {bk.lo}
          </div>
        ))}
      </div>
    </ACard>
  );
}
