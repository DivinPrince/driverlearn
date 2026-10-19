<script lang="ts">
  import Brain from '@lucide/svelte/icons/brain'
  import { DAY_MS } from '../../lib/engine/dates'
  import { INTERVALS_MS, MASTERED_BOX } from '../../lib/engine/srs'
  import { tr } from '../../lib/i18n'
  import type { L10n } from '../../lib/types'

  interface Props {
    /** How many of the learner's answered questions sit in each Leitner box (index = box). */
    boxes: number[]
  }

  let { boxes }: Props = $props()

  const anySeen = $derived(boxes.some((n) => n > 0))

  function gap(ms: number): { n: number; unit: L10n } {
    if (ms < DAY_MS) return { n: Math.round(ms / 60000), unit: { en: 'min', rw: 'iminota' } }
    const n = Math.round(ms / DAY_MS)
    return { n, unit: n === 1 ? { en: 'day', rw: 'umunsi' } : { en: 'days', rw: 'iminsi' } }
  }

  const STEPS: { emoji: string; title: L10n; body: L10n }[] = [
    {
      emoji: '🔁',
      title: { en: 'Misses come back sooner', rw: 'Ibyo wishe bigaruka vuba' },
      body: {
        en: 'Get a question wrong and you’ll see it again in about 10 minutes, so it sticks.',
        rw: 'Niwica ikibazo, uzongera kukibona nyuma y’iminota nka 10 kugira ngo ugifate neza.',
      },
    },
    {
      emoji: '📅',
      title: { en: 'Right answers space out', rw: 'Ibyo usubije neza bitinda kugaruka' },
      body: {
        en: 'Each correct answer pushes the next review further away: 1 day, 3 days, a week…',
        rw: 'Buri gisubizo cy’ukuri gituma ikibazo gitinda kugaruka: umunsi 1, iminsi 3, icyumweru…',
      },
    },
    {
      emoji: '🏆',
      title: { en: 'Mastered after 3 in a row', rw: 'Inshuro 3 zikurikiranye: wakimenye!' },
      body: {
        en: 'Answer a question right 3 times in a row, spread over time, and it counts as mastered.',
        rw: 'Subiza ikibazo neza inshuro 3 zikurikiranye mu bihe bitandukanye, uzaba wakimenye neza.',
      },
    },
  ]
</script>

<section class="card overflow-hidden" aria-labelledby="how-learning-works">
  <div class="flex items-start gap-3 p-5 pb-0 sm:p-6 sm:pb-0">
    <span
      class="grid size-11 shrink-0 place-items-center rounded-2xl bg-grape-100 text-grape-600 dark:bg-grape-600/25 dark:text-grape-400"
      aria-hidden="true"><Brain size={22} /></span
    >
    <div class="min-w-0">
      <h2 id="how-learning-works" class="text-xl font-bold">{tr({ en: 'How learning works', rw: 'Uko kwiga bikora' })}</h2>
      <p class="mt-0.5 text-sm text-ink-muted">
        {tr({
          en: 'DriverLearn uses spaced repetition: each question comes back right before you would forget it.',
          rw: 'DriverLearn ikoresha uburyo bwo gusubiramo mu bihe bitandukanye: buri kibazo kigaruka mbere y’uko ucyibagirwa.',
        })}
      </p>
    </div>
  </div>

  <ol class="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
    {#each STEPS as step, i (i)}
      <li class="flex gap-3 rounded-2xl bg-surface-2 p-4 sm:flex-col sm:gap-2">
        <span class="text-2xl leading-none" aria-hidden="true">{step.emoji}</span>
        <div>
          <h3 class="leading-tight font-bold">{tr(step.title)}</h3>
          <p class="mt-1 text-sm text-ink-muted">{tr(step.body)}</p>
        </div>
      </li>
    {/each}
  </ol>

  <!-- The Leitner ladder: how long each step waits before the question returns -->
  <div class="border-t border-line bg-surface-2/50 px-5 py-5 sm:px-6">
    <p class="eyebrow mb-3">{tr({ en: 'Wait before a question comes back', rw: 'Igihe ikibazo kimara mbere yo kugaruka' })}</p>
    <ol class="grid grid-cols-6 gap-1.5 sm:gap-2">
      {#each INTERVALS_MS as ms, box (box)}
        {@const g = gap(ms)}
        <li
          class="flex flex-col items-center rounded-2xl border-2 px-0.5 py-2 text-center {box === 0
            ? 'border-flame-200 bg-flame-100 text-flame-600 dark:border-flame-700/50 dark:bg-flame-700/20 dark:text-flame-400'
            : box >= MASTERED_BOX
              ? 'border-leaf-200 bg-leaf-100 text-leaf-700 dark:border-leaf-700/50 dark:bg-leaf-700/20 dark:text-leaf-400'
              : 'border-line bg-surface text-ink'}"
        >
          <span class="font-display text-lg leading-none font-black tabular-nums sm:text-2xl">{g.n}</span>
          <span class="mt-0.5 max-w-full truncate text-[0.62rem] font-bold sm:text-xs">{tr(g.unit)}</span>
          {#if anySeen}
            <span
              class="mt-1.5 rounded-full bg-black/5 px-1.5 text-[0.62rem] font-bold tabular-nums dark:bg-white/10 sm:text-[0.7rem]"
              title={tr({ en: 'Your questions on this step', rw: 'Ibibazo byawe biri kuri iyi ntambwe' })}
            >
              {boxes[box] ?? 0}
            </span>
          {/if}
        </li>
      {/each}
    </ol>
    <div class="mt-2 grid grid-cols-6 gap-1.5 text-[0.65rem] font-bold sm:gap-2 sm:text-xs">
      <span class="border-t-2 border-flame-400 pt-1 text-center text-flame-600 dark:border-flame-600 dark:text-flame-400">✕ {tr({ en: 'Missed', rw: 'Wishe' })}</span>
      <span
        class="border-t-2 border-leaf-400 pt-1 text-center text-leaf-700 dark:border-leaf-600 dark:text-leaf-400"
        style:grid-column="{MASTERED_BOX + 1} / span {INTERVALS_MS.length - MASTERED_BOX}"
      >
        ✓ {tr({ en: 'Mastered', rw: 'Wakimenye' })}
      </span>
    </div>
    <p class="mt-3 text-xs text-ink-muted">
      {tr({
        en: 'A right answer moves a question one step right. A wrong answer sends it back to the start.',
        rw: 'Igisubizo cy’ukuri cyimura ikibazo intambwe imwe iburyo. Igisubizo kitari cyo kigisubiza ku ntangiriro.',
      })}
      {#if anySeen}
        {tr({ en: 'Small numbers show how many of your questions are on each step.', rw: 'Imibare mito yerekana umubare w’ibibazo byawe biri kuri buri ntambwe.' })}
      {/if}
    </p>
  </div>
</section>
