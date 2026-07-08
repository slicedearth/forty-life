<script lang="ts">
  import type { Player } from './types'

  interface Props {
    player: Player
    opponents: Player[]
    rotate: boolean
    onClose: () => void
    onQuickDamage: (opponentId: number, delta: number) => void
  }

  const { player, opponents, rotate, onClose, onQuickDamage }: Props = $props()

  const HOLD_DELAY = 450
  const HOLD_INTERVAL = 150

  interface PipTimer {
    timeout?: ReturnType<typeof setTimeout>
    interval?: ReturnType<typeof setInterval>
    fired: boolean
  }

  const timers = new Map<number, PipTimer>()

  function startPress(opponentId: number) {
    const timer: PipTimer = { fired: false }
    timers.set(opponentId, timer)
    timer.timeout = setTimeout(() => {
      timer.fired = true
      onQuickDamage(opponentId, 5)
      timer.interval = setInterval(() => onQuickDamage(opponentId, 5), HOLD_INTERVAL)
    }, HOLD_DELAY)
  }

  function endPress(opponentId: number) {
    const timer = timers.get(opponentId)
    if (!timer) return
    clearTimeout(timer.timeout)
    clearInterval(timer.interval)
    if (!timer.fired) onQuickDamage(opponentId, 1)
    timers.delete(opponentId)
  }

  function cancelPress(opponentId: number) {
    const timer = timers.get(opponentId)
    if (!timer) return
    clearTimeout(timer.timeout)
    clearInterval(timer.interval)
    timers.delete(opponentId)
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
  onclick={onClose}
  role="presentation"
>
  <div
    class="mx-4 flex max-h-[85vh] w-full max-w-xs flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-surface p-4 text-white shadow-2xl"
    class:rotate-180={rotate}
    onclick={(e) => e.stopPropagation()}
    role="presentation"
  >
    <div class="flex items-center justify-between gap-2">
      <p class="text-sm font-semibold text-white">Commander damage to {player.name}</p>
      <button
        type="button"
        aria-label="Close"
        class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 hover:border-white/30 hover:text-white"
        onclick={onClose}
      >
        ✕
      </button>
    </div>
    <p class="text-xs text-gray-400">Tap to add 1, hold to add 5</p>

    <div class="flex flex-col gap-1.5">
      {#each opponents as opponent (opponent.id)}
        {@const damage = player.commanderDamage[opponent.id] ?? 0}
        {@const thumbnail = opponent.commanders?.[0]?.imageUrl}
        <button
          type="button"
          aria-label="Deal commander damage from {opponent.name}"
          class="flex touch-none items-center gap-3 rounded-xl border border-white/10 p-2 text-left hover:bg-white/10"
          onpointerdown={() => startPress(opponent.id)}
          onpointerup={() => endPress(opponent.id)}
          onpointerleave={() => cancelPress(opponent.id)}
          onpointercancel={() => cancelPress(opponent.id)}
        >
          <span
            class="h-8 w-8 flex-shrink-0 rounded-full border border-white/40 bg-cover bg-center"
            style:background-color={thumbnail ? undefined : opponent.color}
            style:background-image={thumbnail ? `url('${thumbnail}')` : undefined}
          ></span>
          <span class="min-w-0 flex-1 truncate text-sm font-medium text-white">{opponent.name}</span>
          <span class="text-lg font-bold tabular-nums {damage >= 21 ? 'text-red-400' : 'text-white/80'}">
            {damage}
          </span>
        </button>
      {/each}
    </div>
  </div>
</div>
