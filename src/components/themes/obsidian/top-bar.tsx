"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IMPLEMENTED_THEMES, THEME_LIST, useTheme } from "@/lib/theme-context";
import { useData } from "@/lib/data-context";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import type { PageId } from "@/lib/types";
import { O_PAL, oStyles } from "./styles";

const SYNC_LABEL: Record<string, { dot: string; text: string; color: string }> = {
  live:    { dot: "●", text: "LIVE",    color: "#5fe1b3" },
  saving:  { dot: "◐", text: "SAVING",  color: "#7ee0ff" },
  local:   { dot: "○", text: "LOCAL",   color: "#f0d674" },
  error:   { dot: "✕", text: "ERROR",   color: "#ff7a8a" },
  loading: { dot: "·", text: "SYNC",    color: "#5d6170" },
};

const NAV: { id: PageId; label: string; href: string }[] = [
  { id: "roster",    label: "Roster",    href: "/" },
  { id: "resonator", label: "Resonator", href: "" }, // dynamic, filled in below
  { id: "teams",     label: "Teams",     href: "/teams" },
  { id: "cycles",    label: "Cycles",    href: "/cycles" },
  { id: "convene",   label: "Convene",   href: "/convene" },
];

function activePage(pathname: string): PageId {
  if (pathname === "/" || pathname === "") return "roster";
  if (pathname.startsWith("/r/")) return "resonator";
  if (pathname.startsWith("/teams")) return "teams";
  if (pathname.startsWith("/cycles")) return "cycles";
  if (pathname.startsWith("/convene")) return "convene";
  return "roster";
}

export function ObsidianTopBar() {
  const pathname = usePathname() ?? "/";
  const active = activePage(pathname);
  const { theme, setTheme, lastResonator } = useTheme();
  const { syncStatus } = useData();
  const sync = SYNC_LABEL[syncStatus] ?? SYNC_LABEL.loading;
  const { isMobile, isTablet } = useDashboardViewport();
  const isCompact = isTablet;

  return (
    <div
      style={{
        minHeight: isCompact ? 104 : 64,
        padding: isCompact ? "10px 16px 12px" : "0 32px",
        display: "flex",
        flexDirection: isCompact ? "column" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: isCompact ? 10 : 0,
        borderBottom: `1px solid ${O_PAL.border}`,
        background: "rgba(10,13,20,0.7)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isCompact ? "column" : "row",
          alignItems: isCompact ? "stretch" : "center",
          gap: isCompact ? 10 : 40,
          width: isCompact ? "100%" : "auto",
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "linear-gradient(135deg, #e9d49b 0%, #8a6f3c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: oStyles.display.fontFamily,
              fontSize: 18,
              color: "#0a0d14",
              fontWeight: 600,
            }}
          >
            R
          </div>
          <div style={{ ...oStyles.display, fontSize: isCompact ? 18 : 19, letterSpacing: 0.5 }}>
            Resonance Atelier
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: isCompact ? 20 : 28,
            fontSize: 13,
            overflowX: isCompact ? "auto" : "visible",
            paddingBottom: isCompact ? 2 : 0,
            scrollbarWidth: "none",
          }}
        >
          {NAV.map((n) => {
            const href = n.id === "resonator" ? `/r/${encodeURIComponent(lastResonator)}` : n.href;
            const isActive = active === n.id;
            return (
              <Link
                key={n.id}
                href={href}
                style={{
                  color: isActive ? O_PAL.text : O_PAL.textDim,
                  borderBottom: isActive ? `1px solid ${O_PAL.accent}` : "1px solid transparent",
                  paddingBottom: 4,
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: isCompact ? "wrap" : "nowrap",
          gap: isCompact ? 10 : 16,
          width: isCompact ? "100%" : "auto",
          overflowX: "visible",
          paddingBottom: isCompact ? 2 : 0,
          scrollbarWidth: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 2,
            padding: 3,
            borderRadius: 999,
            border: `1px solid ${O_PAL.border}`,
            background: "rgba(0,0,0,0.3)",
          }}
        >
          {THEME_LIST.map((t) => {
            const isActive = theme === t.id;
            const isImplemented = IMPLEMENTED_THEMES.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => isImplemented && setTheme(t.id)}
                disabled={!isImplemented}
                title={isImplemented ? t.sub : "Coming next"}
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  fontSize: isMobile ? 10 : 11,
                  cursor: isImplemented ? "pointer" : "not-allowed",
                  background: isActive ? O_PAL.accent : "transparent",
                  color: isActive ? "#0a0d14" : O_PAL.textDim,
                  opacity: isImplemented ? 1 : 0.4,
                  border: "none",
                  transition: "all 0.15s",
                  ...oStyles.mono,
                  letterSpacing: 1,
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {t.label.toUpperCase()}
              </button>
            );
          })}
        </div>
        <div
          style={{
            ...oStyles.mono,
            fontSize: 11,
            color: sync.color,
            letterSpacing: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
          }}
          title={`Supabase sync · ${syncStatus}`}
        >
          <span>{sync.dot}</span>
          <span>{sync.text}</span>
        </div>
        <div
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: `1px solid ${O_PAL.border}`,
            background: O_PAL.surface,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: O_PAL.textDim,
            flexShrink: 0,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: 999, background: "#5fe1b3" }} />
          A.
        </div>
      </div>
    </div>
  );
}
