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

  // ── Bulk-carved 2026-05-31 (carve_spine.py). Each starts at the Aemeath
  //    center (x:-614, y:692); dial y (and x if off-center) live in Teams.
  //    Bundle = the in-game pinyin codename. "DIAL" = not yet tuned.
  Augusta:     { bundle: "Portraits_Aogusita",   animation: "idle", viewport: { x: -580, y: 646, width: 1317, height: 1756 } }, // up5 zoom-in5 (center-locked)
  Cantarella:  { bundle: "Portraits_Kanteleila", animation: "idle", viewport: { x: -648, y: 738, width: 1455, height: 1940 } }, // zoom-out5 down5 (center-locked)
  Carlotta:    { bundle: "Portraits_Kelaita",    animation: "idle", viewport: { x: -752, y: 600, ...BUST_ZOOM } }, // right10 up5
  Cartethyia:  { bundle: "Portraits_Katixiya",   animation: "idle", viewport: { x: -614, y: 1061, ...BUST_ZOOM } }, // down20
  Changli:     { bundle: "Portraits_Changli1",   animation: "idle", viewport: { x: -363, y: 3044, width: 1247, height: 1663 } }, // Skin1 reclining scene-diorama; face-bust, right5 zoom-in10 (center-locked)
  Chisa:       { bundle: "Portraits_Qianxiao",   animation: "idle", viewport: { x: -683, y: 508, ...BUST_ZOOM } }, // 千咲 · up10 right5
  Ciaccona:    { bundle: "Portraits_Xiakong",    animation: "idle", viewport: { x: -614, y: 877, ...BUST_ZOOM } }, // 夏空 · down10
  Denia:       { bundle: "Portraits_Daniya",     animation: "idle", viewport: { x: -614, y: 600, ...BUST_ZOOM } }, // 丹雅 · up5
  Encore:      { bundle: "Portraits_Anke",       animation: "idle", viewport: { x: -614, y: 692, ...BUST_ZOOM } }, // 安可 · DIAL
  Iuno:        { bundle: "Portraits_Younuo",     animation: "idle", viewport: { x: -614, y: 600, ...BUST_ZOOM } }, // 攸娜 · up5
  Jinhsi:      { bundle: "Portraits_Jinxi1",     animation: "idle", viewport: { x: -319, y: 2914, width: 1119, height: 1492 } }, // Skin1 full-body standing (moon); face-bust, right5 zoom-in~20 (center-locked)
  Lupa:        { bundle: "Portraits_Lupa",       animation: "idle", viewport: { x: -822, y: 747, ...BUST_ZOOM } }, // right15 down3
  Phoebe:      { bundle: "Portraits_Feibi",      animation: "idle", viewport: { x: -614, y: 692, ...BUST_ZOOM } }, // DIAL
  Phrolova:    { bundle: "Portraits_Fuluoluo",   animation: "idle", viewport: { x: -614, y: 692, ...BUST_ZOOM } }, // default — gorgeous as-is
  Roccia:      { bundle: "Portraits_Luokeke",    animation: "idle", viewport: { x: -614, y: 507, ...BUST_ZOOM } }, // up10
  Nyx:         { bundle: "Portraits_Female1",    animation: "idle", viewport: { x: -529, y: 850, width: 1275, height: 1700 } }, // FemRover (A.'s, named "Nyx") · full-body scene splash; face-bust right15 (live-dialed perfect-center against the Team #12 cell)
  Shorekeeper: { bundle: "Portraits_Shouanren",  animation: "idle", viewport: { x: -545, y: 785, width: 1247, height: 1663 } }, // 守岸人 · zoom-in 10% (center-locked)
  Verina:      { bundle: "Portraits_Weilinai",   animation: "idle", viewport: { x: -311, y: 275, width: 862, height: 1150 } }, // 维里奈 · full-body standing; face-bust INSPECTOR-ESTIMATED (not in any comp — live-dial when added)
  Zani:        { bundle: "Portraits_Zanni1",     animation: "idle", viewport: { x: -463, y: 2927, width: 1247, height: 1663 } }, // Skin1 full-body standing; face-bust, right10 up5 zoom-in10 (center-locked)
  Zhezhi:      { bundle: "Portraits_Zhezhi",     animation: "idle", viewport: { x: -545, y: 693, width: 1247, height: 1663 } }, // up5 zoom-in 10% (center-locked)
};

export function spinePortraitOf(name: string): SpinePortraitConfig | null {
  return SPINE_PORTRAITS[name] ?? null;
}
