<script lang="ts">
  import { Play, RotateCcw } from '@lucide/svelte'
  import type { PlayerConfig } from "./game";
  import type { SavedPod } from "./storage";
  import { PLAYER_COLORS, type CommanderCard } from "./types";
  import CommanderPicker from "./CommanderPicker.svelte";

  interface Props {
    lastPod: SavedPod | null;
    onStart: (players: PlayerConfig[], startingLife: number) => void;
  }

  const { lastPod, onStart }: Props = $props();

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

  function cloneConfigs(configs: PlayerConfig[]): PlayerConfig[] {
    return configs.map(config => ({
      ...config,
      commanders: config.commanders.map((commander: CommanderCard) => ({ ...commander })),
    }));
  }

  function reuseLastPod() {
    if (!lastPod) return;
    playerCount = lastPod.players.length;
    playerConfigs = cloneConfigs(lastPod.players);
    if (lifeTotals.some(({ value }) => value === lastPod.startingLife)) {
      startingLife = lastPod.startingLife;
      customLife = "";
    } else {
      customLife = String(lastPod.startingLife);
    }
  }

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

<div class="h-full overflow-y-auto">
  <div class="mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-8">
    <header class="text-center">
      <p class="text-xs font-bold text-accent uppercase">Forty Life</p>
      <h1 class="mt-1 text-3xl font-bold text-white">Set up your game</h1>
    </header>

    {#if lastPod}
      <section class="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4" aria-label="Last pod">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-white">Last pod</p>
          <p class="truncate text-xs text-white/45">
            {lastPod.players.length} players · {lastPod.startingLife} life
          </p>
        </div>
        <button
          type="button"
          class="flex min-h-11 flex-shrink-0 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-gray-200 hover:border-white/30 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-accent"
          onclick={reuseLastPod}
        >
          <RotateCcw size={16} strokeWidth={2.25} />
          Reuse pod
        </button>
      </section>
    {/if}

    <section class="mt-7 grid gap-6 border-y border-white/10 py-5 sm:grid-cols-2 sm:gap-8">
      <fieldset>
        <legend class="mb-3 text-sm font-medium text-gray-400">Players</legend>
        <div class="flex gap-2">
          {#each playerCounts as count (count)}
            <button
              type="button"
              aria-pressed={playerCount === count}
              class="h-11 min-w-11 flex-1 rounded-lg border font-semibold transition-colors {playerCount === count
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-white/15 text-gray-300 hover:border-white/30'}"
              onclick={() => setPlayerCount(count)}
            >
              {count}
            </button>
          {/each}
        </div>
      </fieldset>

      <fieldset>
        <legend class="mb-3 text-sm font-medium text-gray-400">Starting life</legend>
        <div class="grid grid-cols-[1fr_1fr_5.5rem] gap-2">
          {#each lifeTotals as { label, value } (value)}
            <button
              type="button"
              aria-pressed={startingLife === value && !customLife}
              class="min-h-11 rounded-lg border px-2 text-sm font-semibold transition-colors {startingLife === value && !customLife
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-white/15 text-gray-300 hover:border-white/30'}"
              onclick={() => {
                startingLife = value;
                customLife = "";
              }}
            >
              {label} <span class="text-white/45">{value}</span>
            </button>
          {/each}
          <input
            type="number"
            min="1"
            inputmode="numeric"
            aria-label="Custom starting life"
            placeholder="Custom"
            bind:value={customLife}
            class="min-h-11 min-w-0 rounded-lg border border-white/15 bg-transparent px-2 text-center text-sm font-semibold text-white placeholder:text-gray-500 focus:border-accent focus:outline-none"
          />
        </div>
      </fieldset>
    </section>

    <div class="mt-6 flex items-end justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-white">Players</h2>
        <p class="text-xs text-white/45">Names, colors, and optional commander art</p>
      </div>
      <span class="text-xs font-medium text-white/35">{playerCount} total</span>
    </div>

    <div class="mt-3 flex flex-col gap-3">
      {#each playerConfigs as config, i (i)}
        <section class="overflow-visible rounded-lg border border-white/10 bg-white/[0.025] p-3 text-left">
          <div class="flex items-center gap-3">
            <span
              class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style:background={config.color}
            >
              {i + 1}
            </span>
            <input
              type="text"
              maxlength="40"
              bind:value={config.name}
              placeholder="Player {i + 1}"
              aria-label="Player {i + 1} name"
              class="min-h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/10 px-3 text-sm font-medium text-white placeholder:text-gray-500 focus:border-accent focus:outline-none"
            />
          </div>

          <div class="mt-3 grid grid-cols-8 gap-1" aria-label="Player {i + 1} color">
            {#each PLAYER_COLORS as color (color)}
              <button
                type="button"
                aria-label="Choose color {color}"
                aria-pressed={config.color === color}
                class="flex h-9 items-center justify-center rounded-lg transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-accent"
                onclick={() => (config.color = color)}
              >
                <span
                  class="h-6 w-6 rounded-full border-2 transition-transform {config.color === color
                    ? 'scale-110 border-white'
                    : 'border-white/10'}"
                  style:background={color}
                ></span>
              </button>
            {/each}
          </div>

          <div class="mt-2 border-t border-white/10 pt-3">
            <CommanderPicker value={config.commanders} onChange={(cards) => (config.commanders = cards)} />
          </div>
        </section>
      {/each}
    </div>

    <div class="sticky bottom-0 z-20 mt-5 border-t border-white/10 bg-bg/95 py-3 backdrop-blur-md">
      <button
        type="button"
        class="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-8 text-base font-bold text-black shadow-lg shadow-cyan-950/30 transition-colors hover:bg-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        onclick={start}
      >
        <Play size={18} fill="currentColor" strokeWidth={2.25} />
        Start game
      </button>
    </div>
  </div>
</div>
