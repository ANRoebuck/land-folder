import { Fragment } from 'react'
import type { CategoryInfo, Cycle, FlatLand, LandClass } from '../data/types'
import type { HiddenState } from '../lib/storage'

interface VisibilityPanelProps {
  classes: LandClass[]
  cycles: Cycle[]
  flatLands: FlatLand[]
  hidden: HiddenState
  onToggleRow: (id: string) => void
  onToggleCategory: (classId: string, key: string) => void
  onMoveRow: (id: string, direction: 'up' | 'down') => void
  onMoveClass: (id: string, direction: 'up' | 'down') => void
}

function ClassOrderGroup({
  classes,
  onMoveClass,
}: {
  classes: LandClass[]
  onMoveClass: (id: string, direction: 'up' | 'down') => void
}) {
  return (
    <div className="visibility-group">
      <h3>Classes</h3>
      {classes.map((cls, index) => (
        <div key={cls.id} className="visibility-item reorderable">
          <span>{cls.name}</span>
          <span className="reorder-buttons">
            <button
              type="button"
              aria-label={`Move ${cls.name} up`}
              disabled={index === 0}
              onClick={() => onMoveClass(cls.id, 'up')}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Move ${cls.name} down`}
              disabled={index === classes.length - 1}
              onClick={() => onMoveClass(cls.id, 'down')}
            >
              ↓
            </button>
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Hide/reorder controls for one class's row-level items -- a class's
 * cycles if it has categories, or its flat lands if it doesn't (see
 * FlatLand in data/types.ts). Both are just "id + name" here, sharing the
 * same hidden.cycles/row-order keyspace, so one component covers both.
 */
function RowGroup({
  title,
  rows,
  hidden,
  onToggleRow,
  onMoveRow,
}: {
  title: string
  rows: { id: string; name: string }[]
  hidden: HiddenState
  onToggleRow: (id: string) => void
  onMoveRow: (id: string, direction: 'up' | 'down') => void
}) {
  if (rows.length === 0) return null
  return (
    <div className="visibility-group">
      <h3>{title}</h3>
      {rows.map((row, index) => (
        <div key={row.id} className="visibility-item reorderable">
          <label>
            <input
              type="checkbox"
              checked={!hidden.cycles[row.id]}
              onChange={() => onToggleRow(row.id)}
            />
            {row.name}
          </label>
          <span className="reorder-buttons">
            <button
              type="button"
              aria-label={`Move ${row.name} up`}
              disabled={index === 0}
              onClick={() => onMoveRow(row.id, 'up')}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Move ${row.name} down`}
              disabled={index === rows.length - 1}
              onClick={() => onMoveRow(row.id, 'down')}
            >
              ↓
            </button>
          </span>
        </div>
      ))}
    </div>
  )
}

function CategoryGroup({
  title,
  classId,
  categories,
  hidden,
  onToggleCategory,
}: {
  title: string
  classId: string
  categories: CategoryInfo[]
  hidden: HiddenState
  onToggleCategory: (classId: string, key: string) => void
}) {
  if (categories.length === 0) return null
  return (
    <div className="visibility-group">
      <h3>{title}</h3>
      {categories.map((cat) => (
        <label key={cat.key} className="visibility-item">
          <input
            type="checkbox"
            checked={!hidden.categories[classId]?.[cat.key]}
            onChange={() => onToggleCategory(classId, cat.key)}
          />
          {cat.label}
        </label>
      ))}
    </div>
  )
}

export default function VisibilityPanel({
  classes,
  cycles,
  flatLands,
  hidden,
  onToggleRow,
  onToggleCategory,
  onMoveRow,
  onMoveClass,
}: VisibilityPanelProps) {
  return (
    <div className="visibility-panel">
      <ClassOrderGroup classes={classes} onMoveClass={onMoveClass} />
      {classes.map((cls) => {
        const isGrid = cls.categories.length > 0
        return (
          <Fragment key={cls.id}>
            <RowGroup
              title={isGrid ? `${cls.name} — cycles` : `${cls.name} — lands`}
              rows={isGrid ? cycles.filter((c) => c.classId === cls.id) : flatLands.filter((f) => f.classId === cls.id)}
              hidden={hidden}
              onToggleRow={onToggleRow}
              onMoveRow={onMoveRow}
            />
            <CategoryGroup
              title={`${cls.name} — categories`}
              classId={cls.id}
              categories={cls.categories}
              hidden={hidden}
              onToggleCategory={onToggleCategory}
            />
          </Fragment>
        )
      })}
    </div>
  )
}
