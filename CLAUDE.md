# CLAUDE.md

Project context and working agreements for whoever (human or AI) picks up
development on this repo. Read this before making changes.

## What this is

A web app for cataloguing which Magic: the Gathering land cycles someone
owns, organized the way collectors actually think about them: one row per
**cycle** (Original Duals, Shocklands, Checklands, ...) and one column per
**variety** within that cycle (the ten two-color guild pairs, or the ten
three-color wedges/shards for tri-lands). Each cell tracks a regular-copy
count and a foil count.

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
Chromium): data loads, all 7 populated cycles render with correct row/
column counts, quantity/foil inputs persist across reload, name overrides
persist across reload, hiding a row or column actually removes it. Card
names for all 7 populated cycles were verified against the live Scryfall
API (not just recalled from memory) — see "Known gaps" below for what
that verification actually found. Nothing beyond that has been validated
yet — no real usage, no design polish pass, no mobile testing, export/
import round-trip has been code-reviewed but not exhaustively tested by
hand.

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
- `src/data/types.ts` — the `Cycle`, `ColorPairInfo`, `ThreeColorInfo`
  types and the `ColorPairKey` / `ThreeColorKey` unions.
- `src/data/cycles.ts` — the card library. Defines `COLOR_PAIRS` (10
  two-color guild pairs), `THREE_COLOR_COMBOS` (10 wedges/shards), and
  `CYCLES` (array of cycle definitions). Runs `validateCycles()` at
  import time, which throws if any cycle's `cards` keys don't exactly
  match its type's expected key set (no dupes, no missing, no stray
  keys), or if two cycles share the same `id` — this is the file to edit
  when adding a new cycle or fixing a
  card name.
- `src/lib/storage.ts` — the localStorage schema (see below), including
  versioned export/import.
- `src/components/` — `CycleTable.tsx` (renders one `<table>` for a set
  of cycles + columns), `CardCell.tsx` (name + qty/foil inputs for one
  card), `Toolbar.tsx` (edit-mode toggle, export/import, visibility
  panel toggle), `VisibilityPanel.tsx` (checkboxes for hiding
  cycles/pairs/triples).
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

`src/data/cycles.ts` — one cycle looks like:

```ts
{
  id: "shocklands",              // stable, kebab-case, used in storage keys
  name: "Shock Lands",
  era: "Ravnica: City of Guilds block, 2005-2006 (split across Ravnica, Guildpact, Dissension); heavily reprinted since Return to Ravnica, 2012",
  type: "two-color",             // or "three-color"
  verified: true,                // false renders a "*" marker in the UI
  description: "Enters tapped unless you pay 2 life.",
  cards: { WU: "Hallowed Fountain", UB: "Watery Grave", /* ...10 total */ }
}
```

`cards` keys must exactly match `COLOR_PAIRS` keys (for `type:
"two-color"`) or `THREE_COLOR_COMBOS` keys (for `type: "three-color"`), and
every cycle's `id` must be unique across `CYCLES` (two cycles sharing an
`id` would silently share the same storage keys via `cardId()`, so a
quantity entered for one row's card would leak into the other row's
same-lettered card). This is enforced automatically by `validateCycles()`
at the bottom of `cycles.ts` — a mismatch throws at import time instead of
silently rendering a blank column or corrupting unrelated ownership data.

localStorage (`src/lib/storage.ts`), all under the
`mtgCycleTracker.v1.` prefix:

- `mtgCycleTracker.v1.ownership` → `{ [cardId]: { normal: number, foil:
  number } }`
- `mtgCycleTracker.v1.overrides` → `{ [cardId]: "user-edited name" }`
- `mtgCycleTracker.v1.hidden` → `{ cycles: {id: true}, pairs: {key:
  true}, triples: {key: true} }` (presence of a key = hidden)

`cardId` is always `` `${cycleId}__${colKey}` ``, e.g.
`"shocklands__WU"`. If you ever change this scheme, you must bump the
prefix (`v1` → `v2`) and write a migration, or existing users' exported
backups silently stop matching on import.

**If you change the shape of any of these three objects**, bump
`version` in `ExportPayload` (`src/lib/storage.ts`) and handle both old
and new shapes in `applyImportPayload`, at least for one release. Don't
break someone's backup file silently.

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
  field.
- New cycles go in `src/data/cycles.ts` only; components should need zero
  changes to pick up a new entry in `CYCLES` as long as its `type` is
  already one of `"two-color"` / `"three-color"`.
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
   port and checks: no console errors, row/column counts match
   `cycles.ts`, a quantity input persists across reload, a renamed card
   persists across reload, hiding a column actually removes a header
   cell, and hiding a cycle actually removes a row. Re-run this after any
   change to `App.tsx`, the components, or `storage.ts`.

## Known gaps / accuracy caveats

- Only 7 cycles are populated (Original Duals, Bounce/Karoo, Pain Lands,
  Shock Lands, Check Lands, Fast Lands, Triomes). All 70 card names were
  verified against the live Scryfall API during initial data entry; the
  eras/sets in the data are more specific than a quick memory-recall
  would produce (e.g. Pain Lands split across Ice Age + Apocalypse, not
  "Invasion block"; Check Lands split across Magic 2010 + Innistrad;
  Fast Lands split across Scars of Mirrodin + Kaladesh; Triomes split
  across Ikoria, 2020 (wedges, literally named "___ Triome") and Streets
  of New Capenna, 2022 (shards, named after SNC crime families — these
  don't say "Triome" on the card at all despite being the same cycle
  mechanically)). `cycles.ts` has a comment block listing likely-next
  cycles (Slow Lands, Surveil Lands, Filter Lands, Gain Lands,
  Battle/Tango Lands, Snow Duals) that were deliberately left unfilled
  rather than guessed.
- No per-edition/printing tracking yet — one quantity + one foil count
  per card, full stop. The ownership schema was kept minimal on purpose
  so this can be extended (see Roadmap).
- Number inputs are simple controlled `<input type="number">` elements;
  clearing the field entirely snaps to `0` rather than staying blank
  mid-edit. Minor UX quirk, not a data-loss bug — not worth fixing until
  someone actually finds it annoying.
- Not yet tested on narrow/mobile viewports — tables have
  `overflow-x: auto` but haven't been eyeballed on a phone.
- No Scryfall-lookup integration (a "Verify names" button, card images on
  hover) — see Roadmap.

## Roadmap (rough priority order)

1. **Per-edition tracking.** Change ownership value shape from `{ normal,
   foil }` to `{ [setCode]: { normal, foil } }`, with a set-picker per
   cell. This is the change most likely to actually get requested next —
   design the migration (schema version bump) before starting.
2. **Live Scryfall verification.** A "Verify names" button/build check
   that hits the Scryfall API and flags any card name in `cycles.ts` it
   doesn't recognize, so cycles can be confidently flipped from
   `verified: false` to `true`. Then consider card images on hover. If
   this needs to run server-side to avoid CORS/rate-limit issues, use a
   Netlify Function rather than calling Scryfall directly from every
   client.
3. **Fill in the documented-but-missing cycles**, verifying each against
   Scryfall as you go, per the "don't invent card names" rule above.
4. **Cross-device sync** (optional/later) — the current design is
   single-browser by nature (export/import is the workaround). If this
   becomes a real pain point, that's a bigger architectural conversation
   (Netlify Identity + a database, or similar) — don't half-do it with
   something like a public Netlify Function writing to an unauthenticated
   store.
