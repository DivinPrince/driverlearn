<script lang="ts">
  /**
   * Question navigator: one numbered tile per question. States never rely on color alone —
   * answered tiles are solid, unanswered ones dashed, flagged ones carry a flag badge and the
   * current one a thick ring + underline; each tile also has a full aria-label.
   */
  import Flag from '@lucide/svelte/icons/flag'
  import { tr } from '../../lib/i18n'
  import type { ExamSession } from '../../lib/state/exam.svelte'

  interface Props {
    session: ExamSession
    onpick: (index: number) => void
    /** Show the legend under the grid. */
    legend?: boolean
  }
  let { session, onpick, legend = true }: Props = $props()

  function describe(i: number): string {
    const parts = [tr({ en: 'Question {n}', rw: 'Ikibazo {n}' }, { n: i + 1 })]
    parts.push(
      session.answers[i] === null
        ? tr({ en: 'not answered', rw: 'ntikirasubizwa' })
        : tr({ en: 'answered', rw: 'cyasubijwe' }),
    )
    if (session.flagged[i]) parts.push(tr({ en: 'flagged', rw: 'uzakigarukaho' }))
    return parts.join(', ')
  }
</script>

<ol class="grid grid-cols-5 gap-2" aria-label={tr({ en: 'Questions', rw: 'Ibibazo' })}>
  {#each session.questions as id, i (id)}
    {@const answered = session.answers[i] !== null}
    {@const current = session.current === i}
    <li>
      <button
        type="button"
        class="relative grid aspect-square w-full place-items-center rounded-xl border-2 font-display text-sm font-bold tabular-nums transition-[transform,background-color] duration-150 active:scale-95 {answered
          ? 'border-brand-500 bg-brand-500 text-white hover:bg-brand-400'
          : 'border-dashed border-line-strong bg-surface text-ink-muted hover:border-brand-300 hover:text-ink'} {current
          ? 'z-[1] scale-105 ring-4 ring-brand-500/35 dark:ring-brand-300/40'
          : ''}"
        aria-label={describe(i)}
        aria-current={current ? 'step' : undefined}
        onclick={() => onpick(i)}
      >
        {i + 1}
        {#if current}
          <span class="absolute inset-x-2.5 bottom-1 h-0.5 rounded-full {answered ? 'bg-white' : 'bg-brand-500'}" aria-hidden="true"></span>
        {/if}
        {#if session.flagged[i]}
          <span
            class="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-sun-400 text-brand-950 ring-2 ring-surface"
            aria-hidden="true"
          >
            <Flag size={11} strokeWidth={3} />
          </span>
        {/if}
      </button>
    </li>
  {/each}
</ol>

{#if legend}
  <ul class="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-ink-muted">
    <li class="flex items-center gap-1.5">
      <span class="size-4 rounded-md border-2 border-brand-500 bg-brand-500" aria-hidden="true"></span>
      {tr({ en: 'Answered', rw: 'Byasubijwe' })}
    </li>
    <li class="flex items-center gap-1.5">
      <span class="size-4 rounded-md border-2 border-dashed border-line-strong bg-surface" aria-hidden="true"></span>
      {tr({ en: 'Not answered', rw: 'Bitarasubizwa' })}
    </li>
    <li class="flex items-center gap-1.5">
      <span class="grid size-4 place-items-center rounded-full bg-sun-400 text-brand-950" aria-hidden="true"><Flag size={9} strokeWidth={3} /></span>
      {tr({ en: 'Flagged', rw: 'Uzabigarukaho' })}
    </li>
  </ul>
{/if}
