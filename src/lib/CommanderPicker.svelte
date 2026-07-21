<script lang="ts">
  import { LoaderCircle, X } from '@lucide/svelte'
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

  let primaryQuery = $state('')
  let primarySuggestions = $state<CommanderCard[]>([])
  let primaryLoading = $state(false)
  let primaryDebounce: ReturnType<typeof setTimeout>
  let primaryRequest = 0

  let secondaryQuery = $state('')
  let secondarySuggestions = $state<CommanderCard[]>([])
  let secondaryLoading = $state(false)
  let secondaryDebounce: ReturnType<typeof setTimeout>
  let secondaryRequest = 0

  const primary = $derived(value[0] ?? null)
  const secondary = $derived(value[1] ?? null)
  const secondaryKind = $derived(secondaryKindFor(primary?.partnerMode ?? null))

  $effect(() => {
    primaryQuery = value[0]?.name ?? ''
    secondaryQuery = value[1]?.name ?? ''
  })

  function onPrimaryInput() {
    clearTimeout(primaryDebounce)
    const request = ++primaryRequest
    if (!primaryQuery.trim()) {
      primarySuggestions = []
      primaryLoading = false
      return
    }
    primaryLoading = true
    primaryDebounce = setTimeout(async () => {
      const results = await searchCommanders(primaryQuery)
      if (request !== primaryRequest) return
      primarySuggestions = results
      primaryLoading = false
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
    primaryRequest++
    primaryLoading = false
    primarySuggestions = []
    secondaryQuery = ''
    secondarySuggestions = []
    onChange([])
  }

  function onSecondaryInput() {
    clearTimeout(secondaryDebounce)
    const request = ++secondaryRequest
    if (!secondaryQuery.trim() || !secondaryKind) {
      secondarySuggestions = []
      secondaryLoading = false
      return
    }
    const kind = secondaryKind
    secondaryLoading = true
    secondaryDebounce = setTimeout(async () => {
      const results = await searchSecondaryCommander(kind, secondaryQuery)
      if (request !== secondaryRequest) return
      secondarySuggestions = results
      secondaryLoading = false
    }, 300)
  }

  function pickSecondary(card: CommanderCard) {
    secondaryQuery = card.name
    secondarySuggestions = []
    if (primary) onChange([primary, card])
  }

  function clearSecondary() {
    secondaryQuery = ''
    secondaryRequest++
    secondaryLoading = false
    secondarySuggestions = []
    if (primary) onChange([primary])
  }
</script>

<div class="flex flex-col gap-2">
  <div class="relative">
    <div class="flex items-center gap-2">
      {#if primary}
        <img src={primary.imageUrl} alt="" class="h-10 w-10 flex-shrink-0 rounded-md object-cover" />
      {/if}
      <input
        type="text"
        bind:value={primaryQuery}
        oninput={onPrimaryInput}
        aria-label="Search for a commander"
        autocomplete="off"
        placeholder="Search commander…"
        class="min-h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-accent focus:outline-none"
      />
      {#if primaryLoading}
        <LoaderCircle size={16} class="flex-shrink-0 animate-spin text-gray-500" aria-label="Searching" />
      {:else if primaryQuery}
        <button
          type="button"
          aria-label="Clear commander"
          class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-accent"
          onclick={clearPrimary}
        >
          <X size={16} strokeWidth={2.25} />
        </button>
      {/if}
    </div>

    {#if primarySuggestions.length > 0}
      <ul class="absolute inset-x-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-white/15 bg-surface shadow-xl">
        {#each primarySuggestions as card (card.name)}
          <li>
            <button
              type="button"
              class="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
              onclick={() => pickPrimary(card)}
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
        <img src={secondary.imageUrl} alt="" class="h-7 w-7 flex-shrink-0 rounded object-cover" />
        <span class="min-w-0 flex-1 truncate">Partners with {secondary.name}</span>
        <button type="button" aria-label="Remove partner" class="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-white/10 hover:text-white" onclick={clearSecondary}>
          <X size={14} strokeWidth={2.25} />
        </button>
      {/if}
    </div>
  {:else if secondaryKind}
    <div class="relative pl-2">
      <div class="flex items-center gap-2">
        {#if secondary}
          <img src={secondary.imageUrl} alt="" class="h-9 w-9 flex-shrink-0 rounded-md object-cover" />
        {/if}
        <input
          type="text"
          bind:value={secondaryQuery}
          oninput={onSecondaryInput}
          aria-label={SECONDARY_PLACEHOLDERS[secondaryKind]}
          autocomplete="off"
          placeholder={SECONDARY_PLACEHOLDERS[secondaryKind]}
          class="min-h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-accent focus:outline-none"
        />
        {#if secondaryQuery}
          <button
            type="button"
            aria-label="Clear partner"
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-white/10 hover:text-white"
            onclick={clearSecondary}
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        {/if}
      </div>

      {#if secondarySuggestions.length > 0}
        <ul class="absolute inset-x-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-white/15 bg-surface shadow-xl">
          {#each secondarySuggestions as card (card.name)}
            <li>
              <button
                type="button"
                class="min-h-11 w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
                onclick={() => pickSecondary(card)}
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
