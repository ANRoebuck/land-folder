import type { FlatLand } from '../data/types'
import type { OwnershipMap, OverridesMap, VersionKey } from '../lib/storage'
import { createEmptyOwnership } from '../lib/storage'
import CardCell from './CardCell'

interface FlatLandSectionProps {
  title: string
  lands: FlatLand[]
  ownership: OwnershipMap
  overrides: OverridesMap
  editMode: boolean
  onNameCommit: (id: string, name: string, defaultName: string) => void
  onAddVersion: (id: string, version: VersionKey) => void
}

/**
 * Renders a class with no categories (Gold, Colourless): no row/column
 * grid, since each card stands alone rather than belonging to a cycle or
 * category (see FlatLand in types.ts) -- just a flowing collection of
 * cards, reusing CardCell in its 'div' form instead of CycleTable's table.
 */
export default function FlatLandSection({
  title,
  lands,
  ownership,
  overrides,
  editMode,
  onNameCommit,
  onAddVersion,
}: FlatLandSectionProps) {
  if (lands.length === 0) {
    return null
  }

  return (
    <section className="cycle-table-section">
      <h2>{title}</h2>
      <div className="flat-land-grid">
        {lands.map((land) => {
          const displayName = overrides[land.id] ?? land.name
          const owned = ownership[land.id] ?? createEmptyOwnership()
          return (
            <CardCell
              key={land.id}
              as="div"
              name={displayName}
              editMode={editMode}
              versions={owned.versions}
              onNameCommit={(name) => onNameCommit(land.id, name, land.name)}
              onAddVersion={(version) => onAddVersion(land.id, version)}
            />
          )
        })}
      </div>
    </section>
  )
}
