import type { ElementName } from "./types";

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
};

const TALL_OVERRIDES: Record<string, string> = {
  Rover: "Rover_1.webp",
};

export function portrait(name: string): string {
  const file = PORTRAIT_OVERRIDES[name] ?? `${name.toLowerCase()}.png`;
  return `/portraits/${file}`;
}

export function tallPortrait(name: string): string {
  const file = TALL_OVERRIDES[name] ?? `${name}_Full_Sprite.webp`;
  return `/tall-portraits/${file}`;
}

export function elementIcon(el: ElementName | string): string {
  return `/portraits/element_${el.toLowerCase()}.png`;
}
