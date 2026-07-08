export interface Player {
  id: number
  name: string
  life: number
  color: string
  poison: number
  /** Damage taken from each opponent, keyed by opponent id. 21+ from one opponent is lethal. */
  commanderDamage: Record<number, number>
}

export interface LayoutRow {
  rotate: boolean
  count: number
}

export type HistoryEntry =
  | { type: 'life'; playerId: number; delta: number }
  | { type: 'poison'; playerId: number; delta: number }
  | { type: 'commanderDamage'; playerId: number; opponentId: number; delta: number }

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
  '#7f1d1d',
  '#7c2d12',
  '#713f12',
  '#14532d',
  '#164e63',
  '#1e3a8a',
  '#4c1d95',
  '#831843',
]
