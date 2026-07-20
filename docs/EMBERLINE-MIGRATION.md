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
   **Splash-art canvas iteration (same day, A.'s call):** the card's art zone
   now renders the resonator's OFFICIAL splash art (wiki "<Name> Splash Art"
   set → `public/splash/`, alpha-trimmed webp q90, all 23 roster members
   ~16MB, `splashArt()` in portraits.ts). Key learning: every splash is
   22–58% TRANSPARENT — they're composed medallion pieces (sun disc / moon /
   orrery / Aemeath's crystal polestar), NOT wallpapers, so cover-cropping
   kills them (Changli's card showed pavilion, no Changli). The card renders
   the piece WHOLE: contain-by-height right-anchored + element-glow drop
   shadow, over a blurred+dimmed copy of itself as zone ambiance, behind
   left/top scrims. No per-art tuning map needed. A missing splash falls
   back to the tall-sprite cut-out via onError remount (correction note:
   Aemeath's was initially skipped on a wrong "she has no wiki art"
   assumption — her wiki upload is 2026-02-04, post-knowledge-cutoff;
   A. caught it). Blur verified to survive the html-to-image export
   (pixel-sampled 3040×1760).
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
5. ~~**Mobile**~~ **DONE 2026-07-20** — full responsive pass across all 5 pages +
   chrome, built from the 1c mockup's language (layout only — Resonance
   Instrument stack kept, never the mockup's Marcellus/JetBrains).
   Two-stage semantics matching obsidian's shipped idiom: `isTablet` (≤1024)
   collapses structure (multi-col grids → single column, top-bar stacks, tab
   strip compacts), `isMobile` (≤700) does fonts/padding/hero re-composition.
   All THREE 1280 locks dropped together (EShell, top-bar, resonator's bespoke
   shell); primitives (EShell/EFooter/ECard/EKpi) self-adapt by calling the
   hook internally — no signature changes. Highlights: resonator hero is 1c
   verbatim on mobile (centered portrait, bottom scrim, element circle
   top-right, RATING plate top-left, identity centered bottom, sub-medals in a
   centered row under the tab strip — 66px×4 fits 358px); roster hero = art
   zone on top with identity over the scrim, stat tiles + CTA FLOW BELOW the
   art (first attempt anchored the whole cluster over the portrait's face —
   don't regress to that); forte arc → 5-across flow chain (labels tightened,
   `flow` prop on EForteDisc — NOT shared with flex-card, verified); teams
   keeps its HEADED table scrolling in-card at minWidth 560 (teams-panels
   idiom, deliberately NOT obsidian's label-less stacked rows) + the cover
   strip's hardcoded `repeat(3,1fr)` → `team.team.length` bug fix rode along;
   cycles + convene selectors = horizontal scroll strips with fixed-width
   cards, cycles auto-parks on the selected cycle (scrollIntoView
   inline:center, block:nearest); constellation untouched by design. FLEX CARD
   trigger hidden on mobile (obsidian precedent), visible on tablet;
   flex-card.tsx + teams-panels.tsx byte-untouched.
   Verified live at TRUE 375/768/1440 layout viewports (the Claude browser
   pane's mobile preset only scales the VISUAL viewport — layout stays 1280;
   verification needed a same-origin 375px iframe rig in a CDP browser):
   zero page-body h-scroll on every page + TEAMS tab, zero overflow offenders,
   zero console errors, desktop construct-identical at 1440 (80px name, SEQ
   ornament, 3-col grid, named prev/next all present). Two tablet-band bugs
   caught live and fixed (tab strip + convene header compacted only at
   isMobile, overflowed 701-1024). `npm run build` clean (30 pages), eslint
   clean, 3-lens adversarial review (correctness / fidelity / repo-gotchas):
   0 findings.
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
