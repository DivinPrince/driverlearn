<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import Info from '@lucide/svelte/icons/info'
  import { tr, T } from '../../lib/i18n'

  type Tone = 'leaf' | 'flame' | 'sun'

  interface Props {
    href: string
    emoji: string
    title: string
    description: string
    count: number
    /** Short word under the count, e.g. "to fix". */
    countLabel: string
    /** Shown instead of the description when there is nothing to practise (count 0). */
    emptyHint: string
    tone: Tone
  }

  let { href, emoji, title, description, count, countLabel, emptyHint, tone }: Props = $props()

  const TONES: Record<Tone, { badge: string; count: string; hover: string; go: string }> = {
    leaf: {
      badge: 'bg-leaf-100 dark:bg-leaf-700/30',
      count: 'text-leaf-600 dark:text-leaf-400',
      hover: 'hover:border-leaf-400 dark:hover:border-leaf-600',
      go: 'text-leaf-600 dark:text-leaf-400',
    },
    flame: {
      badge: 'bg-flame-100 dark:bg-flame-700/30',
      count: 'text-flame-600 dark:text-flame-400',
      hover: 'hover:border-flame-400 dark:hover:border-flame-600',
      go: 'text-flame-600 dark:text-flame-400',
    },
    sun: {
      badge: 'bg-sun-100 dark:bg-sun-400/15',
      count: 'text-sun-600 dark:text-sun-300',
      hover: 'hover:border-sun-400 dark:hover:border-sun-600',
      go: 'text-sun-600 dark:text-sun-300',
    },
  }

  const t = $derived(TONES[tone])
  const empty = $derived(count <= 0)
</script>

{#snippet body()}
  <span
    class="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl transition-transform sm:size-14 sm:text-3xl {t.badge} {empty
      ? 'grayscale'
      : 'group-hover:scale-105 group-hover:-rotate-3'}"
    aria-hidden="true">{emoji}</span
  >
  <div class="min-w-0 flex-1 sm:pr-14">
    <h3 class="text-lg leading-tight font-bold">{title}</h3>
    {#if empty}
      <p class="mt-1 flex items-start gap-1.5 text-sm text-ink-muted">
        <Info size={15} class="mt-0.5 shrink-0" aria-hidden="true" /><span>{emptyHint}</span>
      </p>
    {:else}
      <p class="mt-1 text-sm text-ink-muted">{description}</p>
    {/if}
  </div>
  <div class="flex shrink-0 flex-col items-end text-right sm:absolute sm:top-5 sm:right-5">
    <span class="font-display text-3xl leading-none font-black tabular-nums {empty ? 'text-ink-faint' : t.count}">{count}</span>
    <span class="mt-1 text-[0.7rem] font-bold text-ink-faint">{countLabel}</span>
  </div>
  {#if !empty}
    <ChevronRight size={20} class="-mr-1 shrink-0 text-ink-faint sm:hidden" aria-hidden="true" />
  {/if}
{/snippet}

{#if empty}
  <div
    class="card-flat relative flex items-center gap-4 border-dashed bg-surface-2/60 p-4 sm:flex-col sm:items-start sm:gap-3 sm:p-5"
    aria-disabled="true"
  >
    {@render body()}
  </div>
{:else}
  <a
    {href}
    class="card group relative flex items-center gap-4 p-4 transition hover:-translate-y-0.5 sm:flex-col sm:items-start sm:gap-3 sm:p-5 {t.hover}"
  >
    {@render body()}
    <span class="mt-auto hidden items-center gap-0.5 font-display text-sm font-bold sm:inline-flex {t.go}" aria-hidden="true">
      {tr(T.start)}<ChevronRight size={16} class="transition-transform group-hover:translate-x-0.5" />
    </span>
  </a>
{/if}
