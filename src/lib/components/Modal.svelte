<script lang="ts">
  import X from '@lucide/svelte/icons/x'
  import type { Snippet } from 'svelte'
  import { tr, T } from '../i18n'

  interface Props {
    open: boolean
    onclose: () => void
    title?: string
    /** Hide the corner close button (e.g. for forced choices). */
    dismissable?: boolean
    size?: 'sm' | 'md' | 'lg' | 'full'
    children: Snippet
    footer?: Snippet
  }

  let { open, onclose, title, dismissable = true, size = 'md', children, footer }: Props = $props()

  let dialog: HTMLDialogElement | undefined = $state()

  $effect(() => {
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  })

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl', full: 'max-w-5xl' }
</script>

<dialog
  bind:this={dialog}
  class="m-auto w-[calc(100%-1.5rem)] {widths[size]} rounded-4xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-brand-950/60 backdrop:backdrop-blur-sm open:animate-pop"
  oncancel={(e) => {
    e.preventDefault()
    if (dismissable) onclose()
  }}
  onclick={(e) => {
    if (dismissable && e.target === dialog) onclose()
  }}
>
  {#if open}
    <div class="flex max-h-[85dvh] flex-col">
      {#if title || dismissable}
        <header class="flex items-center gap-3 px-6 pt-5">
          {#if title}<h2 class="flex-1 text-xl font-bold">{title}</h2>{:else}<span class="flex-1"></span>{/if}
          {#if dismissable}
            <button class="btn btn-ghost btn-icon -mr-2" onclick={onclose} aria-label={tr(T.close)}><X size={20} /></button>
          {/if}
        </header>
      {/if}
      <div class="overflow-y-auto px-6 py-4">{@render children()}</div>
      {#if footer}<footer class="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">{@render footer()}</footer>{/if}
    </div>
  {/if}
</dialog>
