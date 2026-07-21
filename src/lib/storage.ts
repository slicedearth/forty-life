import { PLAYER_COLORS, type CommanderCard, type PartnerMode, type Player } from './types'
import { normalizePlayerName, normalizeScryfallImageUrl } from './security'

export const STORAGE_KEY = 'mtg-life-counter'
export const STORAGE_VERSION = 1

const MIN_PLAYERS = 2
const MAX_PLAYERS = 6
const MAX_TRACKED_VALUE = 9999
const MAX_CARD_NAME_LENGTH = 200
const PARTNER_MODES: PartnerMode[] = [
  null,
  'partner',
  'partner-with',
  'background',
  'friends-forever',
  'doctors-companion',
  'time-lord-doctor',
]

type StorageReader = Pick<Storage, 'getItem'>
type StorageWriter = Pick<Storage, 'setItem'>
type StorageRemover = Pick<Storage, 'removeItem'>

export interface SavedState {
  players: Player[]
  startingLife: number
  monarchId: number | null
  initiativeId: number | null
  dayNight: 'day' | 'night'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function boundedInteger(value: unknown, fallback: number, min = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(MAX_TRACKED_VALUE, Math.max(min, Math.trunc(value)))
}

function parseCommander(value: unknown): CommanderCard | null {
  if (!isRecord(value) || typeof value.name !== 'string') return null
  const imageUrl = normalizeScryfallImageUrl(value.imageUrl)
  if (!imageUrl) return null

  const partnerMode = PARTNER_MODES.includes(value.partnerMode as PartnerMode)
    ? (value.partnerMode as PartnerMode)
    : null
  const partnerWithName =
    typeof value.partnerWithName === 'string'
      ? value.partnerWithName.slice(0, MAX_CARD_NAME_LENGTH).trim() || null
      : null

  return {
    name: value.name.slice(0, MAX_CARD_NAME_LENGTH).trim(),
    imageUrl,
    partnerMode,
    partnerWithName,
  }
}

function parsePlayer(value: unknown, index: number, startingLife: number, playerCount: number): Player | null {
  if (!isRecord(value)) return null

  const commanders = Array.isArray(value.commanders)
    ? value.commanders.slice(0, 2).map(parseCommander).filter((card): card is CommanderCard => card !== null)
    : []
  const rawTax = Array.isArray(value.commanderTax) ? value.commanderTax : []
  const commanderTax = Array.from({ length: Math.max(1, commanders.length) }, (_, taxIndex) =>
    boundedInteger(rawTax[taxIndex], 0)
  )

  const commanderDamage: Record<number, number> = {}
  if (isRecord(value.commanderDamage)) {
    for (const [opponentKey, damage] of Object.entries(value.commanderDamage)) {
      const opponentId = Number(opponentKey)
      if (Number.isInteger(opponentId) && opponentId >= 0 && opponentId < playerCount && opponentId !== index) {
        commanderDamage[opponentId] = boundedInteger(damage, 0)
      }
    }
  }

  const color = typeof value.color === 'string' && PLAYER_COLORS.includes(value.color)
    ? value.color
    : PLAYER_COLORS[index % PLAYER_COLORS.length]

  return {
    id: index,
    name: normalizePlayerName(value.name, `Player ${index + 1}`),
    color,
    life: boundedInteger(value.life, startingLife, -MAX_TRACKED_VALUE),
    poison: boundedInteger(value.poison, 0),
    commanderTax,
    commanderDamage,
    commanders,
  }
}

function validHolderId(value: unknown, players: Player[]): number | null {
  return typeof value === 'number' && players.some(player => player.id === value) ? value : null
}

export function parseSavedState(raw: string | null): SavedState | null {
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null
    if ('version' in parsed && parsed.version !== STORAGE_VERSION) return null
    const rawPlayers = parsed.players
    if (!Array.isArray(rawPlayers) || rawPlayers.length < MIN_PLAYERS || rawPlayers.length > MAX_PLAYERS) {
      return null
    }

    const startingLife = boundedInteger(parsed.startingLife, 40, 1)
    const players = rawPlayers.map((player, index) =>
      parsePlayer(player, index, startingLife, rawPlayers.length)
    )
    if (players.some(player => player === null)) return null
    const validPlayers = players as Player[]

    return {
      players: validPlayers,
      startingLife,
      monarchId: validHolderId(parsed.monarchId, validPlayers),
      initiativeId: validHolderId(parsed.initiativeId, validPlayers),
      dayNight: parsed.dayNight === 'night' ? 'night' : 'day',
    }
  } catch {
    return null
  }
}

export function loadSavedState(storage: StorageReader = localStorage): SavedState | null {
  try {
    return parseSavedState(storage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function saveSavedState(state: SavedState, storage: StorageWriter = localStorage): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, ...state }))
    return true
  } catch {
    return false
  }
}

export function clearSavedState(storage: StorageRemover = localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
