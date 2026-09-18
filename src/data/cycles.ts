import type { CategoryInfo, ColorPairInfo, LandClass, ThreeColorInfo, Cycle, FlatLand } from './types'

export const MONO_COLORS: CategoryInfo[] = [
  { key: 'W', label: 'White' },
  { key: 'U', label: 'Blue' },
  { key: 'B', label: 'Black' },
  { key: 'R', label: 'Red' },
  { key: 'G', label: 'Green' },
]

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

/**
 * Every top-level table the app can render, in their built-in (pre-
 * customisation) order. A class with no `categories` isn't divided into
 * columns at all -- its cards live in FLAT_LANDS below instead of CYCLES,
 * each one standing alone rather than belonging to a cycle -- see LandClass
 * and FlatLand in types.ts.
 */
export const LAND_CLASSES: LandClass[] = [
  {
    id: 'two-color',
    name: 'Two-colour lands',
    categories: COLOR_PAIRS.map((p) => ({ key: p.key, label: p.guild, sublabel: p.colors })),
  },
  {
    id: 'three-color',
    name: 'Three-colour lands',
    categories: THREE_COLOR_COMBOS.map((t) => ({ key: t.key, label: t.name, sublabel: t.colors })),
  },
  {
    id: 'mono-color',
    name: 'Mono-colour lands',
    categories: MONO_COLORS,
  },
  {
    id: 'gold',
    name: 'Multicolour lands',
    categories: [],
  },
  {
    id: 'colorless',
    name: 'Colourless lands',
    categories: [],
  },
]

// NOTE ON `verified`: false renders a "*" marker in the UI meaning the card
// names in that cycle have not been confirmed against Scryfall yet. Per
// CLAUDE.md's "don't invent card names" rule, do not flip a cycle to
// verified: true without checking every name against Scryfall first.
export const CYCLES: Cycle[] = [
  {
    id: 'original-duals',
    name: 'Dual Lands',
    era: 'Limited Edition Alpha/Beta, 1993',
    classId: 'two-color',
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
    name: 'Bounce Lands',
    era: 'Ravnica: City of Guilds block, 2005-2006 (split across Ravnica, Guildpact, Dissension)',
    classId: 'two-color',
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
    classId: 'two-color',
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
    classId: 'two-color',
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
    classId: 'two-color',
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
    classId: 'two-color',
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
    classId: 'three-color',
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
  {
    id: 'slow-lands',
    name: 'Slow Lands',
    era: 'Innistrad: Midnight Hunt, 2021 (5 allied pairs) + Innistrad: Crimson Vow, 2021 (5 remaining pairs)',
    classId: 'two-color',
    verified: true,
    description: 'Enters tapped unless you control two or more other lands.',
    cards: {
      WU: 'Deserted Beach',
      UB: 'Shipwreck Marsh',
      BR: 'Haunted Ridge',
      RG: 'Rockfall Vale',
      GW: 'Overgrown Farmland',
      WB: 'Shattered Sanctum',
      UR: 'Stormcarved Coast',
      BG: 'Deathcap Glade',
      RW: 'Sundown Pass',
      GU: 'Dreamroot Cascade',
    },
  },
  {
    id: 'surveil-lands',
    name: 'Surveil Lands',
    era: 'Murders at Karlov Manor, 2024',
    classId: 'two-color',
    verified: true,
    description: 'Enters tapped; Surveil 1 when it enters.',
    cards: {
      WU: 'Meticulous Archive',
      UB: 'Undercity Sewers',
      BR: 'Raucous Theater',
      RG: 'Commercial District',
      GW: 'Lush Portico',
      WB: 'Shadowy Backstreet',
      UR: 'Thundering Falls',
      BG: 'Underground Mortuary',
      RW: 'Elegant Parlor',
      GU: 'Hedge Maze',
    },
  },
  {
    id: 'filter-lands',
    name: 'Filter Lands',
    era: 'Shadowmoor, 2008 (5 allied pairs) + Eventide, 2008 (5 remaining pairs)',
    classId: 'two-color',
    verified: true,
    description:
      'Taps alone for colorless, or filters one mana of either of its colors (via a hybrid ' +
      'cost) into two mana of its two colors.',
    cards: {
      WU: 'Mystic Gate',
      UB: 'Sunken Ruins',
      BR: 'Graven Cairns',
      RG: 'Fire-Lit Thicket',
      GW: 'Wooded Bastion',
      WB: 'Fetid Heath',
      UR: 'Cascade Bluffs',
      BG: 'Twilight Mire',
      RW: 'Rugged Prairie',
      GU: 'Flooded Grove',
    },
  },

  {
    id: 'tango-lands',
    name: 'Tango Lands',
    era:
      'Battle for Zendikar, 2015 (5 pairs), completed over a decade of Commander-only ' +
      'reprint products: Edge of Eternities Commander, 2025 (2 pairs), Lorwyn Eclipsed ' +
      'Commander, 2026 (1 pair), Secrets of Strixhaven Commander, 2026 (final 2 pairs)',
    classId: 'two-color',
    verified: true,
    description: 'Enters tapped unless you control two or more basic lands.',
    cards: {
      WU: 'Prairie Stream',
      UB: 'Sunken Hollow',
      BR: 'Smoldering Marsh',
      RG: 'Cinder Glade',
      GW: 'Canopy Vista',
      WB: 'Eclipsed Steppe',
      UR: 'Scorched Geyser',
      BG: 'Vernal Fen',
      RW: 'Radiant Summit',
      GU: 'Sodden Verdure',
    },
  },
  {
    id: 'fetch-lands',
    name: 'Fetch Lands',
    era: 'Onslaught, 2002 (5 allied pairs) + Zendikar, 2009 (5 remaining pairs); heavily reprinted since (Modern Horizons 2 & 3, various Commander products)',
    classId: 'two-color',
    verified: true,
    description: 'Pay 1 life and sacrifice to search your library for a land of either basic type, then put it onto the battlefield.',
    cards: {
      WU: 'Flooded Strand',
      UB: 'Polluted Delta',
      BR: 'Bloodstained Mire',
      RG: 'Wooded Foothills',
      GW: 'Windswept Heath',
      WB: 'Marsh Flats',
      UR: 'Scalding Tarn',
      BG: 'Verdant Catacombs',
      RW: 'Arid Mesa',
      GU: 'Misty Rainforest',
    },
  },
  {
    id: 'verge-lands',
    name: 'Verges',
    era: 'Duskmourn: House of Horror, 2024 (5 allied pairs) + Aetherdrift, 2025 (5 remaining pairs)',
    classId: 'two-color',
    verified: true,
    description:
      'Enters untapped; always taps for one of its colors, and taps for the other only if ' +
      'you control a basic land of one of its two associated types.',
    cards: {
      WU: 'Floodfarm Verge',
      UB: 'Gloomlake Verge',
      BR: 'Blazemire Verge',
      RG: 'Thornspire Verge',
      GW: 'Hushwood Verge',
      WB: 'Bleachbone Verge',
      UR: 'Riverpyre Verge',
      BG: 'Wastewood Verge',
      RW: 'Sunbillow Verge',
      GU: 'Willowrush Verge',
    },
  },
  {
    id: 'channel-lands',
    name: 'Channel Lands',
    era: 'Kamigawa: Neon Dynasty, 2022',
    classId: 'mono-color',
    verified: true,
    description:
      'Legendary lands that tap for one color; each also has a unique Channel ability, ' +
      'letting you discard it from hand for an effect instead of playing it as a land.',
    cards: {
      W: 'Eiganjo, Seat of the Empire',
      U: 'Otawara, Soaring City',
      B: 'Takenuma, Abandoned Mire',
      R: 'Sokenzan, Crucible of Defiance',
      G: 'Boseiju, Who Endures',
    },
  },

  // Documented-but-not-yet-added cycles (deliberately left out rather than
  // guessed -- verify against Scryfall before filling these in):
  // - Gain Lands (many sets, "Guild Gate"-style with a life-gain ETB)
  // - Snow Duals (Kaldheim snow-covered dual lands)
]

/**
 * Standalone cards for classes with no categories (Gold, Colourless) --
 * see FlatLand in types.ts for why these aren't just cycles with one fake
 * category. Deliberately sparse for now (see CLAUDE.md's Known gaps).
 */
export const FLAT_LANDS: FlatLand[] = [
  {
    id: 'eldrazi-temple',
    name: 'Eldrazi Temple',
    era: 'Rise of the Eldrazi, 2010',
    classId: 'colorless',
    verified: true,
    description:
      'Taps for {C}, or for {C}{C} usable only to cast colorless Eldrazi spells or activate ' +
      'abilities of colorless Eldrazi.',
  },
  {
    id: 'cavern-of-souls',
    name: 'Cavern of Souls',
    era: 'Avacyn Restored, 2012',
    classId: 'gold',
    verified: true,
    description:
      'Choose a creature type as it enters; taps for {C}, or for one mana of any color to cast ' +
      'an uncounterable creature spell of the chosen type.',
  },
]

const CATEGORY_KEYS_BY_CLASS: Record<string, readonly string[]> = Object.fromEntries(
  LAND_CLASSES.map((c) => [c.id, c.categories.map((cat) => cat.key)]),
)
const CLASS_IDS = new Set(LAND_CLASSES.map((c) => c.id))

/**
 * Every cycle's `id` must be unique (it's used to build localStorage keys
 * via `cardId()`; two cycles sharing an id would silently share ownership
 * data for their same-lettered columns), every cycle's `classId` must
 * reference a real entry in `LAND_CLASSES`, and every cycle's `cards`
 * object must have exactly the keys for that class's categories -- no
 * dupes, no stray keys, none missing. Every flat land's `id` must also be
 * unique (across CYCLES *and* FLAT_LANDS -- both feed the same
 * ownership/hidden/row-order keyspace), and its `classId` must reference a
 * class with zero categories, not a grid class. Runs once at module load
 * so a malformed entry fails loudly instead of silently rendering wrong or
 * corrupting unrelated data. See CLAUDE.md's "Testing" section for the
 * pattern this replaces.
 */
function validateCycles(cycles: Cycle[], flatLands: FlatLand[]): void {
  const seenIds = new Set<string>()
  for (const cycle of cycles) {
    if (seenIds.has(cycle.id)) {
      throw new Error(
        `Duplicate id "${cycle.id}" -- ids must be unique across CYCLES and FLAT_LANDS, ` +
          `since they're used to build localStorage keys.`,
      )
    }
    seenIds.add(cycle.id)

    const expected = CATEGORY_KEYS_BY_CLASS[cycle.classId]
    if (!expected) {
      throw new Error(`Cycle "${cycle.id}" has unknown classId "${cycle.classId}" -- add it to LAND_CLASSES first.`)
    }
    const keys = Object.keys(cycle.cards)
    if (new Set(keys).size !== keys.length) {
      throw new Error(`Cycle "${cycle.id}" has duplicate card keys: ${keys.join(', ')}`)
    }
    const keySet = new Set(keys)
    const missing = expected.filter((k) => !keySet.has(k))
    const stray = keys.filter((k) => !expected.includes(k))
    if (missing.length > 0 || stray.length > 0) {
      throw new Error(
        `Cycle "${cycle.id}" card keys don't match its class "${cycle.classId}". ` +
          `Missing: [${missing.join(', ')}]. Stray: [${stray.join(', ')}].`,
      )
    }
  }

  for (const land of flatLands) {
    if (seenIds.has(land.id)) {
      throw new Error(
        `Duplicate id "${land.id}" -- ids must be unique across CYCLES and FLAT_LANDS, ` +
          `since they're used to build localStorage keys.`,
      )
    }
    seenIds.add(land.id)

    if (!CLASS_IDS.has(land.classId)) {
      throw new Error(`Flat land "${land.id}" has unknown classId "${land.classId}" -- add it to LAND_CLASSES first.`)
    }
    const categories = CATEGORY_KEYS_BY_CLASS[land.classId]
    if (categories.length > 0) {
      throw new Error(
        `Flat land "${land.id}" belongs to class "${land.classId}", which has categories -- ` +
          `flat lands only belong in a class with categories: [] (see FlatLand in types.ts).`,
      )
    }
  }
}

validateCycles(CYCLES, FLAT_LANDS)
