"use client";

import { useTheme } from "@/lib/theme-context";
import { ObsidianCycles } from "@/components/themes/obsidian/cycles";
import { AtelierCycles } from "@/components/themes/atelier/cycles";
import { ConsoleCycles } from "@/components/themes/console/cycles";
import { EmberlineCycles } from "@/components/themes/emberline/cycles";

export default function CyclesRoute() {
  const { theme } = useTheme();
  if (theme === "atelier") return <AtelierCycles />;
  if (theme === "console") return <ConsoleCycles />;
  if (theme === "obsidian") return <ObsidianCycles />;
  return <EmberlineCycles />;
}
