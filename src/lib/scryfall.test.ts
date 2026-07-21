import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearScryfallCache,
  fetchCardByExactName,
  searchCommanders,
  searchSecondaryCommander,
  secondaryKindFor,
} from './scryfall'

const card = {
  name: 'Wilson, Refined Grizzly',
  oracle_text: 'Choose a Background',
  type_line: 'Legendary Creature — Bear Warrior',
  image_uris: { art_crop: 'https://cards.scryfall.io/art_crop/front/a/b/wilson.jpg' },
}

describe('Scryfall client', () => {
  beforeEach(() => clearScryfallCache())
  afterEach(() => vi.unstubAllGlobals())

  it('adds commander legality, validates results, caps output, and caches searches', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [...Array(14)].map((_, index) => ({ ...card, name: `Card ${index}` })) }))
    )
    vi.stubGlobal('fetch', fetchMock)

    const first = await searchCommanders('wilson')
    const second = await searchCommanders('wilson')

    expect(first).toHaveLength(12)
    expect(first[0].partnerMode).toBe('background')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('is%3Acommander%20wilson')
    expect(second).toEqual(first)
  })

  it('filters cards with untrusted artwork URLs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [{ ...card, image_uris: { art_crop: 'https://example.com/card.jpg' } }] }))
      )
    )

    await expect(searchCommanders('wilson')).resolves.toEqual([])
  })

  it('does not retry rate-limit failures', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 429 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchCommanders('wilson')).rejects.toThrow('status 429')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects malformed responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {} }))))

    await expect(searchCommanders('wilson')).rejects.toThrow('invalid search response')
  })

  it('uses the compatible secondary filter', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [card] })))
    vi.stubGlobal('fetch', fetchMock)

    await searchSecondaryCommander('background', 'agent')
    expect(fetchMock.mock.calls[0][0]).toContain('type%3Abackground%20agent')
    expect(secondaryKindFor('background')).toBe('background')
    expect(secondaryKindFor('time-lord-doctor')).toBe('doctors-companion')
    expect(secondaryKindFor('doctors-companion')).toBe('time-lord-doctor')
    expect(secondaryKindFor('partner')).toBe('partner')
    expect(secondaryKindFor('friends-forever')).toBe('friends-forever')
    expect(secondaryKindFor('partner-with')).toBeNull()
  })

  it('treats missing searches as empty results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })))

    await expect(searchCommanders('missing')).resolves.toEqual([])
    await expect(searchCommanders('   ')).resolves.toEqual([])
  })

  it('handles exact-name misses and valid partner cards', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(card)))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchCardByExactName('Missing')).resolves.toBeNull()
    await expect(fetchCardByExactName('Wilson, Refined Grizzly')).resolves.toMatchObject({
      name: 'Wilson, Refined Grizzly',
      partnerMode: 'background',
    })
  })

  it('rejects malformed exact-name responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ name: 42 }))))

    await expect(fetchCardByExactName('Malformed')).rejects.toThrow('invalid card response')
  })
})
