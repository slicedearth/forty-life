/** How a commander pairs with a second commander, derived from its oracle text. */
export type PartnerMode =
  | 'partner'
  | 'partner-with'
  | 'background'
  | 'friends-forever'
  | 'doctors-companion'
  | 'time-lord-doctor'
  | null

export interface CommanderCard {
  name: string
  imageUrl: string
  partnerMode: PartnerMode
  /** Only set when partnerMode is 'partner-with' — the exact card it pairs with. */
  partnerWithName: string | null
}

export interface Player {
  id: number
  name: string
  life: number
  color: string
  poison: number
  /** Additional mana owed when casting each commander from the command zone. */
  commanderTax: number[]
  /** Damage taken from each opponent, keyed by opponent id. 21+ from one opponent is lethal. */
  commanderDamage: Record<number, number>
  /** Scryfall art for this player's commander(s), shown as their counter background. 0, 1, or 2 entries. */
  commanders: CommanderCard[]
}

export interface LayoutRow {
  rotate: boolean
  count: number
}

export type HistoryEntry =
  | { type: 'life'; playerId: number; delta: number }
  | { type: 'poison'; playerId: number; delta: number }
  | { type: 'commanderDamage'; playerId: number; opponentId: number; delta: number }
  | { type: 'commanderTax'; playerId: number; commanderIndex: number; delta: number }

/**
 * Each row's player count must divide evenly into GRID_COLUMNS (6) so every
 * cell in a row gets an equal, integer column-span.
 */
export const GRID_COLUMNS = 6

export const LAYOUTS: Record<number, LayoutRow[]> = {
  2: [
    { rotate: true, count: 1 },
    { rotate: false, count: 1 },
  ],
  3: [
    { rotate: true, count: 1 },
    { rotate: false, count: 2 },
  ],
  4: [
    { rotate: true, count: 2 },
    { rotate: false, count: 2 },
  ],
  5: [
    { rotate: true, count: 2 },
    { rotate: false, count: 3 },
  ],
  6: [
    { rotate: true, count: 3 },
    { rotate: false, count: 3 },
  ],
}

export const PLAYER_COLORS = [
  '#b91c1c', // red
  '#c2410c', // orange
  '#a16207', // gold
  '#15803d', // green
  '#0e7490', // cyan
  '#1d4ed8', // blue
  '#6d28d9', // violet
  '#be185d', // pink
]
