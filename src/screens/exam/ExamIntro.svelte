<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import CircleCheck from '@lucide/svelte/icons/circle-check'
  import CircleX from '@lucide/svelte/icons/circle-x'
  import Clock from '@lucide/svelte/icons/clock'
  import EyeOff from '@lucide/svelte/icons/eye-off'
  import Flag from '@lucide/svelte/icons/flag'
  import Play from '@lucide/svelte/icons/play'
  import Send from '@lucide/svelte/icons/send'
  import Shuffle from '@lucide/svelte/icons/shuffle'
  import Timer from '@lucide/svelte/icons/timer'
  import Trash from '@lucide/svelte/icons/trash'
  import type { Component } from 'svelte'
  import Mascot from '../../lib/components/Mascot.svelte'
  import Modal from '../../lib/components/Modal.svelte'
  import { QUESTIONS } from '../../lib/data'
  import { tr, T } from '../../lib/i18n'
  import { href, navigate } from '../../lib/router.svelte'
  import { sfx } from '../../lib/sound'
  import { abandon, exam, remainingSec, startExam, submit } from '../../lib/state/exam.svelte'
  import { progress } from '../../lib/state/progress.svelte'
  import { settings } from '../../lib/state/settings.svelte'
  import type { L10n } from '../../lib/types'
  import ExamArt from './ExamArt.svelte'
  import { clock, dateText, passMark, summarize } from './format'
  import ScoreChart from './ScoreChart.svelte'

  const size = $derived(Math.min(settings.examSize, QUESTIONS.length))
  const minutes = $derived(settings.examMinutes)
  const mark = $derived(passMark(size))
  const official = $derived(settings.examSize === 20 && settings.examMinutes === 20)

  // Live clock for the "resume" card.
  let now = $state(Date.now())
  $effect(() => {
    if (!exam.active) return
    const id = setInterval(() => (now = Date.now()), 1000)
    return () => clearInterval(id)
  })

  const active = $derived(exam.active)
  const activeAnswered = $derived(active ? active.answers.filter((a) => a !== null).length : 0)
  const activeLeft = $derived(active ? remainingSec(active, now) : 0)
  const expired = $derived(!!active && activeLeft <= 0)

  const summary = $derived(summarize(progress.exams))
  const history = $derived([...progress.exams].reverse())
  const recent = $derived(progress.exams.slice(-10))
  let showAll = $state(false)
  const shown = $derived(showAll ? history : history.slice(0, 5))

  let confirmRestart = $state(false)
  let confirmDiscard = $state(false)

  function start() {
    if (exam.active) {
      confirmRestart = true
      return
    }
    begin()
  }

  function begin() {
    confirmRestart = false
    startExam()
    sfx.tap()
    navigate('/exam/run')
  }

  function seeExpiredResult() {
    const id = submit()
    if (id) navigate(`/exam/result/${id}`)
  }

  interface Rule {
    icon: Component<{ size?: number; strokeWidth?: number }>
    text: L10n
  }
  const RULES: Rule[] = [
    {
      icon: Shuffle,
      text: { en: 'Questions are drawn from every topic, like the real test.', rw: 'Ibibazo bituruka mu masomo yose, nko mu kizamini nyirizina.' },
    },
    {
      icon: Flag,
      text: {
        en: 'Answer in any order. Flag tricky questions and come back to them.',
        rw: 'Subiza uko ushaka. Shyira akamenyetso ku bibazo bikugoye, uzabigarukeho.',
      },
    },
    {
      icon: EyeOff,
      text: { en: 'No hints or explanations until you submit.', rw: 'Nta nama cyangwa ibisobanuro mbere yo kohereza.' },
    },
    {
      icon: Timer,
      text: {
        en: 'When time runs out, your answers are submitted automatically.',
        rw: 'Igihe nikirangira, ibisubizo byawe byoherezwa ubwabyo.',
      },
    },
  ]
</script>

<div class="flex flex-col gap-6">
  <!-- Exam in progress -->
  {#if active}
    <section
      class="card animate-rise border-2 p-5 sm:p-6 {expired ? 'border-flame-200 dark:border-flame-700/50' : 'border-sun-300 dark:border-sun-500/50'}"
      aria-labelledby="resume-title"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div class="flex min-w-0 flex-1 items-start gap-4">
          <span
            class="grid size-12 shrink-0 place-items-center rounded-2xl {expired
              ? 'bg-flame-100 text-flame-600 dark:bg-flame-700/30 dark:text-flame-400'
              : 'bg-sun-100 text-brand-950 dark:bg-sun-400/20 dark:text-sun-200'}"
            aria-hidden="true"
          >
            {#if expired}<Clock size={24} />{:else}<Timer size={24} />{/if}
          </span>
          <div class="min-w-0 flex-1">
            <h2 id="resume-title" class="text-lg leading-snug font-bold">
              {expired
                ? tr({ en: 'Time ran out on your last exam', rw: 'Igihe cy’ikizamini cyawe cyarangiye' })
                : tr({ en: 'You have an exam in progress', rw: 'Ufite ikizamini utarangije' })}
            </h2>
            <p class="mt-0.5 text-sm text-ink-muted">
              {tr({ en: '{a} of {n} answered', rw: 'Wasubije {a} kuri {n}' }, { a: activeAnswered, n: active.questions.length })}
              ·
              {#if expired}
                {tr({ en: 'see how you did', rw: 'reba uko wakoze' })}
              {:else if settings.lang === 'rw'}
                hasigaye <span class="font-bold text-ink tabular-nums">{clock(activeLeft)}</span>
              {:else}
                <span class="font-bold text-ink tabular-nums">{clock(activeLeft)}</span> left
              {/if}
            </p>
            <div class="bar mt-3 h-2.5" aria-hidden="true">
              <span class="bg-gradient-to-r from-sun-300 to-sun-500" style:width="{(activeAnswered / active.questions.length) * 100}%"></span>
            </div>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
          {#if expired}
            <button class="btn btn-primary flex-1" onclick={seeExpiredResult}><Send size={18} />{tr({ en: 'See result', rw: 'Reba amanota' })}</button>
          {:else}
            <a class="btn btn-sun flex-1" href={href('/exam/run')}><Play size={18} fill="currentColor" />{tr({ en: 'Resume exam', rw: 'Komeza ikizamini' })}</a>
          {/if}
          <button class="btn btn-ghost btn-sm text-ink-muted" onclick={() => (confirmDiscard = true)}>
            <Trash size={16} />{tr({ en: 'Discard', rw: 'Siba' })}
          </button>
        </div>
      </div>
    </section>
  {/if}

  <!-- Hero -->
  <section class="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg dark:from-brand-700 dark:to-brand-950">
    <div class="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-white/10" aria-hidden="true"></div>
    <div class="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-sun-300/10" aria-hidden="true"></div>
    <div class="relative grid items-center gap-6 p-6 pb-9 sm:p-8 sm:pb-10 md:grid-cols-[1fr_15rem]">
      <div class="min-w-0">
        <p class="text-xs font-extrabold tracking-[0.12em] text-white/75 uppercase">
          {official ? tr({ en: 'Official format', rw: 'Nk’ikizamini nyirizina' }) : tr({ en: 'Custom format', rw: 'Imiterere wahisemo' })}
        </p>
        <h1 class="mt-1 text-3xl font-black sm:text-4xl">{tr(T.exam)}</h1>
        <p class="mt-2 max-w-md text-white/85">
          {tr({
            en: 'Practise under real test conditions for your provisional driving licence.',
            rw: 'Itoze nk’uri mu kizamini nyirizina cy’uruhushya rw’agateganyo rwo gutwara.',
          })}
        </p>

        <ul class="mt-5 grid max-w-md grid-cols-3 gap-2 sm:gap-3">
          <li class="rounded-2xl bg-white/15 p-3 text-center ring-1 ring-white/20 backdrop-blur-sm">
            <span class="block font-display text-2xl leading-none font-black sm:text-3xl">{size}</span>
            <span class="mt-1 block text-xs font-bold text-white/80">{tr({ en: 'questions', rw: 'ibibazo' })}</span>
          </li>
          <li class="rounded-2xl bg-white/15 p-3 text-center ring-1 ring-white/20 backdrop-blur-sm">
            <span class="block font-display text-2xl leading-none font-black sm:text-3xl">{minutes}</span>
            <span class="mt-1 block text-xs font-bold text-white/80">{tr({ en: 'minutes', rw: 'iminota' })}</span>
          </li>
          <li class="rounded-2xl bg-white/15 p-3 text-center ring-1 ring-white/20 backdrop-blur-sm">
            <span class="block font-display text-2xl leading-none font-black sm:text-3xl">{mark}/{size}</span>
            <span class="mt-1 block text-xs font-bold text-white/80">{tr({ en: 'to pass', rw: 'byo gutsinda' })}</span>
          </li>
        </ul>

        <div class="mt-6 flex flex-wrap items-center gap-3">
          <button class="btn btn-sun btn-lg" onclick={start}>
            <Play size={20} fill="currentColor" />{tr({ en: 'Start exam', rw: 'Tangira ikizamini' })}
          </button>
          {#if !official}
            <a href={href('/settings')} class="text-sm font-bold text-white/85 underline-offset-4 hover:underline">
              {tr({ en: 'Change format in Settings', rw: 'Hindura imiterere mu Igenamiterere' })}
            </a>
          {/if}
          <ExamArt class="-my-8 ml-auto w-32 shrink-0 md:hidden" />
        </div>
      </div>
      <ExamArt class="mx-auto hidden w-60 md:block" />
    </div>
    <div class="road-stripes absolute inset-x-0 bottom-0 h-1.5 opacity-80" aria-hidden="true"></div>
  </section>

  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
    <!-- Results -->
    <section class="flex min-w-0 flex-col gap-4" aria-labelledby="attempts-title">
      <h2 id="attempts-title" class="text-xl font-bold">{tr({ en: 'Your attempts', rw: 'Ibizamini wakoze' })}</h2>

      {#if summary.attempts === 0}
        <div class="card-flat flex flex-col items-center border-2 border-dashed px-6 py-8 text-center">
          <Mascot size={96} mood="think" class="animate-float text-ink" />
          <p class="mt-3 font-display text-lg font-bold">{tr({ en: 'No attempts yet', rw: 'Nta kizamini urakora' })}</p>
          <p class="mt-1 max-w-xs text-sm text-ink-muted">
            {tr({
              en: 'Take your first mock exam — your scores and progress will show up here.',
              rw: 'Kora ikizamini cya mbere — amanota yawe n’aho ugeze bizagaragara hano.',
            })}
          </p>
        </div>
      {:else}
        <div class="grid grid-cols-3 gap-3">
          {@render tile('🏆', 'bg-sun-100 dark:bg-sun-400/20', tr({ en: 'Best score', rw: 'Amanota menshi' }), summary.best ? `${summary.best.score}/${summary.best.total}` : '—')}
          {@render tile(
            '✅',
            'bg-leaf-100 dark:bg-leaf-700/30',
            tr({ en: 'Pass rate', rw: 'Ijanisha ryo gutsinda' }),
            summary.passRate === null ? '—' : `${Math.round(summary.passRate * 100)}%`,
          )}
          {@render tile('📝', 'bg-brand-100 dark:bg-brand-900/50', tr({ en: 'Attempts', rw: 'Ibizamini' }), String(summary.attempts))}
        </div>

        {#if recent.length >= 2}
          <div class="card p-4 sm:p-5">
            <div class="mb-3 flex items-baseline justify-between gap-3">
              <h3 class="font-bold">{tr({ en: 'Recent scores', rw: 'Amanota ya vuba' })}</h3>
              <p class="text-xs font-bold text-ink-faint">
                {tr({ en: 'Last {n} attempts', rw: 'Ibizamini {n} bya nyuma' }, { n: recent.length })}
              </p>
            </div>
            <ScoreChart exams={recent} firstNumber={progress.exams.length - recent.length + 1} />
          </div>
        {/if}

        <ol class="flex flex-col gap-2">
          {#each shown as e, i (e.id)}
            <li>
              <a
                href={href(`/exam/result/${e.id}`)}
                class="card-flat group flex items-center gap-3 p-3 pr-4 transition hover:border-brand-300 sm:gap-4"
              >
                <span
                  class="grid size-12 shrink-0 place-items-center rounded-2xl font-display text-base font-black tabular-nums {e.passed
                    ? 'bg-leaf-100 text-leaf-700 dark:bg-leaf-700/30 dark:text-leaf-400'
                    : 'bg-surface-2 text-ink-muted'}"
                >
                  {e.score}/{e.total}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex flex-wrap items-center gap-2">
                    <span class="font-display font-bold">
                      {tr({ en: 'Attempt {n}', rw: 'Ikizamini cya {n}' }, { n: progress.exams.length - i })}
                    </span>
                    {#if e.passed}
                      <span class="chip bg-leaf-100 py-0.5 text-leaf-700 dark:bg-leaf-700/30 dark:text-leaf-400"><CircleCheck size={13} strokeWidth={2.6} />{tr(T.passed)}</span>
                    {:else}
                      <span class="chip bg-flame-100 py-0.5 text-flame-700 dark:bg-flame-700/25 dark:text-flame-200"><CircleX size={13} strokeWidth={2.6} />{tr(T.failed)}</span>
                    {/if}
                  </span>
                  <span class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-semibold text-ink-faint">
                    <span>{dateText(e.date)}</span>
                    <span class="inline-flex items-center gap-1 tabular-nums"><Timer size={12} />{clock(e.durationSec)}</span>
                  </span>
                </span>
                <ChevronRight size={20} class="shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </a>
            </li>
          {/each}
        </ol>
        {#if history.length > 5}
          <button class="btn btn-ghost btn-sm self-center" onclick={() => (showAll = !showAll)}>
            {showAll
              ? tr({ en: 'Show fewer', rw: 'Erekana bike' })
              : tr({ en: 'Show all {n} attempts', rw: 'Erekana ibizamini byose ({n})' }, { n: history.length })}
          </button>
        {/if}
      {/if}
    </section>

    <!-- How it works -->
    <aside class="card p-5 sm:p-6" aria-labelledby="rules-title">
      <h2 id="rules-title" class="text-lg font-bold">{tr({ en: 'How it works', rw: 'Uko bikorwa' })}</h2>
      <ul class="mt-4 flex flex-col gap-4">
        {#each RULES as rule (rule.text.en)}
          {@const Icon = rule.icon}
          <li class="flex gap-3">
            <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300" aria-hidden="true">
              <Icon size={18} strokeWidth={2.4} />
            </span>
            <span class="pt-1.5 text-sm leading-snug">{tr(rule.text)}</span>
          </li>
        {/each}
      </ul>
      <p class="mt-5 rounded-2xl bg-surface-2 p-3 text-sm text-ink-muted">
        🎯 {tr(
          { en: 'Pass mark: {p} correct answers out of {n} (60%). Every answer also trains your review schedule.', rw: 'Gutsinda ni ukubona ibisubizo {p} by’ukuri kuri {n} (60%). Buri gisubizo kandi gifasha gahunda yawe yo gusubiramo.' },
          { p: mark, n: size },
        )}
      </p>
    </aside>
  </div>
</div>

{#snippet tile(emoji: string, tone: string, label: string, value: string)}
  <div class="card flex flex-col items-center gap-2 p-3 text-center sm:flex-row sm:gap-3 sm:p-4 sm:text-left">
    <span class="grid size-10 shrink-0 place-items-center rounded-2xl text-xl sm:size-11 {tone}" aria-hidden="true">{emoji}</span>
    <div class="flex min-w-0 flex-col">
      <p class="font-display text-2xl leading-none font-bold">{value}</p>
      <p class="mt-1 text-xs leading-tight font-bold text-ink-muted">{label}</p>
    </div>
  </div>
{/snippet}

<Modal open={confirmRestart} onclose={() => (confirmRestart = false)} size="sm">
  <div class="flex flex-col items-center text-center">
    <Mascot size={100} mood="think" class="text-ink" />
    <h2 class="mt-3 text-xl font-bold">{tr({ en: 'Start a new exam?', rw: 'Utangire ikizamini gishya?' })}</h2>
    <p class="mt-1 text-ink-muted">
      {tr({ en: 'The exam you have not finished will be discarded.', rw: 'Ikizamini utarangije kizasibwa.' })}
    </p>
    <div class="mt-6 flex w-full flex-col gap-3">
      {#if active && !expired}
        <a class="btn btn-sun" href={href('/exam/run')}>{tr({ en: 'Resume my exam', rw: 'Komeza ikizamini cyanjye' })}</a>
      {/if}
      <button class="btn btn-primary" onclick={begin}>{tr({ en: 'Start a new one', rw: 'Tangira igishya' })}</button>
      <button class="btn btn-ghost" onclick={() => (confirmRestart = false)}>{tr(T.close)}</button>
    </div>
  </div>
</Modal>

<Modal open={confirmDiscard} onclose={() => (confirmDiscard = false)} size="sm">
  <div class="flex flex-col items-center text-center">
    <Mascot size={100} mood="sad" class="text-ink" />
    <h2 class="mt-3 text-xl font-bold">{tr({ en: 'Discard this exam?', rw: 'Urashaka gusiba iki kizamini?' })}</h2>
    <p class="mt-1 text-ink-muted">
      {tr({ en: 'Your answers will be lost and it won’t count in your progress.', rw: 'Ibisubizo byawe bizasibwa kandi ntikizabarwa mu byo umaze kugeraho.' })}
    </p>
    <div class="mt-6 flex w-full flex-col gap-3">
      <button
        class="btn btn-danger"
        onclick={() => {
          abandon()
          confirmDiscard = false
        }}
      >
        <Trash size={18} />{tr({ en: 'Discard', rw: 'Siba' })}
      </button>
      <button class="btn btn-ghost" onclick={() => (confirmDiscard = false)}>{tr({ en: 'Keep it', rw: 'Bireke' })}</button>
    </div>
  </div>
</Modal>
