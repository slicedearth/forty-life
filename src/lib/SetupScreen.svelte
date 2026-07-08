<script lang="ts">
  interface Props {
    onStart: (playerCount: number, startingLife: number) => void
  }

  const { onStart }: Props = $props()

  const playerCounts = [2, 3, 4, 5, 6]
  const lifeTotals = [
    { label: 'Standard', value: 20 },
    { label: 'Commander', value: 40 },
  ]

  let playerCount = $state(4)
  let startingLife = $state(40)
  let customLife = $state('')

  function start() {
    const life = customLife ? Number(customLife) : startingLife
    if (!Number.isFinite(life) || life <= 0) return
    onStart(playerCount, life)
  }
</script>

<div class="flex h-full flex-col items-center justify-center gap-10 px-6 text-center">
  <div>
    <p class="text-sm font-semibold tracking-widest text-accent uppercase">
      MTG Life Counter
    </p>
    <h1 class="mt-2 text-4xl font-bold text-white">Set up your game</h1>
  </div>

  <div>
    <p class="mb-3 text-sm font-medium text-gray-400">Players</p>
    <div class="flex flex-wrap justify-center gap-2">
      {#each playerCounts as count (count)}
        <button
          type="button"
          class="h-12 w-12 rounded-full border font-semibold transition-colors {playerCount === count
            ? 'border-accent bg-accent/20 text-accent'
            : 'border-white/15 text-gray-300 hover:border-white/30'}"
          onclick={() => (playerCount = count)}
        >
          {count}
        </button>
      {/each}
    </div>
  </div>

  <div>
    <p class="mb-3 text-sm font-medium text-gray-400">Starting life</p>
    <div class="flex flex-wrap justify-center gap-2">
      {#each lifeTotals as { label, value } (value)}
        <button
          type="button"
          class="rounded-full border px-4 py-2 font-semibold transition-colors {startingLife === value && !customLife
            ? 'border-accent bg-accent/20 text-accent'
            : 'border-white/15 text-gray-300 hover:border-white/30'}"
          onclick={() => {
            startingLife = value
            customLife = ''
          }}
        >
          {label} ({value})
        </button>
      {/each}
      <input
        type="number"
        placeholder="Custom"
        bind:value={customLife}
        class="w-24 rounded-full border border-white/15 bg-transparent px-4 py-2 text-center font-semibold text-white placeholder:text-gray-500 focus:border-accent focus:outline-none"
      />
    </div>
  </div>

  <button
    type="button"
    class="rounded-full bg-gradient-to-r from-accent to-accent-2 px-8 py-3 text-lg font-bold text-black shadow-lg transition-transform hover:scale-105"
    onclick={start}
  >
    Start Game
  </button>
</div>
