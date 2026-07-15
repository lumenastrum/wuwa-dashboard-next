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

1. **FLEX card** — `components/themes/obsidian/flex-card.tsx` (1520×880 composed
   build card, html-to-image PNG export, Chromium-only). Reuses obsidian's
   `OEchoCard`/`OForteDisc`/`OGrade`/`OSequenceChain` — port needs Emberline-styled
   equivalents, not a reskin of the obsidian internals.
2. **Signature weapon detail** — passive name / passive text / synergy ("why it's
   cracked") / baseAtk / mainStat from `SignatureWeapon`. Emberline's resonator page
   shows only the weapon tile + name/rank line. Obsidian's resonator.tsx has the
   render; `signatureWeaponOf` is already imported in emberline/resonator.tsx.
3. **Teams-featuring + cycle-appearances panels** (resonator page) — obsidian uses
   `teamsFeaturingOf(raw, name)` / `cycleAppearancesOf(raw, name)`. The Emberline
   tab strip already has a dead TEAMS tab — natural home, or extra overview panels.
4. **Edit mode** — Console-only today (`<EditableField>`, `edit-context`,
   `<AuthGate>`). Deleting Console kills ALL browser writes; CLI survives.
   **A. must decide:** port edit mode into Emberline (violates the old "read-only
   surfaces" split) or go CLI-only. Don't decide silently.
5. **Mobile** — Emberline is desktop-spec (`minWidth: 1280`). Old themes had
   viewport handling via `useDashboardViewport`. Port the 1c mobile concept from
   the mockups file when it's mobile's turn.
6. **Resonator rating sub-bars** — Emberline shows the hero PROFICIENCY medallion
   (grade + score) but not the 4 weighted sub-bars (`rating.subs`) the other themes
   render. Cheap add if wanted.

## Strip-down order (after the above are in)

1. Migrate + verify each system in Emberline while the old themes still exist to
   diff against.
2. Delete `themes/obsidian|atelier|console/`, collapse the dispatchers in
   `src/app/*/page.tsx`, `r/[name]/client.tsx`, `components/top-bar.tsx` (drop the
   theme switcher UI), shrink `ThemeId`/`THEME_LIST`/`THEME_INIT_SCRIPT`.
3. Remove now-unused fonts from `layout.tsx` (Cormorant, Instrument Serif, Space
   Grotesk, Geist — check nothing else uses them) — keep JetBrains Mono, Marcellus,
   Manrope.
4. Update `CLAUDE.md` + `README.md` — both say "three-themed" throughout.
5. Land in the real repo: either merge this fork's branch into
   `wuwa-dashboard-next` or cherry-pick; **local-build before push** (NTFS
   colon-name rule), then push to `main` → GH Pages auto-deploys.

## Emberline conventions (established in the build)

- Palette/typography: `styles.ts` (`E_PAL`, `E_STATUS`, `eStyles`, `goldGlow`).
  Element tint auto-derives from `ELEMENTS[element]` (hex/soft/glow) — the mockup's
  PAGE TINT chips were dropped per spec.
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
