/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, type CSSProperties } from "react";
import { weaponImage } from "@/lib/weapons";

export function WeaponImg({
  name,
  size = 80,
  style,
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={weaponImage(name)}
      alt={name}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
