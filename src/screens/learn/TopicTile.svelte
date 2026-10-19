<script lang="ts">
  import ListChecks from '@lucide/svelte/icons/list-checks'
  import ProgressRing from '../../lib/components/ProgressRing.svelte'
  import type { TopicStats } from '../../lib/engine/stats'
  import { tr, T } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import type { TopicMeta } from '../../lib/topics'

  interface Props {
    topic: TopicMeta
    stats: TopicStats
    /** Questions per practice session. */
    size: number
    /** Highlight as the learner's weakest topic. */
    weak?: boolean
  }

  let { topic, stats, size, weak = false }: Props = $props()

  const pct = $derived(Math.round(stats.mastery * 100))
  const done = $derived(stats.total > 0 && stats.mastered === stats.total)
</script>

<article class="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-line-strong">
  <div class="h-1.5 bg-gradient-to-r {topic.gradient}" aria-hidden="true"></div>

  <a
    href={href('/practice', { mode: 'topic', topic: topic.id, n: size })}
    class="flex flex-1 items-start gap-3 p-4 transition-colors hover:bg-surface-2/50 focus-visible:-outline-offset-4"
  >
    <span
      class="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-3xl shadow-sm transition-transform group-hover:scale-105 group-hover:-rotate-3 {topic.gradient}"
      aria-hidden="true">{topic.emoji}</span
    >
    <div class="min-w-0 flex-1">
      <h3 class="leading-tight font-bold">{tr(topic.name)}</h3>
      <p class="mt-0.5 text-sm text-ink-muted">{tr(topic.blurb)}</p>
      {#if done}
        <span class="mt-2 chip bg-leaf-100 text-leaf-700 dark:bg-leaf-700/30 dark:text-leaf-400">👑 {tr(T.mastered)}</span>
      {:else if weak}
        <span class="mt-2 chip bg-flame-100 text-flame-600 dark:bg-flame-700/30 dark:text-flame-400"
          >🎯 {tr({ en: 'Needs practice', rw: 'Ukeneye kwitoza' })}</span
        >
      {/if}
    </div>
    <ProgressRing
      value={stats.mastery}
      size={52}
      stroke={6}
      color={topic.color}
      label={tr({ en: '{p}% mastered', rw: '{p}% wamenye neza' }, { p: pct })}
    />
  </a>

  <div class="flex items-center gap-2 border-t border-line px-4 py-2 text-xs">
    <p class="min-w-0 flex-1 leading-snug">
      <span class="block truncate font-bold text-ink-muted">
        {tr({ en: '{m} / {t} mastered', rw: '{m} / {t} wamenye neza' }, { m: stats.mastered, t: stats.total })}
      </span>
      <span class="block truncate text-ink-faint">
        {#if stats.accuracy !== null}
          {tr({ en: '{p}% accuracy', rw: 'Ukuri: {p}%' }, { p: Math.round(stats.accuracy * 100) })}
        {:else}
          {tr({ en: 'Not started yet', rw: 'Ntiwaratangira' })}
        {/if}
      </span>
    </p>
    <a
      href={href('/library', { topic: topic.id })}
      class="-mr-2 inline-flex shrink-0 items-center gap-1 rounded-xl px-2 py-1.5 font-bold text-brand-600 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/60"
    >
      <ListChecks size={14} aria-hidden="true" />{tr({ en: 'Study list', rw: 'Soma ibibazo' })}
    </a>
  </div>
</article>
