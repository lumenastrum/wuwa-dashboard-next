# ToA Hazard Study — Area Effect vs. Roster (2026-08-22)

A five-run controlled study of a Tower of Adversity Hazard floor: **Sigillum + Fallacy of No Return,
both Level 100, both Calamity class.** Stage clock 5:00 (300s); three stars at under 180s elapsed.

All game text in this document is quoted from the local pak extract
(`wuwa-extract/lang_multi_text_en.db`, table `MultiText`), not from wikis or aggregators. Roster and
benchmark figures are read live from the `andres-wuwa` Supabase profile.

---

## TL;DR

**The support slot decided this floor, not the carry.**

Chisa's presence is worth roughly **30 seconds** — consistently, across three different comps, two
different carries, and both damage lanes. The same S6 carry with the same Crownless benchmark power
cleared in **0:55 with her** and **1:27 without her**.

The Area Effect's headline number (**+50%** for Tune Strain – Shifting) is bolted to the lane that
finished *last*. The smaller **+30%** (Havoc Bane) won, because Havoc Bane arrives bundled with an
instant resistance strip and stacked DEF penetration.

**Read what a buff is attached to, not how large the number is.**

---

## 1. The floor

Three Area Effect rows, matched to their exact pak IDs:

| Effect | Pak ID |
|---|---|
| 60s after battle start, hits apply +5% total DMG taken, +5% per 5s, cap 60% | `TowerChallengeBuff_92008205_Desc` |
| Enemies +15% All-Attribute RES — removed by **Negative Statuses** or **Tune Strain – Interfered** | `TowerChallengeBuff_92008193_Desc` |
| +15% total DMG taken · inflicting **Tune Strain – Shifting** → **+50%** team total DMG dealt (30s) · inflicting **Havoc Bane** → **+30%** team total DMG dealt (30s) · Negative Statuses deal +60% | `TowerChallengeBuff_92008194_Desc` |

### The ramp is a trap
Row `92008205` begins at **60s** and needs a further 60s to cap. Crests score on time remaining. No
team choice influences it. Ignore it when building.

### The wall variant matters
`92008193` accepts only Negative Statuses or Tune Strain – Interfered. A sibling row that appears on
other floors, `92008120`, reads *"when the enemies take **Tune Rupture DMG** or Fusion Burst DMG, or
are hit under Tune Strain – Interfered."*

**Tune Rupture strips that one. It does not strip this one.** A Tune-Rupture-mode team on this floor
never removes the wall — see Run 5.

---

## 2. Mechanics, from the glossary

- **`Term850180` Negative Status** = Spectro Frazzle · **Havoc Bane** · Fusion Burst · Glacio Chafe ·
  Electro Flare · Aero Erosion
- **`Term100003` Tune Strain – Shifting** — inflicted by certain Resonators. If the target is hit by
  **Tune Break** while Shifting, Shifting is replaced by Interfered.
- **`Term100005` Tune Strain – Interfered** — reachable *only* through a completed Tune Break. 30s.
- **`Term100001` Tune Break** — available only at maxed Off-Tune Level (Mistune state).
- **`Term850012` Havoc Bane** — 3 stacks by default, each reducing target DEF by 2%.

### Havoc Bane deals no damage
`Term850012` is a pure DEF-shred clause with no damage component — unlike `Term850010` Glacio Chafe
(*"deals Glacio DMG when being inflicted"*) or `Term850013` Electro Flare (*"deals periodic Electro
DMG"*).

**Consequence:** the Area Effect's *"Enemies take 60% more total DMG from Negative Statuses"* has
nothing to amplify on a Havoc Bane team. That line is collected by Fusion Burst, Glacio Chafe, Electro
Flare, Aero Erosion and Spectro Frazzle teams — not by a Bane team.

### Infliction is the trigger, not maintenance
Both bribes pay on *inflicting*. A completed Tune Break is never required to bank the +50%; Interfered
matters only to Resonators whose own kits scale on it.

---

## 3. Results

| # | Team | Clock left | **Elapsed** | Crownless bench | Ratio | Chisa |
|---|---|---|---|---|---|---|
| 1 | Aemeath S6 / Denia S2 (Fusion Burst) / **Chisa** S1 | 4:05 | **0:55** (55s) | 0:31 (31s) | 1.77× | **yes** |
| 2 | Aemeath S6 (Tune Rupture) / Lynae S2 (Tune Rupture) / Mornye S0 | 3:33 | **1:27** (87s) | 0:32 (32s) | 2.72× | no |
| 3 | Xuanling S0 / **Chisa** S1 / Suisui S0 | 3:18 | **1:42** (102s) | 1:42 (102s) | 1.00× | **yes** |
| 4 | Qingxiao S0 / Denia S2 (Tune Strain, *Reel*) / Mornye S0 | 3:09 | **1:51** (111s) | 1:11 (71s) | 1.56× | no |
| 5 | Qingxiao S0 / Denia S2 (Tune Strain, *Foam*) / Mornye S0 | 2:56 | **2:04** (124s) | 1:11 (71s) | 1.75× | no |

All five three-starred. Crownless benchmarks are Overdrive Zone Lv.100, best-of-3, from the Teams board.

**Run 2 is the control:** both carries in Tune Rupture mode means no Negative Status and no Tune Strain,
so it collects *neither* bribe and never strips the wall. It is the same carry as Run 1, one second
apart on the Crownless bench.

---

## 4. The finding

The ratio column clusters into nothing. A fixed-overhead model fits:

```
ToA_elapsed  =  F  +  k × Crownless_time
```

Holding `k = 0.65` (stable across every fit; the two bosses carry ~65% of one Crownless Lv.100's
effective HP), the implied floor per team:

| Team | Implied `F` | Chisa |
|---|---|---|
| Aemeath / Denia (FB) / Chisa | **34.8s** | yes |
| Xuanling / Chisa / Suisui | **35.7s** | yes |
| Aemeath / Lynae / Mornye | **66.2s** | no |
| Qingxiao / Denia (TS, Reel) / Mornye | **64.8s** | no |
| Qingxiao / Denia (TS, Foam) / Mornye | 77.8s | no — *+13s is the Foam set penalty, see §5* |

**Two bands, roughly 30 seconds apart. The discriminator is one roster slot.**

What Chisa uniquely supplies here:

1. **Instant, permanent wall strip.** Unseen Snare converts the whole team into Havoc Bane appliers —
   any Resonator's direct damage on a marked target applies Bane. Worth ×1.20 on its own.
2. **DEF demolition.** Thread of Bane grants 18% DEF ignore against marked targets; her Outro raises
   Negative Status caps by 3, taking Havoc Bane from 3 stacks to 6 (a 12% DEF shred).
3. **The +30% bribe.** She is the only reliable Havoc Bane generator on the roster.

An S0 carry holding Chisa lands on the same floor as an S6 carry holding Chisa. An S6 carry *without*
her loses 32 seconds.

---

## 5. Secondary finding — Reel of Spliced Memories is content-dependent

A prior A/B on Crownless concluded that Denia's substat-rich Chromatic Foam beat a live Reel 5pc by
3.5s per run, and that "rolls beat set." **That conclusion was correct but scoped narrowly, and the
scope was not recorded.**

Runs 4 and 5 are the same team and same Denia, differing only in echo set:

| Denia set | Elapsed |
|---|---|
| Chromatic Foam 5/5 (better substats; 5pc **inert** in Tune Strain mode) | 2:04 |
| **Reel of Spliced Memories 5/5** | **1:51** — −13s |

**Mechanism.** `PhantomFetter_315`: inflicting Shifting grants the team **+20 Tune Break Boost**. Tune
Break Boost only scales Tune Break DMG and damage against Interfered targets — which looks redundant
until you apply Qingxiao's Tune Break passive, which converts **every point of Tune Break Boost into
+0.12% total DMG per Interfered stack**:

```
+20 Boost × 0.12%  =  +2.4% total DMG PER INTERFERED STACK
```

Observed gain 124/111 = **+11.7% damage** ⇒ ~4.9 sustained Interfered stacks; accounting for Foam's
substat edge, gross contribution is ~+17% ⇒ ~7 stacks.

**Corrected rule:** Reel's value = Tune Break Boost × sustained Interfered stacks × fight duration.
**Chromatic Foam for short single-target content. Reel for long multi-boss content.** The original
A/B ran on a 71-second single-boss fight, where the multiplier had almost nothing to multiply against.

---

## 6. What this study got wrong

Recorded because the failure modes were more instructive than the answers.

1. **Reading a kit summary line instead of the mechanism under it.** `RoleSkillInput_1610_SkillDescList_2`
   says Xuanling *"can convert Havoc Bane into buffs for herself,"* which was read as consumer-only.
   `PhantomFetter_335` and `Skill_1006005` show she is a prolific **applier** (Liberation maxes stacks;
   Feather Release applies six at once). Always read the skill rows, not the blurb.
2. **Trusting a ratio metric across teams with very different absolute times.** A large fixed floor
   inflates the ratio for fast teams and flatters slow ones. It produced a false conclusion that the
   fastest team had the "worst" scaling.
3. **Fitting two parameters to two data points and treating it as validated.** It is exact by
   construction and proves nothing. The model only became credible once independent teams tested it.
4. **Declaring a settled A/B unrepeatable.** The Reel retest was actively discouraged and found 13
   seconds. A verdict established on one content type should be re-opened when the content changes.
5. **Asserting bench vintage from note text.** Benchmark rows carry no date field. A row was described
   as "a month stale"; a re-bench showed a 3-second delta. **The rows are undated — do not infer age
   from prose.** (Fixed for one row; the rest remain undated.)
6. **Concluding from a mis-transcribed time.** Two rows were briefly mis-slotted, which produced a
   confident "the Area Effect is decorative, worth 4 seconds" write-up. The real figure is 32 seconds.
   Re-derive from raw numbers whenever a source table is corrected.

---

## 7. Untested

**Qingxiao S0 / Denia S2 (Tune Strain, Reel) / Chisa S1** — the only comp that banks both bribes *and*
gets a Chisa floor. Model predicts `35.3 + 0.65 × 71` ≈ **81s (1:21)**, which would place second.
Discount for losing Mornye's Tune Break Boost tap and Off-Tune acceleration (§5 prices Boost at ~13s
for this team) gives a realistic **1:21–1:35**.

Also unresolved: **Sigillum and Fallacy of No Return's per-element base resistances.** Neither boss has
a `MonsterInfo` row in the current pak dump. Read from the in-game enemy scan / Illustrated Book.

---

## 8. Method note — querying the pak for mechanics

```bash
sqlite3 wuwa-extract/lang_multi_text_en.db \
  "select Id, Content from MultiText where Content like '%<term>%' and length(Content) < 400;"
```

Useful key prefixes:

| Prefix | Contains |
|---|---|
| `Term<id>_Title` / `_Desc` | In-game glossary — the authoritative definition of any status |
| `TowerChallengeBuff_<id>_Desc` | ToA Area Effect rows, verbatim; siblings differ subtly — match the exact text |
| `RoleSkillInput_<roleid>_SkillDescList_<n>` | Character kit *summaries* — a starting point, not a source |
| `Skill_<id>_SkillDescribe` / `_SkillResume` | Actual skill mechanics with `{n}` value placeholders |
| `PhantomFetter_<id>_EffectDescription` | Echo sonata set effects |
| `RoleInfo_<roleid>_Name` | Role ID → resonator name |

Placeholders (`{0}`, `{1}`) are not resolved in this table; concrete values come from the roster's
own transcribed kit notes. Characters added after the dump date are absent — verify before concluding
a Resonator "does not exist."
