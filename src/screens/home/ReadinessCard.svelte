<script lang="ts">
  import { QUESTIONS } from '../../lib/data'
  import { isMastered } from '../../lib/engine/srs'
  import { readiness } from '../../lib/engine/stats'
  import { tr, T } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import { progress } from '../../lib/state/progress.svelte'
  import type { L10n } from '../../lib/types'

  interface Verdict {
    min: number
    label: L10n
    emoji: string
    /** CSS color of the gauge arc. */
    color: string
    chip: string
  }

  const VERDICTS: Verdict[] = [
    {
      min: 70,
      label: { en: 'Exam ready!', rw: 'Witeguye!' },
      emoji: '🏁',
      color: 'var(--color-leaf-500)',
      chip: 'bg-leaf-100 text-leaf-700 dark:bg-leaf-700/30 dark:text-leaf-400',
    },
    {
      min: 40,
      label: { en: 'Almost ready', rw: 'Uri hafi!' },
      emoji: '🚦',
      color: 'var(--color-sun-500)',
      chip: 'bg-sun-100 text-sun-600 dark:bg-sun-600/25 dark:text-sun-300',
    },
    {
      min: 0,
      label: { en: 'Keep practising', rw: 'Komeza witoze' },
      emoji: '🚧',
      color: 'var(--color-flame-500)',
      chip: 'bg-flame-100 text-flame-600 dark:bg-flame-700/30 dark:text-flame-400',
    },
  ]

  /** Shown before anything has been answered, so a fresh start doesn't read as a failing grade. */
  const NOT_STARTED: Verdict = {
    min: 0,
    label: { en: 'Not started yet', rw: 'Ntiwaratangira' },
    emoji: '🚗',
    color: 'var(--color-brand-500)',
    chip: 'bg-surface-2 text-ink-muted',
  }

  const score = $derived(readiness(QUESTIONS, progress.q, progress.exams))
  const started = $derived(progress.exams.length > 0 || Object.values(progress.q).some((s) => s.seen > 0))
  const verdict = $derived(started ? (VERDICTS.find((v) => score >= v.min) ?? VERDICTS[VERDICTS.length - 1]) : NOT_STARTED)
  const mastered = $derived(QUESTIONS.filter((q) => isMastered(progress.q[q.id])).length)
  const noExams = $derived(progress.exams.length === 0)
</script>

<a
  href={href('/progress')}
  class="card group flex h-full flex-col items-center p-4 text-center transition hover:-translate-y-0.5 hover:border-line-strong sm:p-5"
  aria-labelledby="home-readiness-title home-readiness-value"
>
  <h2 id="home-readiness-title" class="eyebrow self-stretch font-sans">{tr(T.readiness)}</h2>

  <svg viewBox="0 0 120 70" class="mt-3 w-full max-w-44" aria-hidden="true">
    <path
      d="M 12 60 A 48 48 0 0 1 108 60"
      fill="none"
      stroke="color-mix(in oklab, {verdict.color} 18%, var(--surface))"
      stroke-width="12"
      stroke-linecap="round"
    />
    {#if score > 0}
      <path
        d="M 12 60 A 48 48 0 0 1 108 60"
        fill="none"
        stroke={verdict.color}
        stroke-width="12"
        stroke-linecap="round"
        pathLength="100"
        stroke-dasharray="{score} 100"
        class="transition-[stroke-dasharray] duration-700 ease-out"
      />
    {/if}
    <text x="60" y="58" text-anchor="middle" class="fill-ink font-display" font-size="26" font-weight="900"
      >{score}<tspan font-size="13" font-weight="800" dx="1">%</tspan></text
    >
  </svg>

  <p id="home-readiness-value" class="sr-only">{score}%: {tr(verdict.label)}</p>
  <span class="chip mt-2 rounded-2xl text-center text-[0.8rem] text-balance {verdict.chip}" aria-hidden="true">{verdict.emoji} {tr(verdict.label)}</span>

  <p class="mt-2 text-xs leading-snug text-ink-muted">
    {!started
      ? tr({ en: 'Answer questions and take mock exams to fill the gauge.', rw: 'Subiza ibibazo, ukore n’ibizamini by’igerageza kugira ngo igipimo cyuzure.' })
      : noExams
      ? tr({ en: 'Take a mock exam to unlock your full score.', rw: 'Kora ikizamini cy’igerageza ubone igipimo nyacyo.' })
      : tr({ en: '{m} of {t} questions mastered', rw: 'Ibibazo {m} kuri {t} wabimenye neza' }, { m: mastered, t: QUESTIONS.length })}
  </p>
</a>
