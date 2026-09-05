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

export type ColumnKey = ColorPairKey | ThreeColorKey

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

export type CycleType = 'two-color' | 'three-color'

export interface Cycle {
  id: string
  name: string
  era: string
  type: CycleType
  verified: boolean
  description: string
  /** Keys match ColorPairKey for type "two-color", ThreeColorKey for type "three-color". */
  cards: Record<string, string>
}
