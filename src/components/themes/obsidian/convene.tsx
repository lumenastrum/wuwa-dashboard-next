"use client";

import { usePulls } from "@/lib/use-pulls";
import { O_PAL, oStyles } from "./styles";

export function ObsidianConvene() {
  const { summary } = usePulls();
  return (
    <div style={oStyles.shell}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 32px", textAlign: "center" }}>
        <div style={{ ...oStyles.mono, fontSize: 11, letterSpacing: 3, color: O_PAL.accent, marginBottom: 16 }}>
          CONVENE HISTORY
        </div>
        <div style={{ ...oStyles.display, fontSize: 34, color: O_PAL.text, marginBottom: 14 }}>
          {summary
            ? `${summary.totalPulls.toLocaleString()} pulls · ${summary.totalFiveStars} five-stars`
            : "Loading convene history…"}
        </div>
        <p style={{ fontSize: 14, color: O_PAL.textDim, lineHeight: 1.6 }}>
          The full luck analytics, per-banner timeline, and pity distribution live in the{" "}
          <span style={{ color: O_PAL.accent }}>Console</span> theme for now. Switch themes from
          the top-right control to dive into the numbers — an Obsidian render is on the way.
        </p>
      </div>
    </div>
  );
}
