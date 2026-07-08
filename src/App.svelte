<script lang="ts">
  import SetupScreen from './lib/SetupScreen.svelte'
  import PlayerCounter from './lib/PlayerCounter.svelte'
  import PlayerDetail from './lib/PlayerDetail.svelte'
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
  let monarchId = $state<number | null>(saved?.monarchId ?? null)
  let initiativeId = $state<number | null>(saved?.initiativeId ?? null)
  let dayNight = $state<'day' | 'night'>(saved?.dayNight ?? 'day')
  let menuOpen = $state(false)

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
</script>

<main class="h-dvh w-full overflow-hidden bg-bg">
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
                />
              </div>
            {/if}
          {/each}
        {/each}
      </div>

      {#if menuOpen}
        <div
          class="pointer-events-auto fixed inset-0 z-40"
          onclick={() => (menuOpen = false)}
          role="presentation"
        ></div>
      {/if}

      <div class="pointer-events-none absolute inset-x-0 top-1/2 z-50 flex -translate-y-1/2 justify-center">
        <div class="relative">
          <button
            type="button"
            aria-label="Game menu"
            class="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/80 backdrop-blur transition-colors hover:border-white/30 hover:text-white"
            onclick={() => (menuOpen = !menuOpen)}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
              <circle cx="4" cy="10" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="16" cy="10" r="1.5" />
            </svg>
          </button>

          {#if menuOpen}
            <div
              class="pointer-events-auto absolute top-full left-1/2 mt-2 flex w-36 -translate-x-1/2 flex-col gap-1 rounded-xl border border-white/15 bg-black/80 p-2 backdrop-blur"
            >
              <button
                type="button"
                class="rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                onclick={() => {
                  undo()
                  menuOpen = false
                }}
                disabled={history.length === 0}
              >
                Undo
              </button>
              <button
                type="button"
                class="rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                onclick={() => {
                  resetLife()
                  menuOpen = false
                }}
              >
                Reset Life
              </button>
              <button
                type="button"
                class="rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                onclick={() => {
                  newGame()
                  menuOpen = false
                }}
              >
                New Game
              </button>
              <button
                type="button"
                aria-label="Toggle day or night"
                class="rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                onclick={toggleDayNight}
              >
                {dayNight === 'day' ? '☀️ Day' : '🌙 Night'}
              </button>
            </div>
          {/if}
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
    </div>
  {/if}
</main>
