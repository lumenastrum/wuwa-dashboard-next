# Emberline Migration — status & runway

**Decision (2026-07-15): Emberline wins.** A. is collapsing the 3-theme system into
this one unified theme. This doc is the runway for the migration sessions.

## Where things stand

- All 5 pages built + wired in `src/components/themes/emberline/`, registered as a
  4th theme, set as `DEFAULT_THEME` (commit `ec5763c` on branch `emberline`).
- Obsidian / Atelier / Console are untouched and still switchable — they stay until
  every system below is migrated, then they get deleted.
- Verified: `npm run build` clean (30 pages), eslint clean, all 5 pages
  screenshotted at 1440px against live Supabase data (cycle 3, 52-hit constellation,
  32-coinflip record).

## Design sources (the spec)

- `Downloads/Wuthering Waves Dashboard Redesign/design_handoff_emberline_theme/`
  — README.md is the written spec; the 5 `.dc.html` files are the pixel truth.
- `Resonator Redesign Mockups.dc.html` in the same folder: option 1a (airy variant)
  and **1c = the mobile concept** — the only mobile reference that exists.
- Consider copying that folder into the repo (e.g. `.design-handoff/`) before
  Downloads gets cleaned out. It is currently NOT in the repo.

## To migrate INTO Emberline (exists in old themes, absent here)

1. ~~**FLEX card**~~ **DONE 2026-07-20** — Emberline-native rebuild in
   `emberline/flex-card.tsx`, not a reskin: hero-band portrait bleed with the
   element radial wash + bottom scrim, Stat Audit/Weapon + Forte/Sonata panels
   stacked in one left column (panels hug content — a two-column layout left
   dead space, caught in live QA), grade-medal rating cluster over the scrim,
   banded 5-tile echo strip (cost chip + per-slot sonata icon + graded
   substats), ✦ FLEX CARD button in the tab strip. Shares the page's own
   medals/icons via privates now exported from `emberline/resonator.tsx`
   (`gradeColor`/`EGradeMedal`/`EForteIcon` — same pattern obsidian used).
   Export = same html-to-image path (Chromium-only, 2× → 3040×1760).
   Verified live on Aemeath (Fusion) + Yangyang: Xuanling (Havoc + colon
   route): 33/33 images loaded, zero card-bounds overflow, export pixel-QA'd
   (corner pixels = exact palette hexes, portrait/panel/echo zones lit).
   3-lens adversarial review (edge-cases / theme-fidelity / repo-gotchas):
   0 confirmed findings.
2. ~~**Signature weapon detail**~~ **DONE 2026-07-15** (`6951a4c`) — KPI pair +
   PASSIVE inset tile + WHY IT'S CRACKED behind an element-tinted left rule, in
   the left Stat Audit panel. Verified live on Fusion (Aemeath) + Havoc (Xuanling).
3. ~~**Teams-featuring + cycle-appearances panels**~~ **DONE 2026-07-19** — built
   by Codex-Clio as `emberline/teams-panels.tsx` (BATTLE-TESTED TEAMS +
   ENDSTATE CYCLE RECORD), wired into a now-LIVE TEAMS tab on the resonator page
   (OVERVIEW/TEAMS clickable, rest of the strip stays static chrome). Verified
   live vs Supabase on Aemeath (4 benchmark teams, 4 cycle rows, CROWNED gold).
4. ~~**Edit mode**~~ **DECIDED 2026-07-19: CLI-only.** A. called it — Console dies
   and browser writes die with it; `npm run update` is the sole write path.
   `<EditableField>`/`edit-context`/`<AuthGate>` all go in the strip-down.
5. **Mobile** — Emberline is desktop-spec (`minWidth: 1280`). Old themes had
   viewport handling via `useDashboardViewport`. Port the 1c mobile concept from
   the mockups file when it's mobile's turn.
6. ~~**Resonator rating sub-bars**~~ **SUPERSEDED → GRADE MEDALS, DONE 2026-07-19.**
   A. vetoed bars ("less generic chart feel"). The 4 rating subs now render as
   medals-on-plates in the hero band using the GAME'S OWN settlement grade
   letters, ripped from `Common/Image/ComImg/T_ComScore*` → `public/game/grades/`
   ({d,c,b,a,s,ss,sss}.webp, ~53KB). Gotchas baked into the work: the pak's SSS
   texture is byte-identical to SS, so sss.webp is OUR 3-glyph composition at the
   measured 68px stride; ✦ stays a custom pink→gold text render (no game art for
   our tier, on purpose). `gradeIcon()` in `game-icons.ts`; `RatingSub` now
   carries a per-sub `grade` (echo graded on the echo ladder so the medal always
   matches the Echo Audit panel; stats/sig/seq on the rating ladder —
   `gradeOf` exported from echo-audit for this). Neither ladder emits SS, so
   ss.webp is spare inventory (future cycles-page use).

## ⚠ Merge-time sync debt (fork vs main repo)

The main repo grew the **IRIDESCENT** rating tier (2026-07-19, C4 import) AFTER
this fork branched: `Rating` type, CLI `VALID_RATINGS`, rainbow-gradient badge
in all 3 theme cycles renders. This fork has none of that. When landing
Emberline in the real repo: bring IRIDESCENT into the fork's `Rating` type,
add an IRIDESCENT branch to `teams-panels.tsx` `RatingBadge` AND
`emberline/cycles.tsx`, and port the cycles run-list portrait `onError`-hide.

## Strip-down order (after the above are in)

1. Migrate + verify each system in Emberline while the old themes still exist to
   diff against.
2. Delete `themes/obsidian|atelier|console/`, collapse the dispatchers in
   `src/app/*/page.tsx`, `r/[name]/client.tsx`, `components/top-bar.tsx` (drop the
   theme switcher UI), shrink `ThemeId`/`THEME_LIST`/`THEME_INIT_SCRIPT`.
3. Remove now-unused fonts from `layout.tsx` (Cormorant, Instrument Serif, Space
   Grotesk, Geist, JetBrains Mono — check nothing else uses them) — keep Chakra
   Petch, Familjen Grotesk, Martian Mono (Marcellus/Manrope already removed with
   the 2026-07-15 font swap).
4. Update `CLAUDE.md` + `README.md` — both say "three-themed" throughout.
5. Land in the real repo: either merge this fork's branch into
   `wuwa-dashboard-next` or cherry-pick; **local-build before push** (NTFS
   colon-name rule), then push to `main` → GH Pages auto-deploys.

## Emberline conventions (established in the build)

- Palette/typography: `styles.ts` (`E_PAL`, `E_STATUS`, `eStyles`, `goldGlow`).
  Element tint auto-derives from `ELEMENTS[element]` (hex/soft/glow) — the mockup's
  PAGE TINT chips were dropped per spec.
- **Type stack (swapped 2026-07-15, "Resonance Instrument" — A. picked it from a
  3-option live specimen):** Chakra Petch 500 (display) + Familjen Grotesk (body)
  + Martian Mono (HUD/mono). Marcellus/Manrope are gone. Martian is WIDE — dense
  mono spots run size 8–8.5 / spacing 0.5, and roster-card role strings use a
  U+00A0 so "Main DPS" wraps at the · boundaries, not mid-phrase. The specimen
  page (all 3 candidate stacks) is in the session scratchpad:
  `emberline-type-specimen.html` — regenerate from git history if ever needed.
- Primitives: `primitives.tsx` — `ECard` (corner diamonds), `ESectionTitle`
  (hairline rule), `EKicker`, `EKpi`, `EFace` (letter-tile fallback), `EStatusDot`,
  `EFooter`, `EShell` (per-page wash override).
- Icon-fallback components (`EForteIcon`, `ConvFace`) reset error state by REMOUNT —
  callers key them per resonator/hit. Don't add setState-in-effect back (lint error).
- Wide content scrolls inside its card (`overflowX: auto` + `minmax(0, …)` grid
  columns) — the constellation bug taught this; page body must never h-scroll.
- Forte discs: repo glyphs are white → maxed (light) discs ink them with
  `brightness(0)`; unmaxed keep white. Coinflips exclude `guaranteed` pulls.

## Known intentional deltas from the mockups

- Substat chips use `statAbbrev()` output ("Crit Rate 7.5") — longer than the
  mockup's hand-abbreviations ("CR 7.5"), more readable.
- Tab strip is static chrome (only OVERVIEW content exists); prev/next resonator
  pills live in the strip's right side.
- Sig weapon line shows `LV.{resonator.level}` — weapon level isn't in the data.
- Ledger caps at newest 16 (labeled "NEWEST 16 OF n"); constellation shows ALL hits
  via horizontal scroll, auto-parked on the newest.
