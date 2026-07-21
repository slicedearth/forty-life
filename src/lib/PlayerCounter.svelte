<script lang="ts">
  import { Crown, KeyRound, Minus, MoreHorizontal, Plus, Skull, Swords } from '@lucide/svelte'
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
  const highestCommanderTax = $derived(Math.max(0, ...(player.commanderTax ?? [0])))
  const isLethal = $derived(player.life <= 0 || player.poison >= 10 || worstCommanderDamage >= 21)

  const lifeDigits = $derived(player.life.toString().replace('-', '').length)
  const lifeFontSize = $derived(
    lifeDigits >= 3
      ? 'clamp(1.5rem, min(20cqw, 24cqh), 3.25rem)'
      : 'clamp(2rem, min(25cqw, 30cqh), 4.5rem)'
  )
  const pmIconSize = 'clamp(1rem, min(11cqw, 16cqh), 2rem)'
</script>

<div
  class="player-counter relative flex h-full w-full flex-row overflow-hidden border-4"
  class:is-lethal={isLethal}
  style:background={player.color}
  style:border-color={player.color}
  style:container-type="size"
  class:rotate-180={rotate}
>
  {#if player.commanders?.length}
    <div class="pointer-events-none absolute inset-0 flex">
      {#each player.commanders as commander (commander.name)}
        <div class="flex-1 bg-cover bg-center" style:background-image="url('{commander.imageUrl}')"></div>
      {/each}
    </div>
    <div
      class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.34),rgba(0,0,0,0.56))]"
    ></div>
  {/if}

  <div class="pointer-events-none absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-white/10"></div>

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
    aria-label="Open details for {player.name}{highestCommanderTax > 0
      ? `, highest commander tax ${highestCommanderTax}`
      : ''}"
    class="icon-tool pointer-events-auto absolute right-2 bottom-2"
    onclick={(e) => {
      e.stopPropagation()
      onOpenDetail()
    }}
  >
    <MoreHorizontal size={17} strokeWidth={2.25} />
    {#if highestCommanderTax > 0}
      <span
        class="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-700 px-0.5 text-[9px] font-bold text-white shadow-sm"
        title="Highest commander tax"
      >
        +{highestCommanderTax}
      </span>
    {/if}
  </button>

  {#if opponents.length > 0}
    <div
      class="damage-pips pointer-events-auto absolute bottom-2 left-2 max-w-[calc(100%-3rem)] gap-1.5 rounded-full border border-white/15 bg-black/50 p-1.5 shadow-md backdrop-blur"
    >
      {#each opponents as opponent (opponent.id)}
        {@const damage = player.commanderDamage[opponent.id] ?? 0}
        {@const thumbnail = opponent.commanders?.[0]?.imageUrl}
        <button
          type="button"
          aria-label="Deal commander damage from {opponent.name}"
          class="pointer-events-auto relative flex h-8 w-8 flex-shrink-0 touch-none items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-cover bg-center text-xs font-bold text-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
          style:background-color={opponent.color}
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
      class="damage-menu-button icon-tool pointer-events-auto absolute bottom-2 left-2"
      onclick={(e) => {
        e.stopPropagation()
        onOpenDamageMenu()
      }}
    >
      <Swords size={16} strokeWidth={2.25} />
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

  <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-1 pt-2 pb-16">
    <span class="max-w-[78%] truncate text-xs font-semibold text-white/70 uppercase sm:text-sm">
      {player.name}
    </span>
    <div class="grid w-full grid-cols-[minmax(1.25rem,1fr)_auto_minmax(1.25rem,1fr)] items-center gap-1">
      <span class="flex justify-end text-white/45 drop-shadow-lg" style:font-size={pmIconSize}>
        <Minus size="1em" strokeWidth={2.5} />
      </span>
      <span
        class="min-w-0 text-center leading-none font-bold text-white drop-shadow-lg tabular-nums"
        style:font-size={lifeFontSize}
      >
        {player.life}
      </span>
      <span class="flex justify-start text-white/45 drop-shadow-lg" style:font-size={pmIconSize}>
        <Plus size="1em" strokeWidth={2.5} />
      </span>
    </div>
    <div class="flex h-6 max-w-[calc(100%-0.5rem)] items-center gap-1 overflow-hidden text-[10px] font-semibold sm:text-xs">
      {#if isMonarch}
        <span class="status-chip bg-amber-900/75 text-amber-200" title="Monarch">
          <Crown size={12} strokeWidth={2.25} />
        </span>
      {/if}
      {#if isInitiative}
        <span class="status-chip bg-violet-900/75 text-violet-200" title="Initiative">
          <KeyRound size={12} strokeWidth={2.25} />
        </span>
      {/if}
      {#if player.poison > 0}
        <span class="status-chip bg-emerald-900/75 text-emerald-200" title="Poison counters">
          <Skull size={11} strokeWidth={2.25} /> {player.poison}
        </span>
      {/if}
      {#if worstCommanderDamage > 0}
        <span
          class="status-chip {worstCommanderDamage >= 21
            ? 'bg-red-900/80 text-red-300'
            : 'bg-orange-900/70 text-orange-300'}"
          title="Highest commander damage"
        >
          <Swords size={11} strokeWidth={2.25} /> {worstCommanderDamage}
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

<style>
  .player-counter {
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.08);
  }

  .player-counter.is-lethal {
    box-shadow: inset 0 0 0 3px rgb(248 113 113 / 0.9), inset 0 0 3rem rgb(127 29 29 / 0.42);
  }

  .icon-tool {
    display: flex;
    height: 2rem;
    width: 2rem;
    align-items: center;
    justify-content: center;
    border: 1px solid rgb(255 255 255 / 0.16);
    border-radius: 9999px;
    background: rgb(0 0 0 / 0.48);
    color: rgb(255 255 255 / 0.76);
    backdrop-filter: blur(8px);
    transition: border-color 150ms, background-color 150ms, color 150ms;
  }

  .icon-tool:hover,
  .icon-tool:focus-visible {
    border-color: rgb(255 255 255 / 0.35);
    background: rgb(0 0 0 / 0.64);
    color: white;
    outline: none;
  }

  .status-chip {
    display: inline-flex;
    height: 1.25rem;
    flex-shrink: 0;
    align-items: center;
    gap: 0.2rem;
    border-radius: 9999px;
    padding: 0 0.4rem;
  }

  .damage-pips {
    display: none;
  }

  .damage-menu-button {
    display: flex;
  }

  @container (min-width: 16rem) {
    .damage-pips {
      display: flex;
    }

    .damage-menu-button {
      display: none;
    }
  }
</style>
