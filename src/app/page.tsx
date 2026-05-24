"use client";

import { useTheme } from "@/lib/theme-context";
import { ObsidianRoster } from "@/components/themes/obsidian/roster";
import { AtelierRoster } from "@/components/themes/atelier/roster";
import { ConsoleRoster } from "@/components/themes/console/roster";

export default function RosterRoute() {
  const { theme } = useTheme();
  if (theme === "atelier") return <AtelierRoster />;
  if (theme === "console") return <ConsoleRoster />;
  return <ObsidianRoster />;
}
