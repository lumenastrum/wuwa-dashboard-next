"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Emberline is the sole theme (strip-down 2026-07-20). This context now only
// carries cross-page navigation state: the last-viewed resonator, which the
// top bar's RESONATOR pill and the roster's featured hero key off.
const RESO_STORAGE_KEY = "wuwa.resonator";
const DEFAULT_RESONATOR = "Aemeath";

interface ThemeContextValue {
  lastResonator: string;
  setLastResonator: (name: string) => void;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [lastResonator, setLastResonatorState] = useState<string>(DEFAULT_RESONATOR);

  // One-time hydration from localStorage (external system), same shape as
  // use-dashboard-viewport's mount sync — SSR renders the default, the client
  // corrects itself after mount.
  useEffect(() => {
    const hydrate = () => {
      try {
        const stored = localStorage.getItem(RESO_STORAGE_KEY);
        if (stored) setLastResonatorState(stored);
      } catch {}
    };
    hydrate();
  }, []);

  const setLastResonator = useCallback((name: string) => {
    setLastResonatorState(name);
    try { localStorage.setItem(RESO_STORAGE_KEY, name); } catch {}
  }, []);

  return (
    <ThemeCtx.Provider value={{ lastResonator, setLastResonator }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
