<script lang="ts">
  import { celebrate } from '../celebrate'
  import { rankFor } from '../engine/gamify'
  import { tr, T } from '../i18n'
  import { ui } from '../state/ui.svelte'
  import Modal from './Modal.svelte'

  const rank = $derived(rankFor(ui.levelUp))

  $effect(() => {
    if (ui.levelUp) celebrate(1200)
  })
</script>

<Modal open={ui.levelUp > 0} onclose={() => (ui.levelUp = 0)} size="sm">
  <div class="flex flex-col items-center pb-2 text-center">
    <div class="relative grid size-28 animate-pop place-items-center rounded-full bg-gradient-to-br from-sun-300 to-sun-500 shadow-lg">
      <span class="font-display text-5xl font-black text-brand-950">{ui.levelUp}</span>
    </div>
    <h2 class="mt-5 text-3xl font-black">{tr(T.levelUp)}</h2>
    <p class="mt-1 text-lg text-ink-muted">{rank.emoji} {tr(rank.name)}</p>
    <button class="btn btn-primary mt-6 w-full" onclick={() => (ui.levelUp = 0)}>{tr(T.continue)}</button>
  </div>
</Modal>
