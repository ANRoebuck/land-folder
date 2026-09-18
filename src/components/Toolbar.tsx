import { useRef } from 'react'
import type { ChangeEvent } from 'react'

interface ToolbarProps {
  visibilityPanelOpen: boolean
  onToggleVisibilityPanel: () => void
  onExport: () => void
  onImportFile: (file: File) => void
}

export default function Toolbar({
  visibilityPanelOpen,
  onToggleVisibilityPanel,
  onExport,
  onImportFile,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImportChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onImportFile(file)
    }
    e.target.value = ''
  }

  return (
    <div className="toolbar">
      <h1>MTG Land Cycle Tracker</h1>
      <div className="toolbar-actions">
        <button type="button" onClick={onToggleVisibilityPanel} aria-pressed={visibilityPanelOpen}>
          {visibilityPanelOpen ? 'Hide customisation panel' : 'Customise'}
        </button>
        <button type="button" onClick={onExport}>
          Export
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          aria-label="Import collection JSON file"
          className="visually-hidden"
          onChange={handleImportChange}
        />
      </div>
    </div>
  )
}
