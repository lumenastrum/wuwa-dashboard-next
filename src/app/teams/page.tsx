"use client";

import { useTheme } from "@/lib/theme-context";
import { ObsidianTeams } from "@/components/themes/obsidian/teams";
import { AtelierTeams } from "@/components/themes/atelier/teams";
import { ConsoleTeams } from "@/components/themes/console/teams";
import { EmberlineTeams } from "@/components/themes/emberline/teams";

export default function TeamsRoute() {
  const { theme } = useTheme();
  if (theme === "atelier") return <AtelierTeams />;
  if (theme === "console") return <ConsoleTeams />;
  if (theme === "obsidian") return <ObsidianTeams />;
  return <EmberlineTeams />;
}
