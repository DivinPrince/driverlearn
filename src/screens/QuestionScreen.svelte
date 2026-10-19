<script module lang="ts">
  import { QUESTIONS } from '../lib/data'

  /** Question ids in order, for Previous / Next. */
  const ORDER: number[] = QUESTIONS.map((q) => q.id).sort((a, b) => a - b)

  /** Correct answers in a row while answering on question pages (kept across Previous / Next). */
  let pageCombo = 0
</script>

<script lang="ts">
  import ArrowRight from '@lucide/svelte/icons/arrow-right'
  import Bookmark from '@lucide/svelte/icons/bookmark'
  import ChevronLeft from '@lucide/svelte/icons/chevron-left'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import Dumbbell from '@lucide/svelte/icons/dumbbell'
  import Eye from '@lucide/svelte/icons/eye'
  import LibraryBig from '@lucide/svelte/icons/library-big'
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw'
  import { burst } from '../lib/celebrate'
  import EmptyState from '../lib/components/EmptyState.svelte'
  import PageHeader from '../lib/components/PageHeader.svelte'
  import QuestionCard from '../lib/components/QuestionCard.svelte'
  import { getQuestion, QUESTIONS_BY_TOPIC } from '../lib/data'
  import { topicStats } from '../lib/engine/stats'
  import { tr, T } from '../lib/i18n'
  import { href, navigate, route } from '../lib/router.svelte'
  import { sfx, vibrate } from '../lib/sound'
  import { isBookmarked, progress, recordAnswer, toggleBookmark } from '../lib/state/progress.svelte'
  import { TOPIC_BY_ID } from '../lib/topics'
  import type { L10n } from '../lib/types'
  import QuestionHistory from './library/QuestionHistory.svelte'
  import StatusIcon from './library/StatusIcon.svelte'
  import { statusOf } from './library/status'

  // The screen is remounted on every route change, so the id can be read once.
  const id = Number(route.parts[1])
  const question = Number.isInteger(id) ? getQuestion(id) : undefined
  const pos = ORDER.indexOf(id)
  const prevId: number | undefined = pos > 0 ? ORDER[pos - 1] : undefined
  const nextId: number | undefined = pos >= 0 && pos < ORDER.length - 1 ? ORDER[pos + 1] : undefined
  const topic = question ? TOPIC_BY_ID[question.topic] : undefined

  interface Feedback {
    correct: boolean
    /** XP earned, or null when the attempt was practice only (not recorded). */
    xp: number | null
    combo: number
  }

  let selected: number | null = $state(null)
  let revealed = $state(false)
  /** An answer from this visit was recorded; later attempts are practice only. */
  let counted = $state(false)
  /** The answer was shown without trying first. */
  let peeked = $state(false)
  let feedback: Feedback | null = $state(null)

  const qstate = $derived(question ? progress.q[question.id] : undefined)
  const status = $derived(statusOf(qstate))
  const bookmarked = $derived(question ? isBookmarked(question.id) : false)
  const stats = $derived(question ? topicStats(question.topic, QUESTIONS_BY_TOPIC[question.topic] ?? [], progress.q) : null)

  const praise: L10n[] = [
    { en: 'Correct!', rw: 'Ni byo!' },
    { en: 'Nailed it!', rw: 'Ni byo rwose!' },
    { en: 'Great job!', rw: 'Wakoze neza!' },
  ]

  function answer(i: number) {
    if (!question || revealed) return
    selected = i
    revealed = true
    const correct = i === question.answer
    if (!counted && !peeked) {
      pageCombo = correct ? pageCombo + 1 : 0
      const res = recordAnswer(question.id, i, pageCombo)
      counted = true
      feedback = { correct: res.correct, xp: res.xp, combo: pageCombo }
      if (res.correct && pageCombo >= 5 && pageCombo % 5 === 0) burst(0.5, 0.75)
    } else {
      feedback = { correct, xp: null, combo: 0 }
    }
    if (correct) sfx.correct()
    else {
      sfx.wrong()
      vibrate(120)
    }
  }

  function showAnswer() {
    if (!question || revealed) return
    peeked = true
    revealed = true
    selected = null
    feedback = null
    sfx.tap()
  }

  function retry() {
    selected = null
    revealed = false
    feedback = null
  }

  /** Replace (not push) so the back button still returns to where the learner came from. */
  function go(target: number | undefined) {
    if (target !== undefined) navigate(`/q/${target}`, undefined, true)
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
    const t = e.target as HTMLElement | null
    if (t && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable)) return
    if (document.querySelector('dialog[open]')) return
    if (e.key === 'ArrowLeft' && prevId !== undefined) {
      e.preventDefault()
      go(prevId)
    } else if (e.key === 'ArrowRight' && nextId !== undefined) {
      e.preventDefault()
      go(nextId)
    }
  }
</script>

<svelte:window {onkeydown} />

{#if !question || !topic}
  <PageHeader title={tr(T.question)} backTo="/library" />
  <EmptyState
    title={tr({ en: 'Question not found', rw: 'Iki kibazo ntikibonetse' })}
    body={tr({
      en: 'There is no question with this number. Browse the full list instead.',
      rw: 'Nta kibazo gifite iyi nimero. Reba urutonde rw’ibibazo byose.',
    })}
  >
    <a class="btn btn-primary" href={href('/library')}><LibraryBig size={18} />{tr(T.library)}</a>
    <a class="btn btn-soft" href={href('/practice', { mode: 'smart' })}><Dumbbell size={18} />{tr({ en: 'Practise', rw: 'Itoze' })}</a>
  </EmptyState>
{:else}
  <PageHeader
    title="{tr(T.question)} #{question.id}"
    subtitle={tr({ en: '{i} of {n} in the question bank', rw: '{i} kuri {n} mu bibazo byose' }, { i: pos + 1, n: ORDER.length })}
    backTo="/library"
  >
    {#snippet actions()}
      <button
        class="btn btn-soft btn-icon btn-sm {bookmarked ? 'text-sun-500' : ''}"
        onclick={() => toggleBookmark(question.id)}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? tr(T.bookmarked) : tr(T.bookmark)}
        title={bookmarked ? tr(T.bookmarked) : tr(T.bookmark)}
      >
        <Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} />
      </button>
    {/snippet}
  </PageHeader>

  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
    <div class="min-w-0">
      <!-- Topic + status chips -->
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <a
          href={href('/practice', { mode: 'topic', topic: topic.id })}
          class="chip gap-2 border-2 border-line bg-surface py-1.5 text-sm text-ink transition hover:border-brand-300 hover:text-brand-600 dark:hover:text-brand-300"
          title={tr({ en: 'Practise this topic', rw: 'Itoze iri somo' })}
        >
          <span aria-hidden="true">{topic.emoji}</span>{tr(topic.name)}
          <ArrowRight size={14} aria-hidden="true" />
        </a>
        <span class="chip py-1.5 text-sm"><StatusIcon {status} size={16} labelled /></span>
        {#if bookmarked}
          <span class="chip bg-sun-100 py-1.5 text-sm text-sun-600 dark:bg-sun-600/20 dark:text-sun-300">
            <Bookmark size={14} fill="currentColor" aria-hidden="true" />{tr(T.bookmarked)}
          </span>
        {/if}
      </div>

      <QuestionCard
        {question}
        {selected}
        reveal={revealed}
        keyboard
        onselect={answer}
        eyebrow={revealed ? undefined : tr({ en: 'Pick an answer to test yourself', rw: 'Hitamo igisubizo wigerageze' })}
      />

      <!-- Feedback / actions -->
      {#if feedback}
        <div
          class="mt-4 flex animate-rise flex-wrap items-center gap-3 rounded-3xl border-2 p-4 {feedback.correct
            ? 'border-leaf-200 bg-leaf-100 dark:border-leaf-700/50 dark:bg-leaf-700/15'
            : 'border-flame-200 bg-flame-100 dark:border-flame-700/50 dark:bg-flame-700/15'}"
          role="status"
        >
          <span
            class="grid size-11 shrink-0 animate-pop place-items-center rounded-full text-xl font-black text-white {feedback.correct
              ? 'bg-leaf-500'
              : 'bg-flame-500'}"
            aria-hidden="true">{feedback.correct ? '✓' : '✕'}</span
          >
          <div class="min-w-0 flex-1">
            <p class="font-display text-lg font-black {feedback.correct ? 'text-leaf-700 dark:text-leaf-400' : 'text-flame-600 dark:text-flame-400'}">
              {feedback.correct ? tr(praise[question.id % praise.length]) : tr(T.wrong)}
            </p>
            <p class="text-sm font-semibold text-ink-muted">
              {#if feedback.xp !== null}
                +{feedback.xp} XP{#if feedback.correct && feedback.combo >= 2}
                  · 🔥 {tr({ en: '{n} in a row', rw: '{n} bikurikiranye' }, { n: feedback.combo })}{/if}
                {#if !feedback.correct}· {tr({ en: 'We’ll ask you again soon.', rw: 'Tuzongera tukikubaze vuba.' })}{/if}
              {:else}
                {tr({ en: 'Practice only — not counted again.', rw: 'Ni imyitozo gusa — ntibyongera kubarwa.' })}
              {/if}
            </p>
          </div>
          <button class="btn btn-soft btn-sm" onclick={retry}><RotateCcw size={16} />{tr(T.retry)}</button>
        </div>
      {:else if revealed}
        <div class="mt-4 flex animate-rise flex-wrap items-center gap-3 rounded-3xl border-2 border-line bg-surface-2 p-4">
          <span class="grid size-11 shrink-0 place-items-center rounded-full bg-sun-400 text-xl" aria-hidden="true">👀</span>
          <p class="min-w-0 flex-1 text-sm font-semibold text-ink-muted">
            {tr({
              en: 'Answer shown, so it wasn’t counted. Try the next one on your own!',
              rw: 'Igisubizo cyerekanywe, ntibyabaruwe. Gerageza igikurikira wenyine!',
            })}
          </p>
          <button class="btn btn-soft btn-sm" onclick={retry}><RotateCcw size={16} />{tr(T.retry)}</button>
        </div>
      {:else}
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <button class="btn btn-soft" onclick={showAnswer}><Eye size={18} />{tr({ en: 'Show answer', rw: 'Erekana igisubizo' })}</button>
          <p class="min-w-0 flex-1 text-sm text-ink-faint">
            {tr({ en: 'Your first answer counts towards your progress.', rw: 'Igisubizo cya mbere kibarwa mu byo umaze kugeraho.' })}
          </p>
        </div>
      {/if}

      <!-- Previous / Next -->
      <nav class="mt-6 grid grid-cols-2 gap-3" aria-label={tr({ en: 'Browse questions', rw: 'Hindura ikibazo' })}>
        <button class="btn btn-soft min-w-0" disabled={prevId === undefined} onclick={() => go(prevId)}>
          <ChevronLeft size={20} class="shrink-0" />
          <span class="truncate">{tr({ en: 'Previous', rw: 'Ikibanziriza' })}</span>
          {#if prevId !== undefined}<span class="hidden text-ink-faint tabular-nums sm:inline">#{prevId}</span>{/if}
        </button>
        <button class="btn btn-primary min-w-0" disabled={nextId === undefined} onclick={() => go(nextId)}>
          <span class="truncate">{tr({ en: 'Next', rw: 'Igikurikira' })}</span>
          {#if nextId !== undefined}<span class="hidden opacity-75 tabular-nums sm:inline">#{nextId}</span>{/if}
          <ChevronRight size={20} class="shrink-0" />
        </button>
      </nav>
      <p class="mt-3 hidden text-center text-sm text-ink-faint lg:block">
        {tr({ en: 'Tip: press ← → to move, 1–4 to answer', rw: 'Inama: kanda ← → wimuke, 1–4 usubize' })}
      </p>
    </div>

    <aside class="flex flex-col gap-4">
      <QuestionHistory {qstate} />

      {#if stats}
        <section class="card overflow-hidden" aria-labelledby="q-topic-title">
          <div class="flex items-center gap-3 bg-gradient-to-br {topic.gradient} p-4 text-white">
            <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/25 text-2xl" aria-hidden="true">{topic.emoji}</span>
            <div class="min-w-0">
              <p class="text-xs font-extrabold tracking-[0.12em] uppercase opacity-85">{tr({ en: 'Topic', rw: 'Isomo' })}</p>
              <h2 id="q-topic-title" class="truncate text-lg font-bold">{tr(topic.name)}</h2>
            </div>
          </div>
          <div class="p-4">
            <div class="flex justify-between text-sm">
              <span class="text-ink-muted">{tr(T.mastered)}</span>
              <span class="font-bold tabular-nums">{stats.mastered} / {stats.total}</span>
            </div>
            <div
              class="bar mt-2 h-2.5"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(stats.mastery * 100)}
              aria-label={tr({ en: 'Topic mastery', rw: 'Ubumenyi bw’isomo' })}
            >
              <span style:width="{stats.mastery * 100}%" style:background-color={topic.color}></span>
            </div>
            <div class="mt-4 flex flex-col gap-2">
              <a class="btn btn-primary btn-sm" href={href('/practice', { mode: 'topic', topic: topic.id })}>
                <Dumbbell size={16} />{tr({ en: 'Practise this topic', rw: 'Itoze iri somo' })}
              </a>
              <a class="btn btn-ghost btn-sm" href={href('/library', { topic: topic.id })}>
                <LibraryBig size={16} />{tr({ en: 'Browse this topic', rw: 'Reba ibibazo byose by’iri somo' })}
              </a>
            </div>
          </div>
        </section>
      {/if}
    </aside>
  </div>
{/if}
