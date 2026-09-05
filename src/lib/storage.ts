export interface CardOwnership {
  normal: number
  foil: number
}

export type OwnershipMap = Record<string, CardOwnership>
export type OverridesMap = Record<string, string>

export interface HiddenState {
  cycles: Record<string, true>
  pairs: Record<string, true>
  triples: Record<string, true>
}

const PREFIX = 'mtgCycleTracker.v1.'
const KEYS = {
  ownership: `${PREFIX}ownership`,
  overrides: `${PREFIX}overrides`,
  hidden: `${PREFIX}hidden`,
} as const

const EMPTY_HIDDEN: HiddenState = { cycles: {}, pairs: {}, triples: {} }

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function cardId(cycleId: string, colKey: string): string {
  return `${cycleId}__${colKey}`
}

export function loadOwnership(): OwnershipMap {
  return readJSON(KEYS.ownership, {})
}

export function saveOwnership(ownership: OwnershipMap): void {
  writeJSON(KEYS.ownership, ownership)
}

export function loadOverrides(): OverridesMap {
  return readJSON(KEYS.overrides, {})
}

export function saveOverrides(overrides: OverridesMap): void {
  writeJSON(KEYS.overrides, overrides)
}

export function loadHidden(): HiddenState {
  const loaded = readJSON<Partial<HiddenState>>(KEYS.hidden, EMPTY_HIDDEN)
  return {
    cycles: loaded.cycles ?? {},
    pairs: loaded.pairs ?? {},
    triples: loaded.triples ?? {},
  }
}

export function saveHidden(hidden: HiddenState): void {
  writeJSON(KEYS.hidden, hidden)
}

export interface ExportPayload {
  version: 1
  exportedAt: string
  ownership: OwnershipMap
  overrides: OverridesMap
  hidden: HiddenState
}

export function buildExportPayload(): ExportPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    ownership: loadOwnership(),
    overrides: loadOverrides(),
    hidden: loadHidden(),
  }
}

/**
 * Accepts a v1 payload today. When the storage shape changes, bump
 * ExportPayload.version and add a branch here that upgrades older shapes
 * before applying them -- see CLAUDE.md's localStorage section.
 */
export function applyImportPayload(payload: ExportPayload): void {
  if (payload.version !== 1) {
    throw new Error(`Unsupported export version: ${String(payload.version)}`)
  }
  saveOwnership(payload.ownership ?? {})
  saveOverrides(payload.overrides ?? {})
  saveHidden(payload.hidden ?? EMPTY_HIDDEN)
}
