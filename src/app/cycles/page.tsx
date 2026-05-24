"use client";

import { useTheme } from "@/lib/theme-context";
import { ObsidianCycles } from "@/components/themes/obsidian/cycles";
import { AtelierCycles } from "@/components/themes/atelier/cycles";
import { ConsoleCycles } from "@/components/themes/console/cycles";

export default function CyclesRoute() {
  const { theme } = useTheme();
  if (theme === "atelier") return <AtelierCycles />;
  if (theme === "console") return <ConsoleCycles />;
  return <ObsidianCycles />;
}
