"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IMPLEMENTED_THEMES, THEME_LIST, useTheme } from "@/lib/theme-context";
import { useData } from "@/lib/data-context";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import type { PageId } from "@/lib/types";
import { A_PAL, aStyles } from "./styles";

const SYNC_LABEL: Record<string, { dot: string; text: string; color: string }> = {
  live:    { dot: "●", text: "LIVE",   color: "#2e7d32" },
  saving:  { dot: "◐", text: "SAVING", color: "#1976d2" },
  local:   { dot: "○", text: "LOCAL",  color: "#b8860b" },
  error:   { dot: "✕", text: "ERROR",  color: "#c62828" },
  loading: { dot: "·", text: "SYNC",   color: "#5a6076" },
};

const NAV: { id: PageId; label: string; href: string }[] = [
  { id: "roster",    label: "Roster",    href: "/" },
  { id: "resonator", label: "Resonator", href: "" },
  { id: "teams",     label: "Teams",     href: "/teams" },
  { id: "cycles",    label: "Cycles",    href: "/cycles" },
  { id: "convene",   label: "Convene",   href: "/convene" },
];

function activePage(pathname: string): PageId {
  if (pathname.startsWith("/r/")) return "resonator";
  if (pathname.startsWith("/teams")) return "teams";
  if (pathname.startsWith("/cycles")) return "cycles";
  if (pathname.startsWith("/convene")) return "convene";
  return "roster";
}

export function AtelierTopBar() {
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
        minHeight: isCompact ? 100 : 60,
        padding: isCompact ? "10px 16px 12px" : "0 36px",
        display: "flex",
        flexDirection: isCompact ? "column" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: isCompact ? 10 : 0,
        borderBottom: `1px solid ${A_PAL.border}`,
        background: "rgba(255,255,255,0.5)",
        backdropFilter: "blur(14px)",
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
          gap: isCompact ? 10 : 36,
          width: isCompact ? "100%" : "auto",
          minWidth: 0,
        }}
      >
        <div style={{ ...aStyles.display, fontSize: isCompact ? 21 : 22, fontStyle: "italic" }}>
          atelier <span style={{ color: A_PAL.textMute }}>·</span> roster
        </div>
        <div
          style={{
            display: "flex",
            gap: isCompact ? 20 : 24,
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
                  color: isActive ? A_PAL.text : A_PAL.textDim,
                  fontWeight: isActive ? 500 : 400,
                  borderBottom: isActive ? `1px solid ${A_PAL.ink}` : "1px solid transparent",
                  paddingBottom: 3,
                  textDecoration: "none",
                  transition: "all 0.15s",
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
          gap: isCompact ? 10 : 14,
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
            border: `1px solid ${A_PAL.border}`,
            background: "rgba(255,255,255,0.6)",
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
                  background: isActive ? A_PAL.ink : "transparent",
                  color: isActive ? "#fff" : A_PAL.textDim,
                  opacity: isImplemented ? 1 : 0.4,
                  border: "none",
                  ...aStyles.mono,
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
            ...aStyles.mono,
            fontSize: 10,
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
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "linear-gradient(135deg, #c4b5e8, #f0d674)",
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
}
