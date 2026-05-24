"use client";

import { useTheme } from "@/lib/theme-context";
import { ObsidianTopBar } from "./themes/obsidian/top-bar";
import { AtelierTopBar } from "./themes/atelier/top-bar";
import { ConsoleTopBar } from "./themes/console/top-bar";

export function TopBar() {
  const { theme } = useTheme();
  if (theme === "atelier") return <AtelierTopBar />;
  if (theme === "console") return <ConsoleTopBar />;
  return <ObsidianTopBar />;
}
