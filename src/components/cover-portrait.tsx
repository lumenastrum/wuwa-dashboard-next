/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { portrait, tallPortrait, teamPortraitFrame } from "@/lib/portraits";
import { spinePortraitOf } from "@/lib/spine-portraits";
import { SpinePortrait } from "@/components/spine-portrait";

/**
 * The cover-strip portrait for a team member, with a 3-step graceful degrade:
 *
 *     live Spine formation portrait  →  tall full-body sprite  →  square bust
 *
 * New resonators ship art in stages. The Edgerunners collab (Lucy, Rebecca) has
 * no Spine bundle, so they fall to the tall sprite. If even the tall `.webp`
 * hasn't landed yet, the square bust fills the cell — instead of a broken-image
 * box — so a benchmark can feature a brand-new resonator the day it releases.
 *
 * One component so all three themes degrade identically; pass the theme's own
 * drop-shadow as `filter`.
 */
export function CoverPortrait({ name, filter }: { name: string; filter?: string }) {
  const [tallFailed, setTallFailed] = useState(false);
  const sp = spinePortraitOf(name);
  const fr = teamPortraitFrame(name);

  // last-resort fallback — the square bust, framed to fill the 3:4 cell rather
  // than inheriting the tall sprite's head→chest zoom (which would be a giant face)
  const bust = (
    <img
      src={portrait(name)}
      alt={name}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center 18%",
        filter,
      }}
    />
  );

  // standard cover art — the tall sprite, per-character frame crop. onError
  // degrades to the bust if the file is missing.
  const tall = (
    <img
      src={tallPortrait(name)}
      alt={name}
      onError={() => setTallFailed(true)}
      style={{
        position: "absolute",
        top: `${fr.top}%`,
        left: `${fr.left}%`,
        transform: "translateX(-50%)",
        height: `${fr.height}%`,
        width: "auto",
        maxWidth: "none",
        filter,
      }}
    />
  );

  const staticLayer = tallFailed ? bust : tall;

  if (!sp) return staticLayer;

  // live formation portrait; the static layer underlays it (shown during the
  // skel/atlas fetch and kept if WebGL/loading fails)
  return (
    <div style={{ position: "absolute", inset: 0, filter }}>
      <SpinePortrait
        bundle={sp.bundle}
        animation={sp.animation}
        viewport={sp.viewport}
        fallback={staticLayer}
        height="100%"
      />
    </div>
  );
}
