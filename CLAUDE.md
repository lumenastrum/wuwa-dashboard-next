# WuWa Dashboard — context for Claude / Clio / Couch-Clio

Three-themed Wuthering Waves roster dashboard for Andres. Live-saved to Supabase, edit mode in Console theme, CLI mutator for everything else.

Full context: **read `README.md`**. This file is the carry-on.

## Stack at a glance

- **Next.js 16** (App Router, Turbopack, React 19) — read `node_modules/next/dist/docs/` before assuming API shapes from training data. `params` is a Promise; use `use(params)` in client components.
- **Tailwind v4** with CSS-first `@theme` in `globals.css`. Theme palettes live as JS const objects in `components/themes/<name>/styles.ts`, not as Tailwind classes.
- **Supabase** Postgres (`dashboard_profiles` table, JSONB column, profile key `andres-wuwa`). Anon key in client by design. CHECK constraint on profile column was dropped — arbitrary keys are fine now.
- **Three themes** (Obsidian / Atelier / Console) each in `components/themes/<name>/`. Same data, different chrome. Edit mode is **Console only** — don't wire `<EditableField>` into the other two.

## Common tasks

**Update a value:** Use the CLI — `npm run update -- help` for the full surface. Couch-Clio runs it on PowerShell (Win) or terminal (Mac); Claude Code runs via Bash.

**Sync convene (gacha pull) history:** `npm run convene`. Requires the convene URL to be cached in the WuWa logs first — **launch WuWa → open Convene History in-game**, then run it. Auto-finds the URL in `Client.log` or the webview `debug.log`, queries all 7 banners from Kuro's official API, and **archival-merges** into the `andres-wuwa-pulls` Supabase row (separate from the roster blob). Kuro only serves a rolling ~6-month window; the merge keeps everything older we've already captured (boundary-splice on `time`, never deletes) so the archive outlives the game's retention. Flags: `--dry` (fetch + print, no write), `--url "…"` (paste URL manually), `--game "F:\…"` (override install dir; default `F:\Wuthering Waves\Wuthering Waves Game`).

**Import historical pull data:** `npm run convene:import -- --file "path.json"` grafts pre-window pulls from an old tracker export (records OLDER than the current archive only; in-window records ignored since the API is authoritative there). **Preview by default — writes nothing without `--commit`.** Tolerant parser (flat array or banner-keyed object, loose field names); if a file won't map, eyeball a sample and extend `normalize()` in `scripts/convene-import.ts`. Merge logic for both sync + import lives in `src/lib/convene-merge.ts` (`mergeWindow` / `graftOlder`).

**Add a resonator / sequence / weapon:** Edit Supabase directly via Studio, OR add to `public/data.json` and `npm run update -- list` to confirm.

**Add a weapon image:** Drop `Weapon_{Name_With_Underscores}.webp` into `public/weapons/`. Apostrophes are literal `'`, not `%27` — rename wiki downloads if needed.

**Add sonata-effect icons:** Drop `{Set_Name_With_Underscores}.webp` into `public/sonatas/` (e.g. `Crown_of_Valor.webp`, `Void_Thunder.webp`). Rendered in the Echo Audit ECHO SET row of **all three themes** via `<SonataIcons>` (`src/components/sonata-icons.tsx`), which parses the `echoSet` string with `parseEchoSets`/`sonataIcon` (`src/lib/sonata.ts`): a single `"X 5/5"` shows one icon, a hybrid `"X 3 + Y 2"` shows both with piece-count badges. **Missing/unmapped icons hide themselves** (graceful text-only fallback via `onError`), so a partial set of files is fine — no broken-image boxes. The 19 sets in use: `Celestial_Light, Chromatic_Foam, Crown_of_Valor, Dream_of_the_Lost, Eternal_Radiance, Flaming_Clawprint, Frosty_Resolve, Gusts_of_Welkin, Halo_of_Starry_Radiance, Havoc_Eclipse, Midnight_Veil, Molten_Rift, Moonlit_Clouds, Pact_of_Neonlight_Leap, Rejuvenating_Glow, Thread_of_Severed_Fate, Trailblazing_Star, Void_Thunder, Windward_Pilgrimage`.

**Fill a signature weapon (passive / why-cracked / stats):** CLI `npm run update -- sigweapon "<weapon name>" <field> "<value>"` (fields: passive, synergy, passivename, baseatk, mainstat, mainstatvalue, type, wearer), OR inline in Console edit mode. Addressed by **weapon name**, not resonator. New weapons get a blank stub automatically (`ensureSignatureWeapons`); `addsigweapon` creates one explicitly.

**Enter / audit echoes (per-resonator):** Each resonator has an `EchoBuild` — 5 slots, each with a **per-echo cost** (default spread 4/3/3/1/1), a main stat + value, and up to 5 substats (stat + roll value). The Console ECHO AUDIT panel grades each echo (and the build) **for that resonator** via an editable per-resonator stat-weight profile, seeded from buildType + element. CLI: `npm run update -- echoslot "<name>" <1-5> main "<stat>" [value]`, `echoslot "<name>" <1-5> sub <1-5> "<stat>" <value>`, `echoslot "<name>" show`, `echoweight "<name>" "<stat>" <0..1>`, `echoweight "<name>" reset`. OR fill inline in Console edit mode (cost-filtered dropdowns + value inputs). Blank builds are auto-stubbed (`ensureEchoBuilds`). Scoring math is pure in `src/lib/echo-audit.ts` (imported by both the UI and the CLI). It's a **stat grade only** — set bonuses (2pc/5pc) are NOT scored; `echoSet` still holds the set name separately.

**Non-standard cost spreads:** Cost is per-echo, so a resonator can run a layout other than 4-3-3-1-1 — e.g. HP scalers like Cartethyia run **4-4-1-1-1** (a second 4-cost main slot instead of the 3-cost). Set it via `npm run update -- echoslot "<name>" spread 4-4-1-1-1` (whole spread) or `echoslot "<name>" <1-5> cost <1|3|4>` (one slot), or the cost dropdown on each slot in Console edit mode. Changing a slot's cost auto-clears its main stat if that stat isn't valid for the new cost's pool. Total cost budget in-game is 12; the CLI warns if a spread exceeds it but doesn't block. The main-stat pool is keyed by each echo's own cost (`MAIN_STAT_POOLS[echo.cost]`), and scoring (`scoreEcho`/`scoreBuild`) reads `echo.cost`, so spreads are fully supported end-to-end.

**Check a resonator's overall rating:** The Console resonator page shows a `RESONATOR RATING` panel up top — one grade blending echo + stats + signature + sequence ("OPTIMIZER" weighting: build quality over investment). Read it from the terminal with `npm run update -- rating "<name>"`. Read-only; tune weights/curves in `src/lib/resonator-rating.ts`.

**Style a value differently per theme:** Find it in `components/themes/<theme>/{page}.tsx` — each theme owns its full render.

## Don't / gotchas

- **Don't** reinstate the static `src/lib/data.ts` — it was removed deliberately when Supabase landed. Data must be read via `useData()` so live edits propagate.
- **Don't** add `<EditableField>` to Obsidian or Atelier pages. They're pure read surfaces by design.
- **Don't** refactor inline styles into Tailwind utility classes wholesale — the prototype at `../.design-handoff/design_handoff_wuwa_roster/` is the source of truth for visual fidelity. Surgical Tailwind use is fine; mass conversion is not.
- **Don't** add `width: 100%` to tall-portrait `<img>` — Tailwind v4 preflight already sets `max-width: 100%`, which fights the explicit `height: 105%` and squishes the portrait. The fix `width: auto; maxWidth: "none"` is already inline on every tall-portrait; preserve it.
- **Don't** treat the bundled `public/data.json` as the source of truth — it's the seed, only read once if the Supabase row is missing.
- **Couch-Clio runs commands natively.** Don't write instructions as "tell Andres to run X" if she can just run X herself.

## File map quick reference

- Data layer: `src/lib/data-context.tsx`, `src/lib/supabase.ts`, `src/lib/types.ts`
- Edit mode: `src/lib/edit-context.tsx`, `src/components/editable-field.tsx`
- Theme switching: `src/lib/theme-context.tsx`, `src/components/top-bar.tsx`
- CLI: `scripts/update.ts` (roster), `scripts/convene-sync.ts` (pull-history sync), `scripts/convene-import.ts` (historical graft)
- Signature weapons: type in `src/lib/types.ts` (`SignatureWeapon`), `signatureWeaponOf`/`ensureSignatureWeapons` in `data-context.tsx`, render in each theme's `resonator.tsx` (Console editable), seed/migrate via `scripts/migrate-sigweapons.ts`
- Echoes: types in `src/lib/types.ts` (`Echo`/`EchoBuild`/`StatWeights`), pure scorer in `src/lib/echo-audit.ts` (pools/ranges/`defaultWeightsFor`/`scoreEcho`/`scoreBuild`/`blankEchoes`), `echoBuildOf`/`ensureEchoBuilds` in `data-context.tsx`, render in `src/components/themes/console/resonator.tsx` (ECHO AUDIT panel, Console-only), CLI `echoslot`/`echoweight` in `scripts/update.ts`
- Resonator Rating: pure scorer in `src/lib/resonator-rating.ts` (`rateResonator`/`RATING_WEIGHTS`; blends echo+stats+sig+seq → one grade on the echo ladder), render in `src/components/themes/console/resonator.tsx` (RESONATOR RATING panel, Console-only, `GradePill hero`), read-only CLI `rating <name>` in `scripts/update.ts`
- Convene: `src/lib/convene-types.ts`, `src/lib/convene-analytics.ts` (pure pity/50-50/distribution math), `src/lib/convene-merge.ts` (boundary-splice archival merge), `src/lib/use-pulls.ts` (read-only loader), `src/app/convene/page.tsx`, `src/components/themes/*/convene.tsx`
- Design source: `../.design-handoff/design_handoff_wuwa_roster/` (sibling to `wuwa-dashboard-next/`)

## Active scope

- **Convene (pull history) section:** SHIPPED in **all three themes** (`/convene` — global KPIs, banner selector, 5★ timeline, pity bar, 50/50 win/loss/guar tags, distribution histogram). Console = HUD; Obsidian = jewel "ledger" (*"Fortune, accounted for."*); Atelier = light "almanac" (*"A complete ledger of luck."*, legible-on-light hues local to the file). All three read the same `usePulls()` data and handle loading/error/empty status screens. 50/50 is derived from the fixed standard-5★ pool (Calcharo/Encore/Jianxin/Lingyang/Verina), no banner-date mapping. Read-only (no edit mode) — synced via `npm run convene`.
- **Echo Audit section:** SHIPPED in **all three themes** (resonator page — overall stat-grade header + cost slots with main/substat, per-echo grade chips, quality dots/bars, dead-stat strikethrough). Console is editable inline (or via `echoslot`/`echoweight` CLI); **Obsidian + Atelier are read-only renders** of the SAME `scoreBuild`/`scoreEcho` output (jewel ledger / light ledger), no `EditableField` by design. They only list slots that actually grade (blank stubs hidden). Per-resonator stat weights seeded from buildType+element, tunable via CLI. **Stat grade only** — set-bonus (2pc/5pc) evaluation is out of scope. Default weight seeds in `echo-audit.ts` (`DEFAULT_WEIGHTS`) are starting points, not gospel — tune as needed. **Cost is per-echo** — non-standard spreads (e.g. an HP scaler's 4-4-1-1-1) are supported via `echoslot spread`/`cost` CLI or the slot cost dropdown in edit mode (see Common tasks).
  - **Grading recalibrated (2026-05-30):** `rollQuality` is now floor-aware (`value/max` — a min roll is ~its real fraction of ceiling, NOT zero; the old `(value-min)/(max-min)` pinned floor rolls to 0 and made correct-but-low builds grade like off-stat garbage). Substats normalize against a REALISTIC ideal (top-5 relevant stats at `Q_TARGET = 0.75` = "thrilled to get this" = S), and rolls above target overflow past 100 into the prestige zone. Ladder is now **D → C → B → A → S → SSS → ✦** (`gradeOf`): D is reserved for genuinely off-stat builds, S = optimal peak, SSS/✦ are the rare overflow tiers. **S renders GOLD** (`PRESTIGE_HEX` in `console/resonator.tsx`), SSS violet, ✦ (Clio sparkle) a pink→gold gradient + glow. Build headlines are diagnostic (`scoreBuild` branches on `avgMainMatch`), so "right stats, low rolls" no longer reads as "off-stat waste".
- **Resonator Rating section:** Console render SHIPPED (resonator page — `RESONATOR RATING` panel at the TOP of the profile, hero-sized `GradePill` + 4 sub-bars). Blends **Echo 35 / Stats 35 / Sig 15 / Seq 15** ("OPTIMIZER" soul — build quality over investment; an f2p god-build can outscore a sloppy whale) into one grade on the **same ladder** as the echo audit. Sub-scores: echo = `scoreBuild` (can overflow >100 → feeds rating prestige), stats = reuses each `AuditStat._status`, sig = on-sig (R1 80→R5 100, green) vs off-sig (52→70), seq = S0 60 floor→S6 100. Missing inputs renormalize (not punished). Read-only CLI `npm run update -- rating <name>`. Weights/curves in `resonator-rating.ts` are defaults — tune to taste. SHIPPED in **all three themes** now — Console = HUD pill under the header; Obsidian = gold-stroked card with a 64px serif medallion (S renders gold/glow); Atelier = top-rule band with a 62px ink-outlined square. Obsidian/Atelier place the Rating panel after the identity stat row (before the loadout), per the Folio spec.
- Inline edits on Console **Teams** and **Cycles** pages: NOT wired. Use CLI in the meantime.
- EXPORT button (download JSONB snapshot): NOT ported from ZZZ. Supabase is the source of truth so it's lower priority; revisit if Andres wants an offline backup gesture.

## Deployment (shipped)

- **Live** at https://lumenastrum.github.io/wuwa-dashboard-next/ via `.github/workflows/pages.yml` (GitHub Pages Actions, static export — no `gh-pages` branch). Auto-deploys on push to `main`.
- Editing existing data needs **no** redeploy (live from Supabase). Adding a **new resonator** needs a rebuild + push so `generateStaticParams()` emits its `/r/{name}/` page. See README "Deployment".
