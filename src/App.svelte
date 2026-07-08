<script lang="ts">
  import SetupScreen from './lib/SetupScreen.svelte'
  import PlayerCounter from './lib/PlayerCounter.svelte'
  import PlayerDetail from './lib/PlayerDetail.svelte'
  import { LAYOUTS, GRID_COLUMNS, type Player, type HistoryEntry } from './lib/types'

  const STORAGE_KEY = 'mtg-life-counter'
  const MAX_HISTORY = 50

  interface SavedState {
    players: Player[]
    startingLife: number
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

  $effect(() => {
    if (phase === 'game') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, startingLife }))
    }
  })

  function startGame(configs: { name: string; color: string }[], life: number) {
    startingLife = life
    players = configs.map((config, i) => ({
      id: i,
      name: config.name,
      color: config.color,
      life,
      poison: 0,
      commanderDamage: {},
    }))
    history = []
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
  }

  function newGame() {
    if (!confirm('End this game and set up a new one?')) return
    localStorage.removeItem(STORAGE_KEY)
    players = []
    history = []
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
                  onChange={delta => updateLife(player.id, delta)}
                  onOpenDetail={() => (detailPlayerId = player.id)}
                />
              </div>
            {/if}
          {/each}
        {/each}
      </div>

      <div class="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center gap-3">
        <button
          type="button"
          class="pointer-events-auto rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs font-semibold text-white/70 backdrop-blur transition-colors hover:border-white/30 hover:text-white disabled:opacity-30"
          onclick={undo}
          disabled={history.length === 0}
        >
          Undo
        </button>
        <button
          type="button"
          class="pointer-events-auto rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs font-semibold text-white/70 backdrop-blur transition-colors hover:border-white/30 hover:text-white"
          onclick={resetLife}
        >
          Reset Life
        </button>
        <button
          type="button"
          class="pointer-events-auto rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs font-semibold text-white/70 backdrop-blur transition-colors hover:border-white/30 hover:text-white"
          onclick={newGame}
        >
          New Game
        </button>
      </div>

      {#if detailPlayer}
        <PlayerDetail
          player={detailPlayer}
          opponents={players.filter(p => p.id !== detailPlayer.id)}
          rotate={detailRotate}
          onClose={() => (detailPlayerId = null)}
          onLifeChange={delta => updateLife(detailPlayer.id, delta)}
          onPoisonChange={delta => updatePoison(detailPlayer.id, delta)}
          onCommanderDamageChange={(opponentId, delta) =>
            updateCommanderDamage(detailPlayer.id, opponentId, delta)}
          onRename={name => renamePlayer(detailPlayer.id, name)}
        />
      {/if}
    </div>
  {/if}
</main>
