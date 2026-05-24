import type { ElementName, Status } from "./types";

export interface ElementPalette {
  hex: string;
  soft: string;
  glow: string;
  label: ElementName;
}

export const ELEMENTS: Record<ElementName, ElementPalette> = {
  Fusion:  { hex: "#ff7a4d", soft: "#ffb38a", glow: "rgba(255,122,77,0.45)",  label: "Fusion" },
  Glacio:  { hex: "#5ec8ff", soft: "#a5e2ff", glow: "rgba(94,200,255,0.45)",  label: "Glacio" },
  Electro: { hex: "#b785ff", soft: "#d6b8ff", glow: "rgba(183,133,255,0.45)", label: "Electro" },
  Spectro: { hex: "#f0d674", soft: "#fae9a8", glow: "rgba(240,214,116,0.45)", label: "Spectro" },
  Havoc:   { hex: "#e2589d", soft: "#f0a3c7", glow: "rgba(226,88,157,0.45)",  label: "Havoc" },
  Aero:    { hex: "#5fe1b3", soft: "#a5f0d3", glow: "rgba(95,225,179,0.45)",  label: "Aero" },
};

export const STATUS_HEX: Record<Status, string> = {
  green:   "#5fe1b3",
  yellow:  "#f0d674",
  red:     "#ff7a8a",
  neutral: "#8d92a3",
};

export const ELEMENT_NAMES: ElementName[] = [
  "Fusion", "Glacio", "Electro", "Spectro", "Havoc", "Aero",
];
