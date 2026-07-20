# WuWa Dashboard

The house Wuthering Waves roster — audits, benchmarks, and endstate cycles in the Emberline theme, live-saved to Supabase. Built by Clio, fed with real pull data, and yes, the S-grades render in gold because they earned it.

## What this is

A personal gacha-tracker dashboard, single-themed as **Emberline** (the earlier Obsidian / Atelier / Console trio was retired in the 2026-07-20 strip-down):

- **Emberline** — deep abyssal teal with element-reactive ember accents. The "Resonance Instrument" type stack: Chakra Petch 500 display, Familjen Grotesk body, Martian Mono HUD. Palette (`E_PAL`) and primitives (`ECard`/`EKpi`/`EShell`/…) live in `src/components/themes/emberline/`. Fully responsive — a two-stage idiom (`src/lib/use-dashboard-viewport.ts`) collapses structure at ≤1024 and adjusts fonts/padding/heroes at ≤700; wide tables scroll inside their cards.

All writes are **CLI-only** — the browser is read-only on every page.

Four pages: **Roster** (`/`), **Resonator** (`/r/[name]`), **Teams** (`/teams`), **Cycles** (`/cycles`).

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + Tailwind 4 + inline-styled theme primitives |
| Data | Supabase Postgres (`dashboard_profiles` table, JSONB blob) |
| State | DataProvider context with debounced auto-save (650ms) |
| Theme | Emberline — sole theme, inline-styled primitives |
| Writes | CLI-only (`npm run update`) — browser is read-only (RLS) |
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

## Updating data — the CLI

Writes are **owner-locked** (RLS since 2026-07-07) and **CLI-only** — visitors get the museum tour, not the paintbrush. The live site is fully browsable read-only, and there is no in-browser editing on any page (the old Console edit mode was removed in the 2026-07-20 strip-down).

### `npm run update`

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

The anon key is in `src/lib/supabase.ts` — committed deliberately because Supabase anon keys are designed to ship client-side. Security comes from RLS, not key secrecy: since the 2026-07-07 lockdown the anon role is **SELECT-only** (public signups disabled), so the world can read the dashboard and nobody but the owner can write to it. Writes ride the service key (CLI, gitignored `.env`) — there is no in-browser write path. The `dashboard_profiles` table has its old profile CHECK constraint dropped so any namespaced profile key works.

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
│  │  ├─ layout.tsx            ThemeProvider → DataProvider → TopBar + children
│  │  ├─ page.tsx              / → Roster (Emberline)
│  │  ├─ r/[name]/page.tsx     /r/[name] → Resonator
│  │  ├─ teams/page.tsx        /teams
│  │  ├─ cycles/page.tsx       /cycles
│  │  └─ globals.css           Tailwind v4 base reset + body/color (no @theme, no data-theme)
│  ├─ components/
│  │  ├─ top-bar.tsx           Renders the Emberline top bar
│  │  ├─ cover-portrait.tsx    <CoverPortrait> Spine → tall → bust chain
│  │  └─ themes/
│  │     └─ emberline/         { styles (E_PAL), primitives (ECard/EKpi/EShell…), top-bar, roster, resonator, teams, cycles, convene, flex-card }
│  ├─ lib/
│  │  ├─ types.ts              DashboardData, Resonator, AuditEntry, etc.
│  │  ├─ supabase.ts           URL, anon key, table, profile key, debounce delay
│  │  ├─ data-context.tsx      DataProvider + useData() hook + selectors
│  │  ├─ theme-context.tsx     ThemeProvider + useTheme() — cross-page lastResonator only (localStorage wuwa.resonator)
│  │  ├─ use-dashboard-viewport.ts  isMobile ≤700 / isTablet ≤1024 breakpoints
│  │  ├─ elements.ts           Element + status palettes
│  │  ├─ portraits.ts          Portrait + element-icon path resolvers + override map
│  │  ├─ weapons.ts            weaponImage(name) → /weapons/Weapon_*.webp
│  │  ├─ sonata.ts             parseEchoSets/sonataIcon → /sonatas/*.webp
│  │  └─ duration.ts           durationToSec helper
│  └─ data/                    (Empty — data.json moved to public/)
├─ scripts/
│  ├─ update.ts                CLI mutator (run via `npm run update -- …`)
│  ├─ migrate-sigweapons.ts    One-time: backup live row + seed signatureWeapons stubs
│  ├─ convene-sync.ts          Pull-history sync (npm run convene)
│  ├─ convene-import.ts        Historical pull graft (npm run convene:import)
│  └─ service-key.ts           Loads SUPABASE_SERVICE_KEY from gitignored .env
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
- **Editing:** CLI `sigweapon <weapon> <field> <value>` (and `addsigweapon`) — the only write path. Emberline renders it read-only; a blank weapon shows a muted "not documented yet" line.
- **Seeding the live row:** entries are seeded into Supabase by `scripts/migrate-sigweapons.ts` (backs up the row to `./backups/` first, then adds missing stubs — idempotent, never clobbers filled entries).

## Theme

**Emberline** is the sole theme (the earlier Obsidian / Atelier / Console trio was retired in the 2026-07-20 strip-down). Deep abyssal teal with element-reactive ember accents and the "Resonance Instrument" type stack — Chakra Petch 500 display, Familjen Grotesk body, Martian Mono HUD. The palette (`E_PAL`) and primitives (`ECard`/`EKpi`/`EShell`/…) live in `src/components/themes/emberline/`; there's no theme switcher, no `data-theme`, and no per-theme dispatcher — `src/components/top-bar.tsx` and the app pages render Emberline directly.

It's fully **responsive**: a two-stage idiom in `src/lib/use-dashboard-viewport.ts` collapses structure at `isTablet` (≤1024) and adjusts fonts/padding/heroes at `isMobile` (≤700). Wide tables scroll inside their own cards, and the FLEX card export button is desktop/tablet-only.

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
- `401/403` → RLS doing its job: anon is read-only. Use the service key (CLI) to write. If you've forked this for your own data, write your own policies — writes to `authenticated`, reads to everyone, signups off.

**Indicator stays `○ LOCAL` immediately on load** — Supabase client failed to init (bad URL/key). Check `src/lib/supabase.ts` constants.

**Tall portrait looks squished on a resonator** — Tailwind v4 preflight's `max-width: 100%` fighting an explicit `height: 105%`. The fix is already applied (`maxWidth: "none", width: "auto"` inline on every tall-portrait `<img>`) — if it comes back, add those props.

**Weapon image not showing** — Filename mismatch with the convention. Open browser dev tools, check the 404 URL, then either rename the file or add an override to `src/lib/weapons.ts`.

**CLI says "No row for profile andres-wuwa"** — Supabase doesn't have the seed row yet. Open `localhost:3000` once to trigger the seed, then re-run the CLI command.

## For AI agents (Clio, Couch-Clio, anyone else)

If you're a Claude landing in this repo:

- This is **Next.js 16** — many APIs differ from training data (notably `params` is a `Promise` now, accessed via `use(params)` in client components). Always read `node_modules/next/dist/docs/` before changing routing or async data conventions.
- **Don't reinstate the static `lib/data.ts`** — it was replaced with `lib/data-context.tsx` deliberately. Module-level constants from `data.json` can't see Supabase live updates.
- **There is no in-browser editing.** `EditableField`, `edit-context`, `AuthGate`, and `src/lib/auth.ts` were all deleted in the 2026-07-20 strip-down; the CLI is the only write path. Don't try to reintroduce inline editing.
- **Inline styles are preserved 1:1 from the Emberline design prototype** (kept outside this repo). Don't refactor them to Tailwind classes without asking — the prototype is the source of truth for visual fidelity.

See `CLAUDE.md` for shorter context.
