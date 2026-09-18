import type { CSSProperties } from 'react'
import type { Cycle } from '../data/types'
import type { OwnershipMap, OverridesMap, VersionKey } from '../lib/storage'
import { cardId, createEmptyOwnership } from '../lib/storage'
import CardCell from './CardCell'

interface ColumnDef {
  key: string
  label: string
  sublabel: string
}

interface CycleTableProps {
  title: string
  cycles: Cycle[]
  columns: ColumnDef[]
  ownership: OwnershipMap
  overrides: OverridesMap
  editMode: boolean
  onNameCommit: (id: string, name: string, defaultName: string) => void
  onAddVersion: (id: string, version: VersionKey) => void
}

export default function CycleTable({
  title,
  cycles,
  columns,
  ownership,
  overrides,
  editMode,
  onNameCommit,
  onAddVersion,
}: CycleTableProps) {
  if (cycles.length === 0 || columns.length === 0) {
    return null
  }

  return (
    <section className="cycle-table-section">
      <h2>{title}</h2>
      <div className="table-scroll">
        <table style={{ '--col-count': columns.length } as CSSProperties}>
          <thead>
            <tr>
              <th className="row-head-col">Cycle</th>
              {columns.map((col) => (
                <th key={col.key} className="col-head" scope="col">
                  <div className="col-head-label">{col.label}</div>
                  <div className="col-head-sublabel">{col.sublabel}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cycles.map((cycle) => (
              <tr key={cycle.id}>
                <th className="row-head" scope="row">
                  <div className="row-head-name">
                    {cycle.name}
                    {!cycle.verified && (
                      <span
                        className="unverified-marker"
                        title="Card names not yet verified against Scryfall"
                      >
                        *
                      </span>
                    )}
                  </div>
                  {/* <div className="row-head-era">{cycle.era}</div> */}
                  {/* <div className="row-head-description">{cycle.description}</div> */}
                </th>
                {columns.map((col) => {
                  const defaultName = cycle.cards[col.key]
                  if (defaultName === undefined) {
                    return <td key={col.key} className="card-cell card-cell-empty" />
                  }
                  const id = cardId(cycle.id, col.key)
                  const displayName = overrides[id] ?? defaultName
                  const owned = ownership[id] ?? createEmptyOwnership()
                  return (
                    <CardCell
                      key={col.key}
                      name={displayName}
                      editMode={editMode}
                      versions={owned.versions}
                      onNameCommit={(name) => onNameCommit(id, name, defaultName)}
                      onAddVersion={(version) => onAddVersion(id, version)}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
