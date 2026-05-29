"use client";

import { usePulls } from "@/lib/use-pulls";
import { A_PAL, aStyles } from "./styles";

export function AtelierConvene() {
  const { summary } = usePulls();
  return (
    <div style={aStyles.shell}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 36px", textAlign: "center" }}>
        <div style={{ ...aStyles.mono, fontSize: 11, letterSpacing: 3, color: A_PAL.textMute, marginBottom: 16 }}>
          CONVENE HISTORY
        </div>
        <div style={{ ...aStyles.display, fontSize: 36, fontStyle: "italic", color: A_PAL.text, marginBottom: 14 }}>
          {summary
            ? `${summary.totalPulls.toLocaleString()} pulls, ${summary.totalFiveStars} five-stars`
            : "Loading convene history…"}
        </div>
        <p style={{ fontSize: 14, color: A_PAL.textDim, lineHeight: 1.6 }}>
          The full luck analytics, per-banner timeline, and pity distribution live in the{" "}
          <span style={{ color: A_PAL.ink, fontWeight: 500 }}>Console</span> theme for now. Switch
          themes from the top-right control to read the numbers — an editorial render is on the way.
        </p>
      </div>
    </div>
  );
}
