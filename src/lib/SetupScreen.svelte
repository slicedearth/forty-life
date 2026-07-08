<script lang="ts">
  import { PLAYER_COLORS, type CommanderCard } from "./types";
  import CommanderPicker from "./CommanderPicker.svelte";

  interface PlayerConfig {
    name: string;
    color: string;
    commanders: CommanderCard[];
  }

  interface Props {
    onStart: (players: PlayerConfig[], startingLife: number) => void;
  }

  const { onStart }: Props = $props();

  const playerCounts = [2, 3, 4, 5, 6];
  const lifeTotals = [
    { label: "Standard", value: 20 },
    { label: "Commander", value: 40 },
  ];

  let playerCount = $state(4);
  let startingLife = $state(40);
  let customLife = $state("");

  function defaultConfigs(count: number): PlayerConfig[] {
    return Array.from({ length: count }, (_, i) => ({
      name: `Player ${i + 1}`,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      commanders: [],
    }));
  }

  let playerConfigs = $state<PlayerConfig[]>(defaultConfigs(4));

  function setPlayerCount(count: number) {
    playerCount = count;
    playerConfigs = Array.from(
      { length: count },
      (_, i) => playerConfigs[i] ?? defaultConfigs(count)[i],
    );
  }

  function start() {
    const life = customLife ? Number(customLife) : startingLife;
    if (!Number.isFinite(life) || life <= 0) return;
    const configs = playerConfigs.map((p, i) => ({
      name: p.name.trim() || `Player ${i + 1}`,
      color: p.color,
      commanders: p.commanders,
    }));
    onStart(configs, life);
  }
</script>

<div
  class="flex h-full flex-col items-center justify-[safe_center] gap-8 overflow-y-auto px-6 py-10 text-center"
>
  <div>
    <p class="text-sm font-semibold tracking-widest text-accent uppercase">
      Forty Life
    </p>
    <h1 class="mt-2 text-4xl font-bold text-white">Set up your game</h1>
  </div>

  <div>
    <p class="mb-3 text-sm font-medium text-gray-400">Players</p>
    <div class="flex flex-wrap justify-center gap-2">
      {#each playerCounts as count (count)}
        <button
          type="button"
          class="h-12 w-12 rounded-full border font-semibold transition-colors {playerCount ===
          count
            ? 'border-accent bg-accent/20 text-accent'
            : 'border-white/15 text-gray-300 hover:border-white/30'}"
          onclick={() => setPlayerCount(count)}
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
          class="rounded-full border px-4 py-2 font-semibold transition-colors {startingLife ===
            value && !customLife
            ? 'border-accent bg-accent/20 text-accent'
            : 'border-white/15 text-gray-300 hover:border-white/30'}"
          onclick={() => {
            startingLife = value;
            customLife = "";
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

  <div class="w-full max-w-md">
    <p class="mb-3 text-sm font-medium text-gray-400">Names &amp; colors</p>
    <div class="flex flex-col gap-2">
      {#each playerConfigs as config, i (i)}
        <div class="flex flex-col gap-2 rounded-xl border border-white/10 p-2">
          <div class="flex items-center gap-2">
            <input
              type="text"
              bind:value={config.name}
              placeholder="Player {i + 1}"
              class="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 text-left font-medium text-white placeholder:text-gray-500 focus:outline-none"
            />
            <div class="flex flex-shrink-0 gap-1">
              {#each PLAYER_COLORS as color (color)}
                <button
                  type="button"
                  aria-label="Choose color {color}"
                  class="h-6 w-6 rounded-full border-2 transition-transform {config.color ===
                  color
                    ? 'scale-110 border-white'
                    : 'border-transparent hover:scale-105'}"
                  style:background={color}
                  onclick={() => (config.color = color)}
                ></button>
              {/each}
            </div>
          </div>
          <CommanderPicker
            value={config.commanders}
            onChange={(cards) => (config.commanders = cards)}
          />
        </div>
      {/each}
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
