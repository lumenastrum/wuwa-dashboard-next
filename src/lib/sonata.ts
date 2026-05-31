import { BASE_PATH } from "./base-path";

export interface SonataPiece {
  /** Canonical set name, e.g. "Crown of Valor". */
  name: string;
  /** Display piece count: "5", "3", "2" (empty if the string had none). */
  pieces: string;
}

// echoSet strings come in two shapes:
//   "Celestial Light 5/5"                  -> one set, full 5-piece
//   "Crown of Valor 3 + Void Thunder 2"    -> a 3+2 hybrid naming TWO sets
// Split on " + ", then peel the trailing piece count off each token. "5/5"
// collapses to "5"; a bare "3"/"2" keeps its number. Set names never contain
// digits, so anchoring the count to the end of the token is safe.
export function parseEchoSets(echoSet: string | null | undefined): SonataPiece[] {
  if (!echoSet) return [];
  return echoSet
    .split("+")
    .map((tok) => tok.trim())
    .filter(Boolean)
    .map((tok) => {
      const m = tok.match(/^(.*?)\s+(\d)(?:\s*\/\s*\d)?\s*$/);
      return m ? { name: m[1].trim(), pieces: m[2] } : { name: tok, pieces: "" };
    })
    .filter((s) => s.name.length > 0);
}

// Sonata-effect icon path, mirroring the weapons convention: spaces -> underscores.
// Drop files into public/sonatas/, e.g. Crown_of_Valor.webp. Optional asset — the
// <SonataIcons> renderer hides any icon whose file is missing, so callers degrade
// to text-only gracefully until the art exists.
export function sonataIcon(name: string): string {
  return `${BASE_PATH}/sonatas/${name.replace(/\s+/g, "_")}.webp`;
}
