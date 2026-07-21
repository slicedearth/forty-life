import { describe, expect, it, vi } from 'vitest'
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  clearSavedState,
  loadSavedState,
  parseSavedState,
  saveSavedState,
} from './storage'

function validState() {
  return {
    version: STORAGE_VERSION,
    startingLife: 40,
    monarchId: 0,
    initiativeId: null,
    dayNight: 'night',
    players: [
      {
        id: 0,
        name: 'Alice',
        color: '#b91c1c',
        life: 38,
        poison: 2,
        commanderTax: [2],
        commanderDamage: { 1: 4 } as Record<number, number>,
        commanders: [
          {
            name: 'Atraxa, Praetors\' Voice',
            imageUrl: 'https://cards.scryfall.io/art_crop/front/a/b/example.jpg',
            partnerMode: null,
            partnerWithName: null,
          },
        ],
      },
      {
        id: 1,
        name: 'Bob',
        color: '#c2410c',
        life: 40,
        poison: 0,
        commanderTax: [0],
        commanderDamage: {},
        commanders: [],
      },
    ],
  }
}

describe('saved game validation', () => {
  it('rejects missing and malformed storage values', () => {
    expect(parseSavedState(null)).toBeNull()
    expect(parseSavedState('{invalid')).toBeNull()
    expect(parseSavedState(JSON.stringify([]))).toBeNull()
  })

  it('loads a valid versioned game', () => {
    const parsed = parseSavedState(JSON.stringify(validState()))

    expect(parsed?.players[0].name).toBe('Alice')
    expect(parsed?.players[0].commanders[0].imageUrl).toContain('cards.scryfall.io')
    expect(parsed?.monarchId).toBe(0)
    expect(parsed?.dayNight).toBe('night')
  })

  it('accepts and normalizes the legacy unversioned format', () => {
    const legacy = validState()
    Reflect.deleteProperty(legacy, 'version')

    expect(parseSavedState(JSON.stringify(legacy))?.players).toHaveLength(2)
  })

  it('rejects unsupported versions and impossible player counts', () => {
    expect(parseSavedState(JSON.stringify({ ...validState(), version: 99 }))).toBeNull()
    expect(parseSavedState(JSON.stringify({ ...validState(), players: [validState().players[0]] }))).toBeNull()
  })

  it('drops untrusted commander URLs and invalid damage sources', () => {
    const state = validState()
    state.players[0].commanders[0].imageUrl = 'https://example.com/tracker.png'
    state.players[0].commanderDamage = { 1: 4, 8: 99 }

    const parsed = parseSavedState(JSON.stringify(state))
    expect(parsed?.players[0].commanders).toEqual([])
    expect(parsed?.players[0].commanderDamage).toEqual({ 1: 4 })
  })

  it('normalizes names, colors, and numeric ranges', () => {
    const state = validState()
    state.players[0].name = `  ${'A'.repeat(80)}  `
    state.players[0].color = 'url(https://example.com/image)'
    state.players[0].poison = -50

    const parsed = parseSavedState(JSON.stringify(state))
    expect(parsed?.players[0].name).toHaveLength(40)
    expect(parsed?.players[0].color).toBe('#b91c1c')
    expect(parsed?.players[0].poison).toBe(0)
  })

  it('clears role holders that are not present in the game', () => {
    const state = validState()
    state.monarchId = 9

    expect(parseSavedState(JSON.stringify(state))?.monarchId).toBeNull()
  })

  it('fails closed when browser storage is unavailable', () => {
    const storage = {
      getItem: vi.fn(() => { throw new Error('blocked') }),
      setItem: vi.fn(() => { throw new Error('quota') }),
      removeItem: vi.fn(() => { throw new Error('blocked') }),
    }
    const parsed = parseSavedState(JSON.stringify(validState()))
    if (!parsed) throw new Error('Fixture should be valid')

    expect(loadSavedState(storage)).toBeNull()
    expect(saveSavedState(parsed, storage)).toBe(false)
    expect(() => clearSavedState(storage)).not.toThrow()
  })

  it('writes the storage version with saved games', () => {
    const storage = { setItem: vi.fn() }
    const parsed = parseSavedState(JSON.stringify(validState()))
    if (!parsed) throw new Error('Fixture should be valid')

    expect(saveSavedState(parsed, storage)).toBe(true)
    expect(storage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining(`\"version\":${STORAGE_VERSION}`)
    )
  })
})
