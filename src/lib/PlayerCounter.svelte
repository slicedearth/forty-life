<script lang="ts">
  import type { Player } from './types'

  interface Props {
    player: Player
    rotate: boolean
    opponents: Player[]
    isMonarch: boolean
    isInitiative: boolean
    onChange: (delta: number) => void
    onOpenDetail: () => void
    onQuickDamage: (opponentId: number, delta: number) => void
    onOpenDamageMenu: () => void
  }

  const {
    player,
    rotate,
    opponents,
    isMonarch,
    isInitiative,
    onChange,
    onOpenDetail,
    onQuickDamage,
    onOpenDamageMenu,
  }: Props = $props()

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

  interface PipTimer {
    timeout?: ReturnType<typeof setTimeout>
    interval?: ReturnType<typeof setInterval>
    fired: boolean
  }

  const pipTimers = new Map<number, PipTimer>()

  function startPipPress(opponentId: number) {
    const timer: PipTimer = { fired: false }
    pipTimers.set(opponentId, timer)
    timer.timeout = setTimeout(() => {
      timer.fired = true
      onQuickDamage(opponentId, 5)
      timer.interval = setInterval(() => onQuickDamage(opponentId, 5), HOLD_INTERVAL)
    }, HOLD_DELAY)
  }

  function endPipPress(opponentId: number) {
    const timer = pipTimers.get(opponentId)
    if (!timer) return
    clearTimeout(timer.timeout)
    clearInterval(timer.interval)
    if (!timer.fired) onQuickDamage(opponentId, 1)
    pipTimers.delete(opponentId)
  }

  function cancelPipPress(opponentId: number) {
    const timer = pipTimers.get(opponentId)
    if (!timer) return
    clearTimeout(timer.timeout)
    clearInterval(timer.interval)
    pipTimers.delete(opponentId)
  }

  const worstCommanderDamage = $derived(
    Math.max(0, ...Object.values(player.commanderDamage))
  )

  const lifeDigits = $derived(player.life.toString().replace('-', '').length)
  const lifeFontSize = $derived(
    lifeDigits >= 3
      ? 'clamp(1.5rem, min(7vw, 5vh), 3.25rem)'
      : 'clamp(2rem, min(9vw, 6.5vh), 4.5rem)'
  )
  const pmFontSize = 'clamp(1rem, min(5vw, 4vh), 2.25rem)'
</script>

<div
  class="relative flex h-full w-full flex-row overflow-hidden border-4"
  style:background={player.color}
  style:border-color={player.color}
  class:rotate-180={rotate}
>
  {#if player.commanders?.length}
    <div class="pointer-events-none absolute inset-0 flex">
      {#each player.commanders as commander (commander.name)}
        <div class="flex-1 bg-cover bg-center" style:background-image="url('{commander.imageUrl}')"></div>
      {/each}
    </div>
    <div class="pointer-events-none absolute inset-0 bg-black/45"></div>
  {/if}

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
    aria-label="Increase {player.name}'s life"
    class="flex flex-1 touch-none items-center justify-center active:bg-white/10"
    onpointerdown={() => startPress(1)}
    onpointerup={() => endPress(1)}
    onpointerleave={cancelPress}
    onpointercancel={cancelPress}
  ></button>

  <button
    type="button"
    aria-label="Open details for {player.name}"
    class="pointer-events-auto absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 backdrop-blur transition-colors hover:border-white/30 hover:text-white"
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

  {#if opponents.length > 0}
    <div
      class="pointer-events-auto absolute bottom-2 left-2 hidden max-w-[calc(100%-3rem)] gap-1.5 overflow-x-auto rounded-2xl border border-white/15 bg-black/40 p-1.5 backdrop-blur sm:flex"
    >
      {#each opponents as opponent (opponent.id)}
        {@const damage = player.commanderDamage[opponent.id] ?? 0}
        {@const thumbnail = opponent.commanders?.[0]?.imageUrl}
        <button
          type="button"
          aria-label="Deal commander damage from {opponent.name}"
          class="pointer-events-auto relative flex h-8 w-8 flex-shrink-0 touch-none items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-cover bg-center text-xs font-bold text-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
          style:background-color={thumbnail ? undefined : opponent.color}
          style:background-image={thumbnail ? `url('${thumbnail}')` : undefined}
          onpointerdown={(e) => {
            e.stopPropagation()
            startPipPress(opponent.id)
          }}
          onpointerup={(e) => {
            e.stopPropagation()
            endPipPress(opponent.id)
          }}
          onpointerleave={() => cancelPipPress(opponent.id)}
          onpointercancel={() => cancelPipPress(opponent.id)}
        >
          {#if damage > 0}
            <span class="flex h-full w-full items-center justify-center rounded-full bg-black/55">{damage}</span>
          {/if}
        </button>
      {/each}
    </div>

    <button
      type="button"
      aria-label="Assign commander damage"
      class="pointer-events-auto absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/40 text-sm text-white/80 backdrop-blur transition-colors hover:border-white/30 hover:text-white sm:hidden"
      onclick={(e) => {
        e.stopPropagation()
        onOpenDamageMenu()
      }}
    >
      ⚔
      {#if worstCommanderDamage > 0}
        <span
          class="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white {worstCommanderDamage >=
          21
            ? 'bg-red-600'
            : 'bg-orange-600'}"
        >
          {worstCommanderDamage}
        </span>
      {/if}
    </button>
  {/if}

  <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 pt-2 pb-16">
    <span class="text-sm font-semibold tracking-wide text-white/70 uppercase">
      {player.name}
    </span>
    <div class="flex items-center gap-2">
      <span
        class="leading-none font-bold text-white/40 drop-shadow-lg select-none"
        style:font-size={pmFontSize}
      >
        −
      </span>
      <span
        class="font-bold text-white drop-shadow-lg tabular-nums"
        style:font-size={lifeFontSize}
      >
        {player.life}
      </span>
      <span
        class="leading-none font-bold text-white/40 drop-shadow-lg select-none"
        style:font-size={pmFontSize}
      >
        +
      </span>
    </div>
    <div class="flex h-6 items-center gap-1.5 text-xs font-semibold">
      {#if isMonarch}
        <span class="rounded-full bg-amber-900/70 px-2 py-0.5 text-amber-300">👑</span>
      {/if}
      {#if isInitiative}
        <span class="rounded-full bg-violet-900/70 px-2 py-0.5 text-violet-300">🗝️</span>
      {/if}
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
    {#if flashDelta !== null}
      <span
        class="absolute -bottom-2 text-2xl font-bold {flashDelta > 0 ? 'text-emerald-300' : 'text-red-300'}"
      >
        {flashDelta > 0 ? '+' : ''}{flashDelta}
      </span>
    {/if}
  </div>
</div>
