"use client";

import { use } from "react";
import { useTheme } from "@/lib/theme-context";
import { ObsidianResonator } from "@/components/themes/obsidian/resonator";
import { AtelierResonator } from "@/components/themes/atelier/resonator";
import { ConsoleResonator } from "@/components/themes/console/resonator";

export default function ResonatorRoute({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const decoded = decodeURIComponent(name);
  const { theme } = useTheme();
  if (theme === "atelier") return <AtelierResonator name={decoded} />;
  if (theme === "console") return <ConsoleResonator name={decoded} />;
  return <ObsidianResonator name={decoded} />;
}
