import type { CommanderCard, HistoryEntry, Player } from './types'
import { MAX_PLAYER_NAME_LENGTH, normalizePlayerName } from './security'

export const MAX_HISTORY = 50

export interface PlayerConfig {
  name: string
  color: string
  commanders: CommanderCard[]
}

export interface PlayerUpdate {
  players: Player[]
  appliedDelta: number
}

export function createPlayers(configs: PlayerConfig[], life: number): Player[] {
  return configs.map((config, index) => ({
    id: index,
    name: normalizePlayerName(config.name, `Player ${index + 1}`),
    color: config.color,
    life,
    poison: 0,
    commanderTax: Array(Math.max(1, config.commanders.length)).fill(0),
    commanderDamage: {},
    commanders: config.commanders.slice(0, 2),
  }))
}

export function appendHistory(history: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [...history.slice(-MAX_HISTORY + 1), entry]
}

export function applyLifeDelta(players: Player[], playerId: number, delta: number): PlayerUpdate {
  let appliedDelta = 0
  const nextPlayers = players.map(player => {
    if (player.id !== playerId) return player
    appliedDelta = delta
    return { ...player, life: player.life + delta }
  })
  return { players: appliedDelta === 0 ? players : nextPlayers, appliedDelta }
}

export function applyPoisonDelta(players: Player[], playerId: number, delta: number): PlayerUpdate {
  let appliedDelta = 0
  const nextPlayers = players.map(player => {
    if (player.id !== playerId) return player
    const next = Math.max(0, player.poison + delta)
    appliedDelta = next - player.poison
    return appliedDelta === 0 ? player : { ...player, poison: next }
  })
  return { players: appliedDelta === 0 ? players : nextPlayers, appliedDelta }
}

export function applyCommanderDamageDelta(
  players: Player[],
  playerId: number,
  opponentId: number,
  delta: number
): PlayerUpdate {
  let appliedDelta = 0
  const nextPlayers = players.map(player => {
    if (player.id !== playerId) return player
    const current = player.commanderDamage[opponentId] ?? 0
    const next = Math.max(0, current + delta)
    appliedDelta = next - current
    return appliedDelta === 0
      ? player
      : { ...player, commanderDamage: { ...player.commanderDamage, [opponentId]: next } }
  })
  return { players: appliedDelta === 0 ? players : nextPlayers, appliedDelta }
}

export function applyCommanderTaxDelta(
  players: Player[],
  playerId: number,
  commanderIndex: number,
  delta: number
): PlayerUpdate {
  if (!Number.isInteger(commanderIndex) || commanderIndex < 0 || commanderIndex > 1) {
    return { players, appliedDelta: 0 }
  }

  let appliedDelta = 0
  const nextPlayers = players.map(player => {
    if (player.id !== playerId) return player
    const commanderTax = [...player.commanderTax]
    while (commanderTax.length <= commanderIndex) commanderTax.push(0)
    const current = commanderTax[commanderIndex] ?? 0
    const next = Math.max(0, current + delta)
    appliedDelta = next - current
    if (appliedDelta === 0) return player
    commanderTax[commanderIndex] = next
    return { ...player, commanderTax }
  })
  return { players: appliedDelta === 0 ? players : nextPlayers, appliedDelta }
}

export function undoHistoryEntry(players: Player[], entry: HistoryEntry): Player[] {
  switch (entry.type) {
    case 'life':
      return applyLifeDelta(players, entry.playerId, -entry.delta).players
    case 'poison':
      return applyPoisonDelta(players, entry.playerId, -entry.delta).players
    case 'commanderDamage':
      return applyCommanderDamageDelta(
        players,
        entry.playerId,
        entry.opponentId,
        -entry.delta
      ).players
    case 'commanderTax':
      return applyCommanderTaxDelta(
        players,
        entry.playerId,
        entry.commanderIndex,
        -entry.delta
      ).players
  }
}

export function resetPlayers(players: Player[], startingLife: number): Player[] {
  return players.map(player => ({
    ...player,
    life: startingLife,
    poison: 0,
    commanderDamage: {},
    commanderTax: player.commanderTax.map(() => 0),
  }))
}

export function renamePlayer(players: Player[], playerId: number, name: string): Player[] {
  const safeName = name.slice(0, MAX_PLAYER_NAME_LENGTH)
  return players.map(player =>
    player.id === playerId
      ? { ...player, name: safeName }
      : player
  )
}

export function updatePlayerCommanders(
  players: Player[],
  playerId: number,
  commanders: CommanderCard[]
): Player[] {
  const nextCommanders = commanders.slice(0, 2)
  return players.map(player => {
    if (player.id !== playerId) return player
    const commanderTax = Array.from(
      { length: Math.max(1, nextCommanders.length) },
      (_, index) => player.commanderTax[index] ?? 0
    )
    return { ...player, commanders: nextCommanders, commanderTax }
  })
}

export function isPlayerLethal(player: Player): boolean {
  const worstCommanderDamage = Math.max(0, ...Object.values(player.commanderDamage))
  return player.life <= 0 || player.poison >= 10 || worstCommanderDamage >= 21
}
