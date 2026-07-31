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
  // ── Carved 2026-07-31: the Edgerunners collab pair + the two newest adds,
  //    which had been falling all the way through to the tall-sprite
  //    DEFAULT_FRAME. Dialed against the shipped roster in the bust harness
  //    (wuwa-extract/spine_out/dial.html): eye-line on the 40% cell line,
  //    face centered on 50%, standard BUST_ZOOM — the house framing.
  Lucy:                 { bundle: "Portraits_Lucy",     animation: "idle", viewport: { x: -606, y: 659, ...BUST_ZOOM } }, // eye-line + center measured off her 眼球 bones
  Rebecca:              { bundle: "Portraits_Rebecca",  animation: "idle", viewport: { x: -490, y: 784, ...BUST_ZOOM } }, // left9 down5 — her pose is turned + gun-side heavy
  Suisui:               { bundle: "Portraits_SuiSui",   animation: "idle", viewport: { x: -556, y: 637, ...BUST_ZOOM } }, // right4 up3 (Head bone)
  "Yangyang: Xuanling": { bundle: "Portraits_XuanLing", animation: "idle", viewport: { x: -586, y: 655, ...BUST_ZOOM } }, // right2 up2 (脸 bone)

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

/** Atlas page filenames per bundle. Needed because a page's name is NOT derivable
 *  from the bundle folder (Portraits_Daniya ships Portraits_DaNiYa.webp, and skin
 *  bundles use the _Skin1 stem), and because preloading has to fire in PARALLEL
 *  with the skel/atlas — spine-player only learns these names after it has fetched
 *  and parsed the atlas, which is exactly the serial hop we want to skip.
 *  Regenerate after carving a new bundle by reading the page lines out of its
 *  .atlas (see docs/adding-a-resonator.md 7d). */
export const SPINE_PAGES: Record<string, string[]> = {
  Portraits_Aimisi    : ["Portraits_Aimisi.webp"],
  Portraits_Anke      : ["Portraits_Anke.webp"],
  Portraits_Aogusita  : ["Portraits_Aogusita.webp", "Portraits_Aogusita_2.webp", "Portraits_Aogusita_3.webp"],
  Portraits_Changli1  : ["Portraits_Changli_Skin1.webp", "Portraits_Changli_Skin1_2.webp", "Portraits_Changli_Skin1_3.webp"],
  Portraits_Daniya    : ["Portraits_DaNiYa.webp", "Portraits_DaNiYa_2.webp"],
  Portraits_Feibi     : ["Portraits_Feibi.webp"],
  Portraits_Female1   : ["Portraits_Female_Skin1.webp"],
  Portraits_Fuluoluo  : ["Portraits_Fuluoluo.webp"],
  Portraits_Jinxi1    : ["Portraits_Jinxi_Skin1.webp", "Portraits_Jinxi_Skin1_2.webp", "Portraits_Jinxi_Skin1_3.webp"],
  Portraits_Kanteleila: ["Portraits_Kanteleila.webp", "Portraits_Kanteleila_2.webp", "Portraits_Kanteleila_3.webp"],
  Portraits_Katixiya  : ["Portraits_Katixiya.webp"],
  Portraits_Kelaita   : ["Portraits_Kelaita.webp"],
  Portraits_Linnai    : ["Portraits_Linnai.webp", "Portraits_Linnai_2.webp", "Portraits_Linnai_3.webp"],
  Portraits_Lucy      : ["Portraits_Lucy.webp"],
  Portraits_Luokeke   : ["Portraits_Luokeke.webp"],
  Portraits_Lupa      : ["Portraits_Lupa.webp"],
  Portraits_Moning    : ["Portraits_Moning.webp"],
  Portraits_Qianxiao  : ["Portraits_Qianxiao.webp"],
  Portraits_Rebecca   : ["Portraits_Rebecca.webp"],
  Portraits_Shouanren : ["Portraits_Shouanren.webp"],
  Portraits_SuiSui    : ["Portraits_Suisui.webp", "Portraits_Suisui_2.webp"],
  Portraits_Weilinai  : ["Portraits_Weilinai.webp"],
  Portraits_Xiakong   : ["Portraits_Xiakong.webp", "Portraits_Xiakong_2.webp"],
  Portraits_XuanLing  : ["Portraits_Xuanling.webp", "Portraits_Xuanling_2.webp"],
  Portraits_Younuo    : ["Portraits_Younuo.webp", "Portraits_Younuo_2.webp"],
  Portraits_Zanni1    : ["Portraits_Zanni_Skin1.webp", "Portraits_Zanni_Skin1_2.webp", "Portraits_Zanni_Skin1_3.webp"],
  Portraits_Zhezhi    : ["Portraits_Zhezhi.webp"],
};

export function spinePortraitOf(name: string): SpinePortraitConfig | null {
  return SPINE_PORTRAITS[name] ?? null;
}
