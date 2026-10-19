<script lang="ts">
  import Play from '@lucide/svelte/icons/play'
  import { QUESTIONS_BY_TOPIC } from '../../lib/data'
  import { topicStats } from '../../lib/engine/stats'
  import { tr } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import { TOPICS } from '../../lib/topics'
  import type { QState } from '../../lib/types'
  import { percent } from './format'

  interface Props {
    states: Record<number, QState>
  }

  let { states }: Props = $props()

  const rows = $derived(TOPICS.map((t) => ({ meta: t, stats: topicStats(t.id, QUESTIONS_BY_TOPIC[t.id] ?? [], states) })))

  /** The started topic with the weakest accuracy (below 80%) gets a gentle nudge. */
  const focusId = $derived.by(() => {
    let worst: (typeof rows)[number] | undefined
    for (const r of rows) {
      const acc = r.stats.accuracy
      if (acc === null || r.stats.seen < 3 || acc >= 0.8) continue
      if (!worst || acc < (worst.stats.accuracy ?? 1)) worst = r
    }
    return worst?.meta.id
  })

  const totals = $derived(rows.reduce((s, r) => ({ mastered: s.mastered + r.stats.mastered, total: s.total + r.stats.total }), { mastered: 0, total: 0 }))
</script>

<section class="card p-5 sm:p-6" aria-labelledby="topics-title">
  <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
    <h2 id="topics-title" class="text-lg font-bold">{tr({ en: 'Topic mastery', rw: 'Uko uzi buri somo' })}</h2>
    <p class="text-xs font-bold text-ink-faint">
      {tr({ en: '{m} of {t} questions mastered', rw: 'Ibibazo {m} kuri {t} wabimenye neza' }, { m: totals.mastered, t: totals.total })}
    </p>
  </div>

  <ul class="mt-3 grid grid-cols-1 gap-x-8 lg:grid-cols-2">
    {#each rows as { meta, stats } (meta.id)}
      {@const empty = stats.total === 0}
      {@const done = !empty && stats.mastered === stats.total}
      <li class="flex items-center gap-3 border-t border-line py-3.5 first:border-t-0 lg:nth-2:border-t-0 {empty ? 'opacity-55' : ''}">
        <span
          class="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-2xl shadow-sm {meta.gradient}"
          aria-hidden="true">{meta.emoji}</span
        >
        <div class="min-w-0 flex-1">
          <div class="flex items-start gap-2">
            <p class="min-w-0 flex-1 font-display leading-tight font-bold text-balance">{tr(meta.name)}</p>
            <p class="shrink-0 text-xs font-bold text-ink-muted tabular-nums">
              {#if empty}—{:else}{stats.mastered}/{stats.total}{/if}
            </p>
          </div>
          <div class="mt-1.5 flex items-center gap-2">
            <div
              class="bar h-2.5 flex-1"
              role="progressbar"
              aria-label={tr({ en: '{t} mastery', rw: 'Uko uzi {t}' }, { t: tr(meta.name) })}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent(stats.mastery)}
            >
              <span style:width="{stats.mastery * 100}%" style:background-color={meta.color}></span>
            </div>
            <span class="w-9 shrink-0 text-right font-display text-xs font-bold tabular-nums">{percent(stats.mastery)}%</span>
          </div>
          <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
            {#if empty}
              {tr({ en: 'No questions yet', rw: 'Nta bibazo birimo' })}
            {:else if stats.accuracy === null}
              {tr({ en: 'Not started yet', rw: 'Ntiwaritangira' })}
            {:else}
              <span>{tr({ en: '{p}% correct', rw: '{p}% ni byo' }, { p: percent(stats.accuracy) })}</span>
              <span aria-hidden="true">·</span>
              <span>{tr({ en: '{s} of {t} seen', rw: 'Wabonye {s} kuri {t}' }, { s: stats.seen, t: stats.total })}</span>
            {/if}
            {#if done}
              <span class="chip bg-leaf-100 px-2 py-0 text-[11px] text-leaf-700 dark:bg-leaf-700/25 dark:text-leaf-400"
                >🏆 {tr({ en: 'Mastered', rw: 'Warabimenye' })}</span
              >
            {:else if meta.id === focusId}
              <span class="chip bg-sun-100 px-2 py-0 text-[11px] text-sun-600 dark:bg-sun-600/20 dark:text-sun-300"
                >💪 {tr({ en: 'Focus here', rw: 'Shyiramo imbaraga' })}</span
              >
            {/if}
          </p>
        </div>
        {#if !empty}
          <a
            href={href('/practice', { mode: 'topic', topic: meta.id })}
            class="btn btn-soft btn-sm btn-icon shrink-0 sm:aspect-auto sm:px-3"
            aria-label={tr({ en: 'Practise {t}', rw: 'Witoze {t}' }, { t: tr(meta.name) })}
          >
            <Play size={16} fill="currentColor" />
            <span class="hidden sm:inline">{tr({ en: 'Practise', rw: 'Witoze' })}</span>
          </a>
        {/if}
      </li>
    {/each}
  </ul>
</section>
