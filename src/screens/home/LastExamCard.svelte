<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import { PASS_RATIO } from '../../lib/engine/gamify'
  import { tr, T } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import { progress } from '../../lib/state/progress.svelte'
  import { settings } from '../../lib/state/settings.svelte'
  import { relativeDay, shortDate } from './format'

  interface Props {
    now: number
  }

  let { now }: Props = $props()

  const last = $derived(progress.exams.at(-1))
  const recent = $derived(progress.exams.slice(-5))
  const passes = $derived(progress.exams.filter((e) => e.passed).length)
  const passMark = $derived(Math.ceil(settings.examSize * PASS_RATIO))

  // Mini chart geometry (viewBox units)
  const SLOT = 20
  const BAR = 12
  const BASE = 34
  const H = 32
</script>

{#if last}
  <a
    href={href(`/exam/result/${last.id}`)}
    class="card group flex h-full flex-col p-4 transition hover:-translate-y-0.5 hover:border-line-strong sm:p-5"
  >
    <h2 class="eyebrow font-sans">{tr({ en: 'Last mock exam', rw: 'Ikizamini giheruka' })}</h2>
    <p class="mt-3 font-display leading-none font-black tabular-nums">
      <span class="text-4xl">{last.score}</span><span class="text-xl text-ink-faint">/{last.total}</span>
    </p>
    <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span
        class="chip {last.passed
          ? 'bg-leaf-100 text-leaf-700 dark:bg-leaf-700/30 dark:text-leaf-400'
          : 'bg-flame-100 text-flame-600 dark:bg-flame-700/30 dark:text-flame-400'}"
      >
        <span aria-hidden="true">{last.passed ? '✓' : '✕'}</span>{last.passed ? tr(T.passed) : tr(T.failed)}
      </span>
      <span class="text-xs font-semibold text-ink-faint">{relativeDay(last.date, now)}</span>
    </div>

    {#if recent.length > 1}
      <figure class="mt-3">
        <svg viewBox="0 0 {SLOT * 5} 36" class="h-auto w-full max-w-36" role="img" aria-label={tr({ en: 'Recent exam scores', rw: 'Amanota y’ibizamini biheruka' })}>
          {#each recent as e, i (e.id)}
            {@const h = Math.max((e.total ? e.score / e.total : 0) * H, 2)}
            <rect
              x={i * SLOT + (SLOT - BAR) / 2}
              y={BASE - h}
              width={BAR}
              height={h}
              rx="2"
              class={e.passed ? 'fill-leaf-500' : 'fill-flame-400'}
              opacity={i === recent.length - 1 ? 1 : 0.7}
            >
              <title>{shortDate(e.date, now)}: {e.score}/{e.total} · {e.passed ? tr(T.passed) : tr(T.failed)}</title>
            </rect>
          {/each}
          <line x1="0" x2={SLOT * 5} y1={BASE - PASS_RATIO * H} y2={BASE - PASS_RATIO * H} class="stroke-ink-faint" stroke-width="0.8" stroke-dasharray="2 2" />
          <line x1="0" x2={SLOT * 5} y1={BASE + 0.5} y2={BASE + 0.5} class="stroke-line-strong" stroke-width="1" />
        </svg>
        <figcaption class="mt-1 text-xs text-ink-muted">
          {tr({ en: 'Passed {p} of {n}', rw: 'Watsinze {p} kuri {n}' }, { p: passes, n: progress.exams.length })}
        </figcaption>
      </figure>
    {/if}

    <span class="mt-auto flex items-center gap-0.5 pt-3 text-sm font-bold text-brand-600 group-hover:underline dark:text-brand-300">
      {tr({ en: 'View results', rw: 'Reba amanota' })}<ChevronRight size={16} strokeWidth={2.6} aria-hidden="true" />
    </span>
  </a>
{:else}
  <a
    href={href('/exam')}
    class="card group flex h-full flex-col p-4 transition hover:-translate-y-0.5 hover:border-brand-300 sm:p-5"
  >
    <h2 class="eyebrow font-sans">{tr(T.exam)}</h2>
    <span class="mt-3 grid size-12 place-items-center rounded-2xl bg-grape-100 text-2xl dark:bg-grape-600/25" aria-hidden="true">📝</span>
    <p class="mt-3 font-display text-lg leading-tight font-bold">
      {tr({ en: 'Take your first mock exam', rw: 'Kora ikizamini cya mbere cy’igerageza' })}
    </p>
    <p class="mt-1 text-xs leading-snug text-ink-muted">
      {tr(
        { en: '{n} questions · {m} min · pass mark {p}/{n}, just like the real test.', rw: 'Ibibazo {n} · iminota {m} · gutsinda ni {p}/{n}, nk’ikizamini nyacyo.' },
        { n: settings.examSize, m: settings.examMinutes, p: passMark },
      )}
    </p>
    <span class="mt-auto flex items-center gap-0.5 pt-3 text-sm font-bold text-brand-600 group-hover:underline dark:text-brand-300">
      {tr(T.start)}<ChevronRight size={16} strokeWidth={2.6} aria-hidden="true" />
    </span>
  </a>
{/if}
