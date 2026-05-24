import type { CSSProperties } from "react";

export const A_PAL = {
  bg: "#eef1f6",
  bgGrad:
    "radial-gradient(ellipse at 0% 0%, #f6f0ff 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, #e9f4fb 0%, transparent 50%), #eef1f6",
  surface: "rgba(255,255,255,0.55)",
  surfaceStrong: "rgba(255,255,255,0.85)",
  surfacePaper: "#f9fafd",
  border: "rgba(60,70,100,0.10)",
  borderStrong: "rgba(60,70,100,0.18)",
  text: "#1a1d2a",
  textDim: "#5a6076",
  textMute: "#9097a8",
  accent: "#3b4664",
  ink: "#10131c",
} as const;

const display: CSSProperties = {
  fontFamily: "var(--font-instrument), 'Cormorant Garamond', serif",
  fontWeight: 400,
  letterSpacing: "-0.015em",
};

const mono: CSSProperties = {
  fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
};

const shell: CSSProperties = {
  minHeight: "100dvh",
  background: A_PAL.bgGrad,
  color: A_PAL.text,
  fontFamily: "var(--font-geist), system-ui, sans-serif",
};

export const aStyles = { shell, display, mono } as const;
