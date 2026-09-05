import type { ColorPairInfo, ThreeColorInfo, Cycle } from './types'

export const COLOR_PAIRS: ColorPairInfo[] = [
  { key: 'WU', guild: 'Azorius', colors: 'White / Blue' },
  { key: 'UB', guild: 'Dimir', colors: 'Blue / Black' },
  { key: 'BR', guild: 'Rakdos', colors: 'Black / Red' },
  { key: 'RG', guild: 'Gruul', colors: 'Red / Green' },
  { key: 'GW', guild: 'Selesnya', colors: 'Green / White' },
  { key: 'WB', guild: 'Orzhov', colors: 'White / Black' },
  { key: 'UR', guild: 'Izzet', colors: 'Blue / Red' },
  { key: 'BG', guild: 'Golgari', colors: 'Black / Green' },
  { key: 'RW', guild: 'Boros', colors: 'Red / White' },
  { key: 'GU', guild: 'Simic', colors: 'Green / Blue' },
]

export const THREE_COLOR_COMBOS: ThreeColorInfo[] = [
  { key: 'bant', name: 'Bant', colors: 'Green / White / Blue' },
  { key: 'esper', name: 'Esper', colors: 'White / Blue / Black' },
  { key: 'grixis', name: 'Grixis', colors: 'Blue / Black / Red' },
  { key: 'jund', name: 'Jund', colors: 'Black / Red / Green' },
  { key: 'naya', name: 'Naya', colors: 'Red / Green / White' },
  { key: 'abzan', name: 'Abzan', colors: 'White / Black / Green' },
  { key: 'jeskai', name: 'Jeskai', colors: 'Blue / Red / White' },
  { key: 'sultai', name: 'Sultai', colors: 'Black / Green / Blue' },
  { key: 'mardu', name: 'Mardu', colors: 'Red / White / Black' },
  { key: 'temur', name: 'Temur', colors: 'Green / Blue / Red' },
]

// NOTE ON `verified`: false renders a "*" marker in the UI meaning the card
// names in that cycle have not been confirmed against Scryfall yet. Per
// CLAUDE.md's "don't invent card names" rule, do not flip a cycle to
// verified: true without checking every name against Scryfall first.
export const CYCLES: Cycle[] = [
  {
    id: 'original-duals',
    name: 'Original Dual Lands',
    era: 'Limited Edition Alpha/Beta, 1993',
    type: 'two-color',
    verified: true,
    description: 'Enters untapped, taps for either color, no drawback.',
    cards: {
      WU: 'Tundra',
      UB: 'Underground Sea',
      BR: 'Badlands',
      RG: 'Taiga',
      GW: 'Savannah',
      WB: 'Scrubland',
      UR: 'Volcanic Island',
      BG: 'Bayou',
      RW: 'Plateau',
      GU: 'Tropical Island',
    },
  },
  {
    id: 'bounce-lands',
    name: 'Bounce Lands (Karoo)',
    era: 'Ravnica: City of Guilds block, 2005-2006 (split across Ravnica, Guildpact, Dissension)',
    type: 'two-color',
    verified: true,
    description: 'Enters tapped; return a land you control to hand; taps for both colors at once.',
    cards: {
      WU: 'Azorius Chancery',
      UB: 'Dimir Aqueduct',
      BR: 'Rakdos Carnarium',
      RG: 'Gruul Turf',
      GW: 'Selesnya Sanctuary',
      WB: 'Orzhov Basilica',
      UR: 'Izzet Boilerworks',
      BG: 'Golgari Rot Farm',
      RW: 'Boros Garrison',
      GU: 'Simic Growth Chamber',
    },
  },
  {
    id: 'pain-lands',
    name: 'Pain Lands',
    era: 'Ice Age, 1995 (5 allied pairs) + Apocalypse, 2001 (5 remaining pairs)',
    type: 'two-color',
    verified: true,
    description: 'Enters untapped; taps for colorless free or colored for 1 life.',
    cards: {
      WU: 'Adarkar Wastes',
      UB: 'Underground River',
      BR: 'Sulfurous Springs',
      RG: 'Karplusan Forest',
      GW: 'Brushland',
      WB: 'Caves of Koilos',
      UR: 'Shivan Reef',
      BG: 'Llanowar Wastes',
      RW: 'Battlefield Forge',
      GU: 'Yavimaya Coast',
    },
  },
  {
    id: 'shocklands',
    name: 'Shock Lands',
    era: 'Ravnica: City of Guilds block, 2005-2006 (split across Ravnica, Guildpact, Dissension); heavily reprinted since Return to Ravnica, 2012',
    type: 'two-color',
    verified: true,
    description: 'Enters tapped unless you pay 2 life.',
    cards: {
      WU: 'Hallowed Fountain',
      UB: 'Watery Grave',
      BR: 'Blood Crypt',
      RG: 'Stomping Ground',
      GW: 'Temple Garden',
      WB: 'Godless Shrine',
      UR: 'Steam Vents',
      BG: 'Overgrown Tomb',
      RW: 'Sacred Foundry',
      GU: 'Breeding Pool',
    },
  },
  {
    id: 'check-lands',
    name: 'Check Lands',
    era: 'Magic 2010 core set, 2009 (5 allied pairs) + Innistrad, 2011 (5 remaining pairs)',
    type: 'two-color',
    verified: true,
    description: 'Enters tapped unless you control a basic land of one of its types.',
    cards: {
      WU: 'Glacial Fortress',
      UB: 'Drowned Catacomb',
      BR: 'Dragonskull Summit',
      RG: 'Rootbound Crag',
      GW: 'Sunpetal Grove',
      WB: 'Isolated Chapel',
      UR: 'Sulfur Falls',
      BG: 'Woodland Cemetery',
      RW: 'Clifftop Retreat',
      GU: 'Hinterland Harbor',
    },
  },
  {
    id: 'fast-lands',
    name: 'Fast Lands',
    era: 'Scars of Mirrodin, 2010 (5 allied pairs) + Kaladesh, 2016 (5 remaining pairs)',
    type: 'two-color',
    verified: true,
    description: 'Enters untapped if you control two or fewer other lands.',
    cards: {
      WU: 'Seachrome Coast',
      UB: 'Darkslick Shores',
      BR: 'Blackcleave Cliffs',
      RG: 'Copperline Gorge',
      GW: 'Razorverge Thicket',
      WB: 'Concealed Courtyard',
      UR: 'Spirebluff Canal',
      BG: 'Blooming Marsh',
      RW: 'Inspiring Vantage',
      GU: 'Botanical Sanctum',
    },
  },
  {
    id: 'triomes',
    name: 'Triomes',
    era: 'Ikoria: Lair of Behemoths, 2020 (the 5 wedges) + Streets of New Capenna, 2022 (the 5 shards)',
    type: 'three-color',
    verified: true,
    description:
      'Enters tapped, taps for any of its three colors, has Cycling {3}. Only the wedge ' +
      'versions literally say "Triome" on the card; the shard versions are named after ' +
      'Streets of New Capenna crime families.',
    cards: {
      bant: "Spara's Headquarters",
      esper: "Raffine's Tower",
      grixis: "Xander's Lounge",
      jund: "Ziatora's Proving Ground",
      naya: "Jetmir's Garden",
      abzan: 'Indatha Triome',
      jeskai: 'Raugrin Triome',
      sultai: 'Zagoth Triome',
      mardu: 'Savai Triome',
      temur: 'Ketria Triome',
    },
  },

  // Documented-but-not-yet-added cycles (deliberately left out rather than
  // guessed -- verify against Scryfall before filling these in):
  // - Slow Lands (Kaldheim/Midnight Hunt "check the top two colors" lands)
  // - Surveil Lands (Murders at Karlov Manor)
  // - Filter Lands (Shadowmoor/Eventide, Future Sight)
  // - Gain Lands (many sets, "Guild Gate"-style with a life-gain ETB)
  // - Battle/Tango Lands (Khans of Tarkir "enters tapped unless you control two+ basics")
  // - Snow Duals (Kaldheim snow-covered dual lands)
]

const PAIR_KEYS: readonly string[] = COLOR_PAIRS.map((p) => p.key)
const TRIPLE_KEYS: readonly string[] = THREE_COLOR_COMBOS.map((t) => t.key)

/**
 * Every cycle's `id` must be unique (it's used to build localStorage keys
 * via `cardId()`; two cycles sharing an id would silently share ownership
 * data for their same-lettered columns), and every cycle's `cards` object
 * must have exactly the keys for its type -- no dupes, no stray keys, none
 * missing. Runs once at module load so a malformed cycle fails loudly
 * instead of silently rendering a blank column or corrupting unrelated
 * data. See CLAUDE.md's "Testing" section for the pattern this replaces.
 */
function validateCycles(cycles: Cycle[]): void {
  const seenIds = new Set<string>()
  for (const cycle of cycles) {
    if (seenIds.has(cycle.id)) {
      throw new Error(
        `Duplicate cycle id "${cycle.id}" -- ids must be unique across CYCLES, ` +
          `since they're used to build localStorage keys.`,
      )
    }
    seenIds.add(cycle.id)

    const expected = cycle.type === 'two-color' ? PAIR_KEYS : TRIPLE_KEYS
    const keys = Object.keys(cycle.cards)
    if (new Set(keys).size !== keys.length) {
      throw new Error(`Cycle "${cycle.id}" has duplicate card keys: ${keys.join(', ')}`)
    }
    const keySet = new Set(keys)
    const missing = expected.filter((k) => !keySet.has(k))
    const stray = keys.filter((k) => !expected.includes(k))
    if (missing.length > 0 || stray.length > 0) {
      throw new Error(
        `Cycle "${cycle.id}" card keys don't match its type "${cycle.type}". ` +
          `Missing: [${missing.join(', ')}]. Stray: [${stray.join(', ')}].`,
      )
    }
  }
}

validateCycles(CYCLES)
