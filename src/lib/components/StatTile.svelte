<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    label: string
    value: string | number
    /** Small text under the value. */
    hint?: string
    /** Emoji or short glyph shown in the colored badge. */
    emoji?: string
    /** Tailwind classes for the badge background. */
    tone?: string
    icon?: Snippet
  }

  let { label, value, hint, emoji, tone = 'bg-brand-100 dark:bg-brand-900/50', icon }: Props = $props()
</script>

<div class="card flex items-center gap-3 p-4">
  {#if emoji || icon}
    <span class="grid size-11 shrink-0 place-items-center rounded-2xl text-xl {tone}" aria-hidden="true">
      {#if icon}{@render icon()}{:else}{emoji}{/if}
    </span>
  {/if}
  <div class="min-w-0">
    <p class="font-display text-2xl leading-none font-bold">{value}</p>
    <p class="mt-1 line-clamp-2 text-xs leading-tight font-bold text-ink-muted">{label}</p>
    {#if hint}<p class="line-clamp-2 text-xs leading-tight text-ink-faint">{hint}</p>{/if}
  </div>
</div>
