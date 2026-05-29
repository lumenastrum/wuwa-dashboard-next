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

**Fill a signature weapon (passive / why-cracked / stats):** CLI `npm run update -- sigweapon "<weapon name>" <field> "<value>"` (fields: passive, synergy, passivename, baseatk, mainstat, mainstatvalue, type, wearer), OR inline in Console edit mode. Addressed by **weapon name**, not resonator. New weapons get a blank stub automatically (`ensureSignatureWeapons`); `addsigweapon` creates one explicitly.

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
- Convene: `src/lib/convene-types.ts`, `src/lib/convene-analytics.ts` (pure pity/50-50/distribution math), `src/lib/convene-merge.ts` (boundary-splice archival merge), `src/lib/use-pulls.ts` (read-only loader), `src/app/convene/page.tsx`, `src/components/themes/*/convene.tsx`
- Design source: `../.design-handoff/design_handoff_wuwa_roster/` (sibling to `wuwa-dashboard-next/`)

## Active scope

- **Convene (pull history) section:** Console render SHIPPED (`/convene` — global KPIs, banner selector, 5★ timeline, pity bar, 50/50 win/loss/guar tags, distribution histogram). Obsidian + Atelier are **placeholder** renders (headline number + "view in Console") — full theme ports PENDING. 50/50 is derived from the fixed standard-5★ pool (Calcharo/Encore/Jianxin/Lingyang/Verina), no banner-date mapping. Read-only (no edit mode) — synced via `npm run convene`.
- Inline edits on Console **Teams** and **Cycles** pages: NOT wired. Use CLI in the meantime.
- EXPORT button (download JSONB snapshot): NOT ported from ZZZ. Supabase is the source of truth so it's lower priority; revisit if Andres wants an offline backup gesture.

## Deployment (shipped)

- **Live** at https://lumenastrum.github.io/wuwa-dashboard-next/ via `.github/workflows/pages.yml` (GitHub Pages Actions, static export — no `gh-pages` branch). Auto-deploys on push to `main`.
- Editing existing data needs **no** redeploy (live from Supabase). Adding a **new resonator** needs a rebuild + push so `generateStaticParams()` emits its `/r/{name}/` page. See README "Deployment".
