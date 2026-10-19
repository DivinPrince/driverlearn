<script lang="ts">
  /**
   * Column chart of the most recent mock exams (score as % of total), with the 60% pass line.
   * Passes are green, other attempts neutral; position against the pass line is the second cue,
   * and every column is a link with a full text label (the attempts list is the table view).
   */
  import { PASS_RATIO } from '../../lib/engine/gamify'
  import { tr, T } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import type { ExamRecord } from '../../lib/types'
  import { dateText } from './format'

  interface Props {
    exams: readonly ExamRecord[]
    /** Attempt number of the first exam in `exams` (1-based), for the x-axis labels. */
    firstNumber: number
  }
  let { exams, firstNumber }: Props = $props()

  let width = $state(320)
  let hovered: number | null = $state(null)

  const H = 132
  const TOP = 18
  const BOTTOM = 22
  const LEFT = 30
  const RIGHT = 8
  const plotH = H - TOP - BOTTOM

  const slot = $derived(Math.max(1, (width - LEFT - RIGHT) / Math.max(exams.length, 1)))
  const barW = $derived(Math.min(24, slot * 0.6))
  const y = (ratio: number) => TOP + plotH * (1 - ratio)

  function ratioOf(e: ExamRecord) {
    return e.total ? e.score / e.total : 0
  }

  /** Column with a 4px rounded top and a square base. */
  function columnPath(x: number, top: number, w: number): string {
    const base = TOP + plotH
    const h = base - top
    if (h <= 0.5) return ''
    const r = Math.min(4, w / 2, h)
    return `M${x} ${base}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + w - r}Q${x + w} ${top} ${x + w} ${top + r}V${base}Z`
  }

  function label(e: ExamRecord) {
    return `${e.score}/${e.total} · ${e.passed ? tr(T.passed) : tr(T.failed)} · ${dateText(e.date)}`
  }

  const tip = $derived(hovered !== null ? exams[hovered] : null)
</script>

<div class="relative" bind:clientWidth={width}>
  <svg {width} height={H} viewBox="0 0 {width} {H}" class="block overflow-visible" role="group" aria-label={tr({ en: 'Recent scores', rw: 'Amanota ya vuba' })}>
    <!-- gridlines: 0 and 100% (the pass line is drawn on top of the columns) -->
    {#each [0, 1] as g (g)}
      <line x1={LEFT} x2={width - RIGHT} y1={y(g)} y2={y(g)} stroke="var(--line)" stroke-width="1" />
      <text x={LEFT - 6} y={y(g) + 3.5} text-anchor="end" class="fill-ink-faint text-[10px] font-bold tabular-nums">{g * 100}%</text>
    {/each}
    <text x={LEFT - 6} y={y(PASS_RATIO) + 3.5} text-anchor="end" class="fill-ink-muted text-[10px] font-black tabular-nums"
      >{Math.round(PASS_RATIO * 100)}%</text
    >

    {#each exams as e, i (e.id)}
      {@const cx = LEFT + slot * i + slot / 2}
      {@const r = ratioOf(e)}
      <a
        href={href(`/exam/result/${e.id}`)}
        aria-label={label(e)}
        onpointerenter={() => (hovered = i)}
        onpointerleave={() => (hovered = null)}
        onfocus={() => (hovered = i)}
        onblur={() => (hovered = null)}
        class="outline-none"
      >
        <!-- hit area: the whole slot -->
        <rect x={cx - slot / 2} y={TOP - 8} width={slot} height={plotH + 8 + BOTTOM} fill="transparent" />
        {#if hovered === i}
          <rect x={cx - slot / 2 + 1} y={TOP - 8} width={slot - 2} height={plotH + 8} rx="6" fill="var(--surface-2)" />
        {/if}
        <path
          d={columnPath(cx - barW / 2, y(r), barW)}
          fill={e.passed ? 'var(--color-leaf-500)' : 'var(--line-strong)'}
          class="transition-opacity {hovered !== null && hovered !== i ? 'opacity-60' : ''}"
        />
        {#if r === 0}
          <rect x={cx - barW / 2} y={TOP + plotH - 2} width={barW} height="2" rx="1" fill="var(--line-strong)" />
        {/if}
        <text x={cx} y={H - 6} text-anchor="middle" class="fill-ink-faint text-[10px] font-bold tabular-nums {hovered === i ? 'fill-ink' : ''}"
          >{firstNumber + i}</text
        >
      </a>
    {/each}

    <!-- pass line (a threshold, so dashed) -->
    <line x1={LEFT} x2={width - RIGHT} y1={y(PASS_RATIO)} y2={y(PASS_RATIO)} stroke="var(--ink-muted)" stroke-width="1.25" stroke-dasharray="4 3" />

    <!-- direct label on the latest attempt only -->
    {#if exams.length}
      {@const last = exams[exams.length - 1]}
      {@const lx = LEFT + slot * (exams.length - 1) + slot / 2}
      {#if hovered === null}
        <text x={lx} y={y(ratioOf(last)) - 5} text-anchor="middle" class="fill-ink text-[11px] font-black tabular-nums">{last.score}</text>
      {/if}
    {/if}
  </svg>

  <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-ink-muted">
    <li class="flex items-center gap-1.5">
      <span class="h-3 w-2.5 rounded-t-[3px] bg-leaf-500" aria-hidden="true"></span>{tr(T.passed)}
    </li>
    <li class="flex items-center gap-1.5">
      <span class="h-3 w-2.5 rounded-t-[3px] bg-line-strong" aria-hidden="true"></span>{tr(T.failed)}
    </li>
    <li class="flex items-center gap-1.5">
      <svg width="16" height="4" aria-hidden="true"><line x1="0" x2="16" y1="2" y2="2" stroke="var(--ink-muted)" stroke-width="1.5" stroke-dasharray="4 3" /></svg>
      {tr({ en: 'Pass mark ({p}%)', rw: 'Amanota yo gutsinda ({p}%)' }, { p: Math.round(PASS_RATIO * 100) })}
    </li>
  </ul>

  {#if tip && hovered !== null}
    {@const cx = LEFT + slot * hovered + slot / 2}
    <div
      class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-line bg-surface px-3 py-2 text-left whitespace-nowrap shadow-lg"
      style:left="{Math.min(Math.max(cx, 70), width - 70)}px"
      style:top="{y(ratioOf(tip)) - 10}px"
    >
      <p class="font-display text-base leading-none font-black">{tip.score}/{tip.total}</p>
      <p class="mt-1 text-xs font-bold text-ink-muted">{tip.passed ? `✓ ${tr(T.passed)}` : `✕ ${tr(T.failed)}`}</p>
      <p class="text-xs text-ink-faint">{dateText(tip.date)}</p>
    </div>
  {/if}
</div>
