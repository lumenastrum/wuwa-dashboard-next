/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { fiveStarIcon, portrait } from "@/lib/portraits";
import type { Status } from "@/lib/types";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import { E_PAL, E_STATUS, eStyles } from "./styles";

// 7px rotated square — the theme's signature ornament, pinned to panel corners.
export function EDiamond({
  color = E_PAL.tide,
  size = 7,
  corner,
  style,
}: {
  color?: string;
  size?: number;
  corner?: "tl" | "tr";
  style?: CSSProperties;
}) {
  const pos: CSSProperties = corner
    ? {
        position: "absolute",
        top: -Math.ceil(size / 2) - 1,
        ...(corner === "tl" ? { left: -Math.ceil(size / 2) - 1 } : { right: -Math.ceil(size / 2) - 1 }),
      }
    : {};
  return (
    <div
      style={{
        width: size,
        height: size,
        transform: "rotate(45deg)",
        background: color,
        flexShrink: 0,
        ...pos,
        ...style,
      }}
    />
  );
}

// Card panel — 8px radius, 1px border, panel bg, corner diamond top-left
// (top-right too on major panels).
export function ECard({
  children,
  style,
  diamonds = "tl",
  accent = E_PAL.tide,
}: {
  children: ReactNode;
  style?: CSSProperties;
  diamonds?: "tl" | "both" | "none";
  accent?: string;
}) {
  const { isMobile } = useDashboardViewport();
  return (
    <div
      style={{
        position: "relative",
        border: `1px solid ${E_PAL.border}`,
        borderRadius: 8,
        background: E_PAL.panel,
        padding: isMobile ? "14px 16px" : "18px 20px",
        minWidth: 0,
        ...style,
      }}
    >
      {diamonds !== "none" && <EDiamond corner="tl" color={accent} />}
      {diamonds === "both" && <EDiamond corner="tr" color={accent} />}
      {children}
    </div>
  );
}

// Display-face section title + gradient hairline flexed to fill + optional slots.
export function ESectionTitle({
  title,
  sub,
  right,
  size = 22,
  color = E_PAL.text,
  style,
}: {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, ...style }}>
      <div style={{ ...eStyles.display, fontSize: size, color }}>{title}</div>
      {sub && <div style={{ ...eStyles.body, fontSize: 12, color: E_PAL.textDim }}>{sub}</div>}
      <div style={eStyles.rule} />
      {right}
    </div>
  );
}

// Mono uppercase kicker line.
export function EKicker({
  children,
  color = E_PAL.textMute,
  spacing = 2,
  size = 10,
  style,
}: {
  children: ReactNode;
  color?: string;
  spacing?: number;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <div style={{ ...eStyles.mono, fontSize: size, letterSpacing: spacing, color, ...style }}>
      {children}
    </div>
  );
}

export function EStatusDot({ status, size = 6, glow = true }: { status: Status; size?: number; glow?: boolean }) {
  const hex = E_STATUS[status] ?? E_STATUS.neutral;
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        flexShrink: 0,
        background: hex,
        boxShadow: glow ? `0 0 8px ${hex}99` : undefined,
        display: "inline-block",
      }}
    />
  );
}

// The source art is Kuro's five-pip strip. Clip it to the resonator's actual
// rarity so four-stars keep the same Emberline treatment without lying.
export function ERarityPips({ rarity = 5, height = 14 }: { rarity?: 4 | 5; height?: number }) {
  const fullWidth = height * (74 / 16);
  const pipCount = rarity === 4 ? 4 : 5;
  return (
    <span
      role="img"
      aria-label={`${pipCount}★`}
      style={{ display: "inline-block", width: fullWidth * (pipCount / 5), height, overflow: "hidden", flexShrink: 0 }}
    >
      <img src={fiveStarIcon()} alt="" aria-hidden="true" style={{ display: "block", width: fullWidth, height }} />
    </span>
  );
}

// Portrait face with letter-tile fallback (teal tint + display-face initial) for
// roster members without art (e.g. Sanhua, Nyx in benchmark lineups).
export function EFace({
  name,
  size = 24,
  radius = 6,
  border = "rgba(140,220,225,0.25)",
  style,
}: {
  name: string;
  size?: number;
  radius?: number;
  border?: string;
  style?: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        title={name}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          flexShrink: 0,
          border: `1px solid ${border}`,
          background: "rgba(140,220,225,0.08)",
          color: E_PAL.tide,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...eStyles.display,
          fontSize: Math.round(size * 0.45),
          ...style,
        }}
      >
        {name.charAt(0)}
      </div>
    );
  }
  return (
    <img
      src={portrait(name)}
      alt={name}
      title={name}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: "cover",
        objectPosition: "center 20%",
        flexShrink: 0,
        background: "rgba(0,0,0,0.4)",
        border: `1px solid ${border}`,
        ...style,
      }}
    />
  );
}

// Footer strip: mono 9px factoid · gradient hairline · UPDATED date.
export function EFooter({ factoid, updated }: { factoid: string; updated: string }) {
  const { isMobile } = useDashboardViewport();
  if (isMobile) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "0 16px calc(18px + env(safe-area-inset-bottom))",
          ...eStyles.mono,
          fontSize: 9,
          letterSpacing: 2,
          color: E_PAL.textFaint,
        }}
      >
        <span style={{ lineHeight: 1.6 }}>{factoid}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(140,220,225,0.12), transparent)" }} />
          <span style={{ whiteSpace: "nowrap" }}>UPDATED {updated}</span>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 34px 22px",
        ...eStyles.mono,
        fontSize: 9,
        letterSpacing: 2,
        color: E_PAL.textFaint,
      }}
    >
      <span>{factoid}</span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(140,220,225,0.12), transparent)" }} />
      <span>UPDATED {updated}</span>
    </div>
  );
}

// Page shell — bg gradient + optional extra wash, min-width 1280 per spec.
export function EShell({ children, wash }: { children: ReactNode; wash?: string }) {
  const { isMobile, isTablet } = useDashboardViewport();
  return (
    <div
      style={{
        ...eStyles.shell,
        minWidth: (isMobile || isTablet) ? 0 : 1280,
        // clip (NOT hidden) so a stray-wide child can't spawn a page h-scroll,
        // without creating a scroll container. Belt-and-suspenders on mobile.
        overflowX: isMobile ? "clip" : undefined,
        background: wash ? `${wash}, ${E_PAL.bgGrad}` : `${E_PAL.wash}, ${E_PAL.bgGrad}`,
      }}
    >
      {children}
    </div>
  );
}

// Small KPI tile with accent corner diamond + accent sub-line.
export function EKpi({
  label,
  value,
  sub,
  accent,
  valueColor = E_PAL.text,
  style,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent: string;
  valueColor?: string;
  style?: CSSProperties;
}) {
  const { isMobile } = useDashboardViewport();
  return (
    <div
      style={{
        position: "relative",
        border: `1px solid ${E_PAL.borderKpi}`,
        borderRadius: 6,
        background: E_PAL.panelStrong,
        padding: isMobile ? "12px 14px" : "14px 16px",
        minWidth: 0,
        ...style,
      }}
    >
      <EDiamond corner="tl" color={accent} />
      <EKicker size={9} spacing={2}>{label}</EKicker>
      <div style={{ ...eStyles.display, fontSize: isMobile ? 25 : 30, marginTop: 4, color: valueColor, lineHeight: 1.15 }}>
        {value}
      </div>
      {sub && (
        <div style={{ ...eStyles.mono, fontSize: 9, color: accent, marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}
