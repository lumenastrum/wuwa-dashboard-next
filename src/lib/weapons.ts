import { BASE_PATH } from "./base-path";

// Wiki convention: `Weapon_{Name_With_Underscores}.webp`
// (e.g. `Weapon_Everbright_Polestar.webp`).
// Add overrides here if a specific weapon's filename deviates from that pattern
// (different extension, special characters escaped differently, etc.).
const WEAPON_OVERRIDES: Record<string, string> = {
  // "Defier's Thorn": "Weapon_Defiers_Thorn.webp",  // example: if apostrophe stripped
};

export function weaponImage(weaponName: string): string {
  const file = WEAPON_OVERRIDES[weaponName] ?? `Weapon_${weaponName.replace(/ /g, "_")}.webp`;
  return `${BASE_PATH}/weapons/${file}`;
}
