<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import Mascot from '../../lib/components/Mascot.svelte'
  import { PASS_RATIO } from '../../lib/engine/gamify'
  import { tr, T } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import type { ExamRecord } from '../../lib/types'
  import { formatDate, formatDuration, percent } from './format'

  interface Props {
    exams: ExamRecord[]
  }

  let { exams }: Props = $props()

  const LIMIT = 15
  const offset = $derived(Math.max(0, exams.length - LIMIT))
  const recent = $derived(exams.slice(-LIMIT))
  /** When every plotted exam has the same length, the axis reads in points (e.g. 12/20) instead of %. */
  const uniformTotal = $derived(recent.length && recent.every((e) => e.total === recent[0].total) ? recent[0].total : null)
  const passRatio = $derived(uniformTotal ? Math.ceil(uniformTotal * PASS_RATIO) / uniformTotal : PASS_RATIO)

  const ratio = (e: ExamRecord) => (e.total ? e.score / e.total : 0)
  const scoreText = (e: ExamRecord) => `${e.score}/${e.total}`

  const stats = $derived.by(() => {
    if (!exams.length) return null
    const best = recent.reduce((b, e) => (ratio(e) > ratio(b) ? e : b), recent[0])
    const avg = recent.reduce((s, e) => s + ratio(e), 0) / recent.length
    const passed = exams.filter((e) => e.passed).length
    return { best, avg, passed }
  })

  // Geometry (px) — the SVG is drawn at its measured width so text never scales.
  let width = $state(0)
  const H = $derived(width >= 520 ? 260 : 210)
  const PAD = { top: 26, right: 12, bottom: 26, left: 32 }
  const INSET = 14
  const plotW = $derived(Math.max(width - PAD.left - PAD.right, 10))
  const plotH = $derived(H - PAD.top - PAD.bottom)
  const y = (r: number) => PAD.top + (1 - r) * plotH

  const points = $derived(
    recent.map((e, i) => ({
      e,
      i,
      attempt: offset + i + 1,
      x: recent.length === 1 ? PAD.left + plotW / 2 : PAD.left + INSET + (i * (plotW - INSET * 2)) / (recent.length - 1),
      y: y(ratio(e)),
    })),
  )

  const linePath = $derived(points.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '))
  const areaPath = $derived(
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${y(0)} L ${points[0].x.toFixed(1)} ${y(0)} Z`
      : '',
  )

  const ticks = $derived(
    [0, 0.5, 1].map((r) => ({ r, label: uniformTotal ? String(Math.round(uniformTotal * r)) : `${r * 100}%` })),
  )

  /** Show every k-th attempt number so x labels never collide. */
  const labelEvery = $derived.by(() => {
    if (points.length < 2) return 1
    const spacing = (plotW - INSET * 2) / (points.length - 1)
    return Math.max(1, Math.ceil(26 / spacing))
  })

  let active: number | null = $state(null)
  const activePoint = $derived(active === null ? undefined : points[active])

  function describe(p: (typeof points)[number]): string {
    return tr(
      { en: 'Attempt {a}, {d}: {s} ({p}%), {r}', rw: 'Igerageza rya {a}, {d}: {s} ({p}%), {r}' },
      { a: p.attempt, d: formatDate(p.e.date), s: scoreText(p.e), p: percent(ratio(p.e)), r: tr(p.e.passed ? T.passed : T.failed) },
    )
  }

  const latest = $derived([...exams].reverse().slice(0, 5))
</script>

<section class="card p-5 sm:p-6" aria-labelledby="exams-title">
  <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
    <h2 id="exams-title" class="text-lg font-bold">{tr({ en: 'Mock exam history', rw: 'Amateka y’ibizamini by’igerageza' })}</h2>
    {#if exams.length}
      <p class="text-xs font-bold text-ink-faint">
        {exams.length > LIMIT
          ? tr({ en: 'Last {n} of {t} attempts', rw: 'Amagerageza {n} aheruka kuri {t}' }, { n: LIMIT, t: exams.length })
          : tr({ en: '{n} attempts', rw: 'Amagerageza {n}' }, { n: exams.length })}
      </p>
    {/if}
  </div>

  {#if !stats}
    <div class="mt-4 flex flex-col items-center gap-4 rounded-3xl bg-surface-2 px-5 py-8 text-center sm:flex-row sm:text-left">
      <Mascot size={96} mood="think" class="shrink-0 text-ink" />
      <div class="flex-1">
        <p class="font-display text-lg font-bold">{tr({ en: 'No mock exams yet', rw: 'Nta kizamini cy’igerageza urakora' })}</p>
        <p class="mt-1 text-sm text-ink-muted">
          {tr({
            en: 'Sit a real-format test: 20 questions in 20 minutes, 12 correct to pass. Your scores will be charted here.',
            rw: 'Kora ikizamini nk’icya nyacyo: ibibazo 20 mu minota 20, ugatsinda ubonye 12. Amanota yawe azagaragara hano.',
          })}
        </p>
      </div>
      <a href={href('/exam')} class="btn btn-sun shrink-0">{tr({ en: 'Start a mock exam', rw: 'Tangira ikizamini' })}</a>
    </div>
  {:else}
    <!-- headline numbers -->
    <dl class="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
      <div class="flex flex-col justify-between gap-0.5 rounded-2xl bg-surface-2 px-3 py-2.5">
        <dt class="text-xs leading-tight font-bold text-ink-muted">{tr({ en: 'Best', rw: 'Amanota yo hejuru' })}</dt>
        <dd class="font-display text-xl font-bold">{scoreText(stats.best)}</dd>
      </div>
      <div class="flex flex-col justify-between gap-0.5 rounded-2xl bg-surface-2 px-3 py-2.5">
        <dt class="text-xs leading-tight font-bold text-ink-muted">{tr({ en: 'Average', rw: 'Impuzandengo' })}</dt>
        <dd class="font-display text-xl font-bold">{percent(stats.avg)}%</dd>
      </div>
      <div class="flex flex-col justify-between gap-0.5 rounded-2xl bg-surface-2 px-3 py-2.5">
        <dt class="text-xs leading-tight font-bold text-ink-muted">{tr(T.passed)}</dt>
        <dd class="font-display text-xl font-bold">{stats.passed}/{exams.length}</dd>
      </div>
    </dl>

    <div class="mt-4 grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-3">
      <div class="min-w-0 lg:col-span-2">
        <!-- legend -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-ink-muted">
          <span class="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5" class="fill-leaf-500" /></svg>
            {tr(T.passed)}
          </span>
          <span class="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"
              ><rect x="2" y="2" width="8" height="8" transform="rotate(45 6 6)" class="fill-flame-500" /></svg
            >
            {tr(T.failed)}
          </span>
          <span class="flex items-center gap-1.5">
            <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"
              ><line x1="0" y1="6" x2="18" y2="6" class="stroke-sun-500" stroke-width="2" stroke-dasharray="4 3" /></svg
            >
            {tr({ en: 'Pass mark', rw: 'Amanota yo gutsinda' })}
          </span>
        </div>

        <!-- chart -->
        <div class="relative mt-2" bind:clientWidth={width} style:height="{H}px">
          {#if width}
            <svg {width} height={H} class="block overflow-visible">
              <!-- grid -->
              {#each ticks as t (t.r)}
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t.r)} y2={y(t.r)} class="stroke-line" stroke-width="1" />
                <text x={PAD.left - 8} y={y(t.r)} dy="0.35em" text-anchor="end" class="fill-ink-faint text-[11px] font-bold tabular-nums"
                  >{t.label}</text
                >
              {/each}

              <!-- pass line -->
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(passRatio)}
                y2={y(passRatio)}
                class="stroke-sun-500"
                stroke-width="2"
                stroke-dasharray="6 4"
              />
              <text x={width - PAD.right} y={y(passRatio) - 6} text-anchor="end" class="fill-ink-muted text-[11px] font-extrabold">
                {tr({ en: 'Pass', rw: 'Gutsinda' })}
                {uniformTotal ? `${Math.ceil(uniformTotal * PASS_RATIO)}/${uniformTotal}` : `${PASS_RATIO * 100}%`}
              </text>

              <!-- trend -->
              {#if areaPath}<path d={areaPath} class="fill-brand-500/10" />{/if}
              {#if points.length > 1}
                <path d={linePath} fill="none" class="stroke-brand-400" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
              {/if}

              <!-- x labels -->
              {#each points as p (p.e.id)}
                {#if p.i % labelEvery === 0 || p.i === points.length - 1}
                  <text x={p.x} y={H - 6} text-anchor="middle" class="fill-ink-faint text-[11px] font-bold tabular-nums">#{p.attempt}</text>
                {/if}
              {/each}

              <!-- points (links to each result) -->
              {#each points as p (p.e.id)}
                {@const on = active === p.i}
                <a
                  href={href(`/exam/result/${p.e.id}`)}
                  aria-label={describe(p)}
                  class="outline-none"
                  onpointerenter={() => (active = p.i)}
                  onpointerleave={() => {
                    if (active === p.i) active = null
                  }}
                  onfocus={() => (active = p.i)}
                  onblur={() => {
                    if (active === p.i) active = null
                  }}
                >
                  <circle cx={p.x} cy={p.y} r="15" fill="transparent" />
                  {#if on}<circle cx={p.x} cy={p.y} r="12" class="fill-brand-500/15 stroke-brand-400" stroke-width="2" />{/if}
                  {#if p.e.passed}
                    <circle cx={p.x} cy={p.y} r={on ? 7.5 : 6} class="fill-leaf-500 stroke-surface transition-all" stroke-width="2" />
                  {:else}
                    {@const s = on ? 12 : 10}
                    <rect
                      x={p.x - s / 2}
                      y={p.y - s / 2}
                      width={s}
                      height={s}
                      rx="1.5"
                      transform="rotate(45 {p.x} {p.y})"
                      class="fill-flame-500 stroke-surface transition-all"
                      stroke-width="2"
                    />
                  {/if}
                </a>
              {/each}

              <!-- direct label on the latest attempt -->
              {#if points.length && active !== points.length - 1}
                {@const last = points[points.length - 1]}
                <text
                  x={last.x}
                  y={last.y - 14}
                  text-anchor={points.length === 1 ? 'middle' : 'end'}
                  dx={points.length === 1 ? 0 : 6}
                  class="pointer-events-none fill-ink text-xs font-extrabold">{scoreText(last.e)}</text
                >
              {/if}
            </svg>

            {#if activePoint}
              <div
                class="pointer-events-none absolute z-10 w-max max-w-48 -translate-x-1/2 -translate-y-full rounded-2xl border border-line bg-surface px-3 py-2 text-left shadow-xl"
                style:left="{Math.min(Math.max(activePoint.x, 80), width - 80)}px"
                style:top="{activePoint.y - 16}px"
                aria-hidden="true"
              >
                <p class="font-display text-lg leading-tight font-black">
                  {scoreText(activePoint.e)}
                  <span class="text-sm font-bold text-ink-muted">· {percent(ratio(activePoint.e))}%</span>
                </p>
                <p class="text-xs font-bold {activePoint.e.passed ? 'text-leaf-700 dark:text-leaf-400' : 'text-flame-600 dark:text-flame-400'}">
                  {activePoint.e.passed ? '✓' : '✕'}
                  {tr(activePoint.e.passed ? T.passed : T.failed)}
                </p>
                <p class="mt-0.5 text-xs text-ink-muted">#{activePoint.attempt} · {formatDate(activePoint.e.date)}</p>
              </div>
            {/if}
          {/if}
        </div>
      </div>

      <!-- latest attempts (also the accessible, tap-friendly way into each result) -->
      <div class="min-w-0">
        <h3 class="eyebrow">{tr({ en: 'Latest attempts', rw: 'Ibizamini uheruka gukora' })}</h3>
        <ul class="mt-2 divide-y divide-line">
          {#each latest as e, i (e.id)}
            <li>
              <a
                href={href(`/exam/result/${e.id}`)}
                class="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-surface-2"
              >
                <span
                  class="grid size-9 shrink-0 place-items-center rounded-xl text-sm font-black text-white {e.passed
                    ? 'bg-leaf-500'
                    : 'bg-flame-500'}"
                  aria-hidden="true">{e.passed ? '✓' : '✕'}</span
                >
                <span class="min-w-0 flex-1">
                  <span class="block font-display font-bold">
                    {scoreText(e)}
                    <span class="font-sans text-sm font-semibold text-ink-muted">· {tr(e.passed ? T.passed : T.failed)}</span>
                  </span>
                  <span class="block text-xs text-ink-faint">
                    #{exams.length - i} · {formatDate(e.date)} · ⏱ {formatDuration(e.durationSec)}
                  </span>
                </span>
                <ChevronRight size={18} class="shrink-0 text-ink-faint" />
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}
</section>
