<script lang="ts">
  /**
   * Read-only full view of a question: stem images, every option (correct one highlighted
   * when `reveal`), the road-sign meaning and the explanation.
   */
  import Check from '@lucide/svelte/icons/check'
  import Lightbulb from '@lucide/svelte/icons/lightbulb'
  import Bi from '../../lib/components/Bi.svelte'
  import QImage from '../../lib/components/QImage.svelte'
  import { OPTION_LETTERS, pick } from '../../lib/data'
  import { tr, T } from '../../lib/i18n'
  import { settings } from '../../lib/state/settings.svelte'
  import type { Question } from '../../lib/types'
  import { hasText } from './status'

  interface Props {
    question: Question
    reveal: boolean
  }

  let { question, reveal }: Props = $props()

  const imageOptions = $derived(question.options.some((o) => o.image))
  const hasSign = $derived(hasText(question.sign))
  const hasExplain = $derived(hasText(question.explain))
</script>

<div class="flex flex-col gap-4">
  {#if question.images.length}
    <div class="flex flex-wrap justify-center gap-3">
      {#each question.images as img (img)}
        <QImage id={img} alt={hasSign && reveal ? pick(question.sign, settings.lang) : ''} class="max-h-44 sm:max-h-56" />
      {/each}
    </div>
  {/if}

  <ol class="grid gap-2 {imageOptions ? 'grid-cols-2' : ''}" aria-label={tr({ en: 'Options', rw: 'Ibisubizo bishoboka' })}>
    {#each question.options as option, i (i)}
      {@const correct = reveal && i === question.answer}
      <li
        class="flex gap-3 rounded-2xl border-2 px-3 py-2.5 {correct
          ? 'border-leaf-500 bg-leaf-100 dark:bg-leaf-700/25'
          : 'border-line bg-surface'} {imageOptions ? 'flex-col items-center text-center' : 'items-center'}"
      >
        <span
          class="grid size-7 shrink-0 place-items-center rounded-lg font-display text-sm font-bold {correct
            ? 'bg-leaf-500 text-white'
            : 'bg-surface-2 text-ink-muted'}"
          aria-hidden="true">{OPTION_LETTERS[i]}</span
        >
        {#if option.image}
          <QImage
            id={option.image}
            alt={pick(option, settings.lang) || tr({ en: 'Option {l}', rw: 'Igisubizo {l}' }, { l: OPTION_LETTERS[i] })}
            class="h-20 sm:h-24"
          />
        {:else}
          <span class="min-w-0 flex-1 leading-snug font-semibold"><span class="sr-only">{OPTION_LETTERS[i]}.</span><Bi text={option} /></span>
        {/if}
        {#if correct}
          <span class="inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-leaf-700 dark:text-leaf-400">
            <Check size={16} strokeWidth={3} aria-hidden="true" />
            <span class={imageOptions ? '' : 'sr-only sm:not-sr-only'}>{tr(T.correctAnswer)}</span>
          </span>
        {/if}
      </li>
    {/each}
  </ol>

  {#if reveal && hasSign}
    <div class="flex items-start gap-3 rounded-2xl border-2 border-sun-200 bg-sun-100/70 p-3.5 dark:border-sun-600/40 dark:bg-sun-600/10">
      <span class="text-xl leading-none" aria-hidden="true">🪧</span>
      <div class="min-w-0">
        <p class="eyebrow text-sun-600 dark:text-sun-300">{tr({ en: 'Sign meaning', rw: 'Icyo icyapa gisobanura' })}</p>
        <p class="mt-1 font-bold"><Bi text={question.sign} /></p>
      </div>
    </div>
  {/if}

  {#if reveal && hasExplain}
    <div class="flex items-start gap-3 rounded-2xl bg-surface-2 p-3.5">
      <Lightbulb size={20} class="mt-0.5 shrink-0 text-sun-500" aria-hidden="true" />
      <div class="min-w-0">
        <p class="eyebrow">{tr(T.explanation)}</p>
        <p class="mt-1 leading-relaxed"><Bi text={question.explain} /></p>
      </div>
    </div>
  {/if}
</div>
