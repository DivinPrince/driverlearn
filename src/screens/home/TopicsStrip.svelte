<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import ProgressRing from '../../lib/components/ProgressRing.svelte'
  import { QUESTIONS_BY_TOPIC } from '../../lib/data'
  import { topicStats } from '../../lib/engine/stats'
  import { tr, T } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import { progress } from '../../lib/state/progress.svelte'
  import { TOPICS } from '../../lib/topics'

  const topics = $derived(
    TOPICS.map((meta) => ({ meta, stats: topicStats(meta.id, QUESTIONS_BY_TOPIC[meta.id] ?? [], progress.q) })),
  )
</script>

<section class="card p-5" aria-labelledby="home-topics-title">
  <div class="flex items-center justify-between gap-3">
    <h2 id="home-topics-title" class="text-xl font-bold">{tr({ en: 'Topics', rw: 'Amasomo' })}</h2>
    <a class="btn btn-ghost btn-sm -mr-2 text-brand-600 dark:text-brand-300" href={href('/learn')}>
      {tr({ en: 'See all', rw: 'Reba yose' })}<ChevronRight size={18} strokeWidth={2.6} aria-hidden="true" />
    </a>
  </div>

  <ul
    class="-mx-5 mt-2 flex snap-x snap-mandatory scroll-px-5 gap-0.5 overflow-x-auto px-5 pb-1 [mask-image:linear-gradient(to_right,black_calc(100%-1.75rem),transparent)] [scrollbar-width:none] after:block after:w-8 after:shrink-0 after:content-[''] lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-2 lg:overflow-visible lg:px-0 lg:[mask-image:none] lg:after:hidden"
    aria-label={tr({ en: 'Topics', rw: 'Amasomo' })}
  >
    {#each topics as { meta, stats } (meta.id)}
      {@const pct = Math.round(stats.mastery * 100)}
      {@const empty = stats.total === 0}
      <li class="w-24 shrink-0 snap-start lg:w-auto">
        {#snippet tile()}
          <ProgressRing value={stats.mastery} size={72} stroke={6} color={meta.color} label="{pct}% {tr(T.mastered).toLowerCase()}">
            <span
              class="grid size-[3.25rem] place-items-center rounded-full bg-gradient-to-br text-[1.6rem] shadow-inner {meta.gradient} {empty ? 'grayscale' : ''}"
              aria-hidden="true">{meta.emoji}</span
            >
          </ProgressRing>
          <span class="line-clamp-3 min-h-[2.5em] text-[0.8rem] leading-tight font-bold">{tr(meta.name)}</span>
          <span class="text-xs font-bold text-ink-faint tabular-nums">
            {#if empty}{tr({ en: 'Coming soon', rw: 'Biraza vuba' })}{:else}{pct}% · {stats.seen}/{stats.total}{/if}
          </span>
        {/snippet}
        {#if empty}
          <div class="flex flex-col items-center gap-1.5 rounded-3xl px-1 py-2 text-center opacity-55">{@render tile()}</div>
        {:else}
          <a
            href={href('/practice', { mode: 'topic', topic: meta.id })}
            class="flex flex-col items-center gap-1.5 rounded-3xl px-1 py-2 text-center transition hover:bg-surface-2 active:scale-[0.98]"
          >
            {@render tile()}
          </a>
        {/if}
      </li>
    {/each}
  </ul>
</section>
