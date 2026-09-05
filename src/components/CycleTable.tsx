import type { Cycle } from '../data/types'
import type { OwnershipMap, OverridesMap } from '../lib/storage'
import { cardId } from '../lib/storage'
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
  onQtyChange: (id: string, field: 'normal' | 'foil', value: number) => void
  onNameCommit: (id: string, name: string, defaultName: string) => void
}

export default function CycleTable({
  title,
  cycles,
  columns,
  ownership,
  overrides,
  editMode,
  onQtyChange,
  onNameCommit,
}: CycleTableProps) {
  if (cycles.length === 0 || columns.length === 0) {
    return null
  }

  return (
    <section className="cycle-table-section">
      <h2>{title}</h2>
      <div className="table-scroll">
        <table>
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
                  <div className="row-head-era">{cycle.era}</div>
                  <div className="row-head-description">{cycle.description}</div>
                </th>
                {columns.map((col) => {
                  const defaultName = cycle.cards[col.key]
                  if (defaultName === undefined) {
                    return <td key={col.key} className="card-cell card-cell-empty" />
                  }
                  const id = cardId(cycle.id, col.key)
                  const displayName = overrides[id] ?? defaultName
                  const owned = ownership[id]
                  return (
                    <CardCell
                      key={col.key}
                      name={displayName}
                      editMode={editMode}
                      normal={owned?.normal ?? 0}
                      foil={owned?.foil ?? 0}
                      onNameCommit={(name) => onNameCommit(id, name, defaultName)}
                      onQtyChange={(field, value) => onQtyChange(id, field, value)}
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
