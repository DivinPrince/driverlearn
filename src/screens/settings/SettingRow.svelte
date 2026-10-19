<script lang="ts">
  /**
   * One setting: a label + optional description, and a control. The control snippet receives
   * the ids of the label and description so it can reference them (aria-labelledby / -describedby).
   * layout: 'inline' puts the control on the right, 'stacked' under the text,
   * 'responsive' under the text on phones and on the right from the sm breakpoint.
   */
  import type { Snippet } from 'svelte'

  interface Props {
    label: string
    description?: string
    layout?: 'inline' | 'stacked' | 'responsive'
    control: Snippet<[{ labelId: string; descId: string | undefined }]>
    /** Extra content under the row (notes, previews, status messages). */
    children?: Snippet
  }

  let { label, description, layout = 'inline', control, children }: Props = $props()
  const id = $props.id()
  const labelId = `${id}-label`
  const descId = $derived(description ? `${id}-desc` : undefined)

  const LAYOUTS = {
    inline: 'flex items-center gap-4',
    stacked: 'flex flex-col gap-3',
    responsive: 'flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4',
  }
</script>

<div class="py-4 last:pb-0">
  <div class={LAYOUTS[layout]}>
    <div class="min-w-0 flex-1">
      <p id={labelId} class="font-display font-bold">{label}</p>
      {#if description}<p id={descId} class="mt-0.5 text-sm text-ink-muted">{description}</p>{/if}
    </div>
    {@render control({ labelId, descId })}
  </div>
  {#if children}{@render children()}{/if}
</div>
