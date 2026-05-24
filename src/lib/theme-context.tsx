"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ThemeId } from "./types";

export const THEME_LIST: { id: ThemeId; label: string; sub: string }[] = [
  { id: "obsidian", label: "Obsidian", sub: "dark · jewel" },
  { id: "atelier",  label: "Atelier",  sub: "editorial · light" },
  { id: "console",  label: "Console",  sub: "holographic · HUD" },
];

export const IMPLEMENTED_THEMES: ThemeId[] = ["obsidian", "atelier", "console"];

const THEME_STORAGE_KEY = "wuwa.theme";
const RESO_STORAGE_KEY  = "wuwa.resonator";
const DEFAULT_THEME: ThemeId = "obsidian";
const DEFAULT_RESONATOR = "Aemeath";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  lastResonator: string;
  setLastResonator: (name: string) => void;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [lastResonator, setLastResonatorState] = useState<string>(DEFAULT_RESONATOR);

  useEffect(() => {
    const fromDom = document.documentElement.dataset.theme as ThemeId | undefined;
    if (fromDom) setThemeState(fromDom);
    try {
      const stored = localStorage.getItem(RESO_STORAGE_KEY);
      if (stored) setLastResonatorState(stored);
    } catch {}
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch {}
    document.documentElement.dataset.theme = next;
  }, []);

  const setLastResonator = useCallback((name: string) => {
    setLastResonatorState(name);
    try { localStorage.setItem(RESO_STORAGE_KEY, name); } catch {}
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, lastResonator, setLastResonator }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var t = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (t !== 'obsidian' && t !== 'atelier' && t !== 'console') t = ${JSON.stringify(DEFAULT_THEME)};
    document.documentElement.dataset.theme = t;
  } catch (e) {
    document.documentElement.dataset.theme = ${JSON.stringify(DEFAULT_THEME)};
  }
})();
`.trim();
