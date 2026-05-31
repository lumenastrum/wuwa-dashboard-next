/* eslint-disable @next/next/no-img-element */
"use client";

import type { CSSProperties } from "react";
import { parseEchoSets, sonataIcon } from "@/lib/sonata";

// Renders the sonata-set icon(s) parsed from an echoSet string, each with its
// piece-count badge (5, or 3/2 for hybrids). The icons are OPTIONAL assets in
// public/sonatas/ — until a file exists (or for any unmapped set) the <img>
// errors and hides its own host span, leaving the surrounding text exactly as
// before. So this is safe to ship before the art lands: drop the files in and
// they light up with no further code.
export function SonataIcons({
  set,
  size = 22,
  gap = 6,
  badgeBg = "rgba(0,0,0,0.6)",
  badgeColor = "#fff",
  showBadge = true,
  style,
}: {
  set: string;
  size?: number;
  gap?: number;
  badgeBg?: string;
  badgeColor?: string;
  showBadge?: boolean;
  style?: CSSProperties;
}) {
  const sets = parseEchoSets(set);
  if (!sets.length) return null;
  return (
    <span style={{ display: "inline-flex", gap, alignItems: "center", ...style }}>
      {sets.map((s, i) => (
        <span
          key={`${s.name}-${i}`}
          data-sonata
          title={`${s.name}${s.pieces ? ` · ${s.pieces}pc` : ""}`}
          style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}
        >
          <img
            src={sonataIcon(s.name)}
            alt={s.name}
            width={size}
            height={size}
            style={{ width: size, height: size, objectFit: "contain", display: "block" }}
            onError={(e) => {
              const host = e.currentTarget.parentElement;
              if (host) host.style.display = "none";
            }}
          />
          {showBadge && s.pieces && (
            <span
              style={{
                position: "absolute",
                right: -3,
                bottom: -3,
                fontSize: 8,
                lineHeight: 1,
                fontWeight: 600,
                padding: "1px 3px",
                borderRadius: 4,
                background: badgeBg,
                color: badgeColor,
              }}
            >
              {s.pieces}
            </span>
          )}
        </span>
      ))}
    </span>
  );
}
