// Resonators with an extracted Spine "formation portrait" bundle in
// public/spine/<bundle>/ (skel + atlas + png). Extracted from the live game;
// see the wuwa-spine-extract pipeline.
/** A world-space rectangle (Spine coords, +Y up) used as spine-player's viewport
 *  so we frame head→chest directly and ignore the wide hair spread that bloats
 *  the auto-fit bounds. (x,y) is the bottom-left corner; width/height should match
 *  the cell's 3:4 aspect (width = height * 0.75). Bigger = more zoomed out. */
export interface SpineViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpinePortraitConfig {
  /** folder under public/spine/ holding <bundle>.{skel,atlas,png} */
  bundle: string;
  /** looping animation to play (WuWa formation portraits use "idle") */
  animation?: string;
  /** bust viewport for the Teams cover strip */
  viewport?: SpineViewport;
}

/** The golden bust zoom — the viewport SIZE that frames a head→chest crop at
 *  the cell's 3:4 aspect (ratio 0.75). Standardized across characters so every
 *  portrait reads at the same scale; only x/y (per-character centering) varies.
 *  Tuned live on Aimisi (2026-05-31). Bigger = more zoomed out. */
export const BUST_ZOOM = { width: 1386, height: 1848 } as const;

export const SPINE_PORTRAITS: Record<string, SpinePortraitConfig> = {
  Aemeath: {
    bundle: "Portraits_Aimisi",
    animation: "idle",
    // full bounds ~ x[-1315..3024] y[-3903..2510]; frame head→chest, face-centered
    viewport: { x: -614, y: 692, ...BUST_ZOOM },
  },
  Lynae: {
    bundle: "Portraits_Linnai",
    animation: "idle",
    // dialed live against the Teams cell
    viewport: { x: -614, y: 600, ...BUST_ZOOM },
  },
  Mornye: {
    bundle: "Portraits_Moning",
    animation: "idle",
    // fit the Aemeath standard as-is — no per-character dial needed
    viewport: { x: -614, y: 692, ...BUST_ZOOM },
  },
};

export function spinePortraitOf(name: string): SpinePortraitConfig | null {
  return SPINE_PORTRAITS[name] ?? null;
}
