"use client";

import { useTheme } from "@/lib/theme-context";
import { ObsidianRoster } from "@/components/themes/obsidian/roster";
import { AtelierRoster } from "@/components/themes/atelier/roster";
import { ConsoleRoster } from "@/components/themes/console/roster";
import { EmberlineRoster } from "@/components/themes/emberline/roster";

export default function RosterRoute() {
  const { theme } = useTheme();
  if (theme === "atelier") return <AtelierRoster />;
  if (theme === "console") return <ConsoleRoster />;
  if (theme === "obsidian") return <ObsidianRoster />;
  return <EmberlineRoster />;
}
