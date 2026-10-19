<script lang="ts">
  /** One compact, expandable question row in the library list. */
  import ArrowRight from '@lucide/svelte/icons/arrow-right'
  import Bookmark from '@lucide/svelte/icons/bookmark'
  import Check from '@lucide/svelte/icons/check'
  import ChevronDown from '@lucide/svelte/icons/chevron-down'
  import Eye from '@lucide/svelte/icons/eye'
  import Bi from '../../lib/components/Bi.svelte'
  import { imageUrl, OPTION_LETTERS, pick } from '../../lib/data'
  import { tr, T } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import { toggleBookmark } from '../../lib/state/progress.svelte'
  import { settings } from '../../lib/state/settings.svelte'
  import type { QState, Question } from '../../lib/types'
  import QuestionDetail from './QuestionDetail.svelte'
  import StatusIcon from './StatusIcon.svelte'
  import { statusOf } from './status'

  interface Props {
    question: Question
    qstate: QState | undefined
    bookmarked: boolean
    /** Global "Show answers" toggle. */
    showAnswers: boolean
    expanded: boolean
    /** Answer revealed for this row only (when answers are hidden globally). */
    revealed: boolean
    ontoggle: () => void
    onreveal: () => void
    /** Called right before following the "Open" link. */
    onopen: () => void
  }

  let { question, qstate, bookmarked, showAnswers, expanded, revealed, ontoggle, onreveal, onopen }: Props = $props()

  const status = $derived(statusOf(qstate))
  const answer = $derived(question.options[question.answer])
  const thumb = $derived(question.images[0])
  const reveal = $derived(showAnswers || revealed)
  const detailId = $derived(`lib-q-${question.id}-detail`)
</script>

<li
  id="lib-q-{question.id}"
  class="scroll-mt-24 rounded-3xl border-2 bg-surface transition-[border-color,box-shadow] {expanded
    ? 'border-brand-300 shadow-lg shadow-brand-500/10 dark:border-brand-700 dark:shadow-none'
    : 'border-line hover:border-line-strong'}"
>
  <button
    type="button"
    class="flex w-full items-start gap-3 rounded-3xl p-3 text-left sm:gap-4 sm:p-4"
    aria-expanded={expanded}
    aria-controls={detailId}
    onclick={ontoggle}
  >
    <span
      class="mt-0.5 grid h-8 min-w-12 shrink-0 place-items-center rounded-xl px-2 font-display text-sm font-bold tabular-nums {expanded
        ? 'bg-brand-500 text-white'
        : 'bg-surface-2 text-ink-muted'}"
    >
      <span class="sr-only">{tr(T.question)}</span>#{question.id}
    </span>

    <span class="min-w-0 flex-1">
      <span class="leading-snug font-semibold {expanded ? 'block text-base sm:text-lg' : 'line-clamp-3 text-[0.95rem] sm:text-base'}">
        <Bi text={question.q} />
      </span>
      {#if showAnswers && !expanded}
        <span class="mt-2 flex items-start gap-2 text-sm font-bold text-leaf-700 dark:text-leaf-400">
          <Check size={16} strokeWidth={3} class="mt-0.5 shrink-0" aria-hidden="true" />
          <span class="sr-only">{tr(T.correctAnswer)}:</span>
          <span class="font-display">{OPTION_LETTERS[question.answer]}</span>
          {#if answer?.image}
            <img
              src={imageUrl(answer.image)}
              alt={pick(answer, settings.lang)}
              class="h-11 w-auto rounded-lg border-2 border-leaf-500 bg-white object-contain p-0.5"
              loading="lazy"
              draggable="false"
            />
          {:else if answer}
            <span class="line-clamp-3 min-w-0">{pick(answer, settings.lang)}</span>
          {/if}
        </span>
      {/if}
    </span>

    {#if thumb && !expanded}
      <img
        src={imageUrl(thumb)}
        alt=""
        class="size-14 shrink-0 rounded-xl border border-line bg-white object-contain p-1 sm:size-16"
        loading="lazy"
        draggable="false"
      />
    {/if}

    <span class="flex shrink-0 flex-col items-center gap-2 pt-1">
      <StatusIcon {status} />
      {#if bookmarked}
        <Bookmark size={16} class="text-sun-500" fill="currentColor" aria-hidden="true" />
        <span class="sr-only">{tr(T.bookmarked)}</span>
      {/if}
      <ChevronDown size={18} class="text-ink-faint transition-transform {expanded ? 'rotate-180' : ''}" aria-hidden="true" />
    </span>
  </button>

  {#if expanded}
    <div id={detailId} class="animate-rise border-t-2 border-line px-3 pt-4 pb-3 sm:px-4 sm:pb-4">
      <QuestionDetail {question} {reveal} />

      <div class="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3">
        <p class="flex w-full items-center gap-2 text-xs font-bold text-ink-muted sm:mr-auto sm:w-auto">
          <StatusIcon {status} size={16} labelled />
          {#if qstate?.seen}
            <span aria-hidden="true">·</span>
            <span>
              {tr({ en: '{r} right, {w} wrong', rw: 'Ukuri {r}, amakosa {w}' }, { r: qstate.right, w: qstate.wrong })}
            </span>
          {/if}
        </p>
        {#if !reveal}
          <button type="button" class="btn btn-sun btn-sm" onclick={onreveal}>
            <Eye size={16} />{tr({ en: 'Show answer', rw: 'Erekana igisubizo' })}
          </button>
        {/if}
        <button
          type="button"
          class="btn btn-soft btn-sm {bookmarked ? 'text-sun-600 dark:text-sun-300' : ''}"
          aria-pressed={bookmarked}
          aria-label={tr(T.bookmark)}
          onclick={() => toggleBookmark(question.id)}
        >
          <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
          <span class="hidden sm:inline">{bookmarked ? tr(T.bookmarked) : tr(T.bookmark)}</span>
        </button>
        <a class="btn btn-primary btn-sm ml-auto sm:ml-0" href={href(`/q/${question.id}`)} onclick={onopen}>
          {tr({ en: 'Open', rw: 'Fungura' })}<ArrowRight size={16} />
        </a>
      </div>
    </div>
  {/if}
</li>
