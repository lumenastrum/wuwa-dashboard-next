"use client";

import { useTheme } from "@/lib/theme-context";
import { ObsidianResonator } from "@/components/themes/obsidian/resonator";
import { AtelierResonator } from "@/components/themes/atelier/resonator";
import { ConsoleResonator } from "@/components/themes/console/resonator";
import { EmberlineResonator } from "@/components/themes/emberline/resonator";

export function ResonatorRoute({ name }: { name: string }) {
  const { theme } = useTheme();
  if (theme === "atelier") return <AtelierResonator name={name} />;
  if (theme === "console") return <ConsoleResonator name={name} />;
  if (theme === "obsidian") return <ObsidianResonator name={name} />;
  return <EmberlineResonator name={name} />;
}
