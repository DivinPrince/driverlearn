<script lang="ts">
  import Bookmark from '@lucide/svelte/icons/bookmark'
  import Flame from '@lucide/svelte/icons/flame'
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw'
  import X from '@lucide/svelte/icons/x'
  import { burst, celebrate } from '../lib/celebrate'
  import Bi from '../lib/components/Bi.svelte'
  import EmptyState from '../lib/components/EmptyState.svelte'
  import Mascot from '../lib/components/Mascot.svelte'
  import Modal from '../lib/components/Modal.svelte'
  import ProgressRing from '../lib/components/ProgressRing.svelte'
  import QuestionCard from '../lib/components/QuestionCard.svelte'
  import { getQuestion, QUESTIONS, QUESTIONS_BY_TOPIC } from '../lib/data'
  import { selectMistakes, selectPractice } from '../lib/engine/select'
  import { shuffle } from '../lib/engine/random'
  import { tr, T } from '../lib/i18n'
  import { href, navigate, route } from '../lib/router.svelte'
  import { sfx, vibrate } from '../lib/sound'
  import { isBookmarked, progress, recordAnswer, toggleBookmark } from '../lib/state/progress.svelte'
  import { TOPIC_BY_ID } from '../lib/topics'
  import type { L10n, Question, TopicId } from '../lib/types'

  type Mode = 'smart' | 'topic' | 'mistakes' | 'bookmarks' | 'unseen' | 'ids'

  const mode = (route.query.mode as Mode) || (route.query.topic ? 'topic' : 'smart')
  const topic = route.query.topic as TopicId | undefined
  const size = Math.max(5, Math.min(Number(route.query.n) || 15, 60))

  const TITLES: Record<Mode, L10n> = {
    smart: { en: 'Smart practice', rw: 'Imyitozo y’ubwenge' },
    topic: topic ? TOPIC_BY_ID[topic]?.name ?? { en: 'Topic', rw: 'Isomo' } : { en: 'Topic', rw: 'Isomo' },
    mistakes: { en: 'Fix my mistakes', rw: 'Kosora amakosa yanjye' },
    bookmarks: { en: 'Bookmarked questions', rw: 'Ibibazo nabitse' },
    unseen: { en: 'New questions', rw: 'Ibibazo bishya' },
    ids: { en: 'Review', rw: 'Gusubiramo' },
  }

  function buildSession(): Question[] {
    const now = Date.now()
    switch (mode) {
      case 'topic':
        return selectPractice({ pool: topic ? QUESTIONS_BY_TOPIC[topic] ?? [] : QUESTIONS, states: progress.q, now, count: size })
      case 'mistakes':
        return selectMistakes(QUESTIONS, progress.q).slice(0, size)
      case 'bookmarks':
        return shuffle(progress.bookmarks.map(getQuestion).filter((q): q is Question => !!q)).slice(0, size)
      case 'unseen':
        return shuffle(QUESTIONS.filter((q) => !progress.q[q.id]?.seen)).slice(0, size)
      case 'ids':
        return (route.query.ids ?? '')
          .split(',')
          .map((s) => getQuestion(Number(s)))
          .filter((q): q is Question => !!q)
      default:
        return selectPractice({ pool: QUESTIONS, states: progress.q, now, count: size })
    }
  }

  /** The queue grows when a missed question is re-asked at the end (once per question). */
  let queue: Question[] = $state(buildSession())
  const initialCount = queue.length
  const requeued = new Set<number>()

  let index = $state(0)
  let selected: number | null = $state(null)
  let revealed = $state(false)
  let lastCorrect = $state(false)
  let lastXp = $state(0)
  let combo = $state(0)
  let bestCombo = $state(0)
  let xpGained = $state(0)
  let answered = $state(0)
  let correctCount = $state(0)
  let missed: Question[] = $state([])
  let finished = $state(false)
  let confirmQuit = $state(false)
  const startedAt = Date.now()

  const current = $derived(queue[index])
  const pct = $derived(queue.length ? (index + (revealed ? 1 : 0)) / queue.length : 0)

  function check() {
    if (selected === null || revealed || !current) return
    const nextCombo = current.answer === selected ? combo + 1 : 0
    const res = recordAnswer(current.id, selected, nextCombo)
    revealed = true
    lastCorrect = res.correct
    lastXp = res.xp
    xpGained += res.xp
    answered++
    combo = nextCombo
    bestCombo = Math.max(bestCombo, combo)
    if (res.correct) {
      correctCount++
      sfx.correct()
      if (combo > 0 && combo % 5 === 0) burst(0.5, 0.8)
    } else {
      sfx.wrong()
      vibrate(120)
      if (!missed.includes(current)) missed.push(current)
      if (!requeued.has(current.id)) {
        requeued.add(current.id)
        queue.push(current)
      }
    }
  }

  function next() {
    if (!revealed) return
    if (index + 1 >= queue.length) {
      finished = true
      const acc = answered ? correctCount / answered : 0
      if (acc >= 0.8) {
        sfx.complete()
        celebrate(1200)
      }
      return
    }
    index++
    selected = null
    revealed = false
  }

  function onkeydown(e: KeyboardEvent) {
    if (finished || confirmQuit) return
    if (e.key === 'Enter') {
      e.preventDefault()
      if (revealed) next()
      else check()
    }
  }

  function quit() {
    if (answered > 0 && !finished) confirmQuit = true
    else navigate('/learn')
  }

  const minutes = $derived(Math.max(1, Math.round((Date.now() - startedAt) / 60000)))
  const accuracy = $derived(answered ? correctCount / answered : 0)
  const isRequeue = $derived(index >= initialCount)

  const praise: L10n[] = [
    { en: 'Great job!', rw: 'Wakoze neza!' },
    { en: 'Nailed it!', rw: 'Ni byo rwose!' },
    { en: 'Excellent!', rw: 'Byiza cyane!' },
    { en: 'Keep it up!', rw: 'Komereza aho!' },
  ]
</script>

<svelte:window {onkeydown} />

{#if !queue.length}
  <div class="pt-10">
    <EmptyState
      title={mode === 'mistakes'
        ? tr({ en: 'No mistakes to fix', rw: 'Nta makosa yo gukosora' })
        : mode === 'bookmarks'
          ? tr({ en: 'No bookmarks yet', rw: 'Nta kibazo urabika' })
          : tr({ en: 'Nothing to practise here', rw: 'Nta kibazo cyo kwitoza' })}
      body={mode === 'mistakes'
        ? tr({ en: 'Questions you get wrong will show up here so you can master them.', rw: 'Ibibazo wishe bizajya bigaragara hano kugira ngo ubimenye neza.' })
        : mode === 'bookmarks'
          ? tr({ en: 'Tap the bookmark icon on any question to save it for later.', rw: 'Kanda ku kimenyetso cyo kubika ku kibazo icyo ari cyo cyose.' })
          : tr({ en: 'You have seen every question in this set. Try smart practice!', rw: 'Wabonye ibibazo byose biri aha. Gerageza imyitozo y’ubwenge!' })}
      mood={mode === 'mistakes' ? 'happy' : 'think'}
    >
      <a class="btn btn-primary" href={href('/practice', { mode: 'smart' })}>{tr(TITLES.smart)}</a>
      <a class="btn btn-soft" href={href('/learn')}>{tr(T.back)}</a>
    </EmptyState>
  </div>
{:else if finished}
  <!-- Session summary -->
  <section class="flex flex-col items-center pt-6 text-center">
    <Mascot size={130} mood={accuracy >= 0.8 ? 'wow' : accuracy >= 0.5 ? 'happy' : 'think'} class="animate-float text-ink" />
    <h1 class="mt-4 text-3xl font-black">
      {accuracy >= 0.8
        ? tr({ en: 'Session complete!', rw: 'Imyitozo irarangiye!' })
        : tr({ en: 'Good effort!', rw: 'Wagerageje neza!' })}
    </h1>
    <p class="mt-1 text-ink-muted">{tr(TITLES[mode])}</p>

    <div class="mt-8 grid w-full max-w-md grid-cols-3 gap-3">
      <div class="card flex flex-col items-center gap-2 p-4">
        <ProgressRing value={accuracy} size={64} stroke={7} color="var(--color-leaf-500)" />
        <span class="text-xs font-bold text-ink-muted">{tr({ en: 'Accuracy', rw: 'Ukuri' })}</span>
      </div>
      <div class="card flex flex-col items-center justify-center gap-1 p-4">
        <span class="font-display text-3xl font-black text-sun-500">+{xpGained}</span>
        <span class="text-xs font-bold text-ink-muted">XP</span>
      </div>
      <div class="card flex flex-col items-center justify-center gap-1 p-4">
        <span class="flex items-center gap-1 font-display text-3xl font-black text-orange-500"><Flame size={24} />{bestCombo}</span>
        <span class="text-xs font-bold text-ink-muted">{tr({ en: 'Best combo', rw: 'Uruhererekane' })}</span>
      </div>
    </div>
    <p class="mt-4 text-sm text-ink-muted">
      {tr({ en: '{c} of {n} answers correct · {m} min', rw: 'Ibisubizo {c} kuri {n} ni ukuri · iminota {m}' }, {
        c: correctCount,
        n: answered,
        m: minutes,
      })}
    </p>

    {#if missed.length}
      <div class="mt-8 w-full text-left">
        <h2 class="mb-3 text-lg font-bold">{tr({ en: 'Review what you missed', rw: 'Subiramo ibyo wishe' })}</h2>
        <div class="flex flex-col gap-3">
          {#each missed as q (q.id)}
            <a href={href(`/q/${q.id}`)} class="card-flat flex items-start gap-3 p-4 transition hover:border-brand-300">
              <span class="grid size-8 shrink-0 place-items-center rounded-xl bg-flame-100 font-bold text-flame-600 dark:bg-flame-700/30">!</span>
              <span class="min-w-0 flex-1 text-sm font-semibold"><Bi text={q.q} /></span>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <div class="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <button class="btn btn-primary flex-1" onclick={() => location.reload()}><RotateCcw size={18} />{tr(T.retry)}</button>
      <a class="btn btn-soft flex-1" href={href('/learn')}>{tr(T.continue)}</a>
    </div>
  </section>
{:else if current}
  <!-- Session header -->
  <div class="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-3 bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
    <button class="btn btn-ghost btn-icon btn-sm" onclick={quit} aria-label={tr(T.close)}><X size={22} /></button>
    <div
      class="bar flex-1"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={queue.length}
      aria-valuenow={index + (revealed ? 1 : 0)}
    >
      <span class="bg-gradient-to-r from-leaf-400 to-leaf-500" style:width="{pct * 100}%"></span>
    </div>
    <span class="font-display text-sm font-bold text-ink-muted tabular-nums">{index + 1}/{queue.length}</span>
    {#if combo >= 2}
      <span class="chip animate-pop bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300"><Flame size={14} />{combo}</span>
    {/if}
  </div>

  {#key `${index}-${current.id}`}
    <div class="animate-rise">
      {#if isRequeue}
        <p class="mb-3 chip bg-sun-100 text-sun-600 dark:bg-sun-600/20 dark:text-sun-300">
          🔁 {tr({ en: 'Let’s try this one again', rw: 'Twongere tugerageze iki' })}
        </p>
      {/if}
      <QuestionCard
        question={current}
        {selected}
        reveal={revealed}
        keyboard
        onselect={(i) => {
          selected = i
          sfx.tap()
        }}
        eyebrow="{tr(TOPIC_BY_ID[current.topic].name)} · #{current.id}"
      >
        {#snippet actions()}
          <button
            class="btn btn-ghost btn-icon btn-sm {isBookmarked(current.id) ? 'text-sun-500' : ''}"
            onclick={() => toggleBookmark(current.id)}
            aria-pressed={isBookmarked(current.id)}
            aria-label={tr(T.bookmark)}
          >
            <Bookmark size={20} fill={isBookmarked(current.id) ? 'currentColor' : 'none'} />
          </button>
        {/snippet}
      </QuestionCard>
    </div>
  {/key}

  <!-- Spacer so the fixed action bar never covers content -->
  <div class="h-36"></div>

  <!-- Action / feedback bar -->
  <div
    class="fixed inset-x-0 bottom-0 z-30 border-t-2 pb-[max(1rem,env(safe-area-inset-bottom))] transition-colors {revealed
      ? lastCorrect
        ? 'border-leaf-200 bg-leaf-100 dark:border-leaf-700/50 dark:bg-[#0f2a1c]'
        : 'border-flame-200 bg-flame-100 dark:border-flame-700/50 dark:bg-[#2c1416]'
      : 'border-line bg-surface'}"
  >
    <div class="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:px-6">
      {#if revealed}
        <div class="flex flex-1 animate-rise items-center gap-3">
          <span
            class="grid size-12 shrink-0 place-items-center rounded-full text-2xl {lastCorrect ? 'bg-leaf-500' : 'bg-flame-500'} text-white"
            aria-hidden="true">{lastCorrect ? '✓' : '✕'}</span
          >
          <div>
            <p class="font-display text-xl font-black {lastCorrect ? 'text-leaf-700 dark:text-leaf-400' : 'text-flame-600 dark:text-flame-400'}">
              {lastCorrect ? tr(praise[index % praise.length]) : tr(T.wrong)}
            </p>
            <p class="text-sm font-semibold text-ink-muted">
              {#if lastCorrect}+{lastXp} XP{#if combo >= 2} · 🔥 {tr({ en: '{n} in a row', rw: '{n} bikurikiranye' }, { n: combo })}{/if}
              {:else}{tr({ en: 'Read the explanation above — we’ll ask again later.', rw: 'Soma ibisobanuro biri hejuru — tuzongera tukibaze.' })}{/if}
            </p>
          </div>
        </div>
        <button class="btn {lastCorrect ? 'btn-success' : 'btn-danger'} btn-lg sm:min-w-44" onclick={next}>{tr(T.continue)}</button>
      {:else}
        <p class="hidden flex-1 text-sm text-ink-faint sm:block">
          {tr({ en: 'Tip: press 1–4 to choose, Enter to check', rw: 'Inama: kanda 1–4 uhitemo, Enter ugenzure' })}
        </p>
        <button class="btn btn-primary btn-lg sm:min-w-44" disabled={selected === null} onclick={check}>{tr(T.check)}</button>
      {/if}
    </div>
  </div>
{/if}

<Modal open={confirmQuit} onclose={() => (confirmQuit = false)} size="sm">
  <div class="flex flex-col items-center text-center">
    <Mascot size={100} mood="sad" class="text-ink" />
    <h2 class="mt-3 text-xl font-bold">{tr({ en: 'Leave this session?', rw: 'Urashaka kuva muri iyi myitozo?' })}</h2>
    <p class="mt-1 text-ink-muted">
      {tr({ en: 'Your answers so far are saved.', rw: 'Ibisubizo umaze gutanga byabitswe.' })}
    </p>
    <div class="mt-6 flex w-full flex-col gap-3">
      <button class="btn btn-primary" onclick={() => (confirmQuit = false)}>{tr({ en: 'Keep learning', rw: 'Komeza wige' })}</button>
      <button class="btn btn-ghost" onclick={() => navigate('/learn')}>{tr({ en: 'Leave', rw: 'Sohoka' })}</button>
    </div>
  </div>
</Modal>
