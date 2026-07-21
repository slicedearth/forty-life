<script lang="ts">
  import { onMount } from 'svelte'
  import { FilePlus2, RotateCcw } from '@lucide/svelte'

  interface Props {
    title: string
    message: string
    confirmLabel: string
    destructive?: boolean
    onCancel: () => void
    onConfirm: () => void
  }

  const {
    title,
    message,
    confirmLabel,
    destructive = false,
    onCancel,
    onConfirm,
  }: Props = $props()

  let confirmButton: HTMLButtonElement

  onMount(() => confirmButton.focus())

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onCancel()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm"
  onclick={(event) => {
    if (event.target === event.currentTarget) onCancel()
  }}
  role="presentation"
>
  <div
    class="w-full max-w-sm rounded-lg border border-white/15 bg-surface p-4 text-white shadow-2xl"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirmation-title"
    aria-describedby="confirmation-message"
  >
    <div class="flex items-start gap-3">
      <span
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full {destructive
          ? 'bg-red-500/15 text-red-300'
          : 'bg-cyan-500/15 text-cyan-200'}"
      >
        {#if destructive}
          <FilePlus2 size={19} strokeWidth={2.25} />
        {:else}
          <RotateCcw size={19} strokeWidth={2.25} />
        {/if}
      </span>
      <div class="min-w-0 flex-1">
        <h2 id="confirmation-title" class="text-base font-semibold">{title}</h2>
        <p id="confirmation-message" class="mt-1 text-sm leading-5 text-white/55">{message}</p>
      </div>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-2">
      <button
        type="button"
        class="confirm-action border-white/15 text-white/75 hover:bg-white/10 hover:text-white"
        onclick={onCancel}
      >
        Cancel
      </button>
      <button
        bind:this={confirmButton}
        type="button"
        class="confirm-action border-transparent text-white {destructive
          ? 'bg-red-600 hover:bg-red-500'
          : 'bg-cyan-700 hover:bg-cyan-600'}"
        onclick={onConfirm}
      >
        {confirmLabel}
      </button>
    </div>
  </div>
</div>

<style>
  .confirm-action {
    min-height: 2.75rem;
    border-width: 1px;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    transition: background-color 150ms, color 150ms;
  }

  .confirm-action:focus-visible {
    outline: 2px solid rgb(85 193 224);
    outline-offset: 2px;
  }
</style>
