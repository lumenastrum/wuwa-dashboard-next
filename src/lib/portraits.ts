import type { ElementName, WeaponType } from "./types";
import { BASE_PATH } from "./base-path";

const PORTRAIT_OVERRIDES: Record<string, string> = {
  Carlotta: "Carlotta.png",
  Cartethyia: "Cartethya.png",
  Changli: "ChangLi.png",
  Shorekeeper: "Shorekeeper.png",
  Phoebe: "Phoebe.png",
  Phrolova: "Phrolova.png",
  Rover: "rover_spectro.png",
  Verina: "verina.png",
  Encore: "encore.png",
  Nyx: "rover_spectro.png",
  Sanhua: "rover_spectro.png",
  "Yangyang: Xuanling": "xuanling.png",
};

const TALL_OVERRIDES: Record<string, string> = {
  Rover: "Rover_1.webp",
  "Yangyang: Xuanling": "Xuanling_Full_Sprite.webp",
};

export function portrait(name: string): string {
  const file = PORTRAIT_OVERRIDES[name] ?? `${name.toLowerCase()}.png`;
  return `${BASE_PATH}/portraits/${file}`;
}

export function tallPortrait(name: string): string {
  const file = TALL_OVERRIDES[name] ?? `${name}_Full_Sprite.webp`;
  return `${BASE_PATH}/tall-portraits/${file}`;
}

// Per-character framing for the Teams cover strip — a face/shoulders/chest "bust"
// crop of the full-body tall sprite. The sprites aren't uniformly composed (each
// character sits at a different scale/offset inside its own canvas), so a single
// global crop turns small-in-canvas figures into marooned gremlins. These values
// were measured from each sprite's alpha bounds (head-top + head→chest band for the
// vertical zoom, head→chest centroid for horizontal centering), then baked static so
// there's no per-render canvas work. top/left/height are percentages; the <img> is
// `transform: translateX(-50%)`, height-driven (width auto), inside a 3:4 cell.
export interface PortraitFrame {
  top: number;
  left: number;
  height: number;
}

const TEAM_FRAME: Record<string, PortraitFrame> = {
  Aemeath: { top: 3.9, left: 68, height: 257.6 },
  Augusta: { top: -0.4, left: 36.1, height: 242.8 },
  Cantarella: { top: -24, left: 60, height: 320 },
  Carlotta: { top: 0.5, left: 64.4, height: 253.6 },
  Cartethyia: { top: -0.1, left: 56.8, height: 246.7 },
  Changli: { top: -2.1, left: 35.3, height: 262.7 },
  Chisa: { top: 5.1, left: 57.5, height: 240.2 },
  Ciaccona: { top: -12.3, left: 34, height: 255.9 },
  Denia: { top: -2.6, left: 50.6, height: 255.7 },
  Encore: { top: -3, left: 58.6, height: 254.2 },
  Iuno: { top: 1.3, left: 58.7, height: 243.8 },
  Jinhsi: { top: 5.7, left: 51.5, height: 240.5 },
  Lupa: { top: -40.5, left: 34, height: 285 },
  Lynae: { top: 5.8, left: 88, height: 236 },
  Mornye: { top: 5.6, left: 44.4, height: 239.5 },
  Phoebe: { top: 3.1, left: 34, height: 240.2 },
  Phrolova: { top: 5.4, left: 47.6, height: 270.2 },
  Roccia: { top: 1.6, left: 65.3, height: 243.3 },
  Rover: { top: 7, left: 46.7, height: 243.1 },
  Shorekeeper: { top: -6.1, left: 12, height: 252.1 },
  Zani: { top: -1.1, left: 52.3, height: 244.6 },
  Zhezhi: { top: -14, left: 66, height: 280 },
};

const DEFAULT_FRAME: PortraitFrame = { top: 0, left: 50, height: 245 };

export function teamPortraitFrame(name: string): PortraitFrame {
  return TEAM_FRAME[name] ?? DEFAULT_FRAME;
}

// Official splash art (public/splash/, sourced from the wiki's
// "<Name> Splash Art" set, alpha-trimmed + webp'd at q90). The FLEX card's
// vanity canvas — rendered whole, never cover-cropped (the splashes are
// composed medallion pieces over transparency). A missing file (Aemeath —
// her art is ours, not Kuro's) falls back to the tall sprite at the
// callsite via onError.
export function splashArt(name: string): string {
  const file = `${name.replace(/[^\w ]/g, "").replace(/ +/g, "_")}_Splash_Art.webp`;
  return `${BASE_PATH}/splash/${file}`;
}

export function elementIcon(el: ElementName | string): string {
  return `${BASE_PATH}/portraits/element_${el.toLowerCase()}.png`;
}

export function weaponTypeIcon(t: WeaponType | string): string {
  return `${BASE_PATH}/Icons/${t}_Icon.webp`;
}

export function fiveStarIcon(): string {
  return `${BASE_PATH}/Icons/Icon_5_Stars.webp`;
}
