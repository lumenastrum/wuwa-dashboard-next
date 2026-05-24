"use client";

import { useEffect, useState } from "react";

export function useDashboardViewport() {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const measured = width ?? 1280;
  return {
    width: measured,
    isMobile: measured <= 700,
    isTablet: measured <= 1024,
  };
}
