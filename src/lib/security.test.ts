import { describe, expect, it } from 'vitest'
import { normalizePlayerName, normalizeScryfallImageUrl } from './security'

describe('untrusted value normalization', () => {
  it('allows only HTTPS Scryfall card images', () => {
    expect(normalizeScryfallImageUrl('https://cards.scryfall.io/art_crop/front/a/b/card.jpg')).toContain(
      'cards.scryfall.io'
    )
    expect(normalizeScryfallImageUrl('http://cards.scryfall.io/card.jpg')).toBeNull()
    expect(normalizeScryfallImageUrl('https://example.com/card.jpg')).toBeNull()
    expect(normalizeScryfallImageUrl('not a URL')).toBeNull()
  })

  it('bounds player names and supplies a fallback', () => {
    expect(normalizePlayerName('  Alice  ', 'Player 1')).toBe('Alice')
    expect(normalizePlayerName('   ', 'Player 1')).toBe('Player 1')
    expect(normalizePlayerName('A'.repeat(80), 'Player 1')).toHaveLength(40)
  })
})
