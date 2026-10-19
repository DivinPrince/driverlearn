<script lang="ts">
  /** A settings group: a card with a colored icon badge, a heading and stacked rows. */
  import type { Component, Snippet } from 'svelte'

  interface Props {
    title: string
    subtitle?: string
    icon: Component<{ size?: number; strokeWidth?: number }>
    /** Tailwind classes for the icon badge. */
    tone: string
    children: Snippet
  }

  let { title, subtitle, icon: Icon, tone, children }: Props = $props()
  const id = $props.id()
</script>

<section class="card p-5 sm:p-6" aria-labelledby="{id}-title">
  <header class="mb-1 flex items-center gap-3">
    <span class="grid size-11 shrink-0 place-items-center rounded-2xl {tone}" aria-hidden="true"><Icon size={22} strokeWidth={2.3} /></span>
    <div class="min-w-0">
      <h2 id="{id}-title" class="text-lg leading-tight font-bold">{title}</h2>
      {#if subtitle}<p class="mt-0.5 text-sm text-ink-muted">{subtitle}</p>{/if}
    </div>
  </header>
  <div class="flex flex-col divide-y divide-line">
    {@render children()}
  </div>
</section>
