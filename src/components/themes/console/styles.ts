import type { CSSProperties } from "react";

export const K_PAL = {
  bg: "#070b12",
  bgGrad: "linear-gradient(180deg, #0c1220 0%, #070b12 100%)",
  panel: "rgba(80,160,200,0.04)",
  panelStrong: "rgba(80,160,200,0.08)",
  border: "rgba(120,220,255,0.14)",
  borderStrong: "rgba(120,220,255,0.32)",
  grid: "rgba(120,220,255,0.06)",
  text: "#d8e8f5",
  textDim: "#7a8aa0",
  textMute: "#4a5468",
  cyan: "#7ee0ff",
  cyanDim: "#48a8c8",
  magenta: "#ff6db8",
  amber: "#ffc97a",
  ink: "#0a0f1a",
} as const;

const mono: CSSProperties = {
  fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
};

const display: CSSProperties = {
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 500,
  letterSpacing: "-0.01em",
};

const shell: CSSProperties = {
  minHeight: "100vh",
  background: K_PAL.bgGrad,
  color: K_PAL.text,
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  position: "relative",
};

export const kStyles = { shell, display, mono } as const;
