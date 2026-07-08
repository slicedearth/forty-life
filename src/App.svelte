<script lang="ts">
  import SetupScreen from './lib/SetupScreen.svelte'
  import PlayerCounter from './lib/PlayerCounter.svelte'
  import { LAYOUTS, GRID_COLUMNS, type Player } from './lib/types'

  const STORAGE_KEY = 'mtg-life-counter'

  interface SavedState {
    players: Player[]
    startingLife: number
  }

  function loadSaved(): SavedState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as SavedState) : null
    } catch {
      return null
    }
  }

  const saved = loadSaved()

  let players = $state<Player[]>(saved?.players ?? [])
  let startingLife = $state(saved?.startingLife ?? 40)
  let phase = $state<'setup' | 'game'>(saved && saved.players.length > 0 ? 'game' : 'setup')

  $effect(() => {
    if (phase === 'game') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, startingLife }))
    }
  })

  function startGame(playerCount: number, life: number) {
    startingLife = life
    players = Array.from({ length: playerCount }, (_, i) => ({
      id: i,
      name: `Player ${i + 1}`,
      life,
    }))
    phase = 'game'
  }

  function updateLife(id: number, delta: number) {
    players = players.map(p => (p.id === id ? { ...p, life: p.life + delta } : p))
  }

  function resetLife() {
    if (!confirm('Reset everyone back to starting life?')) return
    players = players.map(p => ({ ...p, life: startingLife }))
  }

  function newGame() {
    if (!confirm('End this game and set up a new one?')) return
    localStorage.removeItem(STORAGE_KEY)
    players = []
    phase = 'setup'
  }

  const layout = $derived(LAYOUTS[players.length] ?? LAYOUTS[4])
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
                  color="hsl({(360 / players.length) * (startIndex + i)} 45% 16%)"
                  onChange={delta => updateLife(player.id, delta)}
                />
              </div>
            {/if}
          {/each}
        {/each}
      </div>

      <div class="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center gap-3">
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
    </div>
  {/if}
</main>
