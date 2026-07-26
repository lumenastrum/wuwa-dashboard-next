// The kicker convention shared by the endgame ledger pages (cycles / toa /
// wastes): a note's first sentence — when short and punchy — renders as the
// bold headline, the remainder as the clamped field-log body. Notes without
// an early sentence break render whole as the body.
export function splitNote(note: string): [string | null, string] {
  const m = note.match(/^(.{4,90}?[.!])\s+([\s\S]*)$/);
  if (m) return [m[1], m[2]];
  return [null, note];
}
