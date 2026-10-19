<script lang="ts">
  import AlarmClock from '@lucide/svelte/icons/alarm-clock'
  import ChevronLeft from '@lucide/svelte/icons/chevron-left'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import Flag from '@lucide/svelte/icons/flag'
  import LayoutGrid from '@lucide/svelte/icons/layout-grid'
  import Send from '@lucide/svelte/icons/send'
  import Timer from '@lucide/svelte/icons/timer'
  import X from '@lucide/svelte/icons/x'
  import Mascot from '../../lib/components/Mascot.svelte'
  import Modal from '../../lib/components/Modal.svelte'
  import QuestionCard from '../../lib/components/QuestionCard.svelte'
  import { getQuestion } from '../../lib/data'
  import { tr, T } from '../../lib/i18n'
  import { navigate } from '../../lib/router.svelte'
  import { sfx, vibrate } from '../../lib/sound'
  import { abandon, answer, exam, goTo, remainingSec, submit, toggleFlag } from '../../lib/state/exam.svelte'
  import { toast } from '../../lib/state/ui.svelte'
  import { clock, durationText, passMark } from './format'
  import NavGrid from './NavGrid.svelte'

  /** Set once we navigate away on purpose, so the "no exam" redirect does not race it. */
  let leaving = false

  const s = $derived(exam.active)

  // No exam in progress (finished in another tab, discarded, or opened directly): back to the intro.
  $effect(() => {
    if (!exam.active && !leaving) navigate('/exam', undefined, true)
  })

  // Wall-clock timer, so a refresh or a phone call does not stop the clock.
  let now = $state(Date.now())
  $effect(() => {
    const tick = () => (now = Date.now())
    const id = setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  })

  const total = $derived(s?.questions.length ?? 0)
  const question = $derived(s ? getQuestion(s.questions[s.current]) : undefined)
  const selected = $derived(s ? s.answers[s.current] : null)
  const isFlagged = $derived(!!s && s.flagged[s.current])
  const isLast = $derived(!!s && s.current >= total - 1)
  const answeredCount = $derived(s ? s.answers.filter((a) => a !== null).length : 0)
  const flaggedCount = $derived(s ? s.flagged.filter(Boolean).length : 0)
  const unansweredCount = $derived(total - answeredCount)
  const firstUnanswered = $derived(s ? s.answers.findIndex((a) => a === null) : -1)
  const firstFlagged = $derived(s ? s.flagged.findIndex(Boolean) : -1)

  const remaining = $derived(s ? remainingSec(s, now) : 0)
  const low = $derived(remaining <= 5 * 60)
  const critical = $derived(remaining < 60)

  let panelOpen = $state(false)
  let confirmSubmit = $state(false)
  let confirmLeave = $state(false)
  const blocking = $derived(confirmSubmit || confirmLeave || panelOpen)

  // Time warnings: announce once each (not again after a refresh past the threshold).
  const startRemaining = exam.active ? remainingSec(exam.active) : 0
  let warned5 = startRemaining <= 5 * 60 || (exam.active?.limitSec ?? 0) <= 5 * 60
  let warned1 = startRemaining <= 60
  let announcement = $state('')

  $effect(() => {
    if (!s || leaving) return
    if (remaining <= 0) {
      finish(true)
      return
    }
    if (!warned5 && remaining <= 5 * 60) {
      warned5 = true
      announcement = tr({ en: '5 minutes left', rw: 'Hasigaye iminota 5' })
      toast({ kind: 'info', emoji: '⏳', title: announcement, body: tr({ en: 'Check your flagged questions.', rw: 'Reba ibibazo washyizeho akamenyetso.' }) }, 3500)
      vibrate(80)
    }
    if (!warned1 && remaining <= 60) {
      warned1 = true
      announcement = tr({ en: '1 minute left', rw: 'Hasigaye umunota 1' })
      toast({ kind: 'info', emoji: '⏰', title: announcement }, 3000)
      vibrate([80, 60, 80])
    }
  })

  function finish(auto = false) {
    if (leaving || !exam.active) return
    leaving = true
    confirmSubmit = false
    const id = submit()
    if (auto) {
      toast({
        kind: 'info',
        emoji: '⏰',
        title: tr({ en: 'Time’s up!', rw: 'Igihe kirarangiye!' }),
        body: tr({ en: 'Your answers were submitted automatically.', rw: 'Ibisubizo byawe byoherejwe ubwabyo.' }),
      })
    }
    navigate(id ? `/exam/result/${id}` : '/exam', undefined, true)
  }

  function leaveForNow() {
    leaving = true
    confirmLeave = false
    navigate('/exam', undefined, true)
  }

  function discard() {
    leaving = true
    confirmLeave = false
    abandon()
    navigate('/exam', undefined, true)
  }

  function show(i: number) {
    goTo(i)
    panelOpen = false
    window.scrollTo({ top: 0 })
  }

  function prev() {
    if (s && s.current > 0) show(s.current - 1)
  }

  function next() {
    if (!s) return
    if (isLast) confirmSubmit = true
    else show(s.current + 1)
  }

  function openSubmit() {
    panelOpen = false
    confirmSubmit = true
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && panelOpen) {
      panelOpen = false
      return
    }
    if (blocking || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]')) return
    const target = e.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
    if (e.key === 'ArrowRight' && s && !isLast) {
      e.preventDefault()
      show(s.current + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
    }
  }

  const timerTone = $derived(
    critical
      ? 'bg-flame-500 text-white ring-2 ring-flame-200 animate-pulse dark:ring-flame-700'
      : low
        ? 'bg-sun-300 text-brand-950 ring-2 ring-sun-400 dark:bg-sun-400'
        : 'bg-surface-2 text-ink',
  )
</script>

<svelte:window {onkeydown} />

{#if s && question}
  <div>
    <p class="sr-only" aria-live="assertive">{announcement}</p>

    <!-- Exam header -->
    <header class="sticky top-0 z-30 -mx-4 mb-4 bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      <div class="flex items-center gap-2 sm:gap-3">
        <button class="btn btn-ghost btn-icon btn-sm" onclick={() => (confirmLeave = true)} aria-label={tr({ en: 'Leave exam', rw: 'Va mu kizamini' })}>
          <X size={22} />
        </button>
        <div class="min-w-0 flex-1">
          <div class="mb-1.5 flex items-baseline justify-between gap-2">
            <p class="truncate font-display text-sm font-bold">
              <span class="hidden sm:inline">{`${tr(T.exam)} · `}</span>{`${tr(T.question)} `}<span class="tabular-nums"
                >{s.current + 1}/{total}</span
              >
            </p>
            <p class="hidden shrink-0 text-xs font-bold text-ink-faint tabular-nums min-[420px]:block">
              {tr({ en: '{a} answered', rw: '{a} byasubijwe' }, { a: answeredCount })}
            </p>
          </div>
          <div
            class="bar h-2.5"
            role="progressbar"
            aria-label={tr({ en: 'Questions answered', rw: 'Ibibazo byasubijwe' })}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={answeredCount}
          >
            <span class="bg-gradient-to-r from-brand-400 to-brand-500" style:width="{total ? (answeredCount / total) * 100 : 0}%"></span>
          </div>
        </div>
        <div
          role="timer"
          aria-label={tr({ en: 'Time left: {t}', rw: 'Igihe gisigaye: {t}' }, { t: durationText(remaining) })}
          class="flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 font-display text-lg leading-none font-black tabular-nums transition-colors duration-300 {timerTone}"
        >
          {#if critical}<AlarmClock size={18} strokeWidth={2.6} />{:else}<Timer size={18} strokeWidth={2.6} />{/if}
          {clock(remaining)}
        </div>
        <button
          class="btn btn-soft btn-icon btn-sm relative lg:hidden {panelOpen ? 'border-brand-400 text-brand-600 dark:text-brand-300' : ''}"
          onclick={() => (panelOpen = !panelOpen)}
          aria-expanded={panelOpen}
          aria-controls="exam-nav-panel"
          aria-label={tr({ en: 'All questions', rw: 'Ibibazo byose' })}
        >
          <LayoutGrid size={20} />
          {#if flaggedCount}
            <span class="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-sun-400 text-[0.65rem] font-black text-brand-950 ring-2 ring-bg"
              >{flaggedCount}</span
            >
          {/if}
        </button>
      </div>

      <!-- Phone navigator drawer -->
      {#if panelOpen}
        <div
          id="exam-nav-panel"
          class="absolute inset-x-3 top-full mt-1 max-h-[calc(100dvh-7rem)] animate-rise overflow-y-auto rounded-3xl border border-line bg-surface p-4 shadow-2xl sm:inset-x-6 lg:hidden"
        >
          {@render overview()}
        </div>
      {/if}
    </header>
    {#if panelOpen}
      <button
        class="fixed inset-0 z-20 cursor-default bg-brand-950/40 backdrop-blur-[2px] lg:hidden"
        onclick={() => (panelOpen = false)}
        aria-label={tr(T.close)}
        tabindex="-1"
      ></button>
    {/if}

    <div class="lg:grid lg:grid-cols-[minmax(0,1fr)_18.5rem] lg:items-start lg:gap-8">
      <div class="min-w-0">
        {#key `${s.current}-${question.id}`}
          <div class="relative animate-rise">
            {#if isFlagged}
              <span
                class="chip absolute -top-3 right-5 z-[1] animate-pop border-2 border-sun-400 bg-sun-100 text-brand-950 shadow-sm dark:bg-[#3a3410] dark:text-sun-200"
              >
                <Flag size={12} strokeWidth={3} fill="currentColor" />{tr({ en: 'Flagged', rw: 'Uzakigarukaho' })}
              </span>
            {/if}
            <QuestionCard
              {question}
              {selected}
              reveal={false}
              keyboard={!blocking}
              onselect={(i) => {
                answer(i)
                sfx.tap()
              }}
              eyebrow={tr({ en: 'Question {n} of {t}', rw: 'Ikibazo {n} kuri {t}' }, { n: s.current + 1, t: total })}
            />
          </div>
        {/key}

        <!-- Spacer so the fixed action bar never covers content on phones -->
        <div class="h-28 lg:hidden"></div>

        <!-- Action bar: fixed on phones, inline on desktop -->
        <div
          class="fixed inset-x-0 bottom-0 z-10 border-t-2 border-line bg-surface pb-[max(1rem,env(safe-area-inset-bottom))] lg:sticky lg:mt-2 lg:border-0 lg:bg-bg/90 lg:pb-5 lg:backdrop-blur"
        >
          <div class="mx-auto flex max-w-3xl items-center gap-2 px-4 pt-4 sm:gap-3 sm:px-6 lg:max-w-none lg:px-0">
            <button class="btn btn-soft btn-icon sm:aspect-auto sm:px-4" onclick={prev} disabled={s.current === 0} aria-label={tr(T.previous)}>
              <ChevronLeft size={22} />
              <span class="hidden sm:inline">{tr(T.previous)}</span>
            </button>
            <button
              class="btn btn-soft px-4 {isFlagged
                ? 'border-sun-400 bg-sun-100 text-brand-950 hover:bg-sun-200 dark:border-sun-400/70 dark:bg-sun-400/15 dark:text-sun-200 dark:hover:bg-sun-400/25'
                : ''}"
              style:--edge={isFlagged ? 'var(--color-sun-500)' : undefined}
              onclick={() => {
                toggleFlag()
                sfx.tap()
              }}
              aria-pressed={isFlagged}
            >
              <Flag size={18} strokeWidth={2.5} fill={isFlagged ? 'currentColor' : 'none'} />
              <span>{tr({ en: 'Flag', rw: 'Nzagaruka' })}</span>
            </button>
            {#if isLast}
              <button class="btn btn-success flex-1" onclick={openSubmit}>
                <Send size={18} />{tr({ en: 'Submit', rw: 'Ohereza' })}
              </button>
            {:else if selected === null}
              <button class="btn btn-soft flex-1" onclick={next}>
                {tr({ en: 'Skip', rw: 'Simbuka' })}<ChevronRight size={20} />
              </button>
            {:else}
              <button class="btn btn-primary flex-1" onclick={next}>
                {tr(T.next)}<ChevronRight size={20} />
              </button>
            {/if}
          </div>
        </div>
      </div>

      <!-- Desktop navigator column -->
      <aside class="hidden lg:sticky lg:top-24 lg:block" aria-label={tr({ en: 'Exam overview', rw: 'Incamake y’ikizamini' })}>
        <div class="card p-5">
          {@render overview()}
        </div>
        <p class="mt-3 px-1 text-center text-xs font-bold text-ink-muted">
          {tr({ en: 'Pass mark: {p} of {n}', rw: 'Gutsinda: {p} kuri {n}' }, { p: passMark(total), n: total })}
        </p>
        <p class="mt-1 px-1 text-center text-xs text-ink-faint">
          {tr({ en: 'Tip: press 1–4 to answer, ← → to move', rw: 'Inama: kanda 1–4 usubize, ← → uhindure ikibazo' })}
        </p>
      </aside>
    </div>
  </div>
{/if}

{#snippet overview()}
  {#if s}
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-lg font-bold">{tr({ en: 'Questions', rw: 'Ibibazo' })}</h2>
      <span class="chip tabular-nums">{answeredCount}/{total}</span>
    </div>
    <NavGrid session={s} onpick={show} />
    <div class="mt-5 rounded-2xl bg-surface-2 p-3 text-sm">
      {#if unansweredCount === 0}
        <p class="font-semibold text-leaf-700 dark:text-leaf-400">
          ✓ {tr({ en: 'All questions answered — ready when you are!', rw: 'Wasubije ibibazo byose — ohereza igihe witeguye!' })}
        </p>
      {:else}
        <p class="font-semibold text-ink-muted">
          {tr({ en: '{n} still to answer', rw: 'Hasigaye ibibazo {n} utarasubiza' }, { n: unansweredCount })}{#if flaggedCount}{` · ${tr(
              { en: '{f} flagged', rw: '{f} uzagarukaho' },
              { f: flaggedCount },
            )}`}{/if}
        </p>
      {/if}
    </div>
    <button class="btn btn-success mt-4 w-full" onclick={openSubmit}>
      <Send size={18} />{tr({ en: 'Submit exam', rw: 'Ohereza ikizamini' })}
    </button>
  {/if}
{/snippet}

<!-- Submit confirmation -->
<Modal open={confirmSubmit} onclose={() => (confirmSubmit = false)} size="sm">
  <div class="flex flex-col items-center text-center">
    <span class="grid size-16 animate-pop place-items-center rounded-full bg-leaf-100 text-leaf-600 dark:bg-leaf-700/30 dark:text-leaf-400">
      <Send size={28} />
    </span>
    <h2 class="mt-4 text-2xl font-black">{tr({ en: 'Submit your answers?', rw: 'Urashaka kohereza ibisubizo?' })}</h2>
    <p class="mt-1 text-ink-muted">
      {tr({ en: '{t} still on the clock.', rw: 'Hasigaye {t}.' }, { t: durationText(remaining) })}
    </p>

    <dl class="mt-5 grid w-full grid-cols-3 gap-2">
      <div class="rounded-2xl bg-surface-2 p-3">
        <dt class="text-xs font-bold text-ink-muted">{tr({ en: 'Answered', rw: 'Byasubijwe' })}</dt>
        <dd class="font-display text-2xl font-black">{answeredCount}</dd>
      </div>
      <div class="rounded-2xl p-3 {unansweredCount ? 'bg-flame-100 dark:bg-flame-700/25' : 'bg-surface-2'}">
        <dt class="text-xs font-bold {unansweredCount ? 'text-flame-700 dark:text-flame-200' : 'text-ink-muted'}">
          {tr({ en: 'Unanswered', rw: 'Bitasubijwe' })}
        </dt>
        <dd class="font-display text-2xl font-black {unansweredCount ? 'text-flame-700 dark:text-flame-200' : ''}">{unansweredCount}</dd>
      </div>
      <div class="rounded-2xl p-3 {flaggedCount ? 'bg-sun-100 dark:bg-sun-400/15' : 'bg-surface-2'}">
        <dt class="text-xs font-bold {flaggedCount ? 'text-brand-950 dark:text-sun-200' : 'text-ink-muted'}">{tr({ en: 'Flagged', rw: 'Uzagarukaho' })}</dt>
        <dd class="font-display text-2xl font-black {flaggedCount ? 'text-brand-950 dark:text-sun-200' : ''}">{flaggedCount}</dd>
      </div>
    </dl>

    {#if unansweredCount}
      <p class="mt-4 w-full rounded-2xl border-2 border-flame-200 p-3 text-sm font-semibold text-flame-700 dark:border-flame-700/50 dark:text-flame-200">
        ⚠️ {tr({ en: 'Unanswered questions count as wrong.', rw: 'Ikibazo kidasubijwe kibarwa nk’ikosa.' })}
      </p>
    {/if}

    <div class="mt-6 flex w-full flex-col gap-3">
      <button class="btn btn-success btn-lg" onclick={() => finish()}>
        <Send size={18} />{tr({ en: 'Submit exam', rw: 'Ohereza ikizamini' })}
      </button>
      {#if firstUnanswered >= 0}
        <button
          class="btn btn-soft"
          onclick={() => {
            confirmSubmit = false
            show(firstUnanswered)
          }}
        >
          {tr({ en: 'Go to question {n} (unanswered)', rw: 'Jya ku kibazo cya {n} (kidasubijwe)' }, { n: firstUnanswered + 1 })}
        </button>
      {:else if firstFlagged >= 0}
        <button
          class="btn btn-soft"
          onclick={() => {
            confirmSubmit = false
            show(firstFlagged)
          }}
        >
          <Flag size={16} />{tr({ en: 'Review flagged question {n}', rw: 'Subira ku kibazo cya {n}' }, { n: firstFlagged + 1 })}
        </button>
      {/if}
      <button class="btn btn-ghost" onclick={() => (confirmSubmit = false)}>{tr({ en: 'Keep checking', rw: 'Komeza usuzume' })}</button>
    </div>
  </div>
</Modal>

<!-- Leave / abandon confirmation -->
<Modal open={confirmLeave} onclose={() => (confirmLeave = false)} size="sm">
  <div class="flex flex-col items-center text-center">
    <Mascot size={100} mood="sad" class="text-ink" />
    <h2 class="mt-3 text-xl font-bold">{tr({ en: 'Leave the exam?', rw: 'Urashaka kuva mu kizamini?' })}</h2>
    <p class="mt-1 text-ink-muted">
      {tr(
        { en: 'Your answers are saved, but the clock keeps running ({t} left).', rw: 'Ibisubizo byawe birabitswe, ariko isaha ikomeza kubara (hasigaye {t}).' },
        { t: clock(remaining) },
      )}
    </p>
    <div class="mt-6 flex w-full flex-col gap-3">
      <button class="btn btn-primary" onclick={() => (confirmLeave = false)}>{tr({ en: 'Keep going', rw: 'Komeza ikizamini' })}</button>
      <button class="btn btn-soft" onclick={leaveForNow}>{tr({ en: 'Leave and finish later', rw: 'Sohoka, uzarangize nyuma' })}</button>
      <button class="btn btn-ghost text-flame-600 hover:text-flame-700 dark:text-flame-400" onclick={discard}>
        {tr({ en: 'Discard this exam', rw: 'Siba iki kizamini' })}
      </button>
    </div>
  </div>
</Modal>
