<script lang="ts">
  import type { Player } from './types'

  interface Props {
    player: Player
    rotate: boolean
    color: string
    onChange: (delta: number) => void
  }

  const { player, rotate, color, onChange }: Props = $props()

  let flashDelta = $state<number | null>(null)
  let flashTimeout: ReturnType<typeof setTimeout>

  function bump(delta: number) {
    onChange(delta)
    flashDelta = delta
    clearTimeout(flashTimeout)
    flashTimeout = setTimeout(() => (flashDelta = null), 600)
  }
</script>

<div
  class="relative flex h-full w-full flex-col overflow-hidden border border-white/10"
  style:background={color}
  class:rotate-180={rotate}
>
  <button
    type="button"
    aria-label="Increase {player.name}'s life"
    class="flex flex-1 items-center justify-center active:bg-white/10"
    onclick={() => bump(1)}
  ></button>
  <button
    type="button"
    aria-label="Decrease {player.name}'s life"
    class="flex flex-1 items-center justify-center active:bg-black/10"
    onclick={() => bump(-1)}
  ></button>

  <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
    <span class="text-sm font-semibold tracking-wide text-white/70 uppercase">
      {player.name}
    </span>
    <span class="text-6xl font-bold text-white drop-shadow-lg tabular-nums sm:text-7xl">
      {player.life}
    </span>
    {#if flashDelta !== null}
      <span
        class="absolute -bottom-2 text-2xl font-bold {flashDelta > 0 ? 'text-emerald-300' : 'text-red-300'}"
      >
        {flashDelta > 0 ? '+1' : '-1'}
      </span>
    {/if}
  </div>
</div>
