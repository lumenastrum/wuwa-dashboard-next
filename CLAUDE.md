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

**Add a resonator / sequence / weapon:** Edit Supabase directly via Studio, OR add to `public/data.json` and `npm run update -- list` to confirm.

**Add a weapon image:** Drop `Weapon_{Name_With_Underscores}.webp` into `public/weapons/`. Apostrophes are literal `'`, not `%27` — rename wiki downloads if needed.

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
- CLI: `scripts/update.ts`
- Design source: `../.design-handoff/design_handoff_wuwa_roster/` (sibling to `wuwa-dashboard-next/`)

## Active scope

- Inline edits on Console **Teams** and **Cycles** pages: NOT wired. Use CLI in the meantime.
- EXPORT button (download JSONB snapshot): NOT ported from ZZZ. Supabase is the source of truth so it's lower priority; revisit if Andres wants an offline backup gesture.
- Deployment: dev-only. GH Pages config + GitHub Action pending. See README "Deployment" section.
