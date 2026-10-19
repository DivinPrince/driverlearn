<script lang="ts">
  import Check from '@lucide/svelte/icons/check'
  import Flame from '@lucide/svelte/icons/flame'
  import { lastDays } from '../../lib/engine/dates'
  import { bestStreak, currentStreak } from '../../lib/engine/gamify'
  import { tr, T } from '../../lib/i18n'
  import { progress } from '../../lib/state/progress.svelte'
  import { weekdayLong, weekdayShort } from './format'

  interface Props {
    /** Today's day key 'YYYY-MM-DD'. */
    today: string
  }

  let { today }: Props = $props()

  const streak = $derived(currentStreak(progress.days, today))
  const best = $derived(bestStreak(progress.days))
  const activeToday = $derived((progress.days[today]?.answered ?? 0) > 0)
  const week = $derived(
    lastDays(today, 7).map((key) => ({
      key,
      active: (progress.days[key]?.answered ?? 0) > 0,
      isToday: key === today,
    })),
  )

  const message = $derived.by(() => {
    if (activeToday) return tr({ en: 'You practised today. See you tomorrow!', rw: 'Wize uyu munsi. Uzagaruke ejo!' })
    if (streak > 0)
      return tr({
        en: 'Practise today so your streak doesn’t break!',
        rw: 'Itoze uyu munsi kugira ngo iminsi yawe ikurikiranye idacika!',
      })
    return tr({ en: 'Answer one question today to start a streak.', rw: 'Subiza nibura ikibazo kimwe uyu munsi utangire kubara iminsi.' })
  })
</script>

<section class="card flex h-full flex-col justify-center p-5" aria-labelledby="home-streak-title">
  <div class="flex items-center gap-3.5">
    <span
      class="grid size-14 shrink-0 place-items-center rounded-2xl transition {streak > 0
        ? 'bg-orange-100 text-orange-500 dark:bg-orange-500/20 dark:text-orange-300'
        : 'bg-surface-2 text-ink-faint'} {activeToday ? 'animate-pop' : ''}"
      aria-hidden="true"
    >
      <Flame size={32} strokeWidth={2.2} fill={activeToday ? 'currentColor' : 'none'} />
    </span>
    <div class="min-w-0 flex-1">
      <h2 id="home-streak-title" class="eyebrow font-sans">{tr(T.streak)}</h2>
      <p class="mt-0.5 font-display leading-none">
        <span class="text-4xl font-black tabular-nums">{streak}</span>
        <span class="ml-0.5 text-base font-bold text-ink-muted">
          {streak === 1 ? tr({ en: 'day', rw: 'umunsi' }) : tr({ en: 'days', rw: 'iminsi' })}
        </span>
      </p>
    </div>
    {#if best > 1}
      <span class="chip shrink-0" title={tr({ en: 'Best streak', rw: 'Agahigo kawe' })}>
        🏅 <span class="sr-only">{tr({ en: 'Best streak', rw: 'Agahigo kawe' })}:</span>{best}
      </span>
    {/if}
  </div>

  <ol class="mt-5 grid grid-cols-7 gap-1" aria-label={tr({ en: 'Last 7 days', rw: 'Iminsi 7 ishize' })}>
    {#each week as d (d.key)}
      <li class="flex flex-col items-center gap-1.5">
        <span
          class="grid size-8 place-items-center rounded-full transition {d.active
            ? 'bg-orange-500 text-white dark:bg-orange-500'
            : 'bg-surface-3 text-ink-faint'} {d.isToday ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-surface' : ''}"
          aria-hidden="true"
        >
          {#if d.active}<Check size={16} strokeWidth={3.2} />{:else if d.isToday}<span class="size-1.5 rounded-full bg-brand-400"></span>{/if}
        </span>
        <span class="text-[0.7rem] font-bold {d.isToday ? 'text-brand-600 dark:text-brand-300' : 'text-ink-faint'}" aria-hidden="true">
          {weekdayShort(d.key)}
        </span>
        <span class="sr-only">
          {d.isToday ? tr({ en: 'Today', rw: 'Uyu munsi' }) : weekdayLong(d.key)}:
          {d.active ? tr({ en: 'practised', rw: 'wize' }) : tr({ en: 'no practice', rw: 'ntiwize' })}
        </span>
      </li>
    {/each}
  </ol>

  <p class="mt-4 text-sm font-semibold text-ink-muted">{message}</p>
</section>
