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

export const SPINE_PORTRAITS: Record<string, SpinePortraitConfig> = {
  Aemeath: {
    bundle: "Portraits_Aimisi",
    animation: "idle",
    // full bounds ~ x[-1315..3024] y[-3903..2510]; frame head→chest, face-centered
    viewport: { x: -200, y: 1000, width: 1200, height: 1600 },
  },
};

export function spinePortraitOf(name: string): SpinePortraitConfig | null {
  return SPINE_PORTRAITS[name] ?? null;
}
