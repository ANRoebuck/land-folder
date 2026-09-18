import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FocusEvent } from 'react'
import { VERSION_KEYS } from '../lib/storage'
import type { VersionKey } from '../lib/storage'
import { useScryfallImage } from '../lib/scryfall'

interface CardCellProps {
  /** 'td' inside a CycleTable row, 'div' for a flat (no category) class's card grid. */
  as?: 'td' | 'div'
  name: string
  editMode: boolean
  versions: Record<VersionKey, number>
  onNameCommit: (name: string) => void
  onAddVersion: (version: VersionKey) => void
}

export default function CardCell({
  as = 'td',
  name,
  editMode,
  versions,
  onNameCommit,
  onAddVersion,
}: CardCellProps) {
  const [draftName, setDraftName] = useState(name)
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const imageUrl = useScryfallImage(name)

  // Keep the field in sync when `name` changes from outside this input (e.g.
  // an Import overwrites the override) -- otherwise the input would keep
  // showing stale text, and blurring it later would commit that stale text
  // and silently wipe out the just-imported override.
  useEffect(() => {
    setDraftName(name)
  }, [name])

  useEffect(() => {
    if (!menuOpen) return
    function handleOutsideClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [menuOpen])

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  function openMenu() {
    clearTimeout(closeTimerRef.current)
    setMenuOpen(true)
  }

  // A short delay before closing tolerates the pointer briefly crossing the
  // visual gap between the "+" button and the popover below it. Without
  // this, that gap is hit-tested as the art thumbnail (a sibling element,
  // not a descendant of add-version-wrap), which fires mouseleave and
  // closes the menu before the pointer ever reaches it.
  function scheduleClose() {
    closeTimerRef.current = setTimeout(() => setMenuOpen(false), 250)
  }

  const ownedVersions = VERSION_KEYS.filter((v) => versions[v] > 0)
  const Root = as

  return (
    <Root className="card-cell">
      <div className="card-art-wrap">
        {imageUrl ? (
          <img className="card-art" src={imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="card-art-placeholder" />
        )}
        <div className="add-version-wrap" ref={wrapRef} onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
          <button
            type="button"
            className="add-version-button"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-label={`Add a copy of ${name}`}
            onClick={openMenu}
          >
            +
          </button>
          {menuOpen && (
            <ul className="add-version-menu" role="menu">
              {VERSION_KEYS.map((v) => (
                <li key={v} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onAddVersion(v)
                      setMenuOpen(false)
                    }}
                  >
                    Version {v}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
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
      {ownedVersions.length > 0 && (
        <div className="card-versions-owned">
          {ownedVersions.map((v) => (
            <span key={v} className="version-badge">
              {v}×{versions[v]}
            </span>
          ))}
        </div>
      )}
    </Root>
  )
}
