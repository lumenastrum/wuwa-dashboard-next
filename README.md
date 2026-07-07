# WuWa Dashboard

The house Wuthering Waves roster — audits, benchmarks, and endstate cycles in three swappable themes, live-saved to Supabase. Built by Clio, fed with real pull data, and yes, the S-grades render in gold because they earned it.

## What this is

A personal gacha-tracker dashboard with three visual themes sharing the same data:

- **Obsidian** — dark, jewel-tone, elegant. Cormorant Garamond display + Geist body, gold accent.
- **Atelier** — light editorial, ink-on-paper. Instrument Serif italic display, navy ink accent.
- **Console** — holographic HUD. Space Grotesk + JetBrains Mono everywhere, cyan + amber + magenta. **Edit mode lives here.**

Four pages: **Roster** (`/`), **Resonator** (`/r/[name]`), **Teams** (`/teams`), **Cycles** (`/cycles`).

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + Tailwind 4 + inline-styled theme primitives |
| Data | Supabase Postgres (`dashboard_profiles` table, JSONB blob) |
| State | DataProvider context with debounced auto-save (650ms) |
| Edit | EditableField primitive, Console-theme only |
| Mutation CLI | `tsx scripts/update.ts` via `npm run update` |
| Deploy | GitHub Pages (static export) — auto-deploys on push to `main` via `.github/workflows/pages.yml`. [Live](https://lumenastrum.github.io/wuwa-dashboard-next/) |

## Quick start

```powershell
# Install
npm install

# Dev server (Turbopack)
npm run dev
# → http://localhost:3000
```

Tested on **Node 24**, npm 11. Should work on any LTS Node ≥ 20.

## Updating data — two ways

Both write paths are **owner-locked** (RLS since 2026-07-07): visitors get the museum tour, not the paintbrush. The live site is fully browsable read-only.

### 1. Browser, in Console theme

1. Switch to the **Console** theme via the top-bar segmented control.
2. Click the `▣ LOCK` button (top right of the top bar). First time per browser, an **owner sign-in** overlay appears — writes require an authenticated Supabase session. After that it becomes `◐ EDIT` (amber) and the session persists.
3. Every editable value on the page is now an input or select. Edit any of them.
4. Click outside the input (or hit Enter) to commit. The sync indicator goes `◐ SAVE` for ~650ms, then back to `● LIVE` once Supabase confirms.
5. Click `◐ EDIT` again to lock back into read mode.

**Currently inline-editable on the Resonator page:** stats (current, optimal, _status), audit notes, build type, priority status, sequence (dropdown), weapon name + rank + level, echo set.

Teams + Cycles editing in-browser is **not wired yet** — use the CLI for those (it's faster anyway).

### 2. CLI — `npm run update`

Run from the project root. Works the same on Windows (PowerShell) and macOS (terminal). Quote values with spaces. Needs `SUPABASE_SERVICE_KEY` in a gitignored `.env` at the repo root — no key, no writes, by design.

```powershell
# Stat audit
npm run update -- stat Aemeath ATK "1,927"
npm run update -- statopt Carlotta CR "70-80%"
npm run update -- statstatus Augusta CR yellow
npm run update -- notes Aemeath "Near perfect"
npm run update -- build Aemeath "CRIT DPS"
npm run update -- prio Carlotta yellow

# Resonator metadata
npm run update -- seq Aemeath S4
npm run update -- level Aemeath 90
npm run update -- weapon Aemeath "Everbright Polestar"
npm run update -- rank Aemeath R1
npm run update -- echo Aemeath "Trailblazing Star 5/5"

# Benchmark times (after each Overdrive run)
npm run update -- bench 1 best 0:31
npm run update -- bench 1 average 0:33.5
npm run update -- bench 1 notes "New PB 2026-05-30"
npm run update -- deaths 1 0

# Cycle results (auto-recomputes totalPoints + teamsOver5k on score change)
npm run update -- cycle 2 team 7 score 13500
npm run update -- cycle 2 team 7 rating CROWNED
npm run update -- cycle 2 team 7 buff "Solar Burst"
npm run update -- cycle 2 team 7 notes "Aemeath carry, no deaths"
npm run update -- cycle 2 team 7 members "Aemeath,Lynae,Mornye"

# Action items + key findings
npm run update -- action 0 status green
npm run update -- action 0 detail "DONE — finished farming session"
npm run update -- finding 0 "new finding text"

# Signature weapons (addressed by WEAPON name, not resonator)
npm run update -- sigweapon "Ages of Harvest" passivename "Tidesculptor"
npm run update -- sigweapon "Ages of Harvest" passive "On Skill, ATK +12% (max 2x); coordinated attacks +48% DMG."
npm run update -- sigweapon "Ages of Harvest" synergy "Tuned for Jinhsi's Incandescence ramp into Liberation."
npm run update -- sigweapon "Ages of Harvest" baseatk "500"
npm run update -- sigweapon "Ages of Harvest" mainstat "Crit DMG"
npm run update -- sigweapon "Ages of Harvest" mainstatvalue "+72.0%"
npm run update -- addsigweapon "New Weapon Name" Sword Aemeath   # create a blank entry
npm run update -- sigweapon "Ages of Harvest" passive            # (no value) clears the field

# Inspection
npm run update -- list                                           # also lists ●/○ documented weapons
npm run update -- help
```

The CLI prints a diff line for every change and confirms `✓ saved to Supabase` on success. On error, exits 1 with a clear message.

## Data layer

### Where data lives

- **Source of truth at runtime:** Supabase row in `dashboard_profiles` where `profile = 'andres-wuwa'`. Single JSONB column holds the whole data blob.
- **Seed file (read once if Supabase is empty):** `public/data.json`. After first load with no row, the app fetches this, populates Supabase, then never touches it again.
- **Types:** `src/lib/types.ts`. Mirrors the JSON shape exactly.

### Load flow (`src/lib/data-context.tsx`)

```
mount
  ├── try Supabase: SELECT data FROM dashboard_profiles WHERE profile = 'andres-wuwa'
  ├── if row exists → use it
  ├── if not        → fetch /data.json → upsert it as the new row
  └── set raw, syncStatus='live'
```

### Save flow

Every `update(draft => …)` call:
1. Deep-clones current `raw` via `structuredClone`
2. Applies the mutator
3. Stores as new `raw` state
4. Schedules a 650ms debounced upsert to Supabase
5. Indicator goes `● LIVE` → `◐ SAVE` → `● LIVE`

If Supabase is unreachable, indicator stays `○ LOCAL`. Edits still apply in-memory; nothing's lost until tab close. (No localStorage fallback yet — could add if remote-edits-with-spotty-wifi becomes a use case.)

### Supabase config

The anon key is in `src/lib/supabase.ts` — committed deliberately because Supabase anon keys are designed to ship client-side. Security comes from RLS, not key secrecy: since the 2026-07-07 lockdown the anon role is **SELECT-only** (public signups disabled), so the world can read the dashboard and nobody but the owner can write to it. Writes ride either the owner's authenticated session (browser) or the service key (CLI, gitignored `.env`). The `dashboard_profiles` table has its old profile CHECK constraint dropped so any namespaced profile key works.

If you ever need to re-create the table from scratch:

```sql
CREATE TABLE dashboard_profiles (
  profile     TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

## Project structure

```
wuwa-dashboard-next/
├─ public/
│  ├─ data.json                Initial seed (live source is Supabase)
│  ├─ portraits/               Square portraits (256×256-ish, casing matters)
│  ├─ tall-portraits/          Tall full-body sprites (WebP)
│  └─ weapons/                 Signature weapon images (Weapon_*.webp)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx            ThemeProvider → DataProvider → EditProvider → TopBar + children
│  │  ├─ page.tsx              / → Roster (dispatches per theme)
│  │  ├─ r/[name]/page.tsx     /r/[name] → Resonator
│  │  ├─ teams/page.tsx        /teams
│  │  ├─ cycles/page.tsx       /cycles
│  │  └─ globals.css           Tailwind v4 + per-theme html[data-theme] tokens
│  ├─ components/
│  │  ├─ top-bar.tsx           Dispatcher → picks theme-specific top bar
│  │  ├─ weapon-img.tsx        <WeaponImg> with onError graceful hide
│  │  ├─ editable-field.tsx    <EditableField> primitive (text/select/textarea)
│  │  └─ themes/
│  │     ├─ obsidian/          { styles, primitives, top-bar, roster, resonator, teams, cycles }
│  │     ├─ atelier/           { + ARosterStrip vertical left-rail on resonator }
│  │     └─ console/           { KPanel HUD chrome, KScanlines grid overlay, edit affordances }
│  ├─ lib/
│  │  ├─ types.ts              DashboardData, Resonator, AuditEntry, etc.
│  │  ├─ supabase.ts           URL, anon key, table, profile key, debounce delay
│  │  ├─ data-context.tsx      DataProvider + useData() hook + selectors
│  │  ├─ theme-context.tsx     ThemeProvider + useTheme() + IMPLEMENTED_THEMES
│  │  ├─ edit-context.tsx      EditProvider + useEditMode()
│  │  ├─ elements.ts           Element + status palettes
│  │  ├─ portraits.ts          Portrait + element-icon path resolvers + override map
│  │  ├─ weapons.ts            weaponImage(name) → /weapons/Weapon_*.webp
│  │  └─ duration.ts           durationToSec helper
│  └─ data/                    (Empty — data.json moved to public/)
├─ scripts/
│  ├─ update.ts                CLI mutator (run via `npm run update -- …`)
│  ├─ migrate-sigweapons.ts    One-time: backup live row + seed signatureWeapons stubs
│  └─ refactor-data-imports.py One-shot codemod, kept for reference
└─ package.json
```

## Adding new weapon images

The wiki convention is `Weapon_{Name_With_Underscores}.webp`. Example: `Weapon_Everbright_Polestar.webp`. Drop the file in `public/weapons/` and it appears on the resonator page the next time you reload.

**Apostrophe gotcha:** the wiki URL-encodes `'` as `%27` in filenames. So a wiki download might land as `Weapon_Defier%27s_Thorn.webp`. Rename it to use a literal apostrophe (`Weapon_Defier's_Thorn.webp`) — that's what the default helper expects.

If a filename diverges from the convention (different extension, weird casing), add an entry to the `WEAPON_OVERRIDES` map in `src/lib/weapons.ts`.

## Signature weapons

Each resonator's signature weapon has a detail entry — **what it does** (passive + stats) and **why it's cracked for that resonator** (the synergy take). These render in the `SIGNATURE WEAPON` block on every resonator page.

- **Data:** a top-level `signatureWeapons: SignatureWeapon[]` collection (see `src/lib/types.ts`), keyed by `name` which matches the resonator's `weapon` field. Fields: `type`, `wearer`, `baseAtk`, `mainStat`, `mainStatValue`, `passiveName`, `passive`, `synergy`.
- **Self-healing:** `ensureSignatureWeapons()` in `data-context.tsx` adds a blank stub for any resonator weapon that lacks one, so a newly-added resonator auto-gets an entry to fill. The CLI does the same on write.
- **Editing:** CLI `sigweapon <weapon> <field> <value>` (and `addsigweapon`), or inline in **Console** edit mode (passive + synergy are textareas). Obsidian and Atelier render it read-only; a blank weapon shows a muted "not documented yet" line.
- **Seeding the live row:** entries are seeded into Supabase by `scripts/migrate-sigweapons.ts` (backs up the row to `./backups/` first, then adds missing stubs — idempotent, never clobbers filled entries).

## Themes

| Theme | When to use | Edit affordances |
|-------|-------------|------------------|
| Obsidian | Read-focused, dark, default for most surfaces | None — pure display |
| Atelier  | Editorial / printable / sharing screenshots | None — pure display |
| Console  | When you're tuning, logging clears, updating after a session | Full inline edit + LOCK toggle |

Adding a fourth theme: copy `src/components/themes/obsidian/`, replace the palette and primitives, register it in `src/lib/theme-context.tsx` (`THEME_LIST`, `IMPLEMENTED_THEMES`, `ThemeId` type), and dispatch in `src/components/top-bar.tsx` + each route under `src/app/`.

## Deployment

**Live at https://lumenastrum.github.io/wuwa-dashboard-next/.** Deploys automatically on every push to `main`.

### How it works

`.github/workflows/pages.yml` runs the official GitHub Pages Actions (no `gh-pages` branch — the build artifact is uploaded directly):

```
push to main → npm ci → npm run build → upload `out/` artifact → deploy-pages
```

The static export is configured in `next.config.ts`:

- `output: 'export'` — emits a fully static `out/` directory.
- `basePath` / `assetPrefix` = `/wuwa-dashboard-next` **in prod only** (so the project-pages URL `lumenastrum.github.io/wuwa-dashboard-next/` resolves assets correctly; `npm run dev` stays at `/`).
- `images: { unoptimized: true }` — required for static export.
- `src/lib/base-path.ts` mirrors `basePath` for the things Next doesn't auto-prefix: plain `<img>` `src` and `fetch()` URLs.

`src/app/r/[name]/page.tsx` calls `generateStaticParams()` (reading `public/data.json`) so every resonator gets its own pre-rendered `/r/{name}/` HTML.

### Data vs. deploy — what needs a rebuild

- **Editing existing data** (stats, notes, sequences, benchmark times, cycle scores…): **no rebuild.** The live site reads the same Supabase row, so edits propagate to every device on next load.
- **Adding a brand-new resonator:** needs a rebuild + push. `generateStaticParams()` reads `public/data.json` at build time, so a new `/r/{name}/` page only exists once the seed includes them and `main` redeploys. (The roster grid itself still shows them live from Supabase — it's only the dedicated detail route that 404s until rebuilt.)

## Troubleshooting

**Sync indicator stuck on `◐ SAVE`** — Network or RLS issue. Check browser console for the Supabase error code. Common ones:
- `23514` → CHECK constraint violation on `profile` column. The constraint should be dropped; if it came back, re-run `ALTER TABLE dashboard_profiles DROP CONSTRAINT dashboard_profiles_profile_check;` in Supabase SQL Editor.
- `401/403` → RLS doing its job: anon is read-only. Sign in via the edit toggle (browser) or use the service key (CLI). If you've forked this for your own data, write your own policies — writes to `authenticated`, reads to everyone, signups off.

**Indicator stays `○ LOCAL` immediately on load** — Supabase client failed to init (bad URL/key). Check `src/lib/supabase.ts` constants.

**Tall portrait looks squished on a resonator** — Tailwind v4 preflight's `max-width: 100%` fighting an explicit `height: 105%`. The fix is already applied (`maxWidth: "none", width: "auto"` inline on every tall-portrait `<img>`) — if it comes back, add those props.

**Weapon image not showing** — Filename mismatch with the convention. Open browser dev tools, check the 404 URL, then either rename the file or add an override to `src/lib/weapons.ts`.

**CLI says "No row for profile andres-wuwa"** — Supabase doesn't have the seed row yet. Open `localhost:3000` once to trigger the seed, then re-run the CLI command.

## For AI agents (Clio, Couch-Clio, anyone else)

If you're a Claude landing in this repo:

- This is **Next.js 16** — many APIs differ from training data (notably `params` is a `Promise` now, accessed via `use(params)` in client components). Always read `node_modules/next/dist/docs/` before changing routing or async data conventions.
- **Don't reinstate the static `lib/data.ts`** — it was replaced with `lib/data-context.tsx` deliberately. Module-level constants from `data.json` can't see Supabase live updates.
- **Edit mode is Console-only by design.** Don't add `<EditableField>` to Obsidian or Atelier pages.
- **Inline styles are preserved 1:1 from the original design prototype** (kept outside this repo). Don't refactor them to Tailwind classes without asking — the prototype is the source of truth for visual fidelity.

See `CLAUDE.md` for shorter context.
