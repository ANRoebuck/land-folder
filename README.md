# MTG Land Cycle Tracker

A web app for cataloguing which Magic: the Gathering land cycles you own,
organized the way collectors actually think about them: one row per
**cycle** (Original Duals, Shock Lands, Triomes, ...) and one column per
**variety** within that cycle (the ten two-color guild pairs, or the ten
three-color wedges/shards). Each cell tracks a regular-copy count and a
foil count.

Your collection data lives only in your browser (`localStorage`) — nothing
is sent to a server. Use **Export** regularly to back it up, and **Import**
to restore it (or move it to another browser/device).

## Using it

- **Edit card names** — toggles inline editing of card names, in case you
  want to note a specific printing or personal shorthand.
- **Show/hide rows & columns** — hide cycles or color combinations you
  don't care about tracking.
- **Export / Import** — download your ownership data as a JSON file, or
  load one back in.

An asterisk (`*`) next to a cycle name means its card list hasn't been
verified against Scryfall yet.

## Developing

Requires Node.js. No build config beyond the defaults below.

```
npm install
npm run dev        # local dev server with hot reload
npm run build      # production build -> dist/
npm run preview    # serve the production build locally
npm run typecheck  # TypeScript check with no emit
```

### Testing

```
npm run build
npm run test:smoke   # headless Playwright smoke test against dist/
```

The smoke test (`tests/smoke.mjs`) checks: no console errors, row/column
counts match the data file, a quantity input persists across reload, a
renamed card persists across reload, hiding a column removes its
header cell, and hiding a cycle removes its row.

Cycle data itself is validated automatically at import time (see
`src/data/cycles.ts`) — a cycle with duplicate, missing, or stray card
keys throws immediately rather than silently rendering a blank column.

## Deploying

This is a static site once built. On Netlify: connect the repo (or drag
the `dist/` folder in manually) — `netlify.toml` already sets the build
command (`npm run build`) and publish directory (`dist`).

## Project conventions

See `CLAUDE.md` for the data model, localStorage schema, and working
agreements for making changes to this repo.
