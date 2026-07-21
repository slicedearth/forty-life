export const MAX_PLAYER_NAME_LENGTH = 40

export function normalizePlayerName(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  return value.trim().slice(0, MAX_PLAYER_NAME_LENGTH) || fallback
}

export function normalizeScryfallImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null

  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'cards.scryfall.io' ? url.href : null
  } catch {
    return null
  }
}
