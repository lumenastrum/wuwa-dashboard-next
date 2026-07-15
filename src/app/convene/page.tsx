"use client";

import { useTheme } from "@/lib/theme-context";
import { ObsidianConvene } from "@/components/themes/obsidian/convene";
import { AtelierConvene } from "@/components/themes/atelier/convene";
import { ConsoleConvene } from "@/components/themes/console/convene";
import { EmberlineConvene } from "@/components/themes/emberline/convene";

export default function ConveneRoute() {
  const { theme } = useTheme();
  if (theme === "atelier") return <AtelierConvene />;
  if (theme === "console") return <ConsoleConvene />;
  if (theme === "obsidian") return <ObsidianConvene />;
  return <EmberlineConvene />;
}
