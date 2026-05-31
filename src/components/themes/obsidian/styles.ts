import type { CSSProperties } from "react";

export const O_PAL = {
  bg: "#0a0d14",
  bgGrad:
    "radial-gradient(ellipse at 20% 0%, rgba(94,225,179,0.05), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(183,133,255,0.05), transparent 50%), #0a0d14",
  surface: "rgba(255,255,255,0.03)",
  surfaceStrong: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.14)",
  text: "#f4f3ee",
  textDim: "#9ca0ad",
  textMute: "#5d6170",
  accent: "#e9d49b",
} as const;

const display: CSSProperties = {
  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
  fontWeight: 400,
  letterSpacing: 0,
};

const mono: CSSProperties = {
  fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
};

const shell: CSSProperties = {
  minHeight: "100dvh",
  background: O_PAL.bgGrad,
  color: O_PAL.text,
  fontFamily: "var(--font-geist), system-ui, sans-serif",
  fontFeatureSettings: '"ss01", "cv11"',
};

export const oStyles = { shell, display, mono } as const;
