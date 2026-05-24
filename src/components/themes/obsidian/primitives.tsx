"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { ELEMENTS, STATUS_HEX } from "@/lib/elements";
import { elementIcon } from "@/lib/portraits";
import type { AuditStat, ElementName, Status } from "@/lib/types";
import { O_PAL, oStyles } from "./styles";

export function OCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 22,
        background: O_PAL.surface,
        border: `1px solid ${O_PAL.border}`,
        backdropFilter: "blur(12px)",
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function OKpi({
  label, value, delta, accent,
}: { label: string; value: string; delta: string; accent: string }) {
  return (
    <div
      style={{
        padding: "18px 22px",
        borderRadius: 14,
        background: O_PAL.surface,
        border: `1px solid ${O_PAL.border}`,
        backdropFilter: "blur(12px)",
        position: "relative",
        overflow: "hidden",
        minWidth: 140,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 100% 0%, ${accent}18, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ fontSize: 11, letterSpacing: 1.5, color: O_PAL.textMute, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ ...oStyles.display, fontSize: 36, marginTop: 6, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: O_PAL.textDim, marginTop: 4, ...oStyles.mono }}>{delta}</div>
    </div>
  );
}

export function OElementPill({ el, weapon, small }: { el: ElementName; weapon?: string; small?: boolean }) {
  const c = ELEMENTS[el];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <Image
        src={elementIcon(el)}
        alt={el}
        width={small ? 12 : 16}
        height={small ? 12 : 16}
        style={{ width: small ? 12 : 16, height: small ? 12 : 16 }}
        unoptimized
      />
      <span style={{ ...oStyles.mono, fontSize: small ? 10 : 11, color: c.hex, letterSpacing: 1.5 }}>
        {c.label.toUpperCase()}{weapon ? ` · ${weapon.toUpperCase()}` : ""}
      </span>
    </div>
  );
}

export function OStatusDot({ status }: { status: Status }) {
  return (
    <div
      style={{
        width: 6,
        height: 6,
        borderRadius: 999,
        background: STATUS_HEX[status],
        boxShadow: `0 0 8px ${STATUS_HEX[status]}80`,
      }}
    />
  );
}

export function OStatBar({ stat }: { stat: AuditStat }) {
  const num = parseFloat(String(stat.current).replace(/[,%]/g, "")) || 0;
  const ceiling = stat.max || (stat.min || 1) * 1.4;
  const pct = Math.min(100, (num / ceiling) * 100);
  const minPct = stat.min ? Math.min(100, (stat.min / ceiling) * 100) : 0;
  const maxPct = stat.max ? Math.min(100, (stat.max / ceiling) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ ...oStyles.mono, fontSize: 11, letterSpacing: 1.5, color: O_PAL.textDim }}>{stat.label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ ...oStyles.display, fontSize: 22, color: STATUS_HEX[stat._status] ?? O_PAL.text }}>
            {stat.current}
          </div>
          <div style={{ ...oStyles.mono, fontSize: 10, color: O_PAL.textMute }}>target {stat.optimal}</div>
        </div>
      </div>
      <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 999 }}>
        {stat.min && stat.max && (
          <div
            style={{
              position: "absolute",
              left: `${minPct}%`,
              top: 0,
              height: "100%",
              width: `${maxPct - minPct}%`,
              background: "rgba(95,225,179,0.18)",
              borderLeft: "1px solid rgba(95,225,179,0.4)",
              borderRight: "1px solid rgba(95,225,179,0.4)",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct}%`,
            background: STATUS_HEX[stat._status] ?? O_PAL.text,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}
