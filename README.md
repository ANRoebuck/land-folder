# MTG Land Cycle Tracker

A web app for cataloguing which Magic: the Gathering land cycles you own,
organized the way collectors actually think about them: one table
(**class**) per broad kind of land (Two-colour, Three-colour, Mono-colour,
Multicolour, Colourless), one row per **cycle** within it (Original Duals,
Shock Lands, Triomes, ...), and one column per **category** within it (the
ten two-colour guild pairs, or the ten three-colour wedges/shards). A
class with no categories (Multicolour, Colourless) shows its cards as a
plain bordered grid instead, since those cards don't belong to a cycle or
category. Each card shows a real card-art thumbnail (fetched live from
Scryfall) and tracks how many copies you own via placeholder "A"/"B"
version counters (see "Using it" below).

Your collection data lives only in your browser (`localStorage`) — nothing
is sent to a server. Use **Export** regularly to back it up, and **Import**
to restore it (or move it to another browser/device).

## Using it

- **Add a version** — hover or click the "+" in a card's top-right corner
  to pick a version and add one copy of it to your collection. For now
  this offers two placeholder versions ("A" and "B") rather than real
  Scryfall printings — see `CLAUDE.md`'s Roadmap.
- **Customise** — hide cycles or categories (colour combinations) you
  don't care about tracking, and reorder cycle rows or whole classes
  (tables) with the up/down arrows next to each one (categories/columns
  aren't reorderable).
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

The smoke test (`tests/smoke.mjs`) checks: no unexpected console errors,
row/column counts match the data file, a categoryless class renders its
cards as a flat grid rather than a table, hiding a column removes its
header cell, hiding a cycle removes its row, an imported name override
applies and persists, adding a placeholder version via a card's "+"
button persists across reload (for both a cycle's card and a standalone
card), and reordering a cycle row or a class persists across reload.
Scryfall API calls are stubbed rather than live, so this test never hits
the real network for card art.

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
