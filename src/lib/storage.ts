// Stand-ins for real Scryfall printings until the "Live Scryfall
// verification" roadmap item wires up actual set/printing data (see
// CLAUDE.md's Roadmap). Every card currently offers the same two fake
// versions, "A" and "B".
export type VersionKey = 'A' | 'B'
export const VERSION_KEYS: readonly VersionKey[] = ['A', 'B']

export interface CardOwnership {
  versions: Record<VersionKey, number>
}

export type OwnershipMap = Record<string, CardOwnership>
export type OverridesMap = Record<string, string>

export interface HiddenState {
  cycles: Record<string, true>
  /** classId -> categoryKey -> true (presence of a key = hidden). */
  categories: Record<string, Record<string, true>>
}

const PREFIX = 'mtgCycleTracker.v1.'
const KEYS = {
  ownership: `${PREFIX}ownership`,
  overrides: `${PREFIX}overrides`,
  hidden: `${PREFIX}hidden`,
  rowOrder: `${PREFIX}rowOrder`,
  classOrder: `${PREFIX}classOrder`,
} as const

const EMPTY_HIDDEN: HiddenState = { cycles: {}, categories: {} }

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

export function createEmptyOwnership(): CardOwnership {
  return { versions: { A: 0, B: 0 } }
}

/**
 * Fills in defaults for any ownership entry that predates the `versions`
 * field. A v1 export (or old localStorage data) had `{ normal, foil }`
 * instead -- those counts have no equivalent under the versions model, so
 * they're dropped rather than guessed at; `versions` defaults to zero.
 */
function normalizeOwnership(raw: unknown): OwnershipMap {
  const result: OwnershipMap = {}
  if (!raw || typeof raw !== 'object') return result
  for (const [id, entry] of Object.entries(raw as Record<string, Partial<CardOwnership> | undefined>)) {
    if (!entry) continue
    result[id] = {
      versions: {
        A: entry.versions?.A ?? 0,
        B: entry.versions?.B ?? 0,
      },
    }
  }
  return result
}

export function loadOwnership(): OwnershipMap {
  return normalizeOwnership(readJSON(KEYS.ownership, {}))
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

/**
 * v3 and earlier stored two hardcoded category namespaces -- `pairs` (for
 * the two-color class) and `triples` (for the three-color class) -- instead
 * of one map keyed by classId. Migrates them in place rather than losing a
 * user's hidden-column choices; a payload that already has `categories`
 * (v4+) is used as-is.
 */
function normalizeHidden(raw: unknown): HiddenState {
  if (!raw || typeof raw !== 'object') return { cycles: {}, categories: {} }
  const loaded = raw as Partial<HiddenState> & {
    pairs?: Record<string, true>
    triples?: Record<string, true>
  }
  const categories =
    loaded.categories ??
    {
      'two-color': loaded.pairs ?? {},
      'three-color': loaded.triples ?? {},
    }
  return {
    cycles: loaded.cycles ?? {},
    categories,
  }
}

export function loadHidden(): HiddenState {
  return normalizeHidden(readJSON(KEYS.hidden, EMPTY_HIDDEN))
}

export function saveHidden(hidden: HiddenState): void {
  writeJSON(KEYS.hidden, hidden)
}

/** User-customised cycle (row) order, as an ordered list of cycle ids. An empty array means "use the built-in order". */
export function loadRowOrder(): string[] {
  const loaded = readJSON<string[]>(KEYS.rowOrder, [])
  return Array.isArray(loaded) ? loaded : []
}

export function saveRowOrder(order: string[]): void {
  writeJSON(KEYS.rowOrder, order)
}

/** User-customised class (table) order, as an ordered list of class ids. An empty array means "use the built-in order". */
export function loadClassOrder(): string[] {
  const loaded = readJSON<string[]>(KEYS.classOrder, [])
  return Array.isArray(loaded) ? loaded : []
}

export function saveClassOrder(order: string[]): void {
  writeJSON(KEYS.classOrder, order)
}

/**
 * Resolves a stored order against the current base key list: stored keys
 * that still exist keep their stored sequence, any base key missing from
 * storage (never reordered, or added after the order was saved) is
 * appended in its natural order, and any stored key no longer in the base
 * list is dropped.
 */
export function resolveOrder(baseKeys: readonly string[], stored: string[]): string[] {
  const baseSet = new Set(baseKeys)
  const kept = stored.filter((k) => baseSet.has(k))
  const keptSet = new Set(kept)
  const missing = baseKeys.filter((k) => !keptSet.has(k))
  return [...kept, ...missing]
}

export interface ExportPayload {
  version: 1 | 2 | 3 | 4
  exportedAt: string
  ownership: OwnershipMap
  overrides: OverridesMap
  hidden: HiddenState
  rowOrder?: string[]
  classOrder?: string[]
}

export function buildExportPayload(): ExportPayload {
  return {
    version: 4,
    exportedAt: new Date().toISOString(),
    ownership: loadOwnership(),
    overrides: loadOverrides(),
    hidden: loadHidden(),
    rowOrder: loadRowOrder(),
    classOrder: loadClassOrder(),
  }
}

/**
 * Accepts v1 (pre-per-version-tracking, `{ normal, foil }`), v2
 * (`{ versions }`), v3 (adds `rowOrder`), and v4 (adds `classOrder`, and
 * replaces `hidden.pairs`/`hidden.triples` with `hidden.categories`)
 * payloads. normalizeOwnership drops the old ownership counts and fills in
 * zeroed `versions` for a v1 payload; normalizeHidden migrates a pre-v4
 * `pairs`/`triples` shape; payloads before a given field was added just
 * fall back to the built-in order. When the storage shape changes again,
 * bump ExportPayload.version and add a branch here that upgrades older
 * shapes before applying them -- see CLAUDE.md's localStorage section.
 */
export function applyImportPayload(payload: ExportPayload): void {
  if (payload.version !== 1 && payload.version !== 2 && payload.version !== 3 && payload.version !== 4) {
    throw new Error(`Unsupported export version: ${String(payload.version)}`)
  }
  saveOwnership(normalizeOwnership(payload.ownership ?? {}))
  saveOverrides(payload.overrides ?? {})
  saveHidden(normalizeHidden(payload.hidden))
  saveRowOrder(Array.isArray(payload.rowOrder) ? payload.rowOrder : [])
  saveClassOrder(Array.isArray(payload.classOrder) ? payload.classOrder : [])
}
