// Headless smoke test -- see CLAUDE.md's "Testing" section for the checks
// this covers: no console errors, row/column counts match data, a
// no-category class (Multicolour/Colourless lands) renders its cards as a
// flat grid rather than a table, hiding a column actually removes a header
// cell, hiding a cycle actually removes a row, reordering a cycle via the
// customisation panel reorders its table row (and persists), reordering a
// class via the customisation panel reorders which table renders first
// (and persists), an imported name override is applied immediately and
// persists across reload, and adding a placeholder version via a card's
// "+" button persists across reload -- for a cycle's card and, separately,
// for a flat land's card.
//
// All requests to api.scryfall.com are intercepted and stubbed (see
// `page.route` below) -- this app fetches a card-art thumbnail for every
// visible cell (~135 cards on a cold cache), and hitting the real API on
// every test run would be slow, flaky under Scryfall's rate limit, and
// exactly the kind of bulk traffic that limit exists to catch. The stub
// means this test never touches the network for art, at the cost of not
// exercising the real `src/lib/scryfall.ts` fetch/retry logic end-to-end.
//
// Usage: npm run build && npm run test:smoke
// Expects the production build to already exist in dist/ and serves it
// itself on a throwaway port.

import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdtemp } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const DIST = fileURLToPath(new URL('../dist', import.meta.url))
const PORT = 4310

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
}

function startServer() {
  const server = createServer(async (req, res) => {
    const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0]
    const filePath = join(DIST, urlPath)
    try {
      const body = await readFile(filePath)
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end('not found')
    }
  })
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)))
}

function fail(message) {
  console.error(`SMOKE TEST FAILED: ${message}`)
  process.exitCode = 1
}

async function main() {
  const server = await startServer()
  const browser = await chromium.launch()
  const page = await browser.newPage()
  page.on('dialog', (dialog) => dialog.accept())

  // Stub every Scryfall lookup with a fixed, always-succeeding response
  // (a data: URI, so the <img> itself never makes a real network request
  // either). See the file header comment for why this is stubbed at all.
  await page.route('https://api.scryfall.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        image_uris: {
          art_crop: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E",
        },
      }),
    }),
  )

  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(String(err)))

  await page.goto(`http://localhost:${PORT}/`)
  await page.waitForSelector('table')

  // -- row/column counts match data.js --
  // Mono-colour lands (Channel Lands) is the third table; Gold and
  // Colourless lands have zero cycles so far and render nothing (see
  // CLAUDE.md's Known gaps), so the DOM only ever has 3 tables right now.
  const tableCount = await page.locator('table').count()
  if (tableCount !== 3) fail(`expected 3 tables (two-color + three-color + mono-color), found ${tableCount}`)

  const twoColorRows = await page.locator('.cycle-table-section >> nth=0 >> tbody tr').count()
  if (twoColorRows !== 12) fail(`expected 12 two-color cycle rows, found ${twoColorRows}`)

  const twoColorCols = await page.locator('.cycle-table-section >> nth=0 >> thead th.col-head').count()
  if (twoColorCols !== 10) fail(`expected 10 two-color columns, found ${twoColorCols}`)

  const threeColorRows = await page.locator('.cycle-table-section >> nth=1 >> tbody tr').count()
  if (threeColorRows !== 1) fail(`expected 1 three-color cycle row (Triomes), found ${threeColorRows}`)

  const monoColorRows = await page.locator('.cycle-table-section >> nth=2 >> tbody tr').count()
  if (monoColorRows !== 1) fail(`expected 1 mono-color cycle row (Channel Lands), found ${monoColorRows}`)

  const monoColorCols = await page.locator('.cycle-table-section >> nth=2 >> thead th.col-head').count()
  if (monoColorCols !== 5) fail(`expected 5 mono-color columns, found ${monoColorCols}`)

  // Multicolour lands and Colourless lands have no categories, so they
  // render as a flat grid of cards (no table at all) rather than a 4th/5th
  // table -- see CLAUDE.md's Data model on FlatLand.
  const multicolorLands = await page
    .locator('.cycle-table-section', { hasText: 'Multicolour lands' })
    .locator('.flat-land-grid .card-cell')
    .count()
  if (multicolorLands !== 1) fail(`expected 1 multicolour land (Cavern of Souls), found ${multicolorLands}`)

  const colorlessLands = await page
    .locator('.cycle-table-section', { hasText: 'Colourless lands' })
    .locator('.flat-land-grid .card-cell')
    .count()
  if (colorlessLands !== 1) fail(`expected 1 colourless land (Eldrazi Temple), found ${colorlessLands}`)

  // -- hiding a column actually removes a header cell --
  await page.getByRole('button', { name: 'Customise' }).click()
  const colsBefore = await page.locator('.cycle-table-section >> nth=0 >> thead th.col-head').count()
  await page
    .locator('.visibility-group', { hasText: 'Two-colour lands — categories' })
    .locator('input[type="checkbox"]')
    .first()
    .uncheck()
  const colsAfter = await page.locator('.cycle-table-section >> nth=0 >> thead th.col-head').count()
  if (colsAfter !== colsBefore - 1) {
    fail(`expected hiding a column to reduce header count from ${colsBefore} to ${colsBefore - 1}, got ${colsAfter}`)
  }

  // -- hiding a cycle actually removes a row --
  const rowsBefore = await page.locator('.cycle-table-section >> nth=0 >> tbody tr').count()
  await page
    .locator('.visibility-group', { hasText: 'Two-colour lands — cycles' })
    .locator('input[type="checkbox"]')
    .first()
    .uncheck()
  const rowsAfter = await page.locator('.cycle-table-section >> nth=0 >> tbody tr').count()
  if (rowsAfter !== rowsBefore - 1) {
    fail(`expected hiding a cycle to reduce row count from ${rowsBefore} to ${rowsBefore - 1}, got ${rowsAfter}`)
  }

  // -- restore the visibility we just changed, back to a known baseline --
  await page
    .locator('.visibility-group', { hasText: 'Two-colour lands — categories' })
    .locator('input[type="checkbox"]')
    .first()
    .check()
  await page
    .locator('.visibility-group', { hasText: 'Two-colour lands — cycles' })
    .locator('input[type="checkbox"]')
    .first()
    .check()
  await page.getByRole('button', { name: 'Hide customisation panel' }).click()

  // -- an imported name override is applied immediately, and persists
  //    across reload --
  // (this used to also check that Edit Mode's name input immediately
  // reflects an import rather than showing stale text -- see git history --
  // but that requires the "Edit card names" button, which is currently
  // hidden; see CLAUDE.md's Known gaps)
  // version 1 predates per-version (A/B) tracking (used { normal, foil }
  // instead) and predates hidden.categories (used hidden.pairs/.triples
  // instead) -- kept here deliberately to check that importing this old
  // shape doesn't crash (see normalizeOwnership/normalizeHidden in
  // src/lib/storage.ts).
  const importPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ownership: { 'original-duals__WU': { normal: 5, foil: 1 } },
    overrides: { 'original-duals__WU': 'Imported Override' },
    hidden: { cycles: {}, pairs: {}, triples: {} },
  }
  const tmpDir = await mkdtemp(join(os.tmpdir(), 'mtg-import-'))
  const payloadPath = join(tmpDir, 'payload.json')
  await writeFile(payloadPath, JSON.stringify(importPayload))
  await page.setInputFiles('input[type="file"]', payloadPath)
  // FileReader resolves asynchronously, so wait for the name to pick up the
  // imported value rather than racing it.
  await page
    .waitForFunction(() => document.querySelector('.card-name')?.textContent === 'Imported Override', {
      timeout: 3000,
    })
    .catch(() => {})

  const nameAfterImport = await page.locator('.card-name').first().innerText()
  if (nameAfterImport !== 'Imported Override') {
    fail(`expected an imported name override to apply immediately, got "${nameAfterImport}"`)
  }

  await page.reload()
  await page.waitForSelector('table')
  const nameAfterReloadPostImport = await page.locator('.card-name').first().innerText()
  if (nameAfterReloadPostImport !== 'Imported Override') {
    fail(`expected the imported override to persist across reload, got "${nameAfterReloadPostImport}"`)
  }

  // -- clicking the add-version popover increments and persists a placeholder version --
  const versionCell = page.locator('.card-cell').first()
  await versionCell.locator('.add-version-button').click()
  await versionCell.getByRole('menuitem', { name: 'Version A' }).click()
  const badgeText = await versionCell.locator('.version-badge').first().innerText()
  if (badgeText !== 'A×1') fail(`expected version badge "A×1" after adding version A, got "${badgeText}"`)

  await page.reload()
  await page.waitForSelector('table')
  const badgeAfterReload = await page.locator('.card-cell').first().locator('.version-badge').first().innerText()
  if (badgeAfterReload !== 'A×1') {
    fail(`expected version badge "A×1" to persist across reload, got "${badgeAfterReload}"`)
  }

  // -- the add-version popover works the same way on a flat land's card
  //    (no cycle/category to key it by -- see FlatLand in data/types.ts),
  //    and persists across reload without leaking onto the other flat land --
  const eldraziCell = page.locator('.flat-land-grid .card-cell', { hasText: 'Eldrazi Temple' })
  await eldraziCell.locator('.add-version-button').click()
  await eldraziCell.getByRole('menuitem', { name: 'Version B' }).click()
  const flatBadgeText = await eldraziCell.locator('.version-badge').first().innerText()
  if (flatBadgeText !== 'B×1') fail(`expected version badge "B×1" on Eldrazi Temple, got "${flatBadgeText}"`)

  const cavernBadgeCount = await page
    .locator('.flat-land-grid .card-cell', { hasText: 'Cavern of Souls' })
    .locator('.version-badge')
    .count()
  if (cavernBadgeCount !== 0) fail(`expected adding a version to Eldrazi Temple not to affect Cavern of Souls`)

  await page.reload()
  await page.waitForSelector('table')
  const flatBadgeAfterReload = await page
    .locator('.flat-land-grid .card-cell', { hasText: 'Eldrazi Temple' })
    .locator('.version-badge')
    .first()
    .innerText()
  if (flatBadgeAfterReload !== 'B×1') {
    fail(`expected flat land version badge "B×1" to persist across reload, got "${flatBadgeAfterReload}"`)
  }

  // -- moving a cycle down in the customisation panel reorders its table
  //    row, and the new order persists across reload --
  // (run last: it changes row order, and earlier steps above assume
  // "original-duals" is the first two-color row)
  await page.getByRole('button', { name: 'Customise' }).click()
  const firstRowNameBefore = await page
    .locator('.cycle-table-section >> nth=0 >> tbody tr')
    .first()
    .locator('.row-head-name')
    .innerText()
  const secondRowNameBefore = await page
    .locator('.cycle-table-section >> nth=0 >> tbody tr')
    .nth(1)
    .locator('.row-head-name')
    .innerText()
  await page
    .locator('.visibility-group', { hasText: 'Two-colour lands — cycles' })
    .locator('.reorder-buttons button', { hasText: '↓' })
    .first()
    .click()
  const firstRowNameAfter = await page
    .locator('.cycle-table-section >> nth=0 >> tbody tr')
    .first()
    .locator('.row-head-name')
    .innerText()
  if (firstRowNameAfter !== secondRowNameBefore) {
    fail(
      `expected moving "${firstRowNameBefore}" down to swap it with "${secondRowNameBefore}", ` +
        `got "${firstRowNameAfter}" in first position`,
    )
  }

  await page.reload()
  await page.waitForSelector('table')
  const firstRowNameAfterReload = await page
    .locator('.cycle-table-section >> nth=0 >> tbody tr')
    .first()
    .locator('.row-head-name')
    .innerText()
  if (firstRowNameAfterReload !== secondRowNameBefore) {
    fail(`expected the reordered cycle rows to persist across reload, got "${firstRowNameAfterReload}" in first position`)
  }

  // -- moving a class down in the customisation panel reorders which table
  //    renders first, and the new order persists across reload --
  // (run last: it changes which table is nth=0, which every check above
  // assumes is "Two-colour lands")
  const firstTableTitleBefore = await page.locator('.cycle-table-section h2').first().innerText()
  const secondTableTitleBefore = await page.locator('.cycle-table-section h2').nth(1).innerText()
  await page.getByRole('button', { name: 'Customise' }).click()
  await page
    .locator('.visibility-group', { hasText: 'Classes' })
    .locator('.reorder-buttons button', { hasText: '↓' })
    .first()
    .click()
  const firstTableTitleAfter = await page.locator('.cycle-table-section h2').first().innerText()
  if (firstTableTitleAfter !== secondTableTitleBefore) {
    fail(
      `expected moving "${firstTableTitleBefore}" down to swap it with "${secondTableTitleBefore}", ` +
        `got "${firstTableTitleAfter}" in first position`,
    )
  }

  await page.reload()
  await page.waitForSelector('table')
  const firstTableTitleAfterReload = await page.locator('.cycle-table-section h2').first().innerText()
  if (firstTableTitleAfterReload !== secondTableTitleBefore) {
    fail(`expected the reordered class order to persist across reload, got "${firstTableTitleAfterReload}" in first position`)
  }

  if (consoleErrors.length > 0) {
    fail(`console errors detected:\n${consoleErrors.join('\n')}`)
  }

  await browser.close()
  server.close()

  if (process.exitCode !== 1) {
    console.log('Smoke test passed.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
