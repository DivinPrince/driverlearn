<script lang="ts" generics="V extends string | number">
  /**
   * Segmented control built as an ARIA radio group: Tab focuses the selected option,
   * arrow keys / Home / End move the selection.
   */
  import type { Component } from 'svelte'
  import { radioKeydown, rovingTabindex } from './radio'

  interface SegmentOption {
    value: V
    label: string
    /** Small second line under the label. */
    hint?: string
    /** Emoji shown before / above the label. */
    emoji?: string
    icon?: Component<{ size?: number; strokeWidth?: number }>
  }

  interface Props {
    value: V
    options: readonly SegmentOption[]
    label?: string
    labelledby?: string
    describedby?: string
    /** Stack the icon / emoji above the label (for tall tiles). */
    stacked?: boolean
    /** Extra classes for the grid, e.g. column overrides like 'grid-cols-2 sm:grid-cols-4'. */
    class?: string
    onchange?: (value: V) => void
  }

  let {
    value = $bindable(),
    options,
    label,
    labelledby,
    describedby,
    stacked = false,
    class: klass = '',
    onchange,
  }: Props = $props()

  let group: HTMLElement | undefined = $state()
  const values = $derived(options.map((o) => o.value))

  function select(v: V) {
    if (v === value) return
    value = v
    onchange?.(v)
  }
</script>

<div
  bind:this={group}
  role="radiogroup"
  tabindex="-1"
  aria-label={label}
  aria-labelledby={labelledby}
  aria-describedby={describedby}
  class="grid gap-1 rounded-2xl border border-line bg-surface-2 p-1 {klass || 'auto-cols-fr grid-flow-col'}"
  onkeydown={(e) => radioKeydown(e, group, values, value, select)}
>
  {#each options as o (o.value)}
    {@const checked = o.value === value}
    {@const Icon = o.icon}
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      tabindex={rovingTabindex(values, value, o.value)}
      onclick={() => select(o.value)}
      class="flex min-w-0 items-center justify-center rounded-xl px-2 py-2 text-center font-display leading-tight transition-[background-color,color,box-shadow] duration-150 {stacked
        ? 'flex-col gap-1 py-2.5'
        : 'gap-1.5'} {checked
        ? 'bg-surface font-bold text-brand-600 shadow-[0_2px_0_var(--line-strong)] ring-1 ring-line-strong dark:bg-surface-3 dark:text-brand-300'
        : 'font-semibold text-ink-muted hover:bg-surface/60 hover:text-ink dark:hover:bg-surface-3/50'}"
    >
      {#if Icon}<Icon size={stacked ? 20 : 17} strokeWidth={checked ? 2.5 : 2.1} />{/if}
      {#if o.emoji}<span class={stacked ? 'text-xl leading-none' : ''} aria-hidden="true">{o.emoji}</span>{/if}
      <span class="flex min-w-0 flex-col">
        <span class="text-[0.95rem]">{o.label}</span>
        {#if o.hint}<span class="mt-0.5 text-[0.7rem] font-semibold {checked ? 'text-brand-500 dark:text-brand-400' : 'text-ink-faint'}">{o.hint}</span>{/if}
      </span>
    </button>
  {/each}
</div>
