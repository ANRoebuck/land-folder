# CLAUDE.md

Project context and working agreements for whoever (human or AI) picks up
development on this repo. Read this before making changes.

## What this is

A web app for cataloguing which Magic: the Gathering land cycles someone
owns, organized the way collectors actually think about them. The data
model has three levels:

- A **class** is a table (Two-colour lands, Three-colour lands,
  Mono-colour lands, Multicolour lands, Colourless lands). Reorderable in
  the customisation panel.
- A **category** is a column within a class -- a class's fixed set of
  categories (e.g. the ten two-colour guild pairs, or the five basic
  colours for Mono-colour lands). A class with no categories (Multicolour,
  Colourless) isn't divided into columns at all.
- A **cycle** is a row within a class (Original Duals, Shocklands,
  Checklands, ...). Reorderable within its own class. A class with no
  categories has no cycles either -- its cards are standalone `FlatLand`s
  instead (see Data model), each one just a card, not part of a cycle.

Each card shows a Scryfall art thumbnail and tracks ownership as
(currently placeholder) per-version counts, added one at a time via a "+"
button on the cell.

It's a React + TypeScript single-page app built with Vite, deployed to
Netlify as a static build. **This was a deliberate architecture change**:
the project was originally *planned* as a zero-build-step vanilla
HTML/CSS/JS app (that plan is what an earlier version of this file
described), but was built in React from the start on the project owner's
explicit instruction before any vanilla-JS code existed. If you're
wondering why there's a `package.json` and a build step despite
MTG-tracker apps not really needing one — that's why; it was a conscious
tradeoff, not scope creep. Don't add a *second* framework or a heavier
build pipeline (SSR, a meta-framework, etc.) without the same kind of
explicit conversation with the project owner first.

## Current state

First working version built and smoke-tested (Playwright, headless
Chromium): data loads, all populated cycles and flat lands render with
correct row/column counts (or, for Multicolour/Colourless, as a flat
bordered card grid with no rows or columns), adding a placeholder version
persists across reload for both a cycle's card and a flat land's card,
name overrides persist across reload, hiding a row or column actually
removes it, and reordering a cycle row or a class via the customisation
panel persists across reload. Card/land names for all 14 populated cycles
and both flat lands were verified against the live Scryfall API (not just
recalled from memory) — see "Known gaps" below for what that verification
actually found. Nothing beyond that has been validated yet — no real
usage, no design polish pass, no mobile testing, export/import round-trip
has been code-reviewed but not exhaustively tested by hand.

## Non-negotiables

- **Ownership data lives in the browser only (`localStorage`), not in the
  codebase.** `src/data/cycles.ts` defines what cards *exist*; it never
  stores how many the user owns. Don't conflate these two — a future
  contributor editing `cycles.ts` and redeploying should never be able to
  wipe anyone's collection data.
- **Don't invent card names.** If you're adding a new cycle and you're not
  certain of a printing/spelling, don't fill it in from memory — leave it
  as a documented TODO (see the bottom of `cycles.ts` for the existing
  pattern) or verify it against Scryfall first (the live API at
  `api.scryfall.com`, not just recollection). A wrong card name in a
  collection tracker is worse than a missing one. This bit the project
  once already during initial data entry — a guessed fast-land name
  ("Razorverge Downs") didn't exist; the real card is "Razorverge
  Thicket." Verify, don't guess.
- **Deployable to Netlify with `netlify.toml` doing all the work** — build
  command `npm run build`, publish directory `dist`. Don't require manual
  Netlify UI configuration beyond pointing at the repo.

## File map

- `index.html` — Vite entry point; just a `#root` div and a script tag
  pointing at `src/main.tsx`. No page markup lives here.
- `src/main.tsx` — mounts `<App />` into `#root`.
- `src/App.tsx` — top-level state (ownership, overrides, hidden) and
  wiring; loads from and persists to localStorage. Owns the handlers
  passed down to child components.
- `src/data/types.ts` — the `Cycle`, `FlatLand`, `LandClass`,
  `CategoryInfo`, `ColorPairInfo`, `ThreeColorInfo` types and the
  `ColorPairKey` / `ThreeColorKey` / `MonoColorKey` unions.
- `src/data/cycles.ts` — the card library. Defines `COLOR_PAIRS` (10
  two-color guild pairs), `THREE_COLOR_COMBOS` (10 wedges/shards),
  `MONO_COLORS` (5 basic colours), `LAND_CLASSES` (the 5 classes, each
  with its `categories`), `CYCLES` (cycle definitions for a class *with*
  categories, each referencing a class via `classId`), and `FLAT_LANDS`
  (standalone card definitions for a class *without* categories, same
  `classId` idea). Runs `validateCycles()` at import time, which throws if
  any cycle's `cards` keys don't exactly match its class's category keys
  (no dupes, no missing, no stray keys), if a cycle's or flat land's
  `classId` doesn't match a real `LAND_CLASSES` entry (or, for a flat
  land, matches one that *has* categories), or if any id is reused across
  CYCLES and FLAT_LANDS — this is the file to edit when adding a new
  class, a new cycle, a new flat land, or fixing a card name.
- `src/lib/storage.ts` — the localStorage schema (see below), including
  versioned export/import.
- `src/lib/scryfall.ts` — fetches real card art from the live Scryfall API
  (`cards/named?exact=`), with a rate-limited request queue and a
  localStorage cache (see Data model) so the same card name is never
  fetched more than once. Exports the `useScryfallImage` hook `CardCell`
  uses for its thumbnail.
- `src/components/` — `CycleTable.tsx` (renders one `<table>` for a
  categorised class's cycles + columns; `App.tsx` calls it once per class
  with `categories.length > 0`), `FlatLandSection.tsx` (renders a
  categoryless class's `FlatLand`s as a bordered flex-wrap grid of cards,
  no table -- `App.tsx` calls it once per class with `categories.length
  === 0`), `CardCell.tsx` (art thumbnail, add-version "+" button/popover,
  name input, owned-version badges for one card; its root element is a
  `<td>` by default or a `<div>` via the `as` prop, since `FlatLandSection`
  uses it outside a table), `Toolbar.tsx` (Customise panel toggle,
  export/import — the name-editing toggle button is currently hidden, see
  Known gaps), `VisibilityPanel.tsx` (a "Classes" group with reorder-only
  arrows, plus one row group -- a class's cycles or its flat lands,
  whichever it has -- and one categories group per class, generated by
  looping over `LAND_CLASSES`).
- `src/styles.css` — all styling, light/dark aware via
  `prefers-color-scheme`. No inline styles; add classes here instead.
- `tests/smoke.mjs` — headless Playwright smoke test against a built
  `dist/`. See "Testing" below.
- `netlify.toml` — build command + publish dir.
- `package.json` / `tsconfig*.json` / `vite.config.ts` — standard Vite +
  React + TS project config, nothing custom.
- `README.md` — user-facing usage/deploy instructions. Keep this in sync
  with reality; it's the first thing a future you will read.

## Data model

`src/data/cycles.ts` — a class looks like:

```ts
{
  id: "two-color",                // stable, kebab-case; referenced by Cycle.classId
  name: "Two-colour lands",       // display name, used as the table title
  categories: [                   // this class's fixed columns; [] = no columns
    { key: "WU", label: "Azorius", sublabel: "White / Blue" }, // ...10 total
  ],
}
```

...and a cycle looks like:

```ts
{
  id: "shocklands",              // stable, kebab-case, used in storage keys
  name: "Shock Lands",
  era: "Ravnica: City of Guilds block, 2005-2006 (split across Ravnica, Guildpact, Dissension); heavily reprinted since Return to Ravnica, 2012",
  classId: "two-color",          // must match a LAND_CLASSES entry's id
  verified: true,                // false renders a "*" marker in the UI
  description: "Enters tapped unless you pay 2 life.",
  cards: { WU: "Hallowed Fountain", UB: "Watery Grave", /* ...10 total */ }
}
```

`cards` keys must exactly match the `categories` keys of the class named
by `classId`, and every cycle's `id` must be unique across `CYCLES` (two
cycles sharing an `id` would silently share the same storage keys via
`cardId()`, so a version added for one row's card would leak into the
other row's same-lettered card). This is enforced automatically by
`validateCycles()` at the bottom of `cycles.ts` — a mismatch throws at
import time instead of silently rendering a blank column or corrupting
unrelated ownership data.

A class with an empty `categories` array isn't divided into columns at
all -- its cards live in `FLAT_LANDS`, not `CYCLES`, one per row-level
entity rather than grouped into a cycle:

```ts
{
  id: "eldrazi-temple",          // stable, kebab-case, unique across CYCLES *and* FLAT_LANDS
  name: "Eldrazi Temple",
  era: "Rise of the Eldrazi, 2010",
  classId: "colorless",          // must match a LAND_CLASSES entry with categories: []
  verified: true,
  description: "Taps for {C}, or for {C}{C} usable only to cast colorless Eldrazi spells...",
}
```

A `FlatLand`'s `id` shares one keyspace with `Cycle` ids -- both are used
directly as ownership/override keys (no `cardId()` composition, since
there's no category to combine with) and both live in the same
`hidden.cycles`/`rowOrder` buckets (see below), since both are just "a
reorderable/hideable row-level thing within a class". `validateCycles()`
enforces the shared-keyspace uniqueness and that a flat land's `classId`
points at a class with zero categories. `CycleTable` renders a class with
categories but no cycles yet as nothing (falls out of its existing
`cycles.length === 0 || columns.length === 0` check); `FlatLandSection`
does the same for a class with zero flat lands.

localStorage (`src/lib/storage.ts`), all under the
`mtgCycleTracker.v1.` prefix:

- `mtgCycleTracker.v1.ownership` → `{ [cardId]: { versions: { A: number,
  B: number } } }`. `versions` is a placeholder for real per-printing
  tracking (Roadmap #1) — every card currently offers the same two fake
  versions, "A" and "B", via the "+" button in the top-right corner of
  each Card Cell; clicking one adds a copy of that version.
- `mtgCycleTracker.v1.overrides` → `{ [cardId]: "user-edited name" }`
- `mtgCycleTracker.v1.hidden` → `{ cycles: {id: true}, categories: {
  [classId]: {categoryKey: true} } }` (presence of a key = hidden). Despite
  the field's name, `cycles` also holds hidden flat land ids (see Data
  model) -- it wasn't renamed, since both are "a hideable row-level id"
  and the field predates flat lands existing at all. Classes themselves
  aren't hideable, only reorderable, so there's no `classes` key here.
- `mtgCycleTracker.v1.rowOrder` → `string[]` of ids, in the user's
  customised display order -- a mix of cycle ids and flat land ids (both
  draw from the same id-space; see Data model). An empty array (the
  default) means "use the built-in order". Reordering only ever swaps a
  row with its nearest same-`classId` neighbour (see `resolveOrder`/
  `App.tsx`'s `handleMoveRow`), since each class renders as its own
  table/grid — a two-color cycle moving "up" skips over any
  differently-classed rows interleaved between it and its previous
  two-color sibling in the underlying arrays, rather than swapping with
  them.
- `mtgCycleTracker.v1.classOrder` → `string[]` of class ids, same
  "empty means built-in order" convention as `rowOrder`, resolved with the
  same `resolveOrder` helper. Unlike cycles, all classes are one flat
  reorderable list (see `App.tsx`'s `handleMoveClass`) — there's no
  further grouping above "class" to scope moves within.
- `mtgCycleTracker.v1.scryfallImageCache` → `{ [cardName]: { url: string |
  null, fetchedAt: number } }`. A pure cache of Scryfall art-crop image
  URLs keyed by exact card name (`src/lib/scryfall.ts`), used to render
  the thumbnail in each Card Cell. Not part of export/import — safe to
  clear at any time, it just rebuilds itself on demand.

`cardId` is always `` `${cycleId}__${colKey}` ``, e.g.
`"shocklands__WU"` -- this only applies to a cycle's cards. A flat land
has no category to combine with, so its ownership/override key is just
its own `id` directly (e.g. `"eldrazi-temple"`), no `cardId()` call
involved. If you ever change either scheme, you must bump the prefix
(`v1` → `v2`) and write a migration, or existing users' exported backups
silently stop matching on import.

**If you change the shape of any of these objects**, bump
`version` in `ExportPayload` (`src/lib/storage.ts`) and handle both old
and new shapes in `applyImportPayload`, at least for one release. Don't
break someone's backup file silently. (`ExportPayload` is currently at
version `4`: `1` → `2` when ownership's `{ normal, foil }` counts were
replaced with `versions`; `2` → `3` when `rowOrder` was added; `3` → `4`
when `hidden.pairs`/`hidden.triples` were replaced with
`hidden.categories` and `classOrder` was added. `applyImportPayload` still
accepts `1`, `2`, and `3` payloads — `normalizeOwnership` drops the old
ownership counts, `normalizeHidden` migrates a pre-v4 `pairs`/`triples`
shape into `categories`, and a missing `rowOrder`/`classOrder` just
defaults to `[]`.)

## Conventions

- Functional React components + hooks, no class components, no external
  state management library — `useState`/`useMemo` in `App.tsx` is plenty
  for this app's size.
- JSX escapes text content by default, so there's no vanilla-JS-style
  `escapeHTML()` helper to remember — just don't reach for
  `dangerouslySetInnerHTML`.
- Card name editing: a controlled `<input>` swapped in for the plain text
  display when `editMode` is on, committed on `blur` (mirrors the
  original app's `contentEditable`-on-blur pattern). Follow that pattern
  rather than introducing a modal or a form if you add another editable
  field. `editMode` is currently hardcoded to `false` in `App.tsx` (its
  toggle button is hidden — see Known gaps) but the rest of the mechanism
  is untouched; re-enabling it is a one-line change (`useState` + a
  button) rather than rebuilding the feature.
- New cycles (or flat lands) go in `src/data/cycles.ts` only; components
  should need zero changes to pick up a new entry in `CYCLES` or
  `FLAT_LANDS` as long as its `classId` matches an existing `LAND_CLASSES`
  entry of the right kind (categorised for a cycle, categoryless for a
  flat land). A genuinely new *class* also only touches `cycles.ts` (add
  to `LAND_CLASSES`) — `App.tsx` and `VisibilityPanel.tsx` both loop over
  `LAND_CLASSES` rather than naming classes individually.
- Keep dependencies minimal. `react`, `react-dom`, and the Vite/TS
  toolchain are the whole production dependency list on purpose — don't
  add a UI kit, CSS framework, or state library without a reason grounded
  in an actual limitation you've hit, not a hypothetical one.

## Testing

1. **Structural/type check** — `npm run typecheck` (or `npm run build`,
   which runs `tsc -b` first). Cycle data is additionally self-validated
   at runtime by `validateCycles()` in `cycles.ts`.

2. **Headless browser smoke test** (Playwright, Chromium) —
   `npm run build && npm run test:smoke`. Serves `dist/` on a throwaway
   port and checks: no unexpected console errors, row/column counts match
   `cycles.ts`, a categoryless class (Multicolour/Colourless) renders its
   `FLAT_LANDS` as a flat card grid rather than a table, hiding a column
   actually removes a header cell, hiding a cycle actually removes a row,
   an imported name override is applied immediately and persists across
   reload, adding a placeholder version via a Card Cell's "+" button
   persists across reload (checked for both a cycle's card and a flat
   land's card, confirming the two don't share ownership by accident),
   reordering a cycle row via the customisation panel's up/down arrows
   persists across reload (run after the above, since it changes row order
   and earlier steps assume "original-duals" is the first two-color row),
   and reordering a class persists across reload (run last of all, since
   it changes which table is first). Re-run this after any change to
   `App.tsx`, the components, or `storage.ts`.

   All `api.scryfall.com` requests are stubbed via `page.route` (see the
   comment at the top of `smoke.mjs`) rather than hitting the real API —
   this app fetches art for ~135 cards on a cold cache, and Scryfall's
   burst rate limit (observed: a 429 after roughly 20 requests) made every
   test run both slow and a real contributor to exactly the kind of bulk
   traffic that limit exists to catch. This means the smoke test does
   *not* exercise `src/lib/scryfall.ts`'s actual fetch/retry/caching logic
   end-to-end — if you change that file, verify it manually against the
   live API (e.g. a throwaway script, or the dev server) rather than
   trusting the smoke test to catch a regression there.

## Known gaps / accuracy caveats

- 14 cycles are populated (Original Duals, Bounce/Karoo, Pain Lands,
  Shock Lands, Check Lands, Fast Lands, Triomes, Slow Lands, Surveil
  Lands, Filter Lands, Tango Lands, Fetch Lands, Verge Lands, Channel
  Lands). All 135 card names were verified against the live Scryfall API
  during data entry; the eras/sets in the data are more specific than a quick
  memory-recall would produce (e.g. Pain Lands split across Ice Age +
  Apocalypse, not "Invasion block"; Check Lands split across Magic 2010 +
  Innistrad; Fast Lands split across Scars of Mirrodin + Kaladesh;
  Triomes split across Ikoria, 2020 (wedges, literally named "___
  Triome") and Streets of New Capenna, 2022 (shards, named after SNC
  crime families — these don't say "Triome" on the card at all despite
  being the same cycle mechanically); Slow Lands split across Innistrad:
  Midnight Hunt + Innistrad: Crimson Vow, both 2021; Filter Lands split
  across Shadowmoor + Eventide, both 2008 — excluding the other,
  differently-mechanic lands in those same two sets (Threshold lands,
  Reflecting Pool, Springjack Pasture); Tango Lands only had 5 of 10
  pairs from Battle for Zendikar, 2015 until Commander-only reprint
  products quietly filled in the remaining 5 pairs between 2025 and 2026
  — a plain oracle-text search on Scryfall missed the last 2 pairs
  entirely until re-checked with the curated `is:tangoland` tag, so if a
  "known" cycle looks incomplete, try that kind of tag search before
  assuming it's genuinely unfinished (this is exactly how Fetch Lands
  were confirmed: `is:fetchland` returned precisely the 10 expected
  cards, allied pairs from Onslaught 2002 + enemy pairs from Zendikar
  2009); Verge Lands were found via a plain name search (`verge t:land`)
  which also surfaced four unrelated cards sharing the word "verge"
  (Krosan Verge, the Needleverge/Pillarverge Pathway MDFC, Razorverge
  Thicket -- already in Fast Lands, Sandstorm Verge -- a Desert with a
  different mechanic) that had to be excluded by checking each card's
  oracle text individually, not just its name, before including it in
  the cycle); Channel Lands (the first Mono-colour lands cycle) were
  confirmed via `keyword:channel t:land`, which returned exactly the 5
  expected cards -- and caught a real near-miss: recollection said
  "Eiganjo, Seat of Empire", but the actual card is "Eiganjo, Seat of
  **the** Empire". `cycles.ts` has a comment block listing likely-next
  cycles (Gain Lands, Snow Duals) that were deliberately left unfilled
  rather than guessed.
- `FLAT_LANDS` has 2 entries so far, one per categoryless class: Eldrazi
  Temple (Colourless, Rise of the Eldrazi 2010) and Cavern of Souls
  (Multicolour, Avacyn Restored 2012), both name/oracle-text verified
  against the live Scryfall API before adding.
- No *real* per-edition/printing tracking yet. Each card has two
  placeholder version counters ("A" and "B", added via the "+" button on
  each Card Cell) that don't correspond to actual Scryfall printings —
  see Roadmap #1. There's no separate foil tracking either; that was
  dropped along with the old `{ normal, foil }` counts when `versions`
  replaced them, and hasn't been reintroduced under the new model.
- Number inputs are simple controlled `<input type="number">` elements;
  clearing the field entirely snaps to `0` rather than staying blank
  mid-edit. Minor UX quirk, not a data-loss bug — not worth fixing until
  someone actually finds it annoying.
- Not fully tested on narrow/mobile viewports (toolbar, customisation
  panel, etc. haven't been eyeballed on a phone). The tables specifically
  were checked at a narrow width (420px) when column widths were made
  equal: `table-layout: fixed` needs a `min-width` on the `<table>` itself
  to guarantee a floor per column, since a cell's own `min-width` doesn't
  force a fixed-layout table wider than its `width` — without that, at a
  narrow width the columns were crushed together and unreadable instead of
  triggering `.table-scroll`'s horizontal scroll like intended (see
  `--col-count` in `styles.css` and `CycleTable.tsx`).
- Card art thumbnails (`src/lib/scryfall.ts`) are fetched client-side by
  exact card name; a name that doesn't match Scryfall exactly (a typo, or
  a user override with a made-up name) just shows no art — it doesn't
  throw or block the rest of the cell. No "Verify names" build check yet
  — see Roadmap.
- The "Edit card names" toggle button is currently hidden from the
  toolbar (assumed not needed for now) — see the Conventions section's
  `editMode` note. The underlying rename feature (input, `onNameCommit`,
  `overrides`) is untouched and still reachable via Import.
- Reordering covers cycles (rows, within their class) and classes
  (tables); there's no way to reorder a class's categories (columns).
- Mono-colour lands has one cycle so far (Channel Lands); Multicolour and
  Colourless lands have one flat land each (Cavern of Souls, Eldrazi
  Temple) — see Roadmap #3 for filling these out further.

## Roadmap (rough priority order)

1. **Real per-edition tracking.** The "A"/"B" version counters added to
   each Card Cell (see Data model / Known gaps) are a placeholder for
   this. Replace them with actual Scryfall printings: change
   `versions: { A, B }` to `{ [setCode]: number }`, with the popover
   listing real printings for that card name instead of two fake labels.
   Foil tracking was dropped along with the old `{ normal, foil }` shape
   (see Known gaps) — decide whether/how foil fits back in here, e.g. a
   separate foil count per printing, rather than reintroducing a bare
   top-level foil count. Needs another `ExportPayload` version bump +
   migration.
2. **Live Scryfall verification.** A "Verify names" button/build check
   that hits the Scryfall API and flags any card name in `cycles.ts` it
   doesn't recognize, so cycles can be confidently flipped from
   `verified: false` to `true`. Card art thumbnails are already wired up
   (client-side, rate-limited, cached — see `src/lib/scryfall.ts`); if
   Scryfall's rate limit or CORS ever becomes a real problem in practice,
   move the fetch behind a Netlify Function rather than calling Scryfall
   directly from every client.
3. **Add more Mono-colour cycles, and more Multicolour/Colourless flat
   lands**, and fill in the documented-but-missing two/three-colour
   cycles, verifying each against Scryfall as you go, per the "don't
   invent card names" rule above. The rendering paths for both shapes are
   proven out now (`CycleTable` for a categorised class, `FlatLandSection`
   for a categoryless one), so this is purely a data-entry task.
4. **Cross-device sync** (optional/later) — the current design is
   single-browser by nature (export/import is the workaround). If this
   becomes a real pain point, that's a bigger architectural conversation
   (Netlify Identity + a database, or similar) — don't half-do it with
   something like a public Netlify Function writing to an unauthenticated
   store.
