import type { CSSProperties } from "react";

// Emberline — deep abyssal teal, element-reactive ember accents.
// Design source: Downloads/Wuthering Waves Dashboard Redesign/design_handoff_emberline_theme/
export const E_PAL = {
  bg: "#050f15",
  bgGrad: "linear-gradient(180deg, #081820 0%, #050f15 100%)",
  wash: "radial-gradient(1100px 520px at 18% -8%, rgba(64,168,178,0.10), transparent 60%)",
  panel: "rgba(140,220,225,0.03)",          // card background
  panelStrong: "rgba(140,220,225,0.035)",   // KPI tiles
  inset: "rgba(4,13,18,0.4)",               // row/tile inside a card
  insetStrong: "rgba(4,13,18,0.5)",
  border: "rgba(140,220,225,0.12)",         // card border
  borderSoft: "rgba(140,220,225,0.08)",     // row border
  borderStrong: "rgba(140,220,225,0.2)",
  borderKpi: "rgba(140,220,225,0.14)",
  track: "rgba(140,220,225,0.08)",          // bar tracks
  trackStrong: "rgba(140,220,225,0.10)",
  text: "#eaf6f3",
  textDim: "#9db8bd",
  textMute: "#5f7d82",
  textFaint: "#46626a",                     // footer strips
  tide: "#93e0d3",                          // sea-glass ornament (corner diamonds, rules)
  ember: "#ff7a4d",                         // primary accent = Fusion (element-reactive)
  emberSoft: "#ffb38a",
  gold: "#f5c97a",                          // prestige: S grades, CROWNED, pity gauge mid
  green: "#6fd6a8",                         // status green / won 50-50
  yellow: "#f0d674",                        // status yellow
  red: "#ff7a8a",                           // status red
  pink: "#e2589d",                          // lost 50-50 / late pity
  dark: "#081218",                          // text on ember/gold fills
} as const;

// Status hexes tuned to the Emberline palette (slightly different from the
// shared STATUS_HEX — the prototypes use these exact values).
export const E_STATUS: Record<string, string> = {
  green: E_PAL.green,
  yellow: E_PAL.yellow,
  red: E_PAL.red,
  neutral: "#8d92a3",
};

// "Resonance Instrument" stack — Chakra Petch carries the display voice at 500
// (it has no single-weight identity like Marcellus did; 400 reads too soft on
// the abyssal ground). Martian Mono is WIDE — fixed-width columns sized for
// JetBrains need re-measuring when touched.
const display: CSSProperties = {
  fontFamily: "var(--font-chakra), 'Chakra Petch', sans-serif",
  fontWeight: 500,
};

const body: CSSProperties = {
  fontFamily: "var(--font-familjen), 'Familjen Grotesk', system-ui, sans-serif",
};

const mono: CSSProperties = {
  fontFamily: "var(--font-martian), 'Martian Mono', ui-monospace, monospace",
};

const shell: CSSProperties = {
  minHeight: "100dvh",
  background: `${E_PAL.wash}, ${E_PAL.bgGrad}`,
  color: E_PAL.text,
  ...body,
};

// Gradient hairline rule — flexed to fill after section titles.
const rule: CSSProperties = {
  flex: 1,
  height: 1,
  background: "linear-gradient(90deg, rgba(147,224,211,0.35), transparent)",
};

export const eStyles = { shell, display, body, mono, rule } as const;

export const goldGlow = (px = 18): CSSProperties => ({
  color: E_PAL.gold,
  textShadow: `0 0 ${px}px rgba(245,201,122,0.55)`,
});
