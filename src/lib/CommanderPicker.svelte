<script lang="ts">
  import type { CommanderCard, PartnerMode } from './types'
  import {
    searchCommanders,
    searchSecondaryCommander,
    secondaryKindFor,
    fetchCardByExactName,
    type SecondarySearchKind,
  } from './scryfall'

  interface Props {
    value: CommanderCard[]
    onChange: (cards: CommanderCard[]) => void
  }

  const { value, onChange }: Props = $props()

  const PARTNER_LABELS: Record<Exclude<PartnerMode, null>, string> = {
    partner: 'Partner',
    'partner-with': 'Partner with',
    background: 'Background',
    'friends-forever': 'Friends forever',
    'doctors-companion': "Doctor's companion",
    'time-lord-doctor': 'Time Lord Doctor',
  }

  const SECONDARY_PLACEHOLDERS: Record<SecondarySearchKind, string> = {
    background: 'Search background (optional)…',
    'time-lord-doctor': 'Search Time Lord Doctor (optional)…',
    'doctors-companion': "Search Doctor's companion (optional)…",
    partner: 'Search partner (optional)…',
    'friends-forever': 'Search partner (optional)…',
  }

  let primaryQuery = $state(value[0]?.name ?? '')
  let primarySuggestions = $state<CommanderCard[]>([])
  let primaryLoading = $state(false)
  let primaryDebounce: ReturnType<typeof setTimeout>

  let secondaryQuery = $state(value[1]?.name ?? '')
  let secondarySuggestions = $state<CommanderCard[]>([])
  let secondaryLoading = $state(false)
  let secondaryDebounce: ReturnType<typeof setTimeout>

  const primary = $derived(value[0] ?? null)
  const secondary = $derived(value[1] ?? null)
  const secondaryKind = $derived(secondaryKindFor(primary?.partnerMode ?? null))

  function onPrimaryInput() {
    clearTimeout(primaryDebounce)
    if (!primaryQuery.trim()) {
      primarySuggestions = []
      return
    }
    primaryDebounce = setTimeout(async () => {
      primarySuggestions = await searchCommanders(primaryQuery)
    }, 300)
  }

  async function pickPrimary(card: CommanderCard) {
    primaryQuery = card.name
    primarySuggestions = []
    secondaryQuery = ''
    secondarySuggestions = []

    if (card.partnerMode === 'partner-with' && card.partnerWithName) {
      secondaryLoading = true
      const partner = await fetchCardByExactName(card.partnerWithName)
      secondaryLoading = false
      secondaryQuery = partner?.name ?? ''
      onChange(partner ? [card, partner] : [card])
    } else {
      onChange([card])
    }
  }

  function clearPrimary() {
    primaryQuery = ''
    primarySuggestions = []
    secondaryQuery = ''
    secondarySuggestions = []
    onChange([])
  }

  function onSecondaryInput() {
    clearTimeout(secondaryDebounce)
    if (!secondaryQuery.trim() || !secondaryKind) {
      secondarySuggestions = []
      return
    }
    const kind = secondaryKind
    secondaryDebounce = setTimeout(async () => {
      secondarySuggestions = await searchSecondaryCommander(kind, secondaryQuery)
    }, 300)
  }

  function pickSecondary(card: CommanderCard) {
    secondaryQuery = card.name
    secondarySuggestions = []
    if (primary) onChange([primary, card])
  }

  function clearSecondary() {
    secondaryQuery = ''
    secondarySuggestions = []
    if (primary) onChange([primary])
  }
</script>

<div class="flex flex-col gap-2">
  <div class="relative">
    <div class="flex items-center gap-2">
      {#if primary}
        <img src={primary.imageUrl} alt={primary.name} class="h-9 w-9 flex-shrink-0 rounded-md object-cover" />
      {/if}
      <input
        type="text"
        bind:value={primaryQuery}
        oninput={onPrimaryInput}
        placeholder="Search commander…"
        class="min-w-0 flex-1 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-accent focus:outline-none"
      />
      {#if primaryLoading}
        <span class="flex-shrink-0 text-xs text-gray-500">…</span>
      {:else if primaryQuery}
        <button
          type="button"
          aria-label="Clear commander"
          class="flex-shrink-0 text-xs text-gray-500 hover:text-white"
          onclick={clearPrimary}
        >
          ✕
        </button>
      {/if}
    </div>

    {#if primarySuggestions.length > 0}
      <ul class="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-surface shadow-xl">
        {#each primarySuggestions as card (card.name)}
          <li>
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
              onmousedown={(e) => {
                e.preventDefault()
                pickPrimary(card)
              }}
            >
              <span class="flex-1 truncate">{card.name}</span>
              {#if card.partnerMode}
                <span class="flex-shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                  {PARTNER_LABELS[card.partnerMode]}
                </span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  {#if primary?.partnerMode === 'partner-with'}
    <div class="flex items-center gap-2 pl-2 text-xs text-gray-400">
      {#if secondaryLoading}
        Loading partner…
      {:else if secondary}
        <img src={secondary.imageUrl} alt={secondary.name} class="h-6 w-6 flex-shrink-0 rounded object-cover" />
        <span>Partners with {secondary.name}</span>
        <button type="button" aria-label="Remove partner" class="text-gray-500 hover:text-white" onclick={clearSecondary}>
          ✕
        </button>
      {/if}
    </div>
  {:else if secondaryKind}
    <div class="relative pl-2">
      <div class="flex items-center gap-2">
        {#if secondary}
          <img src={secondary.imageUrl} alt={secondary.name} class="h-8 w-8 flex-shrink-0 rounded-md object-cover" />
        {/if}
        <input
          type="text"
          bind:value={secondaryQuery}
          oninput={onSecondaryInput}
          placeholder={SECONDARY_PLACEHOLDERS[secondaryKind]}
          class="min-w-0 flex-1 rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-sm text-white placeholder:text-gray-500 focus:border-accent focus:outline-none"
        />
        {#if secondaryQuery}
          <button
            type="button"
            aria-label="Clear partner"
            class="flex-shrink-0 text-xs text-gray-500 hover:text-white"
            onclick={clearSecondary}
          >
            ✕
          </button>
        {/if}
      </div>

      {#if secondarySuggestions.length > 0}
        <ul class="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-surface shadow-xl">
          {#each secondarySuggestions as card (card.name)}
            <li>
              <button
                type="button"
                class="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                onmousedown={(e) => {
                  e.preventDefault()
                  pickSecondary(card)
                }}
              >
                {card.name}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>
