<script lang="ts">
  /** One-card-at-a-time flashcards with a 3D flip, swipe gestures and keyboard shortcuts. */
  import Check from '@lucide/svelte/icons/check'
  import Lightbulb from '@lucide/svelte/icons/lightbulb'
  import Rotate3d from '@lucide/svelte/icons/rotate-3d'
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw'
  import Zap from '@lucide/svelte/icons/zap'
  import { tick } from 'svelte'
  import { burst, celebrate } from '../../lib/celebrate'
  import Bi from '../../lib/components/Bi.svelte'
  import Mascot from '../../lib/components/Mascot.svelte'
  import { pick, translation } from '../../lib/data'
  import { tr } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import { sfx } from '../../lib/sound'
  import { progress, setSignLearned } from '../../lib/state/progress.svelte'
  import { settings } from '../../lib/state/settings.svelte'
  import { TOPIC_BY_ID } from '../../lib/topics'
  import type { L10n, Question } from '../../lib/types'
  import SignDetail from './SignDetail.svelte'
  import SignImage from './SignImage.svelte'
  import { explanationOf, FLASH_ROUND, orderForStudy, S, SIGNS } from './signs'

  /** Horizontal drag distance (px) that counts as a swipe. */
  const SWIPE = 90

  const STILL: L10n = { en: 'Still learning', rw: 'Ndacyiga' }
  const KNOW: L10n = { en: 'I know it', rw: 'Ndakizi' }

  function newDeck(): Question[] {
    return orderForStudy(SIGNS, new Set(progress.signsLearned)).slice(0, FLASH_ROUND)
  }

  /** The deck grows when a "still learning" card is shown again at the end (once per card). */
  const firstDeck = newDeck()
  let deck: Question[] = $state.raw(firstDeck)
  let roundSize = $state(firstDeck.length)
  let index = $state(0)
  let flipped = $state(false)
  let known: number[] = $state.raw([])
  let again: number[] = $state.raw([])
  let newlyLearned = $state(0)
  let finished = $state(false)
  let exit: 'left' | 'right' | null = $state(null)
  let dragX = $state(0)
  let dragging = $state(false)
  let detailId: number | null = $state(null)
  let cardEl: HTMLButtonElement | undefined = $state()
  const requeued = new Set<number>()

  const card = $derived(deck[index])
  const learned = $derived(new Set(progress.signsLearned))
  const explain = $derived(card ? explanationOf(card) : null)
  const otherMeaning = $derived(card ? translation(card.sign, settings.lang) : '')
  const pct = $derived(deck.length ? index / deck.length : 0)
  const allLearned = $derived(SIGNS.every((q) => learned.has(q.id)))

  const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

  const cardTransform = $derived(
    exit
      ? `translateX(${exit === 'right' ? 135 : -135}%) rotate(${exit === 'right' ? 16 : -16}deg)`
      : `translateX(${dragX}px) rotate(${dragX / 22}deg)`,
  )
  /** 0..1 strength of the swipe hint stamps. */
  const knowHint = $derived(exit === 'right' ? 1 : Math.max(0, Math.min(1, dragX / SWIPE)))
  const stillHint = $derived(exit === 'left' ? 1 : Math.max(0, Math.min(1, -dragX / SWIPE)))

  function flip() {
    if (!card || exit) return
    flipped = !flipped
    sfx.tap()
  }

  function answer(knows: boolean) {
    const c = card
    if (!c || exit || finished) return
    if (knows) {
      if (!learned.has(c.id)) {
        setSignLearned(c.id, true)
        newlyLearned++
      }
      known = known.includes(c.id) ? known : [...known, c.id]
      again = again.filter((id) => id !== c.id)
      sfx.correct()
    } else {
      if (!again.includes(c.id)) again = [...again, c.id]
      if (!requeued.has(c.id)) {
        requeued.add(c.id)
        deck = [...deck, c]
      }
      sfx.tap()
    }
    exit = knows ? 'right' : 'left'
    setTimeout(advance, reducedMotion ? 0 : 240)
  }

  async function advance() {
    exit = null
    dragX = 0
    flipped = false
    if (index + 1 >= deck.length) {
      finish()
      return
    }
    index++
    await tick()
    cardEl?.focus({ preventScroll: true })
  }

  function finish() {
    finished = true
    sfx.complete()
    if (again.length === 0) celebrate(1400)
    else burst(0.5, 0.45)
  }

  function restart() {
    deck = newDeck()
    roundSize = deck.length
    index = 0
    flipped = false
    known = []
    again = []
    newlyLearned = 0
    requeued.clear()
    finished = false
    window.scrollTo({ top: 0 })
  }

  // --- Swipe gestures (pointer events; vertical scrolling stays native via touch-action: pan-y) ---
  let pointerId: number | null = null
  let startX = 0
  let startY = 0
  let suppressClick = false

  function onpointerdown(e: PointerEvent) {
    suppressClick = false
    if (exit || (e.pointerType === 'mouse' && e.button !== 0)) return
    pointerId = e.pointerId
    startX = e.clientX
    startY = e.clientY
  }

  function onpointermove(e: PointerEvent) {
    if (e.pointerId !== pointerId) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (!dragging) {
      if (Math.abs(dx) < 10) return
      if (Math.abs(dy) > Math.abs(dx)) {
        pointerId = null
        return
      }
      dragging = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    dragX = dx
  }

  function onpointerup(e: PointerEvent) {
    if (e.pointerId !== pointerId) return
    pointerId = null
    if (!dragging) return
    dragging = false
    suppressClick = true
    if (dragX > SWIPE) answer(true)
    else if (dragX < -SWIPE) answer(false)
    else dragX = 0
  }

  function onpointercancel() {
    pointerId = null
    dragging = false
    dragX = 0
  }

  function onclick() {
    if (suppressClick) {
      suppressClick = false
      return
    }
    flip()
  }

  function onkeydown(e: KeyboardEvent) {
    if (finished || !card || e.metaKey || e.ctrlKey || e.altKey) return
    const target = e.target as HTMLElement | null
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
    if (document.querySelector('dialog[open]')) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      answer(false)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      answer(true)
    } else if (e.key === ' ' || e.key === 'Enter') {
      // Focused buttons and links keep their native Space/Enter activation.
      if (target?.closest('button, a')) return
      e.preventDefault()
      flip()
    }
  }
</script>

<svelte:window {onkeydown} />

{#if finished}
  <section class="mx-auto flex max-w-md animate-rise flex-col items-center text-center">
    <Mascot size={120} mood={again.length ? 'happy' : 'wow'} class="animate-float text-ink" />
    <h2 class="mt-3 text-2xl font-black sm:text-3xl">
      {again.length
        ? tr({ en: 'Round complete!', rw: 'Urangije iki cyiciro!' })
        : tr({ en: 'You knew every card!', rw: 'Wamenye amakarita yose!' })}
    </h2>
    <p class="mt-1 text-ink-muted">
      {tr({ en: 'You went through {n} signs.', rw: 'Wasubiyemo ibyapa {n}.' }, { n: roundSize })}
    </p>

    <div class="mt-6 grid w-full grid-cols-3 gap-3">
      <div class="card flex flex-col items-center gap-1 p-4">
        <span class="font-display text-3xl font-black text-leaf-600 tabular-nums dark:text-leaf-400">{known.length}</span>
        <span class="text-xs font-bold text-ink-muted">{tr({ en: 'Known', rw: 'Uzi' })}</span>
      </div>
      <div class="card flex flex-col items-center gap-1 p-4">
        <span class="font-display text-3xl font-black text-sun-600 tabular-nums dark:text-sun-300">{again.length}</span>
        <span class="text-xs font-bold text-ink-muted">{tr(STILL)}</span>
      </div>
      <div class="card flex flex-col items-center gap-1 p-4">
        <span class="font-display text-3xl font-black text-brand-600 tabular-nums dark:text-brand-300">+{newlyLearned}</span>
        <span class="text-xs font-bold text-ink-muted">{tr({ en: 'New signs', rw: 'Ibishya' })}</span>
      </div>
    </div>

    {#if again.length}
      <div class="mt-7 w-full text-left">
        <h3 class="mb-3 text-lg font-bold">{tr({ en: 'Keep practising these', rw: 'Komeza witoze ibi' })}</h3>
        <ul class="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {#each again as id (id)}
            {@const q = SIGNS.find((s) => s.id === id)}
            {#if q}
              <li>
                <button
                  class="block w-full overflow-hidden rounded-2xl border-2 border-line transition hover:border-brand-300"
                  onclick={() => (detailId = id)}
                  aria-label={pick(q.sign, settings.lang)}
                  title={pick(q.sign, settings.lang)}
                >
                  <SignImage id={q.images[0]} class="aspect-square w-full" pad="p-1.5" />
                </button>
              </li>
            {/if}
          {/each}
        </ul>
      </div>
    {:else if allLearned}
      <p class="mt-6 chip bg-leaf-100 px-4 py-2 text-sm text-leaf-700 dark:bg-leaf-700/25 dark:text-leaf-400">
        🎉 {tr({ en: 'You know every sign in the trainer!', rw: 'Uzi ibyapa byose biri hano!' })}
      </p>
    {/if}

    <div class="mt-8 flex w-full flex-col gap-3 sm:flex-row">
      <button class="btn btn-primary flex-1" onclick={restart}><RotateCcw size={18} />{tr({ en: 'Another round', rw: 'Andi makarita' })}</button>
      <a class="btn btn-soft flex-1" href={href('/signs', { tab: 'quiz' })}><Zap size={18} />{tr({ en: 'Take the quiz', rw: 'Kora isuzuma' })}</a>
    </div>
  </section>
{:else if card}
  <div class="mx-auto flex w-full max-w-sm flex-col">
    <!-- Progress -->
    <div class="mb-3 flex items-center gap-3 sm:mb-4">
      <div class="bar flex-1" role="progressbar" aria-valuemin={0} aria-valuemax={deck.length} aria-valuenow={index}>
        <span class="bg-gradient-to-r from-brand-400 to-brand-500" style:width="{pct * 100}%"></span>
      </div>
      <span class="font-display text-sm font-bold text-ink-muted tabular-nums">
        <span class="sr-only">{tr({ en: 'Card', rw: 'Ikarita' })}</span>
        {index + 1}/{deck.length}
      </span>
      <span class="chip bg-leaf-100 text-leaf-700 tabular-nums dark:bg-leaf-700/25 dark:text-leaf-400" title={tr({ en: 'Known', rw: 'Uzi' })}>
        <Check size={14} strokeWidth={3} />{known.length}
      </span>
    </div>

    <!-- Card stack -->
    <div class="relative h-[min(calc(100dvh-27rem),25rem)] min-h-64 sm:h-[min(calc(100dvh-26rem),26rem)]">
      {#if deck.length - index > 1}
        <div class="absolute inset-x-4 top-3 -bottom-2 rounded-4xl border border-line bg-surface-2" aria-hidden="true"></div>
      {/if}
      {#key index}
        <div
          class="absolute inset-0 {dragging ? '' : 'transition-[transform,opacity] duration-200 ease-out'}"
          style:transform={cardTransform}
          style:opacity={exit ? 0 : 1}
        >
          <div class="h-full animate-pop">
            <button
              bind:this={cardEl}
              type="button"
              class="block h-full w-full touch-pan-y rounded-4xl text-left perspective-[1400px] select-none"
              aria-pressed={flipped}
              {onclick}
              {onpointerdown}
              {onpointermove}
              {onpointerup}
              {onpointercancel}
            >
              <span
                class="relative block h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.3,1.3,0.5,1)] transform-3d {flipped
                  ? 'rotate-y-180'
                  : ''}"
              >
                <!-- Front: the sign -->
                <span
                  class="absolute inset-0 flex flex-col rounded-4xl border-2 border-line bg-white p-5 shadow-xl backface-hidden dark:border-white/10"
                  aria-hidden={flipped}
                >
                  <span class="flex items-center justify-between gap-2">
                    <span class="text-xs font-extrabold tracking-[0.12em] text-slate-400 uppercase">
                      {tr({ en: 'What does it mean?', rw: 'Gisobanura iki?' })}
                    </span>
                    {#if learned.has(card.id)}
                      <span class="chip bg-leaf-100 text-leaf-700"><Check size={13} strokeWidth={3} />{tr(S.learned)}</span>
                    {/if}
                  </span>
                  <SignImage id={card.images[0]} class="my-2 min-h-0 w-full flex-1" pad="p-2" eager />
                  <span class="mx-auto flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                    <Rotate3d size={14} />{tr({ en: 'Tap to flip', rw: 'Kanda uhindure' })}
                  </span>
                </span>

                <!-- Back: meaning + explanation -->
                <span
                  class="absolute inset-0 flex rotate-y-180 flex-col overflow-hidden rounded-4xl border-2 border-brand-200 bg-surface shadow-xl backface-hidden dark:border-brand-800"
                  aria-hidden={!flipped}
                >
                  <span class="flex items-center gap-3 bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-3.5 text-white">
                    <SignImage id={card.images[0]} class="size-12 shrink-0 rounded-xl" pad="p-1" />
                    <span class="min-w-0">
                      <span class="block text-xs font-extrabold tracking-[0.12em] text-white/75 uppercase">{tr(S.meaning)}</span>
                      <span class="block truncate text-sm font-semibold text-white/90"
                        >{TOPIC_BY_ID[card.topic].emoji} {tr(TOPIC_BY_ID[card.topic].name)}</span
                      >
                    </span>
                  </span>
                  <span class="block min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    <span class="block font-display text-2xl leading-tight font-bold text-balance" lang={settings.lang}
                      >{pick(card.sign, settings.lang)}</span
                    >
                    {#if otherMeaning}
                      <span class="mt-1.5 block text-ink-muted italic" lang={settings.lang === 'rw' ? 'en' : 'rw'}>{otherMeaning}</span>
                    {/if}
                    {#if explain}
                      <span class="mt-4 block border-t border-line pt-3 text-sm leading-relaxed text-ink-muted">
                        <Lightbulb size={15} class="mr-1 inline-block -translate-y-px text-sun-500" /><Bi text={explain} />
                      </span>
                    {/if}
                  </span>
                </span>
              </span>
            </button>
          </div>

          <!-- Swipe stamps -->
          <span
            class="pointer-events-none absolute top-5 left-5 -rotate-12 rounded-xl border-4 border-leaf-500 bg-white/90 px-3 py-1 font-display text-lg font-black text-leaf-600 uppercase"
            style:opacity={knowHint}
            aria-hidden="true">{tr(KNOW)}</span
          >
          <span
            class="pointer-events-none absolute top-5 right-5 rotate-12 rounded-xl border-4 border-sun-500 bg-white/90 px-3 py-1 font-display text-lg font-black text-sun-600 uppercase"
            style:opacity={stillHint}
            aria-hidden="true">{tr(STILL)}</span
          >
        </div>
      {/key}
    </div>

    <!-- Actions -->
    <div class="mt-5 grid grid-cols-2 gap-3">
      <button class="btn btn-soft px-3" onclick={() => answer(false)}>
        <RotateCcw size={18} class="shrink-0 text-sun-600 dark:text-sun-300" />{tr(STILL)}
        <kbd class="hidden rounded-md bg-surface-2 px-1.5 text-xs text-ink-faint pointer-fine:inline">←</kbd>
      </button>
      <button class="btn btn-success px-3" onclick={() => answer(true)}>
        <Check size={18} strokeWidth={3} class="shrink-0" />{tr(KNOW)}
        <kbd class="hidden rounded-md bg-white/20 px-1.5 text-xs pointer-fine:inline">→</kbd>
      </button>
    </div>
    <p class="mt-3 text-center text-xs text-ink-faint">
      <span class="pointer-fine:hidden"
        >{tr({
          en: 'Swipe right if you know it, left if you are still learning.',
          rw: 'Sunika ikarita iburyo niba ukizi, ibumoso niba utarakimenya.',
        })}</span
      >
      <span class="hidden pointer-fine:inline"
        >{tr({ en: 'Space: flip · ←: still learning · →: I know it', rw: 'Space: hindura · ←: ndacyiga · →: ndakizi' })}</span
      >
    </p>
  </div>
{/if}

<SignDetail id={detailId} ids={again} onclose={() => (detailId = null)} onnavigate={(id) => (detailId = id)} />
