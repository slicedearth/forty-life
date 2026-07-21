<script lang="ts">
  import { Minus, Plus, Swords, X } from '@lucide/svelte'
  import type { Player } from './types'

  interface Props {
    player: Player
    opponents: Player[]
    rotate: boolean
    onClose: () => void
    onQuickDamage: (opponentId: number, delta: number) => void
  }

  const { player, opponents, rotate, onClose, onQuickDamage }: Props = $props()
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm"
  onclick={(e) => {
    if (e.target === e.currentTarget) onClose()
  }}
  role="presentation"
>
  <div
    class="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-lg border border-white/15 bg-surface text-white shadow-2xl"
    class:rotate-180={rotate}
    role="dialog"
    aria-modal="true"
    aria-labelledby="commander-damage-title"
    tabindex="-1"
  >
    <div class="flex items-center gap-3 border-b border-white/10 px-4 py-3">
      <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-200">
        <Swords size={18} strokeWidth={2.25} />
      </span>
      <div class="min-w-0 flex-1">
        <p id="commander-damage-title" class="truncate text-sm font-semibold text-white">Commander damage</p>
        <p class="truncate text-xs text-white/50">Damage taken by {player.name}</p>
      </div>
      <button
        type="button"
        aria-label="Close"
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white focus-visible:outline-none"
        onclick={onClose}
      >
        <X size={19} strokeWidth={2.25} />
      </button>
    </div>

    <div class="flex flex-col gap-1 overflow-y-auto p-2">
      {#each opponents as opponent (opponent.id)}
        {@const damage = player.commanderDamage[opponent.id] ?? 0}
        {@const thumbnail = opponent.commanders?.[0]?.imageUrl}
        <div class="grid grid-cols-[auto_minmax(0,1fr)_2.5rem_2.5rem_2.5rem] items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5">
          <span
            class="h-9 w-9 flex-shrink-0 rounded-full border border-white/30 bg-cover bg-center"
            style:background-color={thumbnail ? undefined : opponent.color}
            style:background-image={thumbnail ? `url('${thumbnail}')` : undefined}
          ></span>
          <span class="min-w-0 flex-1 truncate text-sm font-medium text-white">{opponent.name}</span>
          <button
            type="button"
            aria-label="Remove one commander damage from {opponent.name}"
            class="damage-step"
            onclick={() => onQuickDamage(opponent.id, -1)}
            disabled={damage === 0}
          >
            <Minus size={15} strokeWidth={2.5} />
          </button>
          <span class="text-center text-lg font-bold tabular-nums {damage >= 21 ? 'text-red-300' : 'text-white'}">
            {damage}
          </span>
          <button
            type="button"
            aria-label="Add one commander damage from {opponent.name}"
            class="damage-step"
            onclick={() => onQuickDamage(opponent.id, 1)}
          >
            <Plus size={15} strokeWidth={2.5} />
          </button>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .damage-step {
    display: flex;
    height: 2.5rem;
    width: 2.5rem;
    align-items: center;
    justify-content: center;
    border: 1px solid rgb(255 255 255 / 0.14);
    border-radius: 9999px;
    color: rgb(255 255 255 / 0.75);
    transition: background-color 150ms, border-color 150ms, color 150ms, opacity 150ms;
  }

  .damage-step:hover,
  .damage-step:focus-visible {
    border-color: rgb(255 255 255 / 0.35);
    background: rgb(255 255 255 / 0.1);
    color: white;
    outline: none;
  }

  .damage-step:disabled {
    opacity: 0.25;
  }
</style>
