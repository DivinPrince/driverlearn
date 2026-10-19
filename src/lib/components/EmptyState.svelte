<script lang="ts">
  import type { Snippet } from 'svelte'
  import Mascot from './Mascot.svelte'

  interface Props {
    title: string
    body?: string
    mood?: 'happy' | 'wow' | 'sad' | 'think'
    children?: Snippet
  }
  let { title, body, mood = 'think', children }: Props = $props()
</script>

<div class="card flex flex-col items-center px-6 py-10 text-center">
  <Mascot size={110} {mood} class="animate-float text-ink" />
  <h2 class="mt-4 text-xl font-bold">{title}</h2>
  {#if body}<p class="mt-1 max-w-sm text-ink-muted">{body}</p>{/if}
  {#if children}<div class="mt-5 flex flex-wrap justify-center gap-3">{@render children()}</div>{/if}
</div>
