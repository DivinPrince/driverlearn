<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import type { Snippet } from 'svelte'
  import { tr, T } from '../i18n'
  import { back } from '../router.svelte'

  interface Props {
    title: string
    subtitle?: string
    /** Show a back button; the string is the fallback route when there is no history. */
    backTo?: string
    actions?: Snippet
  }

  let { title, subtitle, backTo, actions }: Props = $props()
</script>

<header class="mb-6 flex items-center gap-3">
  {#if backTo}
    <button class="btn btn-soft btn-icon btn-sm" onclick={() => back(backTo)} aria-label={tr(T.back)}><ArrowLeft size={20} /></button>
  {/if}
  <div class="min-w-0 flex-1">
    <h1 class="truncate text-2xl font-bold sm:text-3xl">{title}</h1>
    {#if subtitle}<p class="mt-0.5 text-sm text-ink-muted">{subtitle}</p>{/if}
  </div>
  {#if actions}<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>{/if}
</header>
