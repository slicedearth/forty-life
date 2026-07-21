<script lang="ts">
  import { onMount } from 'svelte'
  import { FilePlus2, Moon, RotateCcw, Sun, Undo2 } from '@lucide/svelte'
  import SetupScreen from './lib/SetupScreen.svelte'
  import PlayerCounter from './lib/PlayerCounter.svelte'
  import PlayerDetail from './lib/PlayerDetail.svelte'
  import CommanderDamageMenu from './lib/CommanderDamageMenu.svelte'
  import ConfirmDialog from './lib/ConfirmDialog.svelte'
  import { LAYOUTS, GRID_COLUMNS, type Player, type HistoryEntry, type CommanderCard } from './lib/types'
  import {
    appendHistory,
    applyCommanderDamageDelta,
    applyCommanderTaxDelta,
    applyLifeDelta,
    applyPoisonDelta,
    createPlayers,
    renamePlayer as renamePlayerState,
    resetPlayers,
    undoHistoryEntry,
    updatePlayerCommanders,
  } from './lib/game'
  import { clearSavedState, loadSavedState, saveSavedState } from './lib/storage'

  const saved = loadSavedState()

  let players = $state<Player[]>(saved?.players ?? [])
  let startingLife = $state(saved?.startingLife ?? 40)
  let phase = $state<'setup' | 'game'>(saved && saved.players.length > 0 ? 'game' : 'setup')
  let history = $state<HistoryEntry[]>([])
  let detailPlayerId = $state<number | null>(null)
  let damageMenuPlayerId = $state<number | null>(null)
  let pendingAction = $state<'reset' | 'new' | null>(null)
  let monarchId = $state<number | null>(saved?.monarchId ?? null)
  let initiativeId = $state<number | null>(saved?.initiativeId ?? null)
  let dayNight = $state<'day' | 'night'>(saved?.dayNight ?? 'day')
  let wakeLock: WakeLockSentinel | null = null

  async function requestWakeLock() {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return
    try {
      wakeLock = await navigator.wakeLock.request('screen')
    } catch {
      // Wake lock is progressive enhancement and may be denied by the browser.
    }
  }

  async function releaseWakeLock() {
    if (!wakeLock) return
    await wakeLock.release()
    wakeLock = null
  }

  onMount(() => {
    const handleVisibilityChange = () => {
      if (phase === 'game' && document.visibilityState === 'visible') void requestWakeLock()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    if (phase === 'game') void requestWakeLock()
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void releaseWakeLock()
    }
  })

  $effect(() => {
    if (phase === 'game') {
      saveSavedState({ players, startingLife, monarchId, initiativeId, dayNight })
    }
  })

  function startGame(configs: { name: string; color: string; commanders: CommanderCard[] }[], life: number) {
    startingLife = life
    players = createPlayers(configs, life)
    history = []
    monarchId = null
    initiativeId = null
    dayNight = 'day'
    phase = 'game'
    void requestWakeLock()
  }

  function pushHistory(entry: HistoryEntry) {
    history = appendHistory(history, entry)
  }

  function updateLife(id: number, delta: number) {
    const result = applyLifeDelta(players, id, delta)
    players = result.players
    if (result.appliedDelta !== 0) pushHistory({ type: 'life', playerId: id, delta: result.appliedDelta })
  }

  function updatePoison(id: number, delta: number) {
    const result = applyPoisonDelta(players, id, delta)
    players = result.players
    if (result.appliedDelta !== 0) pushHistory({ type: 'poison', playerId: id, delta: result.appliedDelta })
  }

  function updateCommanderDamage(id: number, opponentId: number, delta: number) {
    const result = applyCommanderDamageDelta(players, id, opponentId, delta)
    players = result.players
    if (result.appliedDelta !== 0) {
      pushHistory({ type: 'commanderDamage', playerId: id, opponentId, delta: result.appliedDelta })
    }
  }

  function updateCommanderTax(id: number, commanderIndex: number, delta: number) {
    const result = applyCommanderTaxDelta(players, id, commanderIndex, delta)
    players = result.players
    if (result.appliedDelta !== 0) {
      pushHistory({ type: 'commanderTax', playerId: id, commanderIndex, delta: result.appliedDelta })
    }
  }

  function renamePlayer(id: number, name: string) {
    players = renamePlayerState(players, id, name)
  }

  function updateCommanders(id: number, commanders: CommanderCard[]) {
    players = updatePlayerCommanders(players, id, commanders)
  }

  function setMonarch(id: number) {
    monarchId = monarchId === id ? null : id
  }

  function setInitiative(id: number) {
    initiativeId = initiativeId === id ? null : id
  }

  function toggleDayNight() {
    dayNight = dayNight === 'day' ? 'night' : 'day'
  }

  function undo() {
    if (history.length === 0) return
    const entry = history[history.length - 1]
    history = history.slice(0, -1)
    players = undoHistoryEntry(players, entry)
  }

  function resetGame() {
    players = resetPlayers(players, startingLife)
    history = []
    monarchId = null
    initiativeId = null
    dayNight = 'day'
  }

  function newGame() {
    clearSavedState()
    players = []
    history = []
    monarchId = null
    initiativeId = null
    dayNight = 'day'
    phase = 'setup'
    void releaseWakeLock()
  }

  const layout = $derived(LAYOUTS[players.length] ?? LAYOUTS[4])
  const detailPlayer = $derived(players.find(p => p.id === detailPlayerId) ?? null)
  const detailRotate = $derived.by(() => {
    if (detailPlayerId === null) return false
    let idx = 0
    for (const row of layout) {
      for (let i = 0; i < row.count; i++, idx++) {
        if (players[idx]?.id === detailPlayerId) return row.rotate
      }
    }
    return false
  })
  const damageMenuPlayer = $derived(players.find(p => p.id === damageMenuPlayerId) ?? null)
  const damageMenuRotate = $derived.by(() => {
    if (damageMenuPlayerId === null) return false
    let idx = 0
    for (const row of layout) {
      for (let i = 0; i < row.count; i++, idx++) {
        if (players[idx]?.id === damageMenuPlayerId) return row.rotate
      }
    }
    return false
  })
</script>

<main
  class="h-dvh w-full overflow-hidden bg-bg"
  style="padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)"
>
  {#if phase === 'setup'}
    <SetupScreen onStart={startGame} />
  {:else}
    <div class="relative h-full w-full">
      <div
        class="grid h-full w-full"
        style:grid-template-columns="repeat({GRID_COLUMNS}, minmax(0, 1fr))"
        style:grid-template-rows="repeat({layout.length}, minmax(0, 1fr))"
      >
        {#each layout as row, rowIndex (rowIndex)}
          {@const startIndex = layout.slice(0, rowIndex).reduce((sum, r) => sum + r.count, 0)}
          {#each { length: row.count } as _, i (i)}
            {@const player = players[startIndex + i]}
            {#if player}
              <div style:grid-column="span {GRID_COLUMNS / row.count}">
                <PlayerCounter
                  {player}
                  rotate={row.rotate}
                  opponents={players.filter(p => p.id !== player.id)}
                  isMonarch={monarchId === player.id}
                  isInitiative={initiativeId === player.id}
                  onChange={delta => updateLife(player.id, delta)}
                  onOpenDetail={() => (detailPlayerId = player.id)}
                  onQuickDamage={(opponentId, delta) => updateCommanderDamage(player.id, opponentId, delta)}
                  onOpenDamageMenu={() => (damageMenuPlayerId = player.id)}
                />
              </div>
            {/if}
          {/each}
        {/each}
      </div>

      <div
        class="pointer-events-none absolute inset-0 z-30 transition-colors duration-700"
        style:background-color={dayNight === 'night' ? 'rgba(30, 27, 75, 0.45)' : 'transparent'}
      ></div>

      <div class="pointer-events-none absolute inset-x-0 top-1/2 z-50 flex -translate-y-1/2 justify-center px-2">
        <div
          class="pointer-events-auto flex items-center rounded-full border border-white/15 bg-black/65 p-1 shadow-lg backdrop-blur-md"
          role="toolbar"
          aria-label="Game controls"
        >
          <button
            type="button"
            aria-label="Undo"
            title="Undo"
            class="game-tool"
            onclick={undo}
            disabled={history.length === 0}
          >
            <Undo2 size={17} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            aria-label="Reset life"
            title="Reset life"
            class="game-tool"
            onclick={() => (pendingAction = 'reset')}
          >
            <RotateCcw size={17} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            aria-label="New game"
            title="New game"
            class="game-tool"
            onclick={() => (pendingAction = 'new')}
          >
            <FilePlus2 size={17} strokeWidth={2.25} />
          </button>
          <span class="mx-1 h-5 w-px bg-white/15" aria-hidden="true"></span>
          <button
            type="button"
            aria-label={dayNight === 'day' ? 'Switch to night' : 'Switch to day'}
            title={dayNight === 'day' ? 'Day' : 'Night'}
            aria-pressed={dayNight === 'night'}
            class="game-tool {dayNight === 'night' ? '!bg-indigo-400/25 !text-indigo-100' : ''}"
            onclick={toggleDayNight}
          >
            {#if dayNight === 'day'}
              <Sun size={17} strokeWidth={2.25} />
            {:else}
              <Moon size={17} strokeWidth={2.25} />
            {/if}
          </button>
        </div>
      </div>

      {#if detailPlayer}
        <PlayerDetail
          player={detailPlayer}
          opponents={players.filter(p => p.id !== detailPlayer.id)}
          rotate={detailRotate}
          isMonarch={monarchId === detailPlayer.id}
          isInitiative={initiativeId === detailPlayer.id}
          onClose={() => (detailPlayerId = null)}
          onLifeChange={delta => updateLife(detailPlayer.id, delta)}
          onPoisonChange={delta => updatePoison(detailPlayer.id, delta)}
          onCommanderDamageChange={(opponentId, delta) =>
            updateCommanderDamage(detailPlayer.id, opponentId, delta)}
          onCommanderTaxChange={(commanderIndex, delta) =>
            updateCommanderTax(detailPlayer.id, commanderIndex, delta)}
          onRename={name => renamePlayer(detailPlayer.id, name)}
          onCommandersChange={cards => updateCommanders(detailPlayer.id, cards)}
          onSetMonarch={() => setMonarch(detailPlayer.id)}
          onSetInitiative={() => setInitiative(detailPlayer.id)}
        />
      {/if}

      {#if damageMenuPlayer}
        <CommanderDamageMenu
          player={damageMenuPlayer}
          opponents={players.filter(p => p.id !== damageMenuPlayer.id)}
          rotate={damageMenuRotate}
          onClose={() => (damageMenuPlayerId = null)}
          onQuickDamage={(opponentId, delta) => updateCommanderDamage(damageMenuPlayer.id, opponentId, delta)}
        />
      {/if}

      {#if pendingAction === 'reset'}
        <ConfirmDialog
          title="Reset this game?"
          message="Return every player to {startingLife} life and clear counters, commander damage, commander tax, roles, and day/night."
          confirmLabel="Reset game"
          onCancel={() => (pendingAction = null)}
          onConfirm={() => {
            pendingAction = null
            resetGame()
          }}
        />
      {:else if pendingAction === 'new'}
        <ConfirmDialog
          title="Start a new game?"
          message="End this game and return to setup. The current game state will be cleared."
          confirmLabel="New game"
          destructive
          onCancel={() => (pendingAction = null)}
          onConfirm={() => {
            pendingAction = null
            newGame()
          }}
        />
      {/if}
    </div>
  {/if}
</main>

<style>
  .game-tool {
    display: flex;
    height: 2rem;
    width: 2rem;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    color: rgb(255 255 255 / 0.72);
    transition: background-color 150ms, color 150ms, opacity 150ms;
  }

  .game-tool:hover,
  .game-tool:focus-visible {
    background: rgb(255 255 255 / 0.12);
    color: white;
    outline: none;
  }

  .game-tool:disabled {
    opacity: 0.28;
  }
</style>
