"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IMPLEMENTED_THEMES, THEME_LIST, useTheme } from "@/lib/theme-context";
import { useData } from "@/lib/data-context";
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
  { id: "convene",   label: "CONVENE",   href: "/convene" },
];

function activePage(pathname: string): PageId {
  if (pathname === "/" || pathname === "") return "roster";
  if (pathname.startsWith("/r/")) return "resonator";
  if (pathname.startsWith("/teams")) return "teams";
  if (pathname.startsWith("/cycles")) return "cycles";
  if (pathname.startsWith("/convene")) return "convene";
  return "roster";
}

export function EmberlineTopBar() {
  const pathname = usePathname() ?? "/";
  const active = activePage(pathname);
  const { theme, setTheme, lastResonator } = useTheme();
  const { syncStatus } = useData();
  const sync = SYNC_LABEL[syncStatus] ?? SYNC_LABEL.loading;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "16px 34px",
        borderBottom: "1px solid rgba(140,220,225,0.10)",
        background: "rgba(5,15,21,0.72)",
        backdropFilter: "blur(14px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        minWidth: 1280,
        color: E_PAL.text,
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", color: "inherit" }}>
        <EDiamond color={E_PAL.ember} />
        <span style={{ ...eStyles.display, fontSize: 15, letterSpacing: 2 }}>
          A.&apos;S WUWA DASHBOARD
        </span>
      </Link>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: 24, ...eStyles.mono, fontSize: 10, letterSpacing: 2 }}>
        {NAV.map((n) => {
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
              }}
            >
              {n.label}
            </Link>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          gap: 2,
          padding: 3,
          borderRadius: 999,
          border: `1px solid ${E_PAL.borderSoft}`,
          background: "rgba(4,13,18,0.5)",
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
                padding: "4px 10px",
                borderRadius: 999,
                ...eStyles.mono,
                fontSize: 9,
                letterSpacing: 1,
                cursor: isImplemented ? "pointer" : "not-allowed",
                background: isActive ? E_PAL.ember : "transparent",
                color: isActive ? E_PAL.dark : E_PAL.textMute,
                opacity: isImplemented ? 1 : 0.4,
                border: "none",
                transition: "all 0.15s",
              }}
            >
              {t.label.toUpperCase()}
            </button>
          );
        })}
      </div>
      <span
        style={{ ...eStyles.mono, fontSize: 10, color: sync.color, letterSpacing: 1, display: "flex", gap: 5 }}
        title={`Supabase sync · ${syncStatus}`}
      >
        <span>{sync.dot}</span>
        <span>{sync.text}</span>
      </span>
    </div>
  );
}
