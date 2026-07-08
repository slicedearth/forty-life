export interface Player {
  id: number
  name: string
  life: number
}

export interface LayoutRow {
  rotate: boolean
  count: number
}

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
