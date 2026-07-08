<script lang="ts">
  import type { Player } from './types'

  interface Props {
    player: Player
    opponents: Player[]
    rotate: boolean
    onClose: () => void
    onLifeChange: (delta: number) => void
    onPoisonChange: (delta: number) => void
    onCommanderDamageChange: (opponentId: number, delta: number) => void
    onRename: (name: string) => void
  }

  const { player, opponents, rotate, onClose, onLifeChange, onPoisonChange, onCommanderDamageChange, onRename }: Props =
    $props()
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
  onclick={onClose}
  role="presentation"
>
  <div
    class="mx-4 flex max-h-[85vh] w-full max-w-sm flex-col gap-5 overflow-y-auto rounded-2xl border border-white/10 bg-surface p-5 text-white shadow-2xl"
    class:rotate-180={rotate}
    onclick={(e) => e.stopPropagation()}
    role="presentation"
  >
    <div class="flex items-center justify-between gap-2">
      <input
        type="text"
        value={player.name}
        placeholder="Player name"
        class="min-w-0 flex-1 rounded-lg border border-white/10 bg-transparent px-3 py-2 font-semibold text-white placeholder:text-gray-500 focus:border-accent focus:outline-none"
        oninput={(e) => onRename((e.target as HTMLInputElement).value)}
      />
      <button
        type="button"
        aria-label="Close"
        class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 hover:border-white/30 hover:text-white"
        onclick={onClose}
      >
        ✕
      </button>
    </div>

    <section>
      <div class="mb-2 flex items-center justify-between">
        <p class="text-sm font-medium text-gray-400">Life</p>
        <p class="text-2xl font-bold tabular-nums">{player.life}</p>
      </div>
      <div class="grid grid-cols-4 gap-2">
        <button type="button" class="life-btn" onclick={() => onLifeChange(-5)}>-5</button>
        <button type="button" class="life-btn" onclick={() => onLifeChange(-1)}>-1</button>
        <button type="button" class="life-btn" onclick={() => onLifeChange(1)}>+1</button>
        <button type="button" class="life-btn" onclick={() => onLifeChange(5)}>+5</button>
      </div>
    </section>

    <section>
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
      <section>
        <p class="mb-2 text-sm font-medium text-gray-400">Commander damage taken (21 is lethal)</p>
        <div class="flex flex-col gap-2">
          {#each opponents as opponent (opponent.id)}
            {@const damage = player.commanderDamage[opponent.id] ?? 0}
            <div class="flex items-center gap-3 rounded-lg border border-white/10 p-2">
              <span class="h-3 w-3 flex-shrink-0 rounded-full" style:background={opponent.color}></span>
              <span class="min-w-0 flex-1 truncate text-left text-sm font-medium">{opponent.name}</span>
              <span class="w-6 text-center text-lg font-bold tabular-nums {damage >= 21 ? 'text-red-400' : ''}">
                {damage}
              </span>
              <button
                type="button"
                class="life-btn !px-3"
                onclick={() => onCommanderDamageChange(opponent.id, -1)}
              >
                -1
              </button>
              <button
                type="button"
                class="life-btn !px-3"
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
    border-radius: 0.75rem;
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
