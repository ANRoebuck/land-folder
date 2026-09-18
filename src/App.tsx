import { useEffect, useMemo, useState } from 'react'
import Toolbar from './components/Toolbar'
import VisibilityPanel from './components/VisibilityPanel'
import CycleTable from './components/CycleTable'
import FlatLandSection from './components/FlatLandSection'
import { LAND_CLASSES, CYCLES, FLAT_LANDS } from './data/cycles'
import {
  buildExportPayload,
  applyImportPayload,
  createEmptyOwnership,
  loadOwnership,
  loadOverrides,
  loadHidden,
  loadRowOrder,
  loadClassOrder,
  resolveOrder,
  saveOwnership,
  saveOverrides,
  saveHidden,
  saveRowOrder,
  saveClassOrder,
} from './lib/storage'
import type { ExportPayload, HiddenState, OverridesMap, OwnershipMap, VersionKey } from './lib/storage'

const CYCLES_BY_ID = Object.fromEntries(CYCLES.map((c) => [c.id, c]))
const FLAT_LANDS_BY_ID = Object.fromEntries(FLAT_LANDS.map((f) => [f.id, f]))
// Cycles and flat lands share one id-keyed row-order/hidden.cycles keyspace
// (see FlatLand in data/types.ts) -- neither is a cycle exactly, but both
// are "a reorderable/hideable row-level thing within a class".
const ROW_IDS = [...CYCLES.map((c) => c.id), ...FLAT_LANDS.map((f) => f.id)]
const CLASS_IDS = LAND_CLASSES.map((c) => c.id)
const CLASSES_BY_ID = Object.fromEntries(LAND_CLASSES.map((c) => [c.id, c]))

function classIdOfRow(id: string): string | undefined {
  return CYCLES_BY_ID[id]?.classId ?? FLAT_LANDS_BY_ID[id]?.classId
}

export default function App() {
  const [ownership, setOwnership] = useState<OwnershipMap>(() => loadOwnership())
  const [overrides, setOverrides] = useState<OverridesMap>(() => loadOverrides())
  const [hidden, setHidden] = useState<HiddenState>(() => loadHidden())
  const [rowOrder, setRowOrder] = useState<string[]>(() => loadRowOrder())
  const [classOrder, setClassOrder] = useState<string[]>(() => loadClassOrder())
  const [visibilityPanelOpen, setVisibilityPanelOpen] = useState(false)
  const editMode = false

  useEffect(() => saveOwnership(ownership), [ownership])
  useEffect(() => saveOverrides(overrides), [overrides])
  useEffect(() => saveHidden(hidden), [hidden])
  useEffect(() => saveRowOrder(rowOrder), [rowOrder])
  useEffect(() => saveClassOrder(classOrder), [classOrder])

  const orderedRowIds = useMemo(() => resolveOrder(ROW_IDS, rowOrder), [rowOrder])
  const orderedCycles = useMemo(
    () => orderedRowIds.filter((id) => CYCLES_BY_ID[id]).map((id) => CYCLES_BY_ID[id]),
    [orderedRowIds],
  )
  const orderedFlatLands = useMemo(
    () => orderedRowIds.filter((id) => FLAT_LANDS_BY_ID[id]).map((id) => FLAT_LANDS_BY_ID[id]),
    [orderedRowIds],
  )
  const orderedClasses = useMemo(
    () => resolveOrder(CLASS_IDS, classOrder).map((id) => CLASSES_BY_ID[id]),
    [classOrder],
  )

  /** One CycleTable's (or FlatLandSection's) worth of props per class, in the user's customised order. */
  const classSections = useMemo(
    () =>
      orderedClasses.map((cls) => ({
        cls,
        cycles: orderedCycles.filter((c) => c.classId === cls.id && !hidden.cycles[c.id]),
        flatLands: orderedFlatLands.filter((f) => f.classId === cls.id && !hidden.cycles[f.id]),
        columns: cls.categories
          .filter((cat) => !hidden.categories[cls.id]?.[cat.key])
          .map((cat) => ({ key: cat.key, label: cat.label, sublabel: cat.sublabel ?? '' })),
      })),
    [orderedClasses, orderedCycles, orderedFlatLands, hidden],
  )

  function handleAddVersion(id: string, version: VersionKey) {
    setOwnership((prev) => {
      const existing = prev[id] ?? createEmptyOwnership()
      return {
        ...prev,
        [id]: {
          ...existing,
          versions: { ...existing.versions, [version]: existing.versions[version] + 1 },
        },
      }
    })
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

  function handleMoveRow(id: string, direction: 'up' | 'down') {
    setRowOrder((prevRowOrder) => {
      const current = resolveOrder(ROW_IDS, prevRowOrder)
      const classId = classIdOfRow(id)
      const sameClass = current
        .map((rid, i) => ({ rid, i }))
        .filter(({ rid }) => classIdOfRow(rid) === classId)
      const pos = sameClass.findIndex(({ rid }) => rid === id)
      const swapPos = direction === 'up' ? pos - 1 : pos + 1
      if (pos === -1 || swapPos < 0 || swapPos >= sameClass.length) return prevRowOrder
      const aIndex = sameClass[pos].i
      const bIndex = sameClass[swapPos].i
      const next = [...current]
      ;[next[aIndex], next[bIndex]] = [next[bIndex], next[aIndex]]
      return next
    })
  }

  function handleMoveClass(id: string, direction: 'up' | 'down') {
    setClassOrder((prevClassOrder) => {
      const current = resolveOrder(CLASS_IDS, prevClassOrder)
      const pos = current.indexOf(id)
      const swapPos = direction === 'up' ? pos - 1 : pos + 1
      if (pos === -1 || swapPos < 0 || swapPos >= current.length) return prevClassOrder
      const next = [...current]
      ;[next[pos], next[swapPos]] = [next[swapPos], next[pos]]
      return next
    })
  }

  function toggleRowHidden(id: string) {
    setHidden((prev) => {
      const nextCycles = { ...prev.cycles }
      if (nextCycles[id]) {
        delete nextCycles[id]
      } else {
        nextCycles[id] = true
      }
      return { ...prev, cycles: nextCycles }
    })
  }

  function toggleCategoryHidden(classId: string, categoryKey: string) {
    setHidden((prev) => {
      const nextForClass = { ...(prev.categories[classId] ?? {}) }
      if (nextForClass[categoryKey]) {
        delete nextForClass[categoryKey]
      } else {
        nextForClass[categoryKey] = true
      }
      return { ...prev, categories: { ...prev.categories, [classId]: nextForClass } }
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
    if (
      !window.confirm(
        'Importing will replace all current ownership, name, visibility, and order (row and class) data in this browser. Continue?',
      )
    ) {
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
        setRowOrder(loadRowOrder())
        setClassOrder(loadClassOrder())
      } catch (err) {
        window.alert(`Could not import file: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="app">
      <Toolbar
        visibilityPanelOpen={visibilityPanelOpen}
        onToggleVisibilityPanel={() => setVisibilityPanelOpen((v) => !v)}
        onExport={handleExport}
        onImportFile={handleImportFile}
      />
      {visibilityPanelOpen && (
        <VisibilityPanel
          classes={orderedClasses}
          cycles={orderedCycles}
          flatLands={orderedFlatLands}
          hidden={hidden}
          onToggleRow={toggleRowHidden}
          onToggleCategory={toggleCategoryHidden}
          onMoveRow={handleMoveRow}
          onMoveClass={handleMoveClass}
        />
      )}
      {classSections.map(({ cls, cycles, flatLands, columns }) =>
        cls.categories.length > 0 ? (
          <CycleTable
            key={cls.id}
            title={cls.name}
            cycles={cycles}
            columns={columns}
            ownership={ownership}
            overrides={overrides}
            editMode={editMode}
            onNameCommit={handleNameCommit}
            onAddVersion={handleAddVersion}
          />
        ) : (
          <FlatLandSection
            key={cls.id}
            title={cls.name}
            lands={flatLands}
            ownership={ownership}
            overrides={overrides}
            editMode={editMode}
            onNameCommit={handleNameCommit}
            onAddVersion={handleAddVersion}
          />
        ),
      )}
      <footer className="app-footer">
        <p>
          Data is stored only in this browser's localStorage. Use Export regularly to back up your
          collection.
        </p>
      </footer>
    </div>
  )
}
