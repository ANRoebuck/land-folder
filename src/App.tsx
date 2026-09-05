import { useEffect, useMemo, useState } from 'react'
import Toolbar from './components/Toolbar'
import VisibilityPanel from './components/VisibilityPanel'
import CycleTable from './components/CycleTable'
import { COLOR_PAIRS, THREE_COLOR_COMBOS, CYCLES } from './data/cycles'
import {
  buildExportPayload,
  applyImportPayload,
  loadOwnership,
  loadOverrides,
  loadHidden,
  saveOwnership,
  saveOverrides,
  saveHidden,
} from './lib/storage'
import type { ExportPayload, HiddenState, OverridesMap, OwnershipMap } from './lib/storage'

export default function App() {
  const [ownership, setOwnership] = useState<OwnershipMap>(() => loadOwnership())
  const [overrides, setOverrides] = useState<OverridesMap>(() => loadOverrides())
  const [hidden, setHidden] = useState<HiddenState>(() => loadHidden())
  const [editMode, setEditMode] = useState(false)
  const [visibilityPanelOpen, setVisibilityPanelOpen] = useState(false)

  useEffect(() => saveOwnership(ownership), [ownership])
  useEffect(() => saveOverrides(overrides), [overrides])
  useEffect(() => saveHidden(hidden), [hidden])

  const twoColorCycles = useMemo(
    () => CYCLES.filter((c) => c.type === 'two-color' && !hidden.cycles[c.id]),
    [hidden],
  )
  const threeColorCycles = useMemo(
    () => CYCLES.filter((c) => c.type === 'three-color' && !hidden.cycles[c.id]),
    [hidden],
  )

  const pairColumns = useMemo(
    () =>
      COLOR_PAIRS.filter((p) => !hidden.pairs[p.key]).map((p) => ({
        key: p.key,
        label: p.guild,
        sublabel: p.colors,
      })),
    [hidden],
  )
  const tripleColumns = useMemo(
    () =>
      THREE_COLOR_COMBOS.filter((t) => !hidden.triples[t.key]).map((t) => ({
        key: t.key,
        label: t.name,
        sublabel: t.colors,
      })),
    [hidden],
  )

  function handleQtyChange(id: string, field: 'normal' | 'foil', value: number) {
    setOwnership((prev) => ({
      ...prev,
      [id]: { normal: prev[id]?.normal ?? 0, foil: prev[id]?.foil ?? 0, [field]: value },
    }))
  }

  function handleNameCommit(id: string, name: string, defaultName: string) {
    const trimmed = name.trim()
    setOverrides((prev) => {
      const next = { ...prev }
      if (!trimmed || trimmed === defaultName) {
        delete next[id]
      } else {
        next[id] = trimmed
      }
      return next
    })
  }

  function toggleInSet(key: 'cycles' | 'pairs' | 'triples', id: string) {
    setHidden((prev) => {
      const next = { ...prev, [key]: { ...prev[key] } }
      if (next[key][id]) {
        delete next[key][id]
      } else {
        next[key][id] = true
      }
      return next
    })
  }

  function handleExport() {
    const payload = buildExportPayload()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mtg-land-cycle-tracker-export-${payload.exportedAt.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(file: File) {
    if (!window.confirm('Importing will replace all current ownership, name, and visibility data in this browser. Continue?')) {
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result)) as ExportPayload
        applyImportPayload(payload)
        setOwnership(loadOwnership())
        setOverrides(loadOverrides())
        setHidden(loadHidden())
      } catch (err) {
        window.alert(`Could not import file: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="app">
      <Toolbar
        editMode={editMode}
        onToggleEditMode={() => setEditMode((v) => !v)}
        visibilityPanelOpen={visibilityPanelOpen}
        onToggleVisibilityPanel={() => setVisibilityPanelOpen((v) => !v)}
        onExport={handleExport}
        onImportFile={handleImportFile}
      />
      {visibilityPanelOpen && (
        <VisibilityPanel
          cycles={CYCLES}
          colorPairs={COLOR_PAIRS}
          threeColorCombos={THREE_COLOR_COMBOS}
          hidden={hidden}
          onToggleCycle={(id) => toggleInSet('cycles', id)}
          onTogglePair={(key) => toggleInSet('pairs', key)}
          onToggleTriple={(key) => toggleInSet('triples', key)}
        />
      )}
      <CycleTable
        title="Two-color lands"
        cycles={twoColorCycles}
        columns={pairColumns}
        ownership={ownership}
        overrides={overrides}
        editMode={editMode}
        onQtyChange={handleQtyChange}
        onNameCommit={handleNameCommit}
      />
      <CycleTable
        title="Three-color lands"
        cycles={threeColorCycles}
        columns={tripleColumns}
        ownership={ownership}
        overrides={overrides}
        editMode={editMode}
        onQtyChange={handleQtyChange}
        onNameCommit={handleNameCommit}
      />
      <footer className="app-footer">
        <p>
          Data is stored only in this browser's localStorage. Use Export regularly to back up your
          collection.
        </p>
      </footer>
    </div>
  )
}
