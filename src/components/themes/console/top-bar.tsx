"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IMPLEMENTED_THEMES, THEME_LIST, useTheme } from "@/lib/theme-context";
import { useData } from "@/lib/data-context";
import { useEditMode } from "@/lib/edit-context";
import { useDashboardViewport } from "@/lib/use-dashboard-viewport";
import type { PageId } from "@/lib/types";
import { K_PAL, kStyles } from "./styles";

const SYNC_LABEL: Record<string, { dot: string; text: string; color: string }> = {
  live:    { dot: "●", text: "LIVE",   color: K_PAL.cyan },
  saving:  { dot: "◐", text: "SAVE",   color: K_PAL.amber },
  local:   { dot: "○", text: "LOCAL",  color: K_PAL.magenta },
  error:   { dot: "✕", text: "ERROR",  color: K_PAL.magenta },
  loading: { dot: "·", text: "SYNC",   color: K_PAL.textDim },
};

const NAV: { id: PageId; label: string; href: string }[] = [
  { id: "roster",    label: "Roster",    href: "/" },
  { id: "resonator", label: "Resonator", href: "" },
  { id: "teams",     label: "Teams",     href: "/teams" },
  { id: "cycles",    label: "Cycles",    href: "/cycles" },
];

function activePage(pathname: string): PageId {
  if (pathname.startsWith("/r/")) return "resonator";
  if (pathname.startsWith("/teams")) return "teams";
  if (pathname.startsWith("/cycles")) return "cycles";
  return "roster";
}

export function ConsoleTopBar() {
  const pathname = usePathname() ?? "/";
  const active = activePage(pathname);
  const { theme, setTheme, lastResonator } = useTheme();
  const { syncStatus } = useData();
  const sync = SYNC_LABEL[syncStatus] ?? SYNC_LABEL.loading;
  const { editMode, toggleEditMode } = useEditMode();
  const { isMobile, isTablet } = useDashboardViewport();
  const isCompact = isTablet;

  return (
    <div
      style={{
        minHeight: isCompact ? 104 : 56,
        padding: isCompact ? "10px 16px 12px" : "0 28px",
        display: "flex",
        flexDirection: isCompact ? "column" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: isCompact ? 10 : 0,
        borderBottom: `1px solid ${K_PAL.border}`,
        background: "linear-gradient(180deg, rgba(80,160,200,0.08), transparent)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isCompact ? "column" : "row",
          alignItems: isCompact ? "stretch" : "center",
          gap: isCompact ? 10 : 32,
          width: isCompact ? "100%" : "auto",
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            style={{ filter: `drop-shadow(0 0 6px ${K_PAL.cyan})` }}
          >
            <path d="M11 2 L20 7 L20 15 L11 20 L2 15 L2 7 Z" fill="none" stroke={K_PAL.cyan} strokeWidth="1.2" />
            <path d="M11 6 L16 9 L16 13 L11 16 L6 13 L6 9 Z" fill="none" stroke={K_PAL.cyan} strokeWidth="1" />
            <circle cx="11" cy="11" r="2" fill={K_PAL.cyan} />
          </svg>
          <div style={{ ...kStyles.mono, fontSize: isCompact ? 11 : 13, color: K_PAL.text, letterSpacing: isCompact ? 2 : 3 }}>
            RESONANCE//CONSOLE
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: isCompact ? 18 : 22,
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
                  ...kStyles.mono,
                  fontSize: 11,
                  letterSpacing: 2,
                  textDecoration: "none",
                  color: isActive ? K_PAL.cyan : K_PAL.textDim,
                  textShadow: isActive ? `0 0 8px ${K_PAL.cyan}50` : "none",
                }}
              >
                {isActive ? "▮" : "▯"} {n.label.toUpperCase()}
              </Link>
            );
          })}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: isCompact ? 10 : 14,
          alignItems: "center",
          flexWrap: isCompact ? "wrap" : "nowrap",
          width: isCompact ? "100%" : "auto",
          overflowX: "visible",
          paddingBottom: isCompact ? 2 : 0,
          scrollbarWidth: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            border: `1px solid ${K_PAL.border}`,
            background: "rgba(0,0,0,0.4)",
          }}
        >
          {THEME_LIST.map((t, i) => {
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
                  fontSize: isMobile ? 9 : 10,
                  cursor: isImplemented ? "pointer" : "not-allowed",
                  background: isActive ? K_PAL.cyan : "transparent",
                  color: isActive ? K_PAL.ink : K_PAL.textDim,
                  opacity: isImplemented ? 1 : 0.4,
                  border: "none",
                  borderRight: i < THEME_LIST.length - 1 ? `1px solid ${K_PAL.border}` : "none",
                  ...kStyles.mono,
                  letterSpacing: 1.5,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {t.label.toUpperCase()}
              </button>
            );
          })}
        </div>
        <div
          style={{
            ...kStyles.mono,
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
        <button
          onClick={toggleEditMode}
          title={editMode ? "Click to lock (no edits)" : "Click to unlock (live edits)"}
          style={{
            ...kStyles.mono,
            fontSize: 10,
            letterSpacing: 1.5,
            padding: "4px 10px",
            cursor: "pointer",
            background: editMode ? K_PAL.amber : "rgba(0,0,0,0.4)",
            color: editMode ? K_PAL.ink : K_PAL.textDim,
            border: `1px solid ${editMode ? K_PAL.amber : K_PAL.border}`,
            fontWeight: editMode ? 600 : 400,
            flexShrink: 0,
          }}
        >
          {editMode ? "◐ EDIT" : "▣ LOCK"}
        </button>
        <div style={{ ...kStyles.mono, fontSize: 10, color: K_PAL.amber, letterSpacing: 1.5, flexShrink: 0 }}>
          OP // ANDRES
        </div>
      </div>
    </div>
  );
}
