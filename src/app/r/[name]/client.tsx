"use client";

import { useTheme } from "@/lib/theme-context";
import { ObsidianResonator } from "@/components/themes/obsidian/resonator";
import { AtelierResonator } from "@/components/themes/atelier/resonator";
import { ConsoleResonator } from "@/components/themes/console/resonator";

export function ResonatorRoute({ name }: { name: string }) {
  const { theme } = useTheme();
  if (theme === "atelier") return <AtelierResonator name={name} />;
  if (theme === "console") return <ConsoleResonator name={name} />;
  return <ObsidianResonator name={name} />;
}
