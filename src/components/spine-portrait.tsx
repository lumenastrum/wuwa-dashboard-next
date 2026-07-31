"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { withBase } from "@/lib/base-path";
import { SPINE_PAGES, spinePortraitOf } from "@/lib/spine-portraits";

/**
 * Start fetching the spine-player chunk the moment this module is evaluated,
 * instead of on first cell mount. The Teams page can't render its cover strip
 * until Supabase answers, so kicking the import off here overlaps ~200KB of JS
 * with the data round trip that was previously blocking it — the import used to
 * be the first link in a four-hop serial chain
 * (data → mount → import → skel/atlas → pages).
 *
 * Module scope, not top-level `import`, so it stays out of the SSR bundle and
 * off the critical path of every other route.
 */
let spineLib: Promise<typeof import("@esotericsoftware/spine-player")> | null = null;
function loadSpineLib() {
  if (!spineLib) spineLib = import("@esotericsoftware/spine-player");
  return spineLib;
}
if (typeof window !== "undefined") {
  // idle so it never competes with first paint
  const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
  idle(() => void loadSpineLib());
}

const preloaded = new Set<string>();

/**
 * Warm a resonator's Spine bundle: skel + atlas + every atlas page, all issued
 * at once. spine-player would otherwise fetch the pages only after the atlas
 * landed and parsed, so this collapses two network hops into one — the pages are
 * the heavy part (600KB–1.2MB) and no longer wait on a 4KB file.
 *
 * Safe to call repeatedly; each bundle is only ever warmed once per session, and
 * the browser cache serves the player's own later requests.
 */
export function preloadSpineBundle(name: string) {
  if (typeof document === "undefined") return;
  const cfg = spinePortraitOf(name);
  if (!cfg || preloaded.has(cfg.bundle)) return;
  preloaded.add(cfg.bundle);

  const add = (href: string, as: "fetch" | "image") => {
    const l = document.createElement("link");
    l.rel = "preload";
    l.as = as;
    l.href = href;
    // MUST match how spine-player itself requests these, or the preload is
    // discarded and the asset downloads TWICE ("preload ... not used because the
    // request credentials mode does not match"). It loads texture pages via an
    // Image with crossOrigin="anonymous", so anonymous is the matching mode for
    // pages and for the skel/atlas fetches alike.
    l.crossOrigin = "anonymous";
    document.head.appendChild(l);
  };
  const dir = withBase(`/spine/${cfg.bundle}`);
  add(`${dir}/${cfg.bundle}.skel`, "fetch");
  add(`${dir}/${cfg.bundle}.atlas`, "fetch");
  for (const page of SPINE_PAGES[cfg.bundle] ?? []) add(`${dir}/${page}`, "image");
  void loadSpineLib();
}

type Props = {
  /** bundle folder name under public/spine/, e.g. "Portraits_Aimisi" */
  bundle: string;
  /** animation to loop. Passing it via config makes spine-player auto-play
   *  (the render loop starts un-paused). Omit to auto-pick an idle. */
  animation?: string;
  /** world-space viewport rectangle (x,y = bottom-left; +Y up) to frame a crop.
   *  Compared by VALUE (JSON), so inline literals are safe — they won't
   *  dispose/rebuild the player every render. */
  viewport?: { x: number; y: number; width: number; height: number };
  /** static stand-in rendered UNDER the canvas — visible while the skel/atlas
   *  fetch is in flight (no blank-canvas flash) and kept if the player fails
   *  (WebGL lost, slow network), so the cell degrades instead of going empty.
   *  Hidden once the live skeleton paints. */
  fallback?: ReactNode;
  height?: number | string;
  style?: CSSProperties;
};

/**
 * Renders a live Spine 4.1 skeleton (the game's animated formation portrait)
 * on a transparent WebGL canvas. spine-player is browser-only, so it's
 * dynamically imported inside the effect — SSR renders an empty plate.
 *
 * The player is only constructed once the element scrolls near the viewport
 * (IntersectionObserver, 200px margin) — three cells on the Teams cover strip
 * would otherwise spin up three WebGL contexts + texture fetches on mount,
 * which mobile does not appreciate.
 *
 * NOTE: spine-player loads PAUSED unless `config.animation` is set (it calls
 * pause() otherwise), so we always feed it an animation up front.
 */
export function SpinePortrait({ bundle, animation, viewport, fallback, height = "100%", style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [live, setLive] = useState(false); // skeleton loaded + animating
  const [inView, setInView] = useState(false);

  // value-compare the viewport so a fresh object literal per render doesn't
  // churn the player (the configs in SPINE_PORTRAITS are stable refs, but
  // inline `viewport={{...}}` shouldn't be a footgun).
  const viewportKey = JSON.stringify(viewport ?? null);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setInView(true);
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);

  useEffect(() => {
    if (!inView) return;
    let player: { dispose?: () => void; play?: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const spine = await loadSpineLib();
        if (cancelled || !ref.current) return;
        // re-arm on bundle/viewport change (no-op on first run)
        setFailed(false);
        setLive(false);

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
            if (!cancelled) setLive(true);
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
    // viewport participates via viewportKey (value identity, see above)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle, animation, viewportKey, inView]);

  return (
    <div
      style={{ position: "relative", width: "100%", height, ...style }}
      aria-hidden
    >
      {fallback && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: live && !failed ? 0 : 1,
            // Short: the underlay and the skeleton are framed alike but not
            // pixel-identical, so a long crossfade reads as a double-image
            // wobble rather than a dissolve. Quick hand-off looks like one image
            // sharpening, which is what we want.
            transition: "opacity 180ms ease-out",
          }}
        >
          {fallback}
        </div>
      )}
      <div
        ref={ref}
        style={{
          position: "absolute",
          inset: 0,
          opacity: failed ? 0 : 1,
        }}
      />
    </div>
  );
}
