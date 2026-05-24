export function durationToSec(t: string): number {
  const [m, s] = t.split(":").map(Number);
  return m * 60 + s;
}
