<script lang="ts">
  import type { Player } from './types'

  interface Props {
    player: Player
    rotate: boolean
    onChange: (delta: number) => void
    onOpenDetail: () => void
  }

  const { player, rotate, onChange, onOpenDetail }: Props = $props()

  const HOLD_DELAY = 450
  const HOLD_INTERVAL = 150

  let flashDelta = $state<number | null>(null)
  let flashTimeout: ReturnType<typeof setTimeout>

  let holdTimeout: ReturnType<typeof setTimeout> | undefined
  let holdInterval: ReturnType<typeof setInterval> | undefined
  let longPressFired = false

  function bump(delta: number) {
    onChange(delta)
    flashDelta = delta
    clearTimeout(flashTimeout)
    flashTimeout = setTimeout(() => (flashDelta = null), 600)
  }

  function startPress(direction: 1 | -1) {
    longPressFired = false
    holdTimeout = setTimeout(() => {
      longPressFired = true
      bump(direction * 5)
      holdInterval = setInterval(() => bump(direction * 5), HOLD_INTERVAL)
    }, HOLD_DELAY)
  }

  function endPress(direction: 1 | -1) {
    clearTimeout(holdTimeout)
    clearInterval(holdInterval)
    if (!longPressFired) {
      bump(direction)
    }
    longPressFired = false
  }

  function cancelPress() {
    clearTimeout(holdTimeout)
    clearInterval(holdInterval)
    longPressFired = false
  }

  const worstCommanderDamage = $derived(
    Math.max(0, ...Object.values(player.commanderDamage))
  )
</script>

<div
  class="relative flex h-full w-full flex-col overflow-hidden border border-white/10"
  style:background={player.color}
  class:rotate-180={rotate}
>
  <button
    type="button"
    aria-label="Increase {player.name}'s life"
    class="flex flex-1 touch-none items-center justify-center active:bg-white/10"
    onpointerdown={() => startPress(1)}
    onpointerup={() => endPress(1)}
    onpointerleave={cancelPress}
    onpointercancel={cancelPress}
  ></button>
  <button
    type="button"
    aria-label="Decrease {player.name}'s life"
    class="flex flex-1 touch-none items-center justify-center active:bg-black/10"
    onpointerdown={() => startPress(-1)}
    onpointerup={() => endPress(-1)}
    onpointerleave={cancelPress}
    onpointercancel={cancelPress}
  ></button>

  <button
    type="button"
    aria-label="Open details for {player.name}"
    class="pointer-events-auto absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 backdrop-blur transition-colors hover:border-white/30 hover:text-white"
    onclick={(e) => {
      e.stopPropagation()
      onOpenDetail()
    }}
  >
    <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  </button>

  <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
    <span class="text-sm font-semibold tracking-wide text-white/70 uppercase">
      {player.name}
    </span>
    <span class="text-6xl font-bold text-white drop-shadow-lg tabular-nums sm:text-7xl">
      {player.life}
    </span>
    {#if player.poison > 0 || worstCommanderDamage > 0}
      <div class="flex gap-2 text-xs font-semibold">
        {#if player.poison > 0}
          <span class="rounded-full bg-emerald-900/70 px-2 py-0.5 text-emerald-300">
            ☠ {player.poison}
          </span>
        {/if}
        {#if worstCommanderDamage > 0}
          <span
            class="rounded-full px-2 py-0.5 {worstCommanderDamage >= 21
              ? 'bg-red-900/80 text-red-300'
              : 'bg-orange-900/70 text-orange-300'}"
          >
            ⚔ {worstCommanderDamage}
          </span>
        {/if}
      </div>
    {/if}
    {#if flashDelta !== null}
      <span
        class="absolute -bottom-2 text-2xl font-bold {flashDelta > 0 ? 'text-emerald-300' : 'text-red-300'}"
      >
        {flashDelta > 0 ? '+' : ''}{flashDelta}
      </span>
    {/if}
  </div>
</div>
