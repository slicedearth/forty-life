import { describe, expect, it } from 'vitest'
import {
  appendHistory,
  applyCommanderDamageDelta,
  applyCommanderTaxDelta,
  applyLifeDelta,
  applyPoisonDelta,
  createPlayers,
  isPlayerLethal,
  resetPlayers,
  renamePlayer,
  undoHistoryEntry,
  updatePlayerCommanders,
} from './game'
import type { HistoryEntry } from './types'

const configs = [
  { name: 'Alice', color: '#b91c1c', commanders: [] },
  { name: 'Bob', color: '#c2410c', commanders: [] },
]

describe('game transitions', () => {
  it('creates a clean player state', () => {
    const players = createPlayers(configs, 40)

    expect(players).toHaveLength(2)
    expect(players[0]).toMatchObject({ id: 0, name: 'Alice', life: 40, poison: 0 })
    expect(players[0].commanderTax).toEqual([0])
  })

  it('applies and undoes life changes', () => {
    const players = createPlayers(configs, 40)
    const changed = applyLifeDelta(players, 0, -5)

    expect(changed.appliedDelta).toBe(-5)
    expect(changed.players[0].life).toBe(35)
    expect(undoHistoryEntry(changed.players, { type: 'life', playerId: 0, delta: -5 })[0].life).toBe(40)
  })

  it('does not record a phantom poison decrement at zero', () => {
    const players = createPlayers(configs, 40)
    const changed = applyPoisonDelta(players, 0, -1)

    expect(changed.appliedDelta).toBe(0)
    expect(changed.players).toBe(players)
  })

  it('tracks commander damage independently and floors it at zero', () => {
    const players = createPlayers(configs, 40)
    const first = applyCommanderDamageDelta(players, 0, 1, 5)
    const second = applyCommanderDamageDelta(first.players, 0, 1, -10)

    expect(first.players[0].commanderDamage).toEqual({ 1: 5 })
    expect(second.appliedDelta).toBe(-5)
    expect(second.players[0].commanderDamage).toEqual({ 1: 0 })
  })

  it('tracks and undoes commander tax', () => {
    const players = createPlayers(configs, 40)
    const changed = applyCommanderTaxDelta(players, 0, 0, 2)
    const entry: HistoryEntry = { type: 'commanderTax', playerId: 0, commanderIndex: 0, delta: 2 }

    expect(changed.players[0].commanderTax).toEqual([2])
    expect(undoHistoryEntry(changed.players, entry)[0].commanderTax).toEqual([0])
  })

  it('rejects an invalid commander slot without changing state', () => {
    const players = createPlayers(configs, 40)
    const changed = applyCommanderTaxDelta(players, 0, 2, 2)

    expect(changed.appliedDelta).toBe(0)
    expect(changed.players).toBe(players)
  })

  it('caps history at the most recent fifty actions', () => {
    let history: HistoryEntry[] = []
    for (let index = 0; index < 55; index++) {
      history = appendHistory(history, { type: 'life', playerId: 0, delta: index })
    }

    expect(history).toHaveLength(50)
    expect(history[0]).toMatchObject({ delta: 5 })
    expect(history.at(-1)).toMatchObject({ delta: 54 })
  })

  it('resets tracked game counters while preserving player identity', () => {
    let players = createPlayers(configs, 40)
    players = applyLifeDelta(players, 0, -12).players
    players = applyPoisonDelta(players, 0, 3).players
    players = applyCommanderDamageDelta(players, 0, 1, 7).players
    players = applyCommanderTaxDelta(players, 0, 0, 4).players

    const reset = resetPlayers(players, 40)
    expect(reset[0]).toMatchObject({ name: 'Alice', life: 40, poison: 0, commanderDamage: {} })
    expect(reset[0].commanderTax).toEqual([0])
  })

  it('recognizes every supported lethal condition', () => {
    const [player] = createPlayers(configs, 40)

    expect(isPlayerLethal(player)).toBe(false)
    expect(isPlayerLethal({ ...player, life: 0 })).toBe(true)
    expect(isPlayerLethal({ ...player, poison: 10 })).toBe(true)
    expect(isPlayerLethal({ ...player, commanderDamage: { 1: 21 } })).toBe(true)
  })

  it('preserves spaces while bounding an in-progress player rename', () => {
    const players = createPlayers(configs, 40)

    expect(renamePlayer(players, 0, 'Alice ')[0].name).toBe('Alice ')
    expect(renamePlayer(players, 0, 'A'.repeat(80))[0].name).toHaveLength(40)
  })

  it('keeps tax aligned with at most two commanders', () => {
    const players = createPlayers(configs, 40)
    const commanders = [0, 1, 2].map(index => ({
      name: `Commander ${index}`,
      imageUrl: `https://cards.scryfall.io/art_crop/front/a/b/${index}.jpg`,
      partnerMode: null,
      partnerWithName: null,
    }))
    const updated = updatePlayerCommanders(players, 0, commanders)

    expect(updated[0].commanders).toHaveLength(2)
    expect(updated[0].commanderTax).toEqual([0, 0])
  })
})
