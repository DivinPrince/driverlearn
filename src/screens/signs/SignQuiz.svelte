<script lang="ts">
  /** 10-question rounds: name the sign from four meanings, with instant feedback. */
  import ArrowRight from '@lucide/svelte/icons/arrow-right'
  import Check from '@lucide/svelte/icons/check'
  import Flame from '@lucide/svelte/icons/flame'
  import Layers from '@lucide/svelte/icons/layers'
  import Lightbulb from '@lucide/svelte/icons/lightbulb'
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw'
  import X from '@lucide/svelte/icons/x'
  import { tick } from 'svelte'
  import { burst, celebrate } from '../../lib/celebrate'
  import Bi from '../../lib/components/Bi.svelte'
  import Mascot from '../../lib/components/Mascot.svelte'
  import ProgressRing from '../../lib/components/ProgressRing.svelte'
  import { OPTION_LETTERS, pick } from '../../lib/data'
  import { tr, T } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import { sfx, vibrate } from '../../lib/sound'
  import { progress, setSignLearned } from '../../lib/state/progress.svelte'
  import { settings } from '../../lib/state/settings.svelte'
  import type { L10n } from '../../lib/types'
  import SignDetail from './SignDetail.svelte'
  import SignImage from './SignImage.svelte'
  import { buildQuiz, explanationOf, QUIZ_ROUND, S, SIGNS, type QuizItem } from './signs'

  const newRound = () => buildQuiz(SIGNS, new Set(progress.signsLearned), QUIZ_ROUND)

  let round: QuizItem[] = $state.raw(newRound())
  let index = $state(0)
  let chosen: number | null = $state(null)
  let score = $state(0)
  let combo = $state(0)
  let bestCombo = $state(0)
  let newlyLearned = $state(0)
  /** The last right answer taught a sign that was not learned before. */
  let wasNew = $state(false)
  let missed: QuizItem[] = $state.raw([])
  let finished = $state(false)
  let detailId: number | null = $state(null)
  let feedbackEl: HTMLElement | undefined = $state()

  const item = $derived(round[index])
  const revealed = $derived(chosen !== null)
  const lastCorrect = $derived(!!item && chosen === item.answer)
  const explain = $derived(item ? explanationOf(item.sign) : null)
  const pct = $derived(round.length ? (index + (revealed ? 1 : 0)) / round.length : 0)
  const isLast = $derived(index + 1 >= round.length)
  const ratio = $derived(round.length ? score / round.length : 0)

  const praise: L10n[] = [
    { en: 'Great job!', rw: 'Wakoze neza!' },
    { en: 'Nailed it!', rw: 'Ni byo rwose!' },
    { en: 'Excellent!', rw: 'Byiza cyane!' },
    { en: 'Keep it up!', rw: 'Komereza aho!' },
  ]

  async function choose(i: number) {
    if (revealed || !item || finished) return
    chosen = i
    if (i === item.answer) {
      score++
      combo++
      bestCombo = Math.max(bestCombo, combo)
      wasNew = !progress.signsLearned.includes(item.sign.id)
      if (wasNew) {
        setSignLearned(item.sign.id, true)
        newlyLearned++
      }
      sfx.correct()
      if (combo % 5 === 0) burst(0.5, 0.75)
    } else {
      combo = 0
      wasNew = false
      missed = [...missed, item]
      sfx.wrong()
      vibrate(120)
    }
    await tick()
    feedbackEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  function next() {
    if (!revealed) return
    if (isLast) {
      finished = true
      if (ratio >= 0.8) {
        sfx.complete()
        celebrate(1400)
      } else if (ratio >= 0.5) sfx.complete()
      else sfx.fail()
      window.scrollTo({ top: 0 })
      return
    }
    index++
    chosen = null
    wasNew = false
  }

  function playAgain() {
    round = newRound()
    index = 0
    chosen = null
    score = 0
    combo = 0
    bestCombo = 0
    newlyLearned = 0
    wasNew = false
    missed = []
    finished = false
    window.scrollTo({ top: 0 })
  }

  function onkeydown(e: KeyboardEvent) {
    if (finished || !item || e.metaKey || e.ctrlKey || e.altKey) return
    const target = e.target as HTMLElement | null
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
    if (document.querySelector('dialog[open]')) return
    if (e.key === 'Enter') {
      if (!revealed) return
      // Also stops a focused choice button from being "clicked" on the next question.
      e.preventDefault()
      next()
      return
    }
    const k = e.key.toLowerCase()
    const i = k.length === 1 && 'abcd'.includes(k) ? 'abcd'.indexOf(k) : Number(k) - 1
    if (!revealed && Number.isInteger(i) && i >= 0 && i < item.choices.length) {
      e.preventDefault()
      void choose(i)
    }
  }

  function choiceState(i: number): 'idle' | 'correct' | 'wrong' | 'dim' {
    if (!revealed || !item) return 'idle'
    if (i === item.answer) return 'correct'
    if (i === chosen) return 'wrong'
    return 'dim'
  }

  const styles = {
    idle: 'border-line bg-surface hover:border-brand-300 hover:bg-brand-50 active:scale-[0.99] dark:hover:bg-brand-950/40',
    correct: 'border-leaf-500 bg-leaf-100 dark:bg-leaf-700/25 animate-pop',
    wrong: 'border-flame-500 bg-flame-100 dark:bg-flame-700/25 animate-shake',
    dim: 'border-line bg-surface opacity-55',
  }
  const badge = {
    idle: 'bg-surface-2 text-ink-muted group-hover:bg-brand-100 group-hover:text-brand-700 dark:group-hover:bg-brand-900/60 dark:group-hover:text-brand-200',
    correct: 'bg-leaf-500 text-white',
    wrong: 'bg-flame-500 text-white',
    dim: 'bg-surface-2 text-ink-faint',
  }
</script>

<svelte:window {onkeydown} />

{#if !round.length}
  <div class="card-flat mx-auto flex max-w-md flex-col items-center px-6 py-10 text-center">
    <Mascot size={96} mood="think" class="text-ink" />
    <h2 class="mt-3 text-lg font-bold">{tr({ en: 'Not enough signs for a quiz yet', rw: 'Nta byapa bihagije byo gukora isuzuma' })}</h2>
    <p class="mt-1 text-sm text-ink-muted">
      {tr({ en: 'A quiz needs at least two different signs.', rw: 'Isuzuma rikenera nibura ibyapa bibiri bitandukanye.' })}
    </p>
  </div>
{:else if finished}
  <!-- Round summary -->
  <section class="mx-auto flex max-w-lg animate-rise flex-col items-center text-center">
    <Mascot size={120} mood={ratio >= 0.8 ? 'wow' : ratio >= 0.5 ? 'happy' : 'think'} class="animate-float text-ink" />
    <h2 class="mt-3 text-2xl font-black sm:text-3xl">
      {ratio === 1
        ? tr({ en: 'Perfect score!', rw: 'Wabikoze byose neza!' })
        : ratio >= 0.8
          ? tr({ en: 'Sign master!', rw: 'Uri intyoza mu byapa!' })
          : ratio >= 0.5
            ? tr({ en: 'Nice work!', rw: 'Wakoze neza!' })
            : tr({ en: 'Keep practising!', rw: 'Komeza witoze!' })}
    </h2>
    <p class="mt-1 text-ink-muted">
      {tr({ en: '{s} of {n} signs named correctly', rw: 'Wamenye ibyapa {s} kuri {n}' }, { s: score, n: round.length })}
    </p>

    <div class="mt-6 grid w-full grid-cols-3 gap-3">
      <div class="card flex flex-col items-center justify-center gap-2 p-4">
        <ProgressRing
          value={ratio}
          size={64}
          stroke={7}
          color="var(--color-leaf-500)"
          label={tr({ en: '{s} of {n} correct', rw: '{s} kuri {n} ni byo' }, { s: score, n: round.length })}
        >
          <span class="font-display text-sm font-bold tabular-nums">{score}/{round.length}</span>
        </ProgressRing>
        <span class="text-xs font-bold text-ink-muted">{tr({ en: 'Score', rw: 'Amanota' })}</span>
      </div>
      <div class="card flex flex-col items-center justify-center gap-1 p-4">
        <span class="flex items-center gap-1 font-display text-3xl font-black text-orange-500 tabular-nums"><Flame size={24} />{bestCombo}</span>
        <span class="text-xs font-bold text-ink-muted">{tr({ en: 'Best combo', rw: 'Uruhererekane' })}</span>
      </div>
      <div class="card flex flex-col items-center justify-center gap-1 p-4">
        <span class="font-display text-3xl font-black text-leaf-600 tabular-nums dark:text-leaf-400">+{newlyLearned}</span>
        <span class="text-xs font-bold text-ink-muted">{tr({ en: 'New signs', rw: 'Ibishya' })}</span>
      </div>
    </div>

    <div class="mt-6 flex w-full flex-col gap-3 sm:flex-row">
      <button class="btn btn-primary flex-1" onclick={playAgain}><RotateCcw size={18} />{tr({ en: 'Play again', rw: 'Ongera ukine' })}</button>
      <a class="btn btn-soft flex-1" href={href('/signs', { tab: 'cards' })}><Layers size={18} />{tr(S.flashcards)}</a>
    </div>

    {#if missed.length}
      <div class="mt-8 w-full text-left">
        <h3 class="mb-3 text-lg font-bold">{tr({ en: 'Signs to review', rw: 'Ibyapa byo gusubiramo' })}</h3>
        <ul class="flex flex-col gap-2">
          {#each missed as m (m.sign.id)}
            <li>
              <button
                class="card-flat flex w-full items-center gap-3 p-2.5 pr-4 text-left transition hover:border-brand-300 dark:hover:border-brand-700"
                onclick={() => (detailId = m.sign.id)}
              >
                <SignImage id={m.sign.images[0]} class="size-14 shrink-0 rounded-xl border border-line" pad="p-1" />
                <span class="min-w-0 flex-1 text-sm font-semibold"><Bi text={m.sign.sign} /></span>
                <ArrowRight size={18} class="shrink-0 text-ink-faint" />
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

  </section>
{:else if item}
  <div class="mx-auto w-full max-w-2xl">
    <!-- Round progress -->
    <div class="mb-3 flex items-center gap-3 sm:mb-4">
      <div class="bar flex-1" role="progressbar" aria-valuemin={0} aria-valuemax={round.length} aria-valuenow={index + (revealed ? 1 : 0)}>
        <span class="bg-gradient-to-r from-leaf-400 to-leaf-500" style:width="{pct * 100}%"></span>
      </div>
      <span class="font-display text-sm font-bold text-ink-muted tabular-nums">
        <span class="sr-only">{tr(T.question)}</span>
        {index + 1}/{round.length}
      </span>
      {#if combo >= 2}
        <span class="chip animate-pop bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300"><Flame size={14} />{combo}</span>
      {/if}
    </div>

    {#key index}
      <article class="card animate-rise p-4 sm:p-7">
        <h2 class="text-lg font-bold sm:text-xl">{tr({ en: 'What does this sign mean?', rw: 'Iki kimenyetso gisobanura iki?' })}</h2>
        <SignImage
          id={item.sign.images[0]}
          alt={tr({ en: 'Road sign to identify', rw: 'Icyapa cyo kumenya' })}
          class="mt-3 h-36 w-full rounded-3xl border border-line sm:mt-4 sm:h-56"
          eager
        />

        <div class="mt-4 grid gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-3" role="group" aria-label={tr({ en: 'Choices', rw: 'Amahitamo' })}>
          {#each item.choices as choice, i (i)}
            {@const st = choiceState(i)}
            <button
              type="button"
              class="group flex w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left sm:px-4 sm:py-3.5 transition-all duration-150 {styles[st]} {revealed
                ? 'cursor-default'
                : ''}"
              aria-disabled={revealed}
              onclick={() => choose(i)}
            >
              <span
                class="grid size-8 shrink-0 place-items-center rounded-xl font-display text-sm font-bold transition-colors {badge[st]}"
                aria-hidden="true"
              >
                {#if st === 'correct'}<Check size={18} strokeWidth={3} />{:else if st === 'wrong'}<X size={18} strokeWidth={3} />{:else}{OPTION_LETTERS[
                    i
                  ]}{/if}
              </span>
              <span class="min-w-0 flex-1 leading-snug font-semibold"><Bi text={choice} /></span>
              {#if st === 'correct'}<span class="sr-only">{tr(T.correctAnswer)}</span>{/if}
            </button>
          {/each}
        </div>

        {#if revealed}
          <div
            bind:this={feedbackEl}
            class="mt-5 animate-rise scroll-mb-28 rounded-3xl border-2 p-4 sm:p-5 {lastCorrect
              ? 'border-leaf-200 bg-leaf-100/60 dark:border-leaf-700/40 dark:bg-leaf-700/10'
              : 'border-flame-200 bg-flame-100/60 dark:border-flame-700/40 dark:bg-flame-700/10'}"
          >
            <div class="flex items-center gap-3" role="status">
              <span
                class="grid size-11 shrink-0 animate-pop place-items-center rounded-full text-white {lastCorrect ? 'bg-leaf-500' : 'bg-flame-500'}"
                aria-hidden="true"
              >
                {#if lastCorrect}<Check size={24} strokeWidth={3} />{:else}<X size={24} strokeWidth={3} />{/if}
              </span>
              <div class="min-w-0 flex-1">
                <p class="font-display text-lg font-black {lastCorrect ? 'text-leaf-700 dark:text-leaf-400' : 'text-flame-600 dark:text-flame-400'}">
                  {lastCorrect ? tr(praise[index % praise.length]) : tr(T.wrong)}
                </p>
                <p class="text-sm font-semibold text-ink-muted">
                  {#if lastCorrect}
                    {wasNew ? tr(S.newLearned) : tr({ en: 'You already knew this one.', rw: 'Wari usanzwe ukizi.' })}
                  {:else}
                    {tr(T.correctAnswer)}: {pick(item.sign.sign, settings.lang)}
                  {/if}
                </p>
              </div>
            </div>
            {#if explain}
              <p class="mt-3 border-t border-line/70 pt-3 text-sm leading-relaxed">
                <Lightbulb size={15} class="mr-1 inline-block -translate-y-px text-sun-500" /><Bi text={explain} />
              </p>
            {/if}
            <div class="mt-4 flex justify-end">
              <button class="btn {lastCorrect ? 'btn-success' : 'btn-danger'} w-full sm:w-auto sm:min-w-44" onclick={next}>
                {isLast ? tr({ en: 'See results', rw: 'Reba amanota' }) : tr(T.continue)}
              </button>
            </div>
          </div>
        {/if}
      </article>
    {/key}

    <p class="mt-3 hidden text-center text-xs text-ink-faint pointer-fine:block">
      {tr({ en: 'Tip: press 1–4 to answer, Enter to continue', rw: 'Inama: kanda 1–4 usubize, Enter ukomeze' })}
    </p>
  </div>
{/if}

<SignDetail
  id={detailId}
  ids={missed.map((m) => m.sign.id)}
  onclose={() => (detailId = null)}
  onnavigate={(id) => (detailId = id)}
/>
