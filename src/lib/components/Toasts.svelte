<script lang="ts">
  import { flip } from 'svelte/animate'
  import { fly } from 'svelte/transition'
  import { dismissToast, ui } from '../state/ui.svelte'
</script>

<div class="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-3" aria-live="polite">
  {#each ui.toasts as t (t.id)}
    <button
      animate:flip={{ duration: 200 }}
      in:fly={{ y: -20, duration: 250 }}
      out:fly={{ y: -20, duration: 200 }}
      class="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-3xl border-2 border-sun-300 bg-surface p-3 pr-5 text-left shadow-xl"
      onclick={() => dismissToast(t.id)}
    >
      <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-sun-100 text-2xl dark:bg-sun-600/30">{t.emoji}</span>
      <span class="min-w-0">
        <span class="block font-display font-bold">{t.title}</span>
        {#if t.body}<span class="block text-sm text-ink-muted">{t.body}</span>{/if}
      </span>
    </button>
  {/each}
</div>
