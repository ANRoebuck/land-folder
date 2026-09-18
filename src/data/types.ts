export type MonoColorKey = 'W' | 'U' | 'B' | 'R' | 'G'

export type ColorPairKey = 'WU' | 'UB' | 'BR' | 'RG' | 'GW' | 'WB' | 'UR' | 'BG' | 'RW' | 'GU'

export type ThreeColorKey =
  | 'bant'
  | 'esper'
  | 'grixis'
  | 'jund'
  | 'naya'
  | 'abzan'
  | 'jeskai'
  | 'sultai'
  | 'mardu'
  | 'temur'

export type ColumnKey = ColorPairKey | ThreeColorKey | MonoColorKey

export interface ColorPairInfo {
  key: ColorPairKey
  guild: string
  colors: string
}

export interface ThreeColorInfo {
  key: ThreeColorKey
  name: string
  colors: string
}

/** A single column within a land class's table -- see LandClass. */
export interface CategoryInfo {
  key: string
  label: string
  sublabel?: string
}

/**
 * A top-level grouping of cycles, rendered as its own table (e.g.
 * "Two-colour lands", "Mono-colour lands"). `categories` is that class's
 * fixed set of columns -- an empty array means the class isn't divided
 * into columns at all, and (paired with no cycles yet) renders no table,
 * the same way a class with categories but no cycles does.
 */
export interface LandClass {
  id: string
  name: string
  categories: CategoryInfo[]
}

export interface Cycle {
  id: string
  name: string
  era: string
  classId: string
  verified: boolean
  description: string
  /** Keys must match the categories of the LandClass identified by classId. */
  cards: Record<string, string>
}

/**
 * A single standalone card in a class with no categories (Gold, Colourless)
 * -- there's no cycle or category to group it under, so unlike Cycle it
 * doesn't hold a `cards` map, it just *is* one card. `id` shares a
 * namespace with Cycle ids (both are used as ownership/hidden/row-order
 * keys), so it must be unique across both CYCLES and FLAT_LANDS.
 */
export interface FlatLand {
  id: string
  name: string
  era: string
  classId: string
  verified: boolean
  description: string
}
