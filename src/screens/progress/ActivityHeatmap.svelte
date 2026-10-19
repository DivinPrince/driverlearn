<script lang="ts">
  import { tick } from 'svelte'
  import { shiftDay } from '../../lib/engine/dates'
  import { tr } from '../../lib/i18n'
  import type { DayStats } from '../../lib/types'
  import { formatDayLong, formatNumber, keyToDate, MONTHS_SHORT, WEEKDAYS_SHORT, weekdayIndex } from './format'

  interface Props {
    days: Record<string, DayStats>
    /** Today's 'YYYY-MM-DD' key. */
    today: string
    /** Daily goal (questions per day); sets the intensity scale. */
    goal: number
  }

  let { days, today, goal }: Props = $props()

  const WEEKS = 16
  const ROWS = [0, 1, 2, 3, 4, 5, 6]

  interface Cell {
    key: string
    future: boolean
    answered: number
    correct: number
    level: number
  }

  /** First Monday shown: 15 full weeks before the current week. */
  const start = $derived(shiftDay(today, -weekdayIndex(keyToDate(today)) - (WEEKS - 1) * 7))

  /** Minimum answered count for intensity levels 1..4 (level 3 = daily goal reached). */
  const thresholds = $derived.by(() => {
    const t = [1, Math.ceil(goal / 2), goal, goal * 2]
    for (let i = 1; i < t.length; i++) t[i] = Math.max(t[i], t[i - 1] + 1)
    return t
  })

  function levelOf(n: number): number {
    let l = 0
    for (const t of thresholds) if (n >= t) l++
    return l
  }

  const weeks: Cell[][] = $derived(
    Array.from({ length: WEEKS }, (_, w) =>
      ROWS.map((d) => {
        const key = shiftDay(start, w * 7 + d)
        const answered = days[key]?.answered ?? 0
        return { key, future: key > today, answered, correct: days[key]?.correct ?? 0, level: levelOf(answered) }
      }),
    ),
  )

  /** Month name above the first week of each month (skipped when it would collide). */
  const monthLabels = $derived.by(() => {
    const months = weeks.map((w) => keyToDate(w[0].key).getMonth())
    return months.map((m, w) => {
      if (w > 0 && m === months[w - 1]) return ''
      if (w === 0) {
        const nextChange = months.findIndex((x) => x !== m)
        if (nextChange > 0 && nextChange < 3) return ''
      }
      return tr(MONTHS_SHORT[m])
    })
  })

  const summary = $derived.by(() => {
    let answered = 0
    let active = 0
    let goalDays = 0
    for (const w of weeks)
      for (const c of w) {
        answered += c.answered
        if (c.answered > 0) active++
        if (c.answered >= goal) goalDays++
      }
    return { answered, active, goalDays }
  })

  const LEVEL_CLASS = [
    'bg-surface-3',
    'bg-leaf-200 dark:bg-leaf-700/55',
    'bg-leaf-400 dark:bg-leaf-600',
    'bg-leaf-600 dark:bg-leaf-400',
    'bg-leaf-700 dark:bg-leaf-200',
  ]

  const legend = $derived(
    LEVEL_CLASS.map((cls, i) => {
      const lo = i === 0 ? 0 : thresholds[i - 1]
      const hi = i === 0 ? 0 : i < thresholds.length ? thresholds[i] - 1 : Infinity
      const range = i === 0 ? '0' : hi === Infinity ? `${lo}+` : lo === hi ? `${lo}` : `${lo}–${hi}`
      return { cls, label: range }
    }),
  )

  function describe(c: Cell): string {
    const day = formatDayLong(c.key)
    if (!c.answered) return tr({ en: '{d}: no practice', rw: '{d}: nta myitozo' }, { d: day })
    return tr(
      { en: '{d}: {n} answered, {c} correct', rw: '{d}: wasubije ibibazo {n}, {c} ni byo' },
      { d: day, n: c.answered, c: c.correct },
    )
  }

  let grid: HTMLDivElement | undefined = $state()
  /** Day that owns the single tab stop (roving tabindex). */
  let focusKey: string | null = $state(null)
  /** Day picked by tap / keyboard, shown in the readout. */
  let pinned: string | null = $state(null)
  let hovered: string | null = $state(null)

  const tabKey = $derived(focusKey ?? today)
  const activeKey = $derived(hovered ?? pinned)
  const activeCell = $derived(activeKey ? weeks.flat().find((c) => c.key === activeKey) : undefined)

  const STEPS: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }

  async function onkeydown(e: KeyboardEvent, key: string) {
    let next: string | null = null
    if (e.key in STEPS) next = shiftDay(key, STEPS[e.key])
    else if (e.key === 'Home') next = start
    else if (e.key === 'End') next = today
    if (!next) return
    e.preventDefault()
    if (next < start || next > today) return
    focusKey = next
    pinned = next
    await tick()
    grid?.querySelector<HTMLButtonElement>(`[data-day="${next}"]`)?.focus()
  }
</script>

<section class="card flex h-full flex-col p-5 sm:p-6" aria-labelledby="activity-title">
  <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
    <h2 id="activity-title" class="text-lg font-bold">{tr({ en: 'Activity', rw: 'Uko witoza' })}</h2>
    <p class="text-xs font-bold text-ink-faint">{tr({ en: 'Last 16 weeks', rw: 'Ibyumweru 16 bishize' })}</p>
  </div>

  <div class="mt-3 flex flex-wrap gap-2">
    <span class="chip">📝 {tr({ en: '{n} answers', rw: 'Ibisubizo {n}' }, { n: formatNumber(summary.answered) })}</span>
    <span class="chip">📅 {tr({ en: '{n} active days', rw: 'Iminsi {n} wize' }, { n: summary.active })}</span>
    <span class="chip">🎯 {tr({ en: '{n} goal days', rw: 'Iminsi {n} wageze ku ntego' }, { n: summary.goalDays })}</span>
  </div>

  <div class="-mx-1 mt-4 overflow-x-auto px-1 pt-1 pb-1">
    <div
      bind:this={grid}
      class="grid max-w-[30rem] min-w-[17.5rem] gap-[3px]"
      style:grid-template-columns="auto repeat({WEEKS}, minmax(0, 1fr))"
      role="group"
      aria-label={tr({ en: 'Daily activity calendar, use arrow keys to move between days', rw: 'Kalendari y’imyitozo ya buri munsi, koresha utwambi ugende ku minsi' })}
    >
      <span></span>
      {#each monthLabels as m, w (w)}
        <span class="h-4 text-[10px] leading-4 font-bold whitespace-nowrap text-ink-faint" aria-hidden="true">{m}</span>
      {/each}

      {#each ROWS as d (d)}
        <span class="self-center pr-1.5 text-[10px] leading-none font-bold text-ink-faint" aria-hidden="true">
          {d % 2 === 0 && d < 6 ? tr(WEEKDAYS_SHORT[d]) : ''}
        </span>
        {#each weeks as week, w (w)}
          {@const c = week[d]}
          {#if c.future}
            <span class="aspect-square" aria-hidden="true"></span>
          {:else}
            <button
              type="button"
              data-day={c.key}
              tabindex={c.key === tabKey ? 0 : -1}
              class="aspect-square w-full rounded-[4px] transition-transform duration-100 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-1 {LEVEL_CLASS[
                c.level
              ]} {c.key === activeKey
                ? 'ring-2 ring-ink ring-offset-1 ring-offset-surface'
                : c.key === today
                  ? 'ring-2 ring-brand-400 ring-offset-1 ring-offset-surface'
                  : ''}"
              title={describe(c)}
              aria-label={describe(c)}
              aria-pressed={c.key === pinned}
              onclick={() => {
                pinned = pinned === c.key ? null : c.key
                focusKey = c.key
              }}
              onpointerenter={(e) => {
                if (e.pointerType === 'mouse') hovered = c.key
              }}
              onpointerleave={() => {
                if (hovered === c.key) hovered = null
              }}
              onkeydown={(e) => onkeydown(e, c.key)}
            ></button>
          {/if}
        {/each}
      {/each}
    </div>
  </div>

  <!-- Readout: what the hovered / tapped day means (tooltips don't exist on touch screens). -->
  <p class="mt-3 min-h-5 text-sm font-semibold text-ink-muted" aria-live="polite">
    {#if activeCell}
      <span class="text-ink">{formatDayLong(activeCell.key)}</span> ·
      {#if activeCell.answered}
        {tr({ en: '{n} answered · {c} correct', rw: 'Wasubije {n} · {c} ni byo' }, { n: activeCell.answered, c: activeCell.correct })}
        {#if activeCell.answered >= goal}<span aria-hidden="true">🎯</span><span class="sr-only"
            >{tr({ en: 'daily goal reached', rw: 'intego y’umunsi yagezweho' })}</span
          >{/if}
      {:else}
        {tr({ en: 'no practice', rw: 'nta myitozo' })}
      {/if}
    {:else}
      <span class="text-ink-faint">{tr({ en: 'Tap a day to see the details.', rw: 'Kanda ku munsi urebe ibisobanuro.' })}</span>
    {/if}
  </p>

  <div class="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3 text-xs font-bold text-ink-faint">
    <div class="flex items-center gap-1.5">
      <span>{tr({ en: 'Less', rw: 'Bike' })}</span>
      {#each legend as l, i (i)}
        <span class="size-3.5 rounded-[3px] {l.cls}" title={l.label}></span>
      {/each}
      <span>{tr({ en: 'More', rw: 'Byinshi' })}</span>
    </div>
    <span>🎯 {tr({ en: '{n}+ = daily goal', rw: '{n}+ = intego y’umunsi' }, { n: goal })}</span>
  </div>
</section>
