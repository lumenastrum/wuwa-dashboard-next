"use client";

import { EmberlineResonator } from "@/components/themes/emberline/resonator";

export function ResonatorRoute({ name }: { name: string }) {
  return <EmberlineResonator name={name} />;
}
