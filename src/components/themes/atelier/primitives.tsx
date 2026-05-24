/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useData } from "@/lib/data-context";
import { portrait } from "@/lib/portraits";
import { STATUS_HEX } from "@/lib/elements";
import type { Status } from "@/lib/types";
import { A_PAL, aStyles } from "./styles";

export function ACard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 22,
        background: A_PAL.surfaceStrong,
        border: `1px solid ${A_PAL.border}`,
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function APill({ status, children }: { status: Status; children: ReactNode }) {
  const c = STATUS_HEX[status] ?? A_PAL.textMute;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        borderRadius: 999,
        fontSize: 10,
        background: `${c}1f`,
        color: c,
        ...aStyles.mono,
        letterSpacing: 1,
      }}
    >
      ● {children}
    </span>
  );
}

export function ARosterStrip({ activeName }: { activeName: string }) {
  const { roster } = useData();
  return (
    <div
      style={{
        width: 84,
        padding: "20px 14px",
        borderRight: `1px solid ${A_PAL.border}`,
        background: "rgba(255,255,255,0.35)",
        backdropFilter: "blur(14px)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
      }}
    >
      <div
        style={{
          ...aStyles.mono,
          fontSize: 9,
          color: A_PAL.textMute,
          letterSpacing: 1.5,
          textAlign: "center",
          marginBottom: 4,
        }}
      >
        {roster.length}
      </div>
      {roster.map((r) => {
        const active = r.name === activeName;
        return (
          <Link
            key={r.name}
            href={`/r/${encodeURIComponent(r.name)}`}
            style={{ position: "relative", padding: 2, display: "block" }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 10,
                overflow: "hidden",
                border: active ? `2px solid ${A_PAL.ink}` : `1px solid ${A_PAL.border}`,
                background: "white",
                opacity: active ? 1 : 0.7,
                transform: active ? "scale(1.05)" : "scale(1)",
                transition: "all 0.15s",
              }}
            >
              <img
                src={portrait(r.name)}
                alt={r.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 20%",
                }}
              />
            </div>
            {active && (
              <div
                style={{
                  position: "absolute",
                  left: -10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 3,
                  height: 20,
                  borderRadius: 2,
                  background: A_PAL.ink,
                }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
