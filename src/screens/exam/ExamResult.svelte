<script lang="ts">
  import Check from '@lucide/svelte/icons/check'
  import ChevronDown from '@lucide/svelte/icons/chevron-down'
  import CircleCheck from '@lucide/svelte/icons/circle-check'
  import CircleX from '@lucide/svelte/icons/circle-x'
  import House from '@lucide/svelte/icons/house'
  import Minus from '@lucide/svelte/icons/minus'
  import Play from '@lucide/svelte/icons/play'
  import Target from '@lucide/svelte/icons/target'
  import X from '@lucide/svelte/icons/x'
  import { celebrate } from '../../lib/celebrate'
  import EmptyState from '../../lib/components/EmptyState.svelte'
  import Mascot from '../../lib/components/Mascot.svelte'
  import PageHeader from '../../lib/components/PageHeader.svelte'
  import ProgressRing from '../../lib/components/ProgressRing.svelte'
  import QuestionCard from '../../lib/components/QuestionCard.svelte'
  import { getQuestion, imageUrl, OPTION_LETTERS, pick } from '../../lib/data'
  import { examXp } from '../../lib/engine/gamify'
  import { tr, T } from '../../lib/i18n'
  import { href, navigate, route } from '../../lib/router.svelte'
  import { sfx } from '../../lib/sound'
  import { exam, startExam } from '../../lib/state/exam.svelte'
  import { progress } from '../../lib/state/progress.svelte'
  import { settings } from '../../lib/state/settings.svelte'
  import { TOPIC_BY_ID } from '../../lib/topics'
  import type { L10n, Question, TopicId } from '../../lib/types'
  import { clock, dateText, durationText, passMark } from './format'

  const id = route.parts[2] ?? ''
  const record = $derived(progress.exams.find((e) => e.id === id))

  // Celebrate only right after submitting (not when reopening the result later).
  const fresh = exam.justFinished === id
  if (fresh) exam.justFinished = null
  $effect(() => {
    if (fresh && record?.passed) {
      celebrate()
      sfx.complete()
    }
  })

  type Outcome = 'correct' | 'wrong' | 'skipped'
  interface Item {
    n: number
    question: Question
    chosen: number | null
    outcome: Outcome
  }

  const items = $derived.by((): Item[] => {
    if (!record) return []
    const list: Item[] = []
    record.questions.forEach((qid, i) => {
      const question = getQuestion(qid)
      if (!question) return
      const chosen = record.answers[i] ?? null
      const outcome: Outcome = chosen === null ? 'skipped' : chosen === question.answer ? 'correct' : 'wrong'
      list.push({ n: i + 1, question, chosen, outcome })
    })
    return list
  })

  const mistakes = $derived(items.filter((x) => x.outcome !== 'correct'))
  const skipped = $derived(items.filter((x) => x.outcome === 'skipped').length)
  const mark = $derived(record ? passMark(record.total) : 0)
  const ratio = $derived(record && record.total ? record.score / record.total : 0)
  const xp = $derived(record ? examXp(record.score, record.passed) : 0)
  const shortBy = $derived(record ? Math.max(0, mark - record.score) : 0)

  interface TopicRow {
    topic: TopicId
    right: number
    total: number
  }
  const byTopic = $derived.by((): TopicRow[] => {
    const map = new Map<TopicId, TopicRow>()
    for (const x of items) {
      const row = map.get(x.question.topic) ?? { topic: x.question.topic, right: 0, total: 0 }
      row.total++
      if (x.outcome === 'correct') row.right++
      map.set(x.question.topic, row)
    }
    return [...map.values()].sort((a, b) => a.right / a.total - b.right / b.total || b.total - a.total)
  })

  type Filter = 'all' | 'mistakes' | 'correct'
  let filter: Filter = $state('all')
  const visible = $derived(
    filter === 'all' ? items : filter === 'mistakes' ? mistakes : items.filter((x) => x.outcome === 'correct'),
  )
  let open: number[] = $state([])
  function toggle(n: number) {
    const i = open.indexOf(n)
    if (i >= 0) open.splice(i, 1)
    else open.push(n)
  }

  function newExam() {
    // An exam is already in progress (e.g. reopened an old result): go back to it rather than discard it.
    if (exam.active) {
      navigate('/exam/run')
      return
    }
    startExam()
    sfx.tap()
    navigate('/exam/run')
  }

  const mistakesHref = $derived(href('/practice', { mode: 'ids', ids: mistakes.map((x) => x.question.id).join(',') }))

  const headline = $derived.by((): L10n => {
    if (!record) return { en: '', rw: '' }
    if (record.passed && record.score === record.total) return { en: 'Perfect score!', rw: 'Nta kosa na rimwe!' }
    if (record.passed) return { en: 'You passed!', rw: 'Watsinze!' }
    if (shortBy <= 2) return { en: 'So close!', rw: 'Wari hafi cyane!' }
    return { en: 'Not this time', rw: 'Ubu ntibikunze' }
  })

  const message = $derived.by((): L10n => {
    if (!record) return { en: '', rw: '' }
    if (record.passed)
      return {
        en: 'You’re on the road to your licence. Keep practising to make it a sure thing.',
        rw: 'Uri mu nzira nziza yo kubona uruhushya. Komeza witoze kugira ngo uzatsinde nta shiti.',
      }
    return {
      en: 'Every mock exam makes you stronger. Practise the questions you missed and try again!',
      rw: 'Buri kizamini cy’igerageza kigufasha gukomera. Itoze ku bibazo wishe, wongere ugerageze!',
    }
  })

  function optionText(q: Question, i: number): string {
    return pick(q.options[i], settings.lang)
  }

  const FILTERS: { id: Filter; label: L10n }[] = [
    { id: 'all', label: { en: 'All', rw: 'Byose' } },
    { id: 'mistakes', label: { en: 'Mistakes', rw: 'Ibyo wishe' } },
    { id: 'correct', label: { en: 'Correct', rw: 'Ibyo wakoze neza' } },
  ]
  const filterCount = (f: Filter) => (f === 'all' ? items.length : f === 'mistakes' ? mistakes.length : items.length - mistakes.length)
</script>

{#if !record}
  <div class="pt-6">
    <EmptyState
      title={tr({ en: 'We couldn’t find that exam', rw: 'Iki kizamini nticyabonetse' })}
      body={tr({
        en: 'It may have been removed when progress was reset. Take a new mock exam to get fresh results.',
        rw: 'Gishobora kuba cyarasibwe igihe wasibaga ibyo wagezeho. Kora ikizamini gishya ubone amanota mashya.',
      })}
      mood="sad"
    >
      <a class="btn btn-primary" href={href('/exam')}>{tr(T.exam)}</a>
      <a class="btn btn-soft" href={href('/')}>{tr(T.home)}</a>
    </EmptyState>
  </div>
{:else}
  <PageHeader title={tr({ en: 'Exam result', rw: 'Amanota y’ikizamini' })} subtitle={dateText(record.date)} backTo="/exam" />

  <div class="flex flex-col gap-6">
    <!-- Hero -->
    <section
      class="relative overflow-hidden rounded-4xl p-6 text-center sm:p-8 {record.passed
        ? 'bg-gradient-to-br from-leaf-400 to-leaf-600 text-white shadow-lg dark:from-leaf-600 dark:to-leaf-700'
        : 'card'}"
      aria-labelledby="result-title"
    >
      {#if record.passed}
        <div class="pointer-events-none absolute -top-20 -left-16 size-56 rounded-full bg-white/10" aria-hidden="true"></div>
        <div class="pointer-events-none absolute -right-10 -bottom-24 size-64 rounded-full bg-sun-300/20" aria-hidden="true"></div>
      {/if}
      <div class="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10 sm:text-left">
        <div class="relative animate-pop">
          <ProgressRing
            value={ratio}
            size={168}
            stroke={14}
            color={record.passed ? 'var(--color-sun-300)' : ratio >= 0.4 ? 'var(--color-sun-400)' : 'var(--color-flame-500)'}
            track={record.passed ? 'rgb(255 255 255 / 0.25)' : 'var(--surface-3)'}
            label={tr({ en: 'Score: {s} out of {t}', rw: 'Amanota: {s} kuri {t}' }, { s: record.score, t: record.total })}
          >
            <span class="flex flex-col items-center">
              <span class="font-display text-5xl font-black tracking-tight">{record.score}</span>
              <span class="mt-1 text-sm font-bold {record.passed ? 'text-white/80' : 'text-ink-muted'}">
                {tr({ en: 'out of {t}', rw: 'kuri {t}' }, { t: record.total })}
              </span>
            </span>
          </ProgressRing>
          {#if !record.passed}
            <Mascot size={72} mood={shortBy <= 2 ? 'think' : 'sad'} class="absolute -right-6 -bottom-3 text-ink drop-shadow" />
          {/if}
        </div>

        <div class="max-w-sm">
          {#if record.passed}
            <span class="chip bg-white/20 text-white ring-1 ring-white/30"><CircleCheck size={14} strokeWidth={2.6} />{tr(T.passed)}</span>
          {:else}
            <span class="chip bg-flame-100 text-flame-700 dark:bg-flame-700/25 dark:text-flame-200"><CircleX size={14} strokeWidth={2.6} />{tr(T.failed)}</span>
          {/if}
          <h1 id="result-title" class="mt-2 text-3xl font-black sm:text-4xl">
            {tr(headline)}{record.passed ? ' 🎉' : ''}
          </h1>
          <p class="mt-2 {record.passed ? 'text-white/90' : 'text-ink-muted'}">{tr(message)}</p>
          <p class="mt-3 text-sm font-bold {record.passed ? 'text-white/85' : 'text-ink'}">
            {#if record.passed}
              {tr({ en: 'Pass mark {p}/{t} — you beat it by {d}.', rw: 'Gutsinda ni {p}/{t} — wayirengejeho {d}.' }, {
                p: mark,
                t: record.total,
                d: record.score - mark,
              })}
            {:else if shortBy === 1}
              {tr(
                { en: 'You needed {p}/{t} — just one more correct answer to pass!', rw: 'Wari ukeneye {p}/{t} — wabuze igisubizo kimwe gusa ngo utsinde!' },
                { p: mark, t: record.total },
              )}
            {:else}
              {tr(
                { en: 'You needed {p}/{t} — {d} more correct answers to pass.', rw: 'Wari ukeneye {p}/{t} — wabuze ibisubizo {d} by’ukuri ngo utsinde.' },
                { p: mark, t: record.total, d: shortBy },
              )}
            {/if}
          </p>
        </div>
      </div>
    </section>

    <!-- Key numbers -->
    <dl class="grid grid-cols-3 gap-3">
      <div class="card flex flex-col items-center gap-1 p-4 text-center">
        <dt class="order-2 text-xs font-bold text-ink-muted">{tr({ en: 'Time used', rw: 'Igihe wakoresheje' })}</dt>
        <dd class="order-1 font-display text-2xl font-black tabular-nums sm:text-3xl" title={durationText(record.durationSec)}>
          {clock(record.durationSec)}
        </dd>
      </div>
      <div class="card flex flex-col items-center gap-1 p-4 text-center">
        <dt class="order-2 text-xs font-bold text-ink-muted">{tr({ en: 'XP earned', rw: 'XP wabonye' })}</dt>
        <dd class="order-1 font-display text-2xl font-black text-sun-600 sm:text-3xl dark:text-sun-300">+{xp}</dd>
      </div>
      <div class="card flex flex-col items-center gap-1 p-4 text-center">
        <dt class="order-2 text-xs font-bold text-ink-muted">{tr({ en: 'Accuracy', rw: 'Ukuri' })}</dt>
        <dd class="order-1 font-display text-2xl font-black sm:text-3xl">{Math.round(ratio * 100)}%</dd>
      </div>
    </dl>

    <!-- Actions -->
    <div class="flex flex-col gap-3 sm:flex-row">
      {#if mistakes.length}
        <a class="btn btn-primary btn-lg flex-1" href={mistakesHref}>
          <Target size={20} />{tr({ en: 'Practise my mistakes', rw: 'Itoze ku makosa yanjye' })}
          <span class="rounded-lg bg-white/20 px-2 py-0.5 text-sm tabular-nums">{mistakes.length}</span>
        </a>
      {/if}
      <button class="btn {mistakes.length ? 'btn-soft' : 'btn-primary'} btn-lg flex-1" onclick={newExam}>
        <Play size={18} fill="currentColor" />{exam.active ? tr({ en: 'Resume exam', rw: 'Komeza ikizamini' }) : tr({ en: 'New exam', rw: 'Ikizamini gishya' })}
      </button>
      <a class="btn btn-soft btn-lg sm:flex-none" href={href('/')}><House size={18} />{tr(T.home)}</a>
    </div>

    <!-- Per-topic breakdown -->
    {#if byTopic.length}
      <section class="card p-5 sm:p-6" aria-labelledby="topics-title">
        <h2 id="topics-title" class="text-lg font-bold">{tr({ en: 'How you did by topic', rw: 'Uko wakoze muri buri somo' })}</h2>
        <p class="mt-0.5 text-sm text-ink-muted">{tr({ en: 'Weakest topics first', rw: 'Amasomo akugoye ni yo abanza' })}</p>
        <ul class="mt-5 flex flex-col gap-4">
          {#each byTopic as row (row.topic)}
            {@const meta = TOPIC_BY_ID[row.topic]}
            {@const r = row.right / row.total}
            <li>
              <a href={href('/practice', { mode: 'topic', topic: row.topic })} class="group block rounded-2xl p-1 -m-1 transition hover:bg-surface-2">
                <span class="flex items-center gap-3">
                  <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-lg group-hover:bg-surface-3" aria-hidden="true">{meta.emoji}</span>
                  <span class="min-w-0 flex-1">
                    <span class="flex items-baseline justify-between gap-3">
                      <span class="truncate text-sm font-bold">{tr(meta.name)}</span>
                      <span class="shrink-0 font-display text-sm font-bold tabular-nums">
                        {row.right}/{row.total}
                        <span class="sr-only">{tr({ en: 'correct', rw: 'by’ukuri' })}</span>
                      </span>
                    </span>
                    <span class="bar mt-1.5 block h-2.5" aria-hidden="true">
                      <span
                        class={r >= 0.6 ? 'bg-leaf-500' : r > 0 ? 'bg-sun-400' : 'bg-flame-500'}
                        style:width="{Math.max(r * 100, r === 0 ? 0 : 6)}%"
                      ></span>
                    </span>
                  </span>
                </span>
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <!-- Review every question -->
    <section aria-labelledby="review-title">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="review-title" class="text-xl font-bold">{tr({ en: 'Review your answers', rw: 'Subiramo ibisubizo byawe' })}</h2>
          {#if skipped}
            <p class="mt-0.5 text-sm text-ink-muted">
              {tr({ en: '{n} left unanswered (counted as wrong)', rw: 'Ibibazo {n} ntiwabisubije (byabazwe nk’amakosa)' }, { n: skipped })}
            </p>
          {/if}
        </div>
        <div class="flex gap-1 rounded-2xl bg-surface-2 p-1" role="group" aria-label={tr({ en: 'Filter questions', rw: 'Hitamo ibibazo' })}>
          {#each FILTERS as f (f.id)}
            <button
              class="rounded-xl px-3 py-1.5 font-display text-sm font-bold transition {filter === f.id
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'}"
              aria-pressed={filter === f.id}
              onclick={() => (filter = f.id)}
            >
              {tr(f.label)} <span class="tabular-nums text-ink-faint">{filterCount(f.id)}</span>
            </button>
          {/each}
        </div>
      </div>

      {#if visible.length === 0}
        <p class="card-flat border-dashed p-6 text-center text-ink-muted">
          {filter === 'mistakes'
            ? tr({ en: 'No mistakes — flawless! 🌟', rw: 'Nta kosa na rimwe — ni byiza cyane! 🌟' })
            : tr({ en: 'No correct answers yet — you’ll get there!', rw: 'Nta gisubizo cy’ukuri — uzabigeraho!' })}
        </p>
      {:else}
        <ol class="flex flex-col gap-3">
          {#each visible as item (item.n)}
            {@const q = item.question}
            {@const expanded = open.includes(item.n)}
            <li class="card-flat overflow-hidden {expanded ? 'border-line-strong' : ''}">
              <button
                class="flex w-full items-start gap-3 p-4 text-left transition hover:bg-surface-2/60"
                aria-expanded={expanded}
                aria-controls="review-{item.n}"
                onclick={() => toggle(item.n)}
              >
                <span
                  class="relative grid size-10 shrink-0 place-items-center rounded-xl font-display text-sm font-black tabular-nums {item.outcome ===
                  'correct'
                    ? 'bg-leaf-100 text-leaf-700 dark:bg-leaf-700/30 dark:text-leaf-400'
                    : item.outcome === 'wrong'
                      ? 'bg-flame-100 text-flame-700 dark:bg-flame-700/25 dark:text-flame-200'
                      : 'bg-surface-3 text-ink-muted'}"
                >
                  {item.n}
                  <span
                    class="absolute -right-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full text-white ring-2 ring-surface {item.outcome ===
                    'correct'
                      ? 'bg-leaf-500'
                      : item.outcome === 'wrong'
                        ? 'bg-flame-500'
                        : 'bg-ink-faint'}"
                    aria-hidden="true"
                  >
                    {#if item.outcome === 'correct'}<Check size={12} strokeWidth={3.5} />{:else if item.outcome === 'wrong'}<X
                        size={12}
                        strokeWidth={3.5}
                      />{:else}<Minus size={12} strokeWidth={3.5} />{/if}
                  </span>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="sr-only">
                    {item.outcome === 'correct'
                      ? tr(T.correct)
                      : item.outcome === 'wrong'
                        ? tr(T.wrong)
                        : tr({ en: 'Not answered', rw: 'Ntiwasubije' })}
                  </span>
                  <span class="line-clamp-2 font-semibold leading-snug">{pick(q.q, settings.lang)}</span>
                  <span class="mt-2 flex flex-col gap-1 text-sm">
                    <span class="flex min-w-0 items-center gap-1.5">
                      <span class="shrink-0 text-ink-muted">{tr({ en: 'Your answer', rw: 'Igisubizo cyawe' })}:</span>
                      {#if item.chosen === null}
                        <span class="font-bold text-ink-faint italic">{tr({ en: 'Not answered', rw: 'Ntiwasubije' })}</span>
                      {:else}
                        {@render answerChip(q, item.chosen, item.outcome === 'correct' ? 'correct' : 'wrong')}
                      {/if}
                    </span>
                    {#if item.outcome !== 'correct'}
                      <span class="flex min-w-0 items-center gap-1.5">
                        <span class="shrink-0 text-ink-muted">{tr(T.correctAnswer)}:</span>
                        {@render answerChip(q, q.answer, 'correct')}
                      </span>
                    {/if}
                  </span>
                </span>
                <ChevronDown size={20} class="mt-1 shrink-0 text-ink-faint transition-transform duration-200 {expanded ? 'rotate-180' : ''}" />
                <span class="sr-only">{expanded ? tr({ en: 'Hide details', rw: 'Hisha' }) : tr({ en: 'Show details', rw: 'Reba byose' })}</span>
              </button>
              {#if expanded}
                <div id="review-{item.n}" class="animate-rise border-t border-line bg-surface-2/50 p-3 sm:p-4">
                  <QuestionCard
                    question={q}
                    selected={item.chosen}
                    reveal
                    eyebrow="{tr(TOPIC_BY_ID[q.topic].name)} · #{q.id}"
                  />
                  <div class="mt-3 flex justify-end">
                    <a class="btn btn-ghost btn-sm" href={href(`/q/${q.id}`)}>{tr({ en: 'Open question page', rw: 'Fungura ikibazo' })}</a>
                  </div>
                </div>
              {/if}
            </li>
          {/each}
        </ol>
      {/if}
    </section>

    <div class="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:justify-center">
      {#if mistakes.length}
        <a class="btn btn-primary" href={mistakesHref}><Target size={18} />{tr({ en: 'Practise my mistakes', rw: 'Itoze ku makosa yanjye' })}</a>
      {/if}
      <button class="btn btn-soft" onclick={newExam}>
        <Play size={16} fill="currentColor" />{exam.active ? tr({ en: 'Resume exam', rw: 'Komeza ikizamini' }) : tr({ en: 'New exam', rw: 'Ikizamini gishya' })}
      </button>
      <a class="btn btn-ghost" href={href('/')}><House size={18} />{tr(T.home)}</a>
    </div>
  </div>
{/if}

{#snippet answerChip(q: Question, i: number, tone: 'correct' | 'wrong')}
  {@const opt = q.options[i]}
  <span
    class="inline-flex min-w-0 items-center gap-1.5 rounded-lg px-1.5 py-0.5 font-bold {tone === 'correct'
      ? 'bg-leaf-100 text-leaf-700 dark:bg-leaf-700/25 dark:text-leaf-400'
      : 'bg-flame-100 text-flame-700 dark:bg-flame-700/25 dark:text-flame-200'}"
  >
    <span class="shrink-0 font-display">{OPTION_LETTERS[i]}</span>
    {#if opt?.image}
      <img src={imageUrl(opt.image)} alt={optionText(q, i)} class="h-7 w-auto shrink-0 rounded bg-white object-contain" loading="lazy" />
    {/if}
    {#if opt && optionText(q, i)}
      <span class="truncate font-semibold">{optionText(q, i)}</span>
    {/if}
  </span>
{/snippet}
