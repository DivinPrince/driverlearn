<script lang="ts">
  import { lastDays } from '../../lib/engine/dates'
  import { tr } from '../../lib/i18n'
  import type { DayStats } from '../../lib/types'
  import { formatDayLong, keyToDate, percent, WEEKDAYS_SHORT, weekdayIndex } from './format'

  interface Props {
    days: Record<string, DayStats>
    today: string
    goal: number
  }

  let { days, today, goal }: Props = $props()

  /** Space above the tallest bar for its value label, and below the plot for the day labels (px). */
  const HEADROOM = 20
  const AXIS = 26

  /** The chart fills whatever height the card gets (it sits beside the taller heatmap on desktop). */
  let boxH = $state(0)
  const plot = $derived(Math.max(120, Math.min(boxH - HEADROOM - AXIS, 260)))

  const week = $derived(
    lastDays(today, 7).map((key) => {
      const answered = days[key]?.answered ?? 0
      const correct = Math.min(days[key]?.correct ?? 0, answered)
      return { key, answered, correct, missed: answered - correct, weekday: weekdayIndex(keyToDate(key)) }
    }),
  )

  const max = $derived(Math.max(goal * 1.2, ...week.map((d) => d.answered), 5))
  const totals = $derived(
    week.reduce((s, d) => ({ answered: s.answered + d.answered, correct: s.correct + d.correct }), { answered: 0, correct: 0 }),
  )

  const px = (n: number) => (n > 0 ? Math.max((n / max) * plot, 3) : 0)
  const goalY = $derived((goal / max) * plot)

  function describe(d: (typeof week)[number]): string {
    if (!d.answered) return tr({ en: '{d}: no practice', rw: '{d}: nta myitozo' }, { d: formatDayLong(d.key) })
    return tr(
      { en: '{d}: {n} answered, {c} correct ({p}%)', rw: '{d}: wasubije {n}, {c} ni byo ({p}%)' },
      { d: formatDayLong(d.key), n: d.answered, c: d.correct, p: percent(d.correct / d.answered) },
    )
  }
</script>

<section class="card flex h-full flex-col p-5 sm:p-6" aria-labelledby="week-title">
  <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
    <h2 id="week-title" class="text-lg font-bold">{tr({ en: 'Last 7 days', rw: 'Iminsi 7 ishize' })}</h2>
    <div class="flex items-center gap-3 text-xs font-bold text-ink-muted">
      <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-[3px] bg-leaf-500"></span>{tr({ en: 'Correct', rw: 'Ni byo' })}</span>
      <span class="flex items-center gap-1.5"
        ><span class="size-2.5 rounded-[3px] bg-flame-200 dark:bg-flame-700/60"></span>{tr({ en: 'Missed', rw: 'Si byo' })}</span
      >
    </div>
  </div>

  <div class="relative mt-4 min-h-48 flex-1" bind:clientHeight={boxH}>
    <div class="absolute inset-0 flex flex-col justify-end">
      <!-- plot: bars on the left, a right gutter holds the goal label -->
      <div class="relative pr-9" style:height="{plot + HEADROOM}px">
        <!-- goal line (a threshold, so dashed) -->
        <div class="pointer-events-none absolute inset-x-0 z-10" style:bottom="{goalY}px" aria-hidden="true">
          <div class="mr-9 border-t-2 border-dashed border-sun-400 dark:border-sun-500"></div>
          <span
            class="absolute right-0 -translate-y-1/2 rounded-full bg-sun-100 px-1.5 text-[10px] leading-4 font-extrabold whitespace-nowrap text-sun-600 dark:bg-sun-600/25 dark:text-sun-300"
            >🎯 {goal}</span
          >
        </div>

        <ol class="flex h-full items-end gap-1.5 border-b border-line sm:gap-2">
          {#each week as d (d.key)}
            <li class="flex h-full min-w-0 flex-1 flex-col items-center justify-end" title={describe(d)}>
              <span class="sr-only">{describe(d)}</span>
              {#if d.answered}
                <span class="mb-1 font-display text-xs font-bold text-ink-muted tabular-nums" aria-hidden="true">{d.answered}</span>
              {/if}
              <div class="flex w-full max-w-6 flex-col gap-[2px]" aria-hidden="true">
                {#if d.missed}
                  <span class="block rounded-t-[4px] bg-flame-200 dark:bg-flame-700/60" style:height="{px(d.missed)}px"></span>
                {/if}
                {#if d.correct}
                  <span class="block bg-leaf-500 {d.missed ? '' : 'rounded-t-[4px]'}" style:height="{px(d.correct)}px"></span>
                {/if}
              </div>
            </li>
          {/each}
        </ol>
      </div>

      <!-- day labels -->
      <div class="mt-1.5 flex gap-1.5 pr-9 sm:gap-2" aria-hidden="true">
        {#each week as d (d.key)}
          <span class="flex min-w-0 flex-1 justify-center">
            <span
              class="rounded-full px-1 text-center text-[11px] leading-5 font-bold whitespace-nowrap {d.key === today
                ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300'
                : 'text-ink-faint'}"
            >
              {tr(WEEKDAYS_SHORT[d.weekday])}
            </span>
          </span>
        {/each}
      </div>
    </div>
  </div>

  <p class="mt-4 text-sm text-ink-muted">
    {#if totals.answered}
      {tr(
        { en: '{n} answers in 7 days · {p}% correct', rw: 'Ibisubizo {n} mu minsi 7 · {p}% ni byo' },
        { n: totals.answered, p: percent(totals.correct / totals.answered) },
      )}
    {:else}
      {tr({ en: 'No practice in the last 7 days yet — a few questions a day go a long way!', rw: 'Nta myitozo mu minsi 7 ishize — ibibazo bike buri munsi bigufasha cyane!' })}
    {/if}
  </p>
</section>
