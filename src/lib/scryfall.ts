import type { CommanderCard, PartnerMode } from './types'

const API_BASE = 'https://api.scryfall.com'

interface ScryfallCard {
  name: string
  type_line?: string
  oracle_text?: string
  keywords?: string[]
  image_uris?: { art_crop?: string }
  card_faces?: { oracle_text?: string; image_uris?: { art_crop?: string } }[]
}

function extractImage(card: ScryfallCard): string | null {
  return card.image_uris?.art_crop ?? card.card_faces?.[0]?.image_uris?.art_crop ?? null
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
  if (!imageUrl) return null
  const { partnerMode, partnerWithName } = detectPartnering(card)
  return { name: card.name, imageUrl, partnerMode, partnerWithName }
}

async function searchCards(query: string): Promise<CommanderCard[]> {
  const res = await fetch(
    `${API_BASE}/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=name`
  )
  if (!res.ok) return []
  const data = (await res.json()) as { data?: ScryfallCard[] }
  return (data.data ?? []).map(toCommanderCard).filter((c): c is CommanderCard => c !== null)
}

export async function searchCommanders(query: string): Promise<CommanderCard[]> {
  const trimmed = query.trim()
  return trimmed ? searchCards(`is:commander ${trimmed}`) : []
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

export async function searchSecondaryCommander(kind: SecondarySearchKind, query: string): Promise<CommanderCard[]> {
  const trimmed = query.trim()
  if (!trimmed) return []
  return searchCards(`${SECONDARY_FILTERS[kind]} ${trimmed}`)
}

export async function fetchCardByExactName(name: string): Promise<CommanderCard | null> {
  const res = await fetch(`${API_BASE}/cards/named?exact=${encodeURIComponent(name)}`)
  if (!res.ok) return null
  const card = (await res.json()) as ScryfallCard
  return toCommanderCard(card)
}
