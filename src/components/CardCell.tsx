import { useEffect, useState } from 'react'
import type { ChangeEvent, FocusEvent } from 'react'

interface CardCellProps {
  name: string
  editMode: boolean
  normal: number
  foil: number
  onNameCommit: (name: string) => void
  onQtyChange: (field: 'normal' | 'foil', value: number) => void
}

function clampCount(value: string): number {
  const n = Number.parseInt(value, 10)
  if (Number.isNaN(n) || n < 0) return 0
  return n
}

export default function CardCell({
  name,
  editMode,
  normal,
  foil,
  onNameCommit,
  onQtyChange,
}: CardCellProps) {
  const [draftName, setDraftName] = useState(name)

  // Keep the field in sync when `name` changes from outside this input (e.g.
  // an Import overwrites the override) -- otherwise the input would keep
  // showing stale text, and blurring it later would commit that stale text
  // and silently wipe out the just-imported override.
  useEffect(() => {
    setDraftName(name)
  }, [name])

  return (
    <td className="card-cell">
      {editMode ? (
        <input
          type="text"
          className="card-name-input"
          value={draftName}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDraftName(e.target.value)}
          onBlur={(e: FocusEvent<HTMLInputElement>) => onNameCommit(e.target.value)}
        />
      ) : (
        <div className="card-name">{name}</div>
      )}
      <div className="card-counts">
        <label className="card-count-field">
          <span>Qty</span>
          <input
            type="number"
            min={0}
            value={normal}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onQtyChange('normal', clampCount(e.target.value))
            }
          />
        </label>
        <label className="card-count-field">
          <span>Foil</span>
          <input
            type="number"
            min={0}
            value={foil}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onQtyChange('foil', clampCount(e.target.value))
            }
          />
        </label>
      </div>
    </td>
  )
}
