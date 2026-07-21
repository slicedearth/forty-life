<script lang="ts">
  import { Crown, KeyRound, X } from '@lucide/svelte'
  import type { CommanderCard, Player } from './types'
  import CommanderPicker from './CommanderPicker.svelte'

  interface Props {
    player: Player
    opponents: Player[]
    rotate: boolean
    isMonarch: boolean
    isInitiative: boolean
    onClose: () => void
    onLifeChange: (delta: number) => void
    onPoisonChange: (delta: number) => void
    onCommanderDamageChange: (opponentId: number, delta: number) => void
    onRename: (name: string) => void
    onCommandersChange: (cards: CommanderCard[]) => void
    onSetMonarch: () => void
    onSetInitiative: () => void
  }

  const {
    player,
    opponents,
    rotate,
    isMonarch,
    isInitiative,
    onClose,
    onLifeChange,
    onPoisonChange,
    onCommanderDamageChange,
    onRename,
    onCommandersChange,
    onSetMonarch,
    onSetInitiative,
  }: Props = $props()
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm"
  onclick={onClose}
  role="presentation"
>
  <div
    class="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-y-auto rounded-lg border border-white/15 bg-surface p-4 text-white shadow-2xl sm:p-5"
    class:rotate-180={rotate}
    onclick={(e) => e.stopPropagation()}
    role="presentation"
  >
    <div class="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
      <input
        type="text"
        value={player.name}
        placeholder="Player name"
        class="min-h-11 min-w-0 flex-1 rounded-lg border border-white/15 bg-black/15 px-3 py-2 font-semibold text-white placeholder:text-gray-500 focus:border-accent focus:outline-none"
        oninput={(e) => onRename((e.target as HTMLInputElement).value)}
      />
      <button
        type="button"
        aria-label="Close"
        class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white focus-visible:outline-none"
        onclick={onClose}
      >
        <X size={19} strokeWidth={2.25} />
      </button>
    </div>

    <section class="pt-1">
      <p class="mb-2 text-sm font-medium text-gray-400">Monarch &amp; Initiative</p>
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="life-btn {isMonarch ? '!border-amber-300 !bg-amber-500/20 !text-amber-300' : ''}"
          onclick={onSetMonarch}
        >
          <Crown size={16} strokeWidth={2.25} /> {isMonarch ? 'Monarch' : 'Take monarch'}
        </button>
        <button
          type="button"
          class="life-btn {isInitiative ? '!border-violet-300 !bg-violet-500/20 !text-violet-300' : ''}"
          onclick={onSetInitiative}
        >
          <KeyRound size={16} strokeWidth={2.25} /> {isInitiative ? 'Initiative' : 'Take initiative'}
        </button>
      </div>
    </section>

    <section class="border-t border-white/10 pt-4">
      <p class="mb-2 text-sm font-medium text-gray-400">Commander art</p>
      <CommanderPicker value={player.commanders} onChange={onCommandersChange} />
    </section>

    <section class="border-t border-white/10 pt-4">
      <div class="mb-2 flex items-center justify-between">
        <p class="text-sm font-medium text-gray-400">Life</p>
        <p class="text-2xl font-bold tabular-nums">{player.life}</p>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <button type="button" class="life-btn" onclick={() => onLifeChange(-10)}>-10</button>
        <button type="button" class="life-btn" onclick={() => onLifeChange(-5)}>-5</button>
        <button type="button" class="life-btn" onclick={() => onLifeChange(-1)}>-1</button>
        <button type="button" class="life-btn" onclick={() => onLifeChange(1)}>+1</button>
        <button type="button" class="life-btn" onclick={() => onLifeChange(5)}>+5</button>
        <button type="button" class="life-btn" onclick={() => onLifeChange(10)}>+10</button>
      </div>
    </section>

    <section class="border-t border-white/10 pt-4">
      <div class="mb-2 flex items-center justify-between">
        <p class="text-sm font-medium text-gray-400">Poison (10 is lethal)</p>
        <p class="text-2xl font-bold tabular-nums {player.poison >= 10 ? 'text-emerald-400' : ''}">
          {player.poison}
        </p>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button type="button" class="life-btn" onclick={() => onPoisonChange(-1)}>-1</button>
        <button type="button" class="life-btn" onclick={() => onPoisonChange(1)}>+1</button>
      </div>
    </section>

    {#if opponents.length > 0}
      <section class="border-t border-white/10 pt-4">
        <p class="mb-2 text-sm font-medium text-gray-400">Commander damage taken (21 is lethal)</p>
        <div class="flex flex-col gap-2">
          {#each opponents as opponent (opponent.id)}
            {@const damage = player.commanderDamage[opponent.id] ?? 0}
            <div class="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5">
              <span
                class="h-8 w-8 flex-shrink-0 rounded-full border border-white/25 bg-cover bg-center"
                style:background-color={opponent.commanders?.[0]?.imageUrl ? undefined : opponent.color}
                style:background-image={opponent.commanders?.[0]?.imageUrl
                  ? `url('${opponent.commanders[0].imageUrl}')`
                  : undefined}
              ></span>
              <span class="min-w-0 flex-1 truncate text-left text-sm font-medium">{opponent.name}</span>
              <span class="w-6 text-center text-lg font-bold tabular-nums {damage >= 21 ? 'text-red-400' : ''}">
                {damage}
              </span>
              <button
                type="button"
                class="life-btn !h-10 !w-10 !p-0"
                onclick={() => onCommanderDamageChange(opponent.id, -1)}
              >
                -1
              </button>
              <button
                type="button"
                class="life-btn !h-10 !w-10 !p-0"
                onclick={() => onCommanderDamageChange(opponent.id, 1)}
              >
                +1
              </button>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  </div>
</div>

<style>
  .life-btn {
    display: flex;
    min-height: 2.75rem;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 0.5rem 0;
    font-weight: 600;
    transition: border-color 0.15s;
  }
  .life-btn:hover {
    border-color: rgba(255, 255, 255, 0.35);
  }
  .life-btn:active {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
