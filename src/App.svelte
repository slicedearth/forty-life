<script lang="ts">
  import { onMount } from 'svelte'
  import { FilePlus2, Moon, RotateCcw, Sun, Undo2 } from '@lucide/svelte'
  import SetupScreen from './lib/SetupScreen.svelte'
  import PlayerCounter from './lib/PlayerCounter.svelte'
  import PlayerDetail from './lib/PlayerDetail.svelte'
  import CommanderDamageMenu from './lib/CommanderDamageMenu.svelte'
  import { LAYOUTS, GRID_COLUMNS, type Player, type HistoryEntry, type CommanderCard } from './lib/types'

  const STORAGE_KEY = 'mtg-life-counter'
  const MAX_HISTORY = 50

  interface SavedState {
    players: Player[]
    startingLife: number
    monarchId: number | null
    initiativeId: number | null
    dayNight: 'day' | 'night'
  }

  function loadSaved(): SavedState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as SavedState
      const valid = parsed.players.every(
        p => typeof p.color === 'string' && typeof p.poison === 'number' && p.commanderDamage
      )
      return valid ? parsed : null
    } catch {
      return null
    }
  }

  const saved = loadSaved()

  let players = $state<Player[]>(saved?.players ?? [])
  let startingLife = $state(saved?.startingLife ?? 40)
  let phase = $state<'setup' | 'game'>(saved && saved.players.length > 0 ? 'game' : 'setup')
  let history = $state<HistoryEntry[]>([])
  let detailPlayerId = $state<number | null>(null)
  let damageMenuPlayerId = $state<number | null>(null)
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, startingLife, monarchId, initiativeId, dayNight }))
    }
  })

  function startGame(configs: { name: string; color: string; commanders: CommanderCard[] }[], life: number) {
    startingLife = life
    players = configs.map((config, i) => ({
      id: i,
      name: config.name,
      color: config.color,
      life,
      poison: 0,
      commanderDamage: {},
      commanders: config.commanders,
    }))
    history = []
    monarchId = null
    initiativeId = null
    dayNight = 'day'
    phase = 'game'
    void requestWakeLock()
  }

  function pushHistory(entry: HistoryEntry) {
    history = [...history.slice(-MAX_HISTORY + 1), entry]
  }

  function updateLife(id: number, delta: number) {
    players = players.map(p => (p.id === id ? { ...p, life: p.life + delta } : p))
    pushHistory({ type: 'life', playerId: id, delta })
  }

  function updatePoison(id: number, delta: number) {
    players = players.map(p =>
      p.id === id ? { ...p, poison: Math.max(0, p.poison + delta) } : p
    )
    pushHistory({ type: 'poison', playerId: id, delta })
  }

  function updateCommanderDamage(id: number, opponentId: number, delta: number) {
    players = players.map(p => {
      if (p.id !== id) return p
      const current = p.commanderDamage[opponentId] ?? 0
      const next = Math.max(0, current + delta)
      return { ...p, commanderDamage: { ...p.commanderDamage, [opponentId]: next } }
    })
    pushHistory({ type: 'commanderDamage', playerId: id, opponentId, delta })
  }

  function renamePlayer(id: number, name: string) {
    players = players.map(p => (p.id === id ? { ...p, name } : p))
  }

  function updateCommanders(id: number, commanders: CommanderCard[]) {
    players = players.map(p => (p.id === id ? { ...p, commanders } : p))
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
    if (entry.type === 'life') {
      players = players.map(p => (p.id === entry.playerId ? { ...p, life: p.life - entry.delta } : p))
    } else if (entry.type === 'poison') {
      players = players.map(p =>
        p.id === entry.playerId ? { ...p, poison: Math.max(0, p.poison - entry.delta) } : p
      )
    } else {
      players = players.map(p => {
        if (p.id !== entry.playerId) return p
        const current = p.commanderDamage[entry.opponentId] ?? 0
        const next = Math.max(0, current - entry.delta)
        return { ...p, commanderDamage: { ...p.commanderDamage, [entry.opponentId]: next } }
      })
    }
  }

  function resetLife() {
    if (!confirm('Reset everyone back to starting life?')) return
    players = players.map(p => ({ ...p, life: startingLife, poison: 0, commanderDamage: {} }))
    history = []
    monarchId = null
    initiativeId = null
    dayNight = 'day'
  }

  function newGame() {
    if (!confirm('End this game and set up a new one?')) return
    localStorage.removeItem(STORAGE_KEY)
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
          <button type="button" aria-label="Reset life" title="Reset life" class="game-tool" onclick={resetLife}>
            <RotateCcw size={17} strokeWidth={2.25} />
          </button>
          <button type="button" aria-label="New game" title="New game" class="game-tool" onclick={newGame}>
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
