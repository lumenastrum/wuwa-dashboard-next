"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { useTheme } from "@/lib/theme-context";
import { useData } from "@/lib/data-context";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import { resonatorPath } from "@/lib/route-name";
import type { PageId } from "@/lib/types";
import { E_PAL, eStyles } from "./styles";
import { EDiamond } from "./primitives";

const SYNC_LABEL: Record<string, { dot: string; text: string; color: string }> = {
  live:    { dot: "●", text: "LIVE",   color: E_PAL.green },
  saving:  { dot: "◐", text: "SAVING", color: E_PAL.tide },
  local:   { dot: "○", text: "LOCAL",  color: E_PAL.yellow },
  error:   { dot: "✕", text: "ERROR",  color: E_PAL.red },
  loading: { dot: "·", text: "SYNC",   color: E_PAL.textMute },
};

const NAV: { id: PageId; label: string; href: string }[] = [
  { id: "roster",    label: "ROSTER",    href: "/" },
  { id: "resonator", label: "RESONATOR", href: "" }, // dynamic, filled in below
  { id: "teams",     label: "TEAMS",     href: "/teams" },
  { id: "cycles",    label: "CYCLES",    href: "/cycles" },
  { id: "toa",       label: "TOWER",     href: "/toa" },
  { id: "wastes",    label: "WASTES",    href: "/wastes" },
  { id: "convene",   label: "CONVENE",   href: "/convene" },
];

function activePage(pathname: string): PageId {
  if (pathname === "/" || pathname === "") return "roster";
  if (pathname.startsWith("/r/")) return "resonator";
  if (pathname.startsWith("/teams")) return "teams";
  if (pathname.startsWith("/cycles")) return "cycles";
  if (pathname.startsWith("/toa")) return "toa";
  if (pathname.startsWith("/wastes")) return "wastes";
  if (pathname.startsWith("/convene")) return "convene";
  return "roster";
}

export function EmberlineTopBar() {
  const pathname = usePathname() ?? "/";
  const active = activePage(pathname);
  const { lastResonator } = useTheme();
  const { syncStatus } = useData();
  const sync = SYNC_LABEL[syncStatus] ?? SYNC_LABEL.loading;
  const { isTablet } = useDashboardViewport();
  const isCompact = isTablet;

  // Sticky/backdrop chrome is invariant across branches (no fixed-position
  // children inside — backdropFilter containing-block trap).
  const rootBase: CSSProperties = {
    borderBottom: "1px solid rgba(140,220,225,0.10)",
    background: "rgba(5,15,21,0.72)",
    backdropFilter: "blur(14px)",
    position: "sticky",
    top: 0,
    zIndex: 50,
    color: E_PAL.text,
  };

  const wordmark = (
    <Link
      href="/"
      style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", color: "inherit", flexShrink: 0 }}
    >
      <EDiamond color={E_PAL.ember} />
      <span style={{ ...eStyles.display, fontSize: 15, letterSpacing: 2 }}>
        A.&apos;S WUWA DASHBOARD
      </span>
    </Link>
  );

  const navLinks = NAV.map((n) => {
    const href = n.id === "resonator" ? resonatorPath(lastResonator) : n.href;
    const isActive = active === n.id;
    return (
      <Link
        key={n.id}
        href={href}
        style={{
          color: isActive ? E_PAL.ember : E_PAL.textMute,
          borderBottom: isActive ? `1px solid ${E_PAL.ember}` : "1px solid transparent",
          paddingBottom: 3,
          textDecoration: "none",
          transition: "color 0.15s",
          flexShrink: isCompact ? 0 : undefined,
          whiteSpace: isCompact ? "nowrap" : undefined,
        }}
      >
        {n.label}
      </Link>
    );
  });

  const syncChip = (
    <span
      style={{ ...eStyles.mono, fontSize: 10, color: sync.color, letterSpacing: 1, display: "flex", gap: 5, flexShrink: 0 }}
      title={`Supabase sync · ${syncStatus}`}
    >
      <span>{sync.dot}</span>
      <span>{sync.text}</span>
    </span>
  );

  if (isCompact) {
    return (
      <div
        style={{
          ...rootBase,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 10,
          padding: "10px 16px 12px",
          minWidth: 0,
        }}
      >
        {/* row 1 — wordmark · spacer · sync chip */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {wordmark}
          <div style={{ flex: 1 }} />
          {syncChip}
        </div>
        {/* row 2 — nav as a horizontal scroll strip */}
        <div
          style={{
            display: "flex",
            gap: 18,
            ...eStyles.mono,
            fontSize: 10,
            letterSpacing: 2,
            overflowX: "auto",
            scrollbarWidth: "none",
            paddingBottom: 2,
          }}
        >
          {navLinks}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...rootBase,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "16px 34px",
        minWidth: 1280,
      }}
    >
      {wordmark}
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: 24, ...eStyles.mono, fontSize: 10, letterSpacing: 2 }}>
        {navLinks}
      </div>
      {syncChip}
    </div>
  );
}
