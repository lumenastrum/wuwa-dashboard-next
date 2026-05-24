"use client";

import type { CSSProperties, ReactNode } from "react";
import { K_PAL, kStyles } from "./styles";

interface KPanelProps {
  children: ReactNode;
  label?: string;
  code?: string;
  accent?: string;
  style?: CSSProperties;
}

export function KPanel({ children, label, code, accent = K_PAL.cyan, style }: KPanelProps) {
  return (
    <div
      style={{
        position: "relative",
        background: K_PAL.panel,
        border: `1px solid ${K_PAL.border}`,
        borderRadius: 4,
        padding: 18,
        ...style,
      }}
    >
      {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            [x ? "right" : "left"]: -1,
            [y ? "bottom" : "top"]: -1,
            width: 8,
            height: 8,
            borderTop: y ? "none" : `1px solid ${accent}`,
            borderBottom: y ? `1px solid ${accent}` : "none",
            borderLeft: x ? "none" : `1px solid ${accent}`,
            borderRight: x ? `1px solid ${accent}` : "none",
          }}
        />
      ))}
      {label && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ ...kStyles.mono, fontSize: 10, color: accent, letterSpacing: 2 }}>
            ▸ {label}
          </div>
          {code && (
            <div
              style={{
                ...kStyles.mono,
                fontSize: 9,
                color: K_PAL.textMute,
                letterSpacing: 1.5,
              }}
            >
              {code}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function KScanlines() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage:
          `linear-gradient(${K_PAL.grid} 1px, transparent 1px), ` +
          `linear-gradient(90deg, ${K_PAL.grid} 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 80%)",
        opacity: 0.5,
      }}
    />
  );
}
