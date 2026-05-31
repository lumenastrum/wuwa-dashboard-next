"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { withBase } from "@/lib/base-path";

type Props = {
  /** bundle folder name under public/spine/, e.g. "Portraits_Aimisi" */
  bundle: string;
  /** animation to loop. Passing it via config makes spine-player auto-play
   *  (the render loop starts un-paused). Omit to auto-pick an idle. */
  animation?: string;
  /** world-space viewport rectangle (x,y = bottom-left; +Y up) to frame a crop */
  viewport?: { x: number; y: number; width: number; height: number };
  height?: number | string;
  style?: CSSProperties;
};

/**
 * Renders a live Spine 4.1 skeleton (the game's animated formation portrait)
 * on a transparent WebGL canvas. spine-player is browser-only, so it's
 * dynamically imported inside the effect — SSR renders an empty plate.
 *
 * NOTE: spine-player loads PAUSED unless `config.animation` is set (it calls
 * pause() otherwise), so we always feed it an animation up front.
 */
export function SpinePortrait({ bundle, animation, viewport, height = "100%", style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let player: { dispose?: () => void; play?: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const spine = await import("@esotericsoftware/spine-player");
        if (cancelled || !ref.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cfg: any = {
          skelUrl: withBase(`/spine/${bundle}/${bundle}.skel`),
          atlasUrl: withBase(`/spine/${bundle}/${bundle}.atlas`),
          premultipliedAlpha: false,
          alpha: true,
          backgroundColor: "#00000000",
          showControls: false,
          showLoading: false,
          // Setting `animation` drives the built-in setAnimation()+play() path
          // (un-paused render loop). Without it the player loads paused/frozen.
          ...(animation ? { animation } : {}),
          // explicit viewport frames a world-space crop (head→chest), bypassing
          // the hair-bloated auto-fit bounds. padding 0 so the rect is exact.
          ...(viewport
            ? {
                viewport: {
                  ...viewport,
                  padLeft: 0,
                  padRight: 0,
                  padTop: 0,
                  padBottom: 0,
                },
              }
            : {}),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          success: (p: any) => {
            try {
              if (!animation) {
                const anims: string[] = p.skeleton.data.animations.map(
                  (a: { name: string }) => a.name
                );
                const pick =
                  anims.find((n) => /idle|loop|stand|breath|show/i.test(n)) ??
                  anims[0];
                p.play(); // unpause first
                if (pick) p.setAnimation(pick, true); // then force our loop
              } else {
                p.play(); // belt-and-suspenders un-pause
              }
            } catch (e) {
              console.error("[SpinePortrait] animate", bundle, e);
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          error: (_p: any, msg: unknown) => {
            console.error("[SpinePortrait]", bundle, msg);
            setFailed(true);
          },
        };

        player = new spine.SpinePlayer(ref.current, cfg);
      } catch (e) {
        console.error("[SpinePortrait] init", bundle, e);
        setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      try {
        player?.dispose?.();
      } catch {
        /* noop */
      }
    };
  }, [bundle, animation, viewport]);

  return (
    <div
      ref={ref}
      style={{ width: "100%", height, opacity: failed ? 0 : 1, ...style }}
      aria-hidden
    />
  );
}
