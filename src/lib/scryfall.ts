import type { CommanderCard, PartnerMode } from './types'
import { normalizeScryfallImageUrl } from './security'

const API_BASE = 'https://api.scryfall.com'
const REQUEST_TIMEOUT_MS = 8_000
const MAX_RESULTS = 12
const MAX_CACHE_ENTRIES = 40
const responseCache = new Map<string, CommanderCard[]>()

interface ScryfallCard {
  name: string
  type_line?: string
  oracle_text?: string
  keywords?: string[]
  image_uris?: { art_crop?: string }
  card_faces?: { oracle_text?: string; image_uris?: { art_crop?: string } }[]
}

function extractImage(card: ScryfallCard): string | null {
  return normalizeScryfallImageUrl(
    card.image_uris?.art_crop ?? card.card_faces?.[0]?.image_uris?.art_crop
  )
}

function extractOracleText(card: ScryfallCard): string {
  if (card.oracle_text) return card.oracle_text
  return card.card_faces?.map(f => f.oracle_text ?? '').join('\n') ?? ''
}

function detectPartnering(card: ScryfallCard): { partnerMode: PartnerMode; partnerWithName: string | null } {
  const text = extractOracleText(card)
  const typeLine = card.type_line ?? ''

  const partnerWithMatch = text.match(/Partner with ([^(]+)\(/)
  if (partnerWithMatch) {
    return { partnerMode: 'partner-with', partnerWithName: partnerWithMatch[1].trim() }
  }
  if (/choose a background/i.test(text)) return { partnerMode: 'background', partnerWithName: null }
  if (/doctor's companion/i.test(text)) return { partnerMode: 'doctors-companion', partnerWithName: null }
  if (typeLine.includes('Time Lord Doctor')) return { partnerMode: 'time-lord-doctor', partnerWithName: null }
  if (/friends forever/i.test(text)) return { partnerMode: 'friends-forever', partnerWithName: null }
  if (card.keywords?.includes('Partner') || /^partner\b/i.test(text)) {
    return { partnerMode: 'partner', partnerWithName: null }
  }
  return { partnerMode: null, partnerWithName: null }
}

function toCommanderCard(card: ScryfallCard): CommanderCard | null {
  const imageUrl = extractImage(card)
  if (!imageUrl || typeof card.name !== 'string' || !card.name.trim()) return null
  const { partnerMode, partnerWithName } = detectPartnering(card)
  return { name: card.name.slice(0, 200), imageUrl, partnerMode, partnerWithName }
}

function parseCard(value: unknown): ScryfallCard | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const card = value as Record<string, unknown>
  if (typeof card.name !== 'string') return null
  return card as unknown as ScryfallCard
}

async function fetchWithTimeout(url: string, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (signal?.aborted) abort()
  signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(abort, REQUEST_TIMEOUT_MS)

  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}

function cacheResults(key: string, results: CommanderCard[]): void {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value
    if (oldestKey) responseCache.delete(oldestKey)
  }
  responseCache.set(key, results)
}

async function searchCards(query: string, signal?: AbortSignal): Promise<CommanderCard[]> {
  const url = `${API_BASE}/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=name`
  const cached = responseCache.get(url)
  if (cached) return cached

  const res = await fetchWithTimeout(url, signal)
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`Scryfall search failed with status ${res.status}`)
  const payload: unknown = await res.json()
  if (typeof payload !== 'object' || payload === null || !('data' in payload) || !Array.isArray(payload.data)) {
    throw new Error('Scryfall returned an invalid search response')
  }
  const results = payload.data
    .slice(0, MAX_RESULTS)
    .map(parseCard)
    .filter((card): card is ScryfallCard => card !== null)
    .map(toCommanderCard)
    .filter((card): card is CommanderCard => card !== null)
  cacheResults(url, results)
  return results
}

export async function searchCommanders(query: string, signal?: AbortSignal): Promise<CommanderCard[]> {
  const trimmed = query.trim()
  return trimmed ? searchCards(`is:commander ${trimmed}`, signal) : []
}

/** What kind of card a player's second commander slot should search for, based on the first commander's ability. */
export type SecondarySearchKind = 'background' | 'time-lord-doctor' | 'doctors-companion' | 'partner' | 'friends-forever'

const SECONDARY_FILTERS: Record<SecondarySearchKind, string> = {
  background: 'type:background',
  'time-lord-doctor': 't:"Time Lord Doctor"',
  'doctors-companion': `o:"Doctor's companion"`,
  partner: 'is:commander keyword:partner',
  'friends-forever': 'is:commander o:"friends forever"',
}

export function secondaryKindFor(partnerMode: PartnerMode): SecondarySearchKind | null {
  switch (partnerMode) {
    case 'background':
      return 'background'
    case 'time-lord-doctor':
      return 'doctors-companion'
    case 'doctors-companion':
      return 'time-lord-doctor'
    case 'partner':
      return 'partner'
    case 'friends-forever':
      return 'friends-forever'
    default:
      return null
  }
}

export async function searchSecondaryCommander(
  kind: SecondarySearchKind,
  query: string,
  signal?: AbortSignal
): Promise<CommanderCard[]> {
  const trimmed = query.trim()
  if (!trimmed) return []
  return searchCards(`${SECONDARY_FILTERS[kind]} ${trimmed}`, signal)
}

export async function fetchCardByExactName(name: string, signal?: AbortSignal): Promise<CommanderCard | null> {
  const res = await fetchWithTimeout(`${API_BASE}/cards/named?exact=${encodeURIComponent(name)}`, signal)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Scryfall card lookup failed with status ${res.status}`)
  const card = parseCard(await res.json())
  if (!card) throw new Error('Scryfall returned an invalid card response')
  return toCommanderCard(card)
}

export function clearScryfallCache(): void {
  responseCache.clear()
}
