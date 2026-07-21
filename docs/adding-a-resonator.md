# Adding a New Resonator — the proven runbook

Written live while adding **Yangyang: Xuanling** (v3.5, 2026-07-12). Every step below was
actually executed in that session; gotchas are ones we hit for real. Follow in order —
later steps assume earlier ones.

## 0. Research the spec (before touching anything)

Pin down, with at least two sources for anything load-bearing:

- **Element / weapon type / role** — these are validated enums in `addresonator`.
- **Signature weapon**: exact EN name (leak-era sources disagree on names — Xuanling's sig
  appeared as both "Azure Oath" and "Azure of Heaven"; resolve before writing the card),
  base ATK, main stat + value, passive name + rank-1 text.
- **Echo spec**: sonata set name, 4-cost echo, per-cost main stats, substat priority.
- **Patch version** — drives the key refresh below. (Andres called 3.5 "3.1" from memory;
  the wire said 3.5. Verify, don't vibe.)

Division of labor per house rules: Andres reads Prydwen, Clio reads r/mains megathreads +
wutheringlab/Game8-tier guides. Chibi subagents get WebFetch only.

## 1. Refresh extractor keys for the new patch

The game repacks ALL paks every patch. In `Claude Space\wuwa-extract\` (bash):

```bash
cp keys.json keys_<oldpatch>_backup.json
curl -s https://yarik0chka.github.io/wuwa-keys/keys.json -o keys.json
dotnet run -c Release -- list <anything>   # smoke test
```

- Mounted file count printed = success (3.5: 1,969,489 files, 470 dynamic keys vs 3.4's 440).
- `Oodle decompression failed with result 0` = **CUE4Parse too old, not a key problem.**
  Bump the nuget package first, then re-test. (3.4→3.5 the July build `1.2.2.202607`
  survived; only keys were stale.)

## 2. Find the codename + asset paths

Playable characters live under pinyin codenames. For an SP/variant form the codename can be
the *variant* name, not the base character (Xuanling, NOT Yangyang2 — `Yangyang2.ini` exists
in Config/Tags but the Role folder is `Character/Role/FemaleM/Xuanling/`).

```bash
dotnet run -c Release -- list <GuessName> | grep -iE "Role/|SkillIcon"
```

- Skill atlas: `UI/UIResources/Common/Atlas/SkillIcon/SkillIcon<CodeName>/` — watch the
  casing, it varies (`SkillIconXuanLing`, capital L).
- Numeric character ID + icon paths come from the role DB (`cat`, not `export` — export is
  the texture path and throws on .db):

```bash
dotnet run -c Release -- cat "Client/Content/Aki/ConfigDB/db_role.db" testout/db_role.db
# then sqlite3: table roleinfo (Id, QualityId, RoleType, BinData);
# grep the BinData blob for the codename → head-icon index + Pile (tall art) path
```

Xuanling: **Id 1610, quality 5, head-icon index 70**, tall art
`Common/Image/IconRolePile/T_IconRole_Pile_Xuanling_UI`.

## 3. Create the roster entry

In `wuwa-dashboard-next/` (any shell):

```bash
npm run update -- addresonator "<Display Name>" <Element> <WeaponType> "<Role>"
```

This creates the Supabase entry + blank audit stub + echo-build stub + sig-weapon stub, and
syncs `public/data.json` so `generateStaticParams()` will emit `/r/<name>/`. **Still needs a
rebuild + push at the end** (step 8).

⚠️ **Names with a colon** ("Yangyang: Xuanling") cannot be portrait filenames on Windows.
Plan for `PORTRAIT_OVERRIDES` / `TALL_OVERRIDES` in `src/lib/portraits.ts` from the start.

### 3b. Colon names break the local Windows build (SOLVED — one-time fix, already in)

The display name is the `/r/[name]` route param, and static export writes it as a
directory — `npm run build` on Windows died with `ENOENT mkdir ... Yangyang: Xuanling.segments`
(the Linux CI builder would have shipped it silently). Fixed 2026-07-12 with a route-slug
layer, so future punctuation names need **no action**:

- `src/lib/route-name.ts`: `routeName()` strips Windows-reserved chars (`<>:"/\|?*`) from
  route params only; `resonatorPath(name)` builds every `/r/` href (all themes + top bars).
- `generateStaticParams` emits `routeName(r.name)`; `getResonatorOrFirstOf` falls back to a
  routeName-equality match, so display names keep their punctuation everywhere visible.
- Clean names route byte-identically to before (no URL churn). Xuanling's page is
  `/r/Yangyang%20Xuanling`.

**After `addresonator`, always run a local `npm run build` before push** — CI being Linux
means Windows-only path bugs never surface there.

## 4. Signature weapon (invoke the `wuwa-weapon-docs` skill first)

The skill has the seven fields, sources, and the synergy-voice guide. Sequence that matters:

1. `npm run update -- weapon "<Resonator>" "<Weapon Name>"` — **this auto-stubs the
   signature-weapon entry** via `ensureSignatureWeapons`. Do NOT `addsigweapon` afterwards
   (it errors "already exists"; harmless but noisy).
2. `rank "<Resonator>" R1` (his actual rank).
3. `sigweapon "<Weapon>" <field> "<value>"` × baseatk / mainstat / mainstatvalue /
   passivename / passive / synergy. Addressed by WEAPON name.

Research notes from the Azure Oath run: leak-era sources contradict each other on names AND
stat archetypes (wutheringlab's weapon page said 500/72CD while its own character page said
588/24.3CR). Passive names come from wuthering.gg/weapons/<kebab>; break stat ties with the
DB-style sources over blog guides, and get two agreeing sources before writing.

### 4b. Stat bands are PER-RESONATOR — account for in-combat sonata sources

`statopt` writes the numeric band (`min`/`max`) that `deriveStatStatus` grades against, so the
band IS the target. Do not paste the generic CRIT-DPS `70-80%` onto a resonator whose set hands
her crit in combat — a sheet stat that looks low can be correct, and cranking it higher is
wasted investment.

Proven cases (pak text, `PhantomFetter_*` / `ItemInfo_*_AttributesDescription`):

| Resonator | Set | Grants | Sheet CR | Effective | Band used |
|---|---|---|---|---|---|
| Yangyang: Xuanling | Song of Feathered Trace 5pc | **+20% CR** on Havoc Bane | 65.5% | ~85% | `60-70%` |
| Phrolova | Dream of the Lost 3pc | **+20% CR** at 0 Resonance Energy | 66.1% | ~86% | `60-70%` |

Fix the **band**, never the status. `statstatus` is an override that the next `stat`/`statopt`
call re-derives away — encoding the reason in the band survives, and the trailing parenthetical
(`"60-70% (+20% CR from …)"`) documents *why* without affecting the parse.

**Not every sub-band stat is this case.** Distinguish:
- **self-sufficient set source** → recalibrate the band (Xuanling, Phrolova)
- **team-dependent buff** (Carlotta: "SK buffs fix") → leave the band; the unit is genuinely
  reliant on a partner
- **deliberate tradeoff** (Zhezhi: "72% CD weapon tax") → leave it; the note carries the intent
- **genuinely under** (Lucy, Camellya) → leave it red/yellow, that's the audit working

## 5. Echo build spec

```bash
npm run update -- build "<Resonator>" "CRIT DPS"    # FIRST — seeds the stat weights
npm run update -- echoweight "<Resonator>" reset     # reseed if build was set after echoes
npm run update -- echo "<Resonator>" "<Set Name> 5/5"
npm run update -- echoslot "<Resonator>" 1 echo "<4-cost species>"
# sonata per slot 1-5, then mains: 4c Crit DMG · 3c element DMG ×2 · 1c ATK% ×2 (typical)
npm run update -- echoslot "<Resonator>" show        # verify the grade headline
```

- **Set `build` BEFORE grading anything** — a blank buildType seeds generic weights and the
  audit reads textbook mains as "Off-stat". After `build` + `echoweight reset` the headline
  becomes the honest "Underbuilt — dead substats" until real rolls go in.
- A new-patch echo species warns `no icon mapped` — expected; fixed by the echo-map regen in
  step 7.
- **Substat values are Andres's in-game homework** — the spec mains document the target
  build; grades stay D until his actual rolls are entered.

## 6. Verify names/stats against the pak (ground truth beats guides)

Leak-era guides contradict each other. The game ships its own English text:

```bash
dotnet run -c Release -- cat "Client/Content/Aki/ConfigDB/en/lang_multi_text.db" testout/lang_mt_en.db
# sqlite MultiText(Id, Content): WeaponConf_<id>_WeaponName, WeaponReson_<id>_Name (passive),
# WeaponConf_<id>_Desc (passive text w/ {} placeholders), PhantomFetter_<n>_Name (sonata sets),
# MonsterInfo_<id>_Name (echoes)
```

This settled Azure Oath (id 21020096, passive "Unbending") when Dimbreath's TextMap didn't
have the 3.5 weapon names yet. There's also `lang_multi_text_1sthalf.db` for phase-gated
strings. Weapon id → find in `db_weapon.db` weaponconf blobs (ASCII icon paths inside);
weapon type blocks: 2101=Broadblade 2102=Sword 2103=Pistols 2104=Gauntlets 2105=Rectifier.

## 7. Rip + ship assets (all from the character's pak data)

**3.5+ texture gotcha:** new-patch 2D textures are BC7Prep-packed behind an
`OodleTextureStorageProviderFactory` — stock nuget CUE4Parse mounts them but `decode
returned null`. Fix (done 2026-07-12): `wuwa-extract.csproj` now ProjectReferences the
source fork `Claude Space\CUE4Parse-wuwa\` (MrEg-az/CUE4Parse-WuWa-3.5 @ da75ad1e, diff
reviewed — the fix is OodleTextureHelper + BC7PrepDecoder + texture-pipeline hooks; the
helper self-downloads the official oo2texrt DLL from WorkingRobot/OodleUE on first decode).
Revert to PackageReference when upstream ships it.

What to rip (paths found in step 2's db_role probe):

| Asset | Pak source | Ships to |
|---|---|---|
| Bust portrait | `Image/IconRoleHead256/T_IconRoleHead256_<idx>_UI` | `public/portraits/<safe>.png` @256 PNG |
| Tall sprite | `Image/IconRolePile/T_IconRole_Pile_<Codename>_UI` | `public/tall-portraits/<Safe>_Full_Sprite.webp` (floor alpha <8 → 0: BC7 junk pixels ride at alpha 1–4) |
| Weapon | `Image/IconWeapon732/T_IconWeapon732_<iconId>_UI` — **`<iconId>` is NOT the weapon's ItemId**, see below | `public/weapons/Weapon_<Name>.webp` — **alpha-bbox crop + centered square pad → 256×256** (the raw icon is ~40% empty canvas; shipped raw it renders as a tiny distant weapon on the card) |
| Sonata icon | path in `db_phantom.db` `phantomfettergroup` blob (Id = PhantomFetter number) | `public/sonatas/<Set_Name>.webp` @64 |
| Echo heads | `Image/IconMonsterHead732/T_IconMonsterHead732_<id>_UI` | `public/game/echoes/<id>.webp` @256 |
| Forte icons | `texdir` the `Atlas/SkillIcon/SkillIcon<CodeName>/` atlas + `props` the TPI asset → `crop_lgui_sprites.py` | `public/game/forte/<safe-lower>/` @128 (B1→b1, Y→y, C1→c1, QTE→intro) |

- Transform = `ship()` in `wuwa-extract/ship_to_public.py` (LANCZOS thumbnail, webp q90 m6).
  **Weapons are NOT handled by `ship_to_public.py`** — their alpha-bbox+square-pad transform has
  always been ad-hoc, which is how a wrong icon ships unnoticed. Eyeball the result.

- ⚠️ **Weapon icon id ≠ weapon ItemId** (burned us 2026-07-21 on Red Spring). `Red Spring` is
  ItemId `21020026`, but its art is `T_IconWeapon732_`**`21020017`**`_UI`. Ripping by ItemId
  silently yields a *different real weapon's* icon — we shipped Bloodpact's Pledge art on
  Camellya's card for a day. **11 of 120 weapons mismatch**, including two straight swaps
  (Ocean's Gift ↔ Stellar Symphony, and Red Spring's ItemId is Bloodpact's Pledge's icon).
  Always read the icon path out of the weapon's own row:

```bash
# ItemId -> true icon id, from the pak (never assume they're equal)
python - <<'PY'
import sqlite3, re
w = sqlite3.connect("testout/db_weapon_35.db")
t = sqlite3.connect("testout/lang_mt_en.db")
names = {i.split("_")[1]: c for i, c in
         t.execute("SELECT Id,Content FROM MultiText WHERE Id LIKE 'WeaponConf_%_WeaponName'")}
for item, blob in w.execute("SELECT ItemId,BinData FROM weaponconf"):
    b = blob if isinstance(blob, bytes) else str(blob).encode()
    m = re.search(rb"T_IconWeapon732_(\d+)_UI", b)
    if m and m.group(1).decode() != str(item):
        print(f"{names.get(str(item),'?'):<26} item={item} icon={m.group(1).decode()}")
PY
```

- **Verifying a weapon icon: do NOT pixel-diff shipped vs pak.** Most shipped weapon art is
  **wiki-sourced** (different crop/zoom/render), so a diff flags ~25 of 26 as "wrong" and tells
  you nothing. Only pak-ripped assets (Azure Oath, Red Spring) diff near zero. Build a
  shipped-vs-pak contact sheet and **look at it** — identity is a visual question.
- Xuanling's QTE sprite was NOT blank (Aimisi's was) — always alpha-count before assuming
  the intro icon needs the screenshot route. `basic` still falls back to the shared
  per-weapon glyph.
- **Regen the echo map**: `python build_echo_names.py testout/lang_mt_en.db` (now reads the
  in-pak lang db — Dimbreath lags patches). Diff `src/lib/echo-icons.json` and confirm
  **insertions only**; rip the listed missing head icons. (Fleurdelys has never mapped —
  known quirk, not a regression.)
- Add `PORTRAIT_OVERRIDES` / `TALL_OVERRIDES` entries in `src/lib/portraits.ts` for
  punctuated names. `forteIcon()` already routes through `routeName()`.
- Forte **levels** (`npm run update -- forte …`) are Andres's homework once he's leveled
  the tree; the panel hides until set.

### 7b. Forte icons: verify slot mapping from `db_skill.db`, don't trust the letter

The atlas sprite letters (`A1`/`B1`/`C1`/`D1`/`Y`/`T`/`QTE`) are NOT self-describing, and the
per-slot files the render wants are `basic` / `b1` / `y` / `c1` / `intro` (see
`FORTE_SLOT_FILES` in `src/lib/game-icons.ts`). Confirm the mapping against the pak's own
skill rows instead of assuming — one query, no guessing:

```bash
python - <<'PY'
import re, sqlite3
db = sqlite3.connect("db_skill.db"); t = sqlite3.connect("testout/lang_mt_en.db")
nm = {i: c for i, c in t.execute(
    "SELECT Id,Content FROM MultiText WHERE Id LIKE 'Skill_%_SkillName'")}
for sid, blob in db.execute("SELECT Id,BinData FROM skill"):
    if not isinstance(blob, bytes) or b"SP_Icon<CodeName>" not in blob: continue
    ic = sorted({m.group().decode() for m in re.finditer(rb"SP_Icon<CodeName>\w*", blob)})[0]
    print(f"{ic:<24} {nm.get(f'Skill_{sid}_SkillName','?')}")
PY
```

Camellya (codename **Chun**) resolved as: `B1`=Resonance Skill, `Y`=Forte Circuit,
`C1`=Resonance Liberation, `QTE`=Intro, `T`=Outro (not rendered), `D1`/`D2`=inherent
passives, `A1`=the Normal Attack glyph (no skill row). That matches the house convention —
but it was *verified*, not assumed.

**Her QTE sprite is NOT blank** (Aemeath's was), so all five slots came straight from the
atlas with no forte-page screenshot needed. Always alpha-count before assuming otherwise.

### 7c. TPI assets ship in two schemas

`crop_lgui_sprites.py` used to read only `SoftAtlasTextures[].AssetPathName` (Aemeath-era).
Older characters like Chun use `AtlasTextures[].ObjectName` = `"Texture2D'T_Foo'"` instead
and blew up with `KeyError: 'SoftAtlasTextures'`. The script now accepts **both** — if a new
rip dies on a missing key, check which schema that character's TPI uses before patching.

## 8. Ship + verify

1. `npm run build` locally (Windows path-bug tripwire; CI is Linux and won't catch them).
2. Dev-server spot check (launch.json `wuwa-dashboard-next`, :3005): resonator page in at
   least one theme + network tab shows every new asset 200. Dev quirks already handled in
   `page.tsx`: workspace-root cwd fallback + encoded-param twins (dev-only, prod emits
   clean dirs).
3. Commit + push to `main` → GH Pages Action deploys. **The new `/r/` page only exists
   after this rebuild.**
4. Closing ritual: load the LIVE page, confirm data + art render.

Data-only edits after this (stats, notes, echo rolls) go live via Supabase instantly — no
rebuild.
