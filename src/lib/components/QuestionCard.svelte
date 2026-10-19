<script lang="ts">
  import Check from '@lucide/svelte/icons/check'
  import Lightbulb from '@lucide/svelte/icons/lightbulb'
  import X from '@lucide/svelte/icons/x'
  import type { Snippet } from 'svelte'
  import { OPTION_LETTERS, pick } from '../data'
  import { tr, T } from '../i18n'
  import { settings } from '../state/settings.svelte'
  import type { Question } from '../types'
  import Bi from './Bi.svelte'
  import QImage from './QImage.svelte'

  interface Props {
    question: Question
    /** Chosen option index, or null. */
    selected: number | null
    /** Show right/wrong styling and lock the options. */
    reveal?: boolean
    /** Show the explanation panel (defaults to `reveal`). */
    showExplanation?: boolean
    onselect?: (index: number) => void
    /** Listen for 1-4 / A-D keys to select an option. */
    keyboard?: boolean
    /** Optional content rendered at the top-right of the card (e.g. bookmark button). */
    actions?: Snippet
    /** Optional line above the stem (e.g. "Question 3 of 20"). */
    eyebrow?: string
  }

  let { question, selected, reveal = false, showExplanation, onselect, keyboard = false, actions, eyebrow }: Props = $props()

  const explain = $derived(showExplanation ?? reveal)
  const imageOptions = $derived(question.options.some((o) => o.image))
  const answeredWrong = $derived(reveal && selected !== null && selected !== question.answer)

  function choose(i: number) {
    if (reveal || !onselect) return
    onselect(i)
  }

  function onkeydown(e: KeyboardEvent) {
    if (!keyboard || reveal || e.metaKey || e.ctrlKey || e.altKey) return
    const target = e.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
    const k = e.key.toLowerCase()
    const byNumber = Number(k) - 1
    const byLetter = 'abcdef'.indexOf(k)
    const i = k.length === 1 && byLetter >= 0 ? byLetter : byNumber
    if (Number.isInteger(i) && i >= 0 && i < question.options.length) {
      e.preventDefault()
      choose(i)
    }
  }

  function optionState(i: number): 'idle' | 'selected' | 'correct' | 'wrong' | 'dim' {
    if (!reveal) return selected === i ? 'selected' : 'idle'
    if (i === question.answer) return 'correct'
    if (i === selected) return 'wrong'
    return 'dim'
  }

  const styles = {
    idle: 'border-line bg-surface hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/40',
    selected: 'border-brand-500 bg-brand-50 ring-4 ring-brand-500/15 dark:bg-brand-950/50',
    correct: 'border-leaf-500 bg-leaf-100 dark:bg-leaf-700/25 animate-pop',
    wrong: 'border-flame-500 bg-flame-100 dark:bg-flame-700/25 animate-shake',
    dim: 'border-line bg-surface opacity-60',
  }
  const badge = {
    idle: 'bg-surface-2 text-ink-muted',
    selected: 'bg-brand-500 text-white',
    correct: 'bg-leaf-500 text-white',
    wrong: 'bg-flame-500 text-white',
    dim: 'bg-surface-2 text-ink-faint',
  }
</script>

<svelte:window {onkeydown} />

<article class="card p-5 sm:p-7">
  <div class="flex items-start gap-3">
    <div class="min-w-0 flex-1">
      {#if eyebrow}<p class="eyebrow mb-2">{eyebrow}</p>{/if}
      <h2 class="font-sans text-lg leading-snug font-bold text-balance sm:text-xl">
        <Bi text={question.q} />
      </h2>
    </div>
    {#if actions}<div class="-mt-1 -mr-2 flex shrink-0 gap-1">{@render actions()}</div>{/if}
  </div>

  {#if question.images.length}
    <div class="mt-5 flex flex-wrap justify-center gap-3">
      {#each question.images as img (img)}
        <QImage id={img} alt={pick(question.sign, settings.lang) ? '' : pick(question.q, settings.lang)} class="max-h-52 sm:max-h-64" />
      {/each}
    </div>
  {/if}

  <div class="mt-6 grid gap-3 {imageOptions ? 'grid-cols-2' : ''}" role="radiogroup" aria-label={tr(T.question)}>
    {#each question.options as option, i (i)}
      {@const st = optionState(i)}
      <button
        type="button"
        role="radio"
        aria-checked={selected === i}
        aria-disabled={reveal}
        class="group flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-150 {st === 'dim' && option.image
          ? 'border-line bg-surface [&_img]:grayscale-[60%]'
          : styles[st]} {imageOptions
          ? 'flex-col justify-center text-center'
          : ''} {reveal ? 'cursor-default' : 'active:scale-[0.99]'}"
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
        {#if option.image}
          <QImage id={option.image} alt={pick(option, settings.lang)} class="h-24 sm:h-28" zoomable={false} />
          <span class="sr-only">{pick(option, settings.lang)}</span>
        {:else}
          <span class="min-w-0 flex-1 leading-snug font-semibold"><Bi text={option} /></span>
        {/if}
      </button>
    {/each}
  </div>

  {#if explain}
    <div
      class="mt-6 animate-rise rounded-3xl border-2 p-5 {answeredWrong
        ? 'border-flame-200 bg-flame-100/60 dark:border-flame-700/40 dark:bg-flame-700/10'
        : 'border-leaf-200 bg-leaf-100/60 dark:border-leaf-700/40 dark:bg-leaf-700/10'}"
    >
      <p class="flex items-center gap-2 font-display font-bold">
        <Lightbulb size={18} class="shrink-0 text-sun-500" />
        {tr(T.correctAnswer)}: {OPTION_LETTERS[question.answer]}
      </p>
      {#if !question.options[question.answer].image}
        <p class="mt-1 font-semibold text-ink-muted">{pick(question.options[question.answer], settings.lang)}</p>
      {/if}
      {#if question.sign.en || question.sign.rw}
        <p class="mt-2 text-sm font-bold text-ink-muted">🪧 <Bi text={question.sign} /></p>
      {/if}
      {#if question.explain.en.trim() && question.explain.en !== '…'}
        <p class="mt-2 leading-relaxed"><Bi text={question.explain} /></p>
      {/if}
    </div>
  {/if}
</article>
