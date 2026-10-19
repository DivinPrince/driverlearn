<script lang="ts">
  import ArrowRight from '@lucide/svelte/icons/arrow-right'
  import { tr, T } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import type { L10n } from '../../lib/types'

  interface Props {
    /** Readiness 0..100 from readiness(). */
    value: number
    /** Number of mock exams taken in total. */
    examCount: number
    totalQuestions: number
  }

  let { value, examCount, totalQuestions }: Props = $props()

  interface Verdict {
    min: number
    label: L10n
    emoji: string
    arc: string
    chip: string
  }

  const VERDICTS: Verdict[] = [
    {
      min: 85,
      label: { en: 'Exam ready!', rw: 'Witeguye ikizamini!' },
      emoji: '🏁',
      arc: 'stroke-leaf-500',
      chip: 'bg-leaf-100 text-leaf-700 dark:bg-leaf-700/25 dark:text-leaf-400',
    },
    {
      min: 65,
      label: { en: 'Almost there', rw: 'Hasigaye gato' },
      emoji: '🚗',
      arc: 'stroke-brand-500',
      chip: 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300',
    },
    {
      min: 40,
      label: { en: 'Getting there', rw: 'Uri mu nzira nziza' },
      emoji: '🛵',
      arc: 'stroke-sun-500',
      chip: 'bg-sun-100 text-sun-600 dark:bg-sun-600/20 dark:text-sun-300',
    },
    {
      min: 0,
      label: { en: 'Just warming up', rw: 'Uracyatangira' },
      emoji: '🐣',
      arc: 'stroke-flame-400',
      chip: 'bg-flame-100 text-flame-600 dark:bg-flame-700/25 dark:text-flame-400',
    },
  ]

  const v = $derived(Math.max(0, Math.min(100, Math.round(value))))
  const verdict = $derived(VERDICTS.find((x) => v >= x.min) ?? VERDICTS[VERDICTS.length - 1])

  // Speedometer geometry (viewBox units).
  const CX = 110
  const CY = 112
  const R = 88
  const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`
  const TICKS = Array.from({ length: 11 }, (_, i) => {
    const a = Math.PI * (1 - i / 10)
    const major = i % 5 === 0
    const r1 = R - 15
    const r2 = R - (major ? 25 : 20)
    return {
      major,
      x1: CX + r1 * Math.cos(a),
      y1: CY - r1 * Math.sin(a),
      x2: CX + r2 * Math.cos(a),
      y2: CY - r2 * Math.sin(a),
    }
  })

  /** Animate from 0 on first paint so the needle sweeps in. */
  let shown = $state(0)
  $effect(() => {
    const target = v
    const id = requestAnimationFrame(() => (shown = target))
    return () => cancelAnimationFrame(id)
  })

  const hint = $derived(
    examCount === 0
      ? tr({
          en: 'Practice alone counts up to 80%. Take a mock exam to see your full readiness.',
          rw: 'Imyitozo yonyine ibarwa kugeza kuri 80%. Kora ikizamini cy’igerageza urebe aho ugeze neza.',
        })
      : tr(
          {
            en: 'Based on how well you know all {n} questions and your last {k} mock exams.',
            rw: 'Bishingiye ku buryo uzi ibibazo {n} byose n’ibizamini {k} by’igerageza uheruka gukora.',
          },
          { n: totalQuestions, k: Math.min(examCount, 5) },
        ),
  )
</script>

<section class="card flex h-full flex-col items-center p-5 text-center sm:p-6" aria-labelledby="readiness-title">
  <h2 id="readiness-title" class="eyebrow self-start">{tr(T.readiness)}</h2>

  <div class="relative mt-3 w-full max-w-64">
    <svg viewBox="0 0 220 124" class="w-full overflow-visible" role="img" aria-label="{tr(T.readiness)}: {v}% — {tr(verdict.label)}">
      <!-- track -->
      <path d={ARC} fill="none" class="stroke-surface-3" stroke-width="16" stroke-linecap="round" />
      <!-- value arc -->
      <path
        d={ARC}
        fill="none"
        class="{verdict.arc} transition-[stroke-dasharray] duration-1000 ease-out"
        stroke-width="16"
        stroke-linecap="round"
        pathLength="100"
        stroke-dasharray="{shown} 100"
        opacity={shown > 0 ? 1 : 0}
      />
      <!-- ticks -->
      {#each TICKS as t, i (i)}
        <line
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          class={t.major ? 'stroke-ink-muted' : 'stroke-ink-faint'}
          stroke-width={t.major ? 3 : 2}
          stroke-linecap="round"
        />
      {/each}
      <!-- needle -->
      <g class="transition-transform duration-1000 ease-out" style:transform-origin="{CX}px {CY}px" style:transform="rotate({(shown / 100) * 180}deg)">
        <line x1={CX} y1={CY} x2={CX - R + 30} y2={CY} class="stroke-ink" stroke-width="5" stroke-linecap="round" />
      </g>
      <circle cx={CX} cy={CY} r="10" class="fill-ink" />
      <circle cx={CX} cy={CY} r="4" class="fill-surface" />
    </svg>
  </div>

  <p class="mt-2 font-display text-5xl leading-none font-black">{v}<span class="text-2xl text-ink-muted">%</span></p>
  <p class="mt-3 chip text-sm {verdict.chip}"><span aria-hidden="true">{verdict.emoji}</span>{tr(verdict.label)}</p>
  <p class="mt-3 max-w-xs text-sm text-pretty text-ink-muted">{hint}</p>

  <div class="mt-auto w-full pt-5">
    {#if examCount === 0 || v >= 85}
      <a href={href('/exam')} class="btn btn-sun w-full">
        {examCount === 0
          ? tr({ en: 'Take a mock exam', rw: 'Kora ikizamini cy’igerageza' })
          : tr({ en: 'Stay sharp: another mock exam', rw: 'Komeza witoze: ikindi kizamini' })}
        <ArrowRight size={18} />
      </a>
    {:else}
      <a href={href('/practice', { mode: 'smart' })} class="btn btn-primary w-full">
        {tr({ en: 'Boost my readiness', rw: 'Ongera ubumenyi bwawe' })}
        <ArrowRight size={18} />
      </a>
    {/if}
  </div>
</section>
