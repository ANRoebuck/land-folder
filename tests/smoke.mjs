// Headless smoke test -- see CLAUDE.md's "Testing" section for the checks
// this covers: no console errors, row/column counts match data, a quantity
// input persists across reload, a renamed card persists across reload,
// hiding a column actually removes a header cell, hiding a cycle actually
// removes a row, and an imported name override is reflected immediately
// (and survives) even while Edit Mode is already on.
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

  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(String(err)))

  await page.goto(`http://localhost:${PORT}/`)
  await page.waitForSelector('table')

  // -- row/column counts match data.js --
  const tableCount = await page.locator('table').count()
  if (tableCount !== 2) fail(`expected 2 tables (two-color + three-color), found ${tableCount}`)

  const twoColorRows = await page.locator('.cycle-table-section >> nth=0 >> tbody tr').count()
  if (twoColorRows !== 6) fail(`expected 6 two-color cycle rows, found ${twoColorRows}`)

  const twoColorCols = await page.locator('.cycle-table-section >> nth=0 >> thead th.col-head').count()
  if (twoColorCols !== 10) fail(`expected 10 two-color columns, found ${twoColorCols}`)

  const threeColorRows = await page.locator('.cycle-table-section >> nth=1 >> tbody tr').count()
  if (threeColorRows !== 1) fail(`expected 1 three-color cycle row (Triomes), found ${threeColorRows}`)

  // -- a quantity input persists across reload --
  const firstQtyInput = page.locator('.card-cell').first().locator('input[type="number"]').first()
  await firstQtyInput.fill('3')
  await firstQtyInput.blur()
  await page.reload()
  await page.waitForSelector('table')
  const qtyAfterReload = await page
    .locator('.card-cell')
    .first()
    .locator('input[type="number"]')
    .first()
    .inputValue()
  if (qtyAfterReload !== '3') fail(`expected quantity "3" to persist across reload, got "${qtyAfterReload}"`)

  // -- a renamed card persists across reload --
  await page.getByRole('button', { name: 'Edit card names' }).click()
  const firstNameInput = page.locator('.card-name-input').first()
  await firstNameInput.fill('Test Renamed Land')
  await firstNameInput.blur()
  await page.getByRole('button', { name: 'Done editing names' }).click()
  await page.reload()
  await page.waitForSelector('table')
  const nameAfterReload = await page.locator('.card-name').first().innerText()
  if (nameAfterReload !== 'Test Renamed Land') {
    fail(`expected renamed card to persist across reload, got "${nameAfterReload}"`)
  }

  // -- hiding a column actually removes a header cell --
  await page.getByRole('button', { name: 'Show/hide rows & columns' }).click()
  const colsBefore = await page.locator('.cycle-table-section >> nth=0 >> thead th.col-head').count()
  await page.locator('.visibility-group', { hasText: 'Two-color pairs' }).locator('input[type="checkbox"]').first().uncheck()
  const colsAfter = await page.locator('.cycle-table-section >> nth=0 >> thead th.col-head').count()
  if (colsAfter !== colsBefore - 1) {
    fail(`expected hiding a column to reduce header count from ${colsBefore} to ${colsBefore - 1}, got ${colsAfter}`)
  }

  // -- hiding a cycle actually removes a row --
  const rowsBefore = await page.locator('.cycle-table-section >> nth=0 >> tbody tr').count()
  await page.locator('.visibility-group', { hasText: 'Cycles' }).locator('input[type="checkbox"]').first().uncheck()
  const rowsAfter = await page.locator('.cycle-table-section >> nth=0 >> tbody tr').count()
  if (rowsAfter !== rowsBefore - 1) {
    fail(`expected hiding a cycle to reduce row count from ${rowsBefore} to ${rowsBefore - 1}, got ${rowsAfter}`)
  }

  // -- restore the visibility we just changed, back to a known baseline --
  await page.locator('.visibility-group', { hasText: 'Two-color pairs' }).locator('input[type="checkbox"]').first().check()
  await page.locator('.visibility-group', { hasText: 'Cycles' }).locator('input[type="checkbox"]').first().check()
  await page.getByRole('button', { name: 'Hide visibility panel' }).click()

  // -- an imported name override is reflected immediately, and survives,
  //    even when Edit Mode was already on when the import happened --
  // (regression test: the name input used to be an uncontrolled `defaultValue`
  // input, so it kept showing stale text after an import; blurring it later
  // committed that stale text and silently deleted the just-imported override)
  await page.getByRole('button', { name: 'Edit card names' }).click()
  const editedNameInput = page.locator('.card-name-input').first()

  const importPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ownership: { 'original-duals__WU': { normal: 5, foil: 1 } },
    overrides: { 'original-duals__WU': 'Imported While Editing' },
    hidden: { cycles: {}, pairs: {}, triples: {} },
  }
  const tmpDir = await mkdtemp(join(os.tmpdir(), 'mtg-import-'))
  const payloadPath = join(tmpDir, 'payload.json')
  await writeFile(payloadPath, JSON.stringify(importPayload))
  await page.setInputFiles('input[type="file"]', payloadPath)
  // FileReader resolves asynchronously, so wait for the input to pick up the
  // imported value rather than racing it.
  await page
    .waitForFunction(() => document.querySelector('.card-name-input')?.value === 'Imported While Editing', {
      timeout: 3000,
    })
    .catch(() => {})

  const nameAfterImportWhileEditing = await editedNameInput.inputValue()
  if (nameAfterImportWhileEditing !== 'Imported While Editing') {
    fail(
      `expected the name input to immediately reflect an import while Edit Mode was on, ` +
        `got "${nameAfterImportWhileEditing}"`,
    )
  }

  // blurring the (now correctly synced) input must NOT discard the import
  await editedNameInput.blur()
  await page.getByRole('button', { name: 'Done editing names' }).click()
  await page.reload()
  await page.waitForSelector('table')
  const nameAfterReloadPostImport = await page.locator('.card-name').first().innerText()
  if (nameAfterReloadPostImport !== 'Imported While Editing') {
    fail(
      `expected the imported override to survive blur + reload, ` +
        `got "${nameAfterReloadPostImport}" (it was likely reverted/deleted on blur)`,
    )
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
