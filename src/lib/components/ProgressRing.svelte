<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    /** 0..1 */
    value: number
    size?: number
    stroke?: number
    /** CSS color of the filled arc. */
    color?: string
    track?: string
    label?: string
    children?: Snippet
  }

  let { value, size = 72, stroke = 8, color = 'var(--color-brand-500)', track = 'var(--surface-3)', label, children }: Props = $props()

  const r = $derived((size - stroke) / 2)
  const c = $derived(2 * Math.PI * r)
  const v = $derived(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)))
</script>

<div
  class="relative inline-grid shrink-0 place-items-center"
  style:width="{size}px"
  style:height="{size}px"
  role="img"
  aria-label={label ?? `${Math.round(v * 100)}%`}
>
  <svg width={size} height={size} viewBox="0 0 {size} {size}" class="-rotate-90">
    <circle cx={size / 2} cy={size / 2} {r} fill="none" stroke={track} stroke-width={stroke} />
    <circle
      cx={size / 2}
      cy={size / 2}
      {r}
      fill="none"
      stroke={color}
      stroke-width={stroke}
      stroke-linecap="round"
      stroke-dasharray={c}
      stroke-dashoffset={c * (1 - v)}
      class="transition-[stroke-dashoffset] duration-700 ease-out"
    />
  </svg>
  <div class="absolute inset-0 grid place-items-center text-center leading-none">
    {#if children}{@render children()}{:else}<span class="font-display text-sm font-bold">{Math.round(v * 100)}%</span>{/if}
  </div>
</div>
