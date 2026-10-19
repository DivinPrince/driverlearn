<script lang="ts">
  /** Modal with one sign: big picture, meaning in both languages, explanation and the learned toggle. */
  import ArrowRight from '@lucide/svelte/icons/arrow-right'
  import Check from '@lucide/svelte/icons/check'
  import ChevronLeft from '@lucide/svelte/icons/chevron-left'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import CircleCheckBig from '@lucide/svelte/icons/circle-check-big'
  import Lightbulb from '@lucide/svelte/icons/lightbulb'
  import Bi from '../../lib/components/Bi.svelte'
  import Modal from '../../lib/components/Modal.svelte'
  import { getQuestion, pick, translation } from '../../lib/data'
  import { tr, T } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import { sfx } from '../../lib/sound'
  import { progress, setSignLearned } from '../../lib/state/progress.svelte'
  import { settings } from '../../lib/state/settings.svelte'
  import { TOPIC_BY_ID } from '../../lib/topics'
  import type { Lang } from '../../lib/types'
  import { explanationOf, S } from './signs'
  import SignImage from './SignImage.svelte'

  interface Props {
    /** Sign shown, or null when closed. */
    id: number | null
    /** Ordered ids the previous / next buttons (and ←/→) move through. */
    ids: readonly number[]
    onclose: () => void
    onnavigate: (id: number) => void
  }

  let { id, ids, onclose, onnavigate }: Props = $props()

  const sign = $derived(id === null ? undefined : getQuestion(id))
  const pos = $derived(id === null ? -1 : ids.indexOf(id))
  const learned = $derived(!!sign && progress.signsLearned.includes(sign.id))
  const other: Lang = $derived(settings.lang === 'rw' ? 'en' : 'rw')
  const otherMeaning = $derived(sign ? translation(sign.sign, settings.lang) : '')
  const explain = $derived(sign ? explanationOf(sign) : null)
  const topic = $derived(sign ? TOPIC_BY_ID[sign.topic] : undefined)

  function step(delta: number) {
    if (pos < 0 || ids.length < 2) return
    sfx.tap()
    onnavigate(ids[(pos + delta + ids.length) % ids.length])
  }

  function mark(value: boolean) {
    if (!sign) return
    setSignLearned(sign.id, value)
    if (value) sfx.correct()
  }

  function onkeydown(e: KeyboardEvent) {
    if (!sign || e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      step(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      step(1)
    }
  }
</script>

<svelte:window {onkeydown} />

<Modal open={!!sign} {onclose} size="md">
  {#if sign}
    <div class="-mt-3">
      <div class="flex flex-wrap items-center gap-2 pr-8">
        {#if topic}<span class="chip">{topic.emoji} {tr(topic.name)}</span>{/if}
        {#if ids.length > 1 && pos >= 0}
          <span class="text-xs font-bold text-ink-faint tabular-nums">
            {tr({ en: 'Sign {i} of {n}', rw: 'Icyapa {i} kuri {n}' }, { i: pos + 1, n: ids.length })}
          </span>
        {/if}
      </div>

      <div class="relative mt-3">
        {#key sign.id}
          <SignImage
            id={sign.images[0]}
            alt={pick(sign.sign, settings.lang)}
            class="h-48 w-full animate-pop rounded-3xl border border-line sm:h-64"
            pad="p-4"
            eager
          />
        {/key}
        {#if ids.length > 1 && pos >= 0}
          <button
            class="btn btn-soft btn-icon btn-sm absolute top-1/2 left-2 -translate-y-1/2"
            onclick={() => step(-1)}
            aria-label={tr(T.previous)}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            class="btn btn-soft btn-icon btn-sm absolute top-1/2 right-2 -translate-y-1/2"
            onclick={() => step(1)}
            aria-label={tr(T.next)}
          >
            <ChevronRight size={20} />
          </button>
        {/if}
      </div>

      <p class="mt-5 eyebrow">{tr(S.meaning)}</p>
      <h2 class="mt-1 text-2xl leading-tight font-bold text-balance" lang={settings.lang}>{pick(sign.sign, settings.lang)}</h2>
      {#if otherMeaning}
        <p class="mt-2 flex items-start gap-2 text-ink-muted">
          <span class="mt-0.5 shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-[0.65rem] font-extrabold tracking-wider text-ink-faint uppercase"
            >{other}</span
          >
          <span class="italic" lang={other}>{otherMeaning}</span>
        </p>
      {/if}

      {#if explain}
        <div class="mt-5 rounded-3xl bg-surface-2 p-4">
          <p class="flex items-center gap-2 font-display font-bold">
            <Lightbulb size={18} class="shrink-0 text-sun-500" />{tr(S.explanation)}
          </p>
          <p class="mt-1.5 leading-relaxed text-ink-muted"><Bi text={explain} /></p>
        </div>
      {/if}

      <a
        class="mt-4 inline-flex items-center gap-1.5 rounded-lg font-display text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
        href={href(`/q/${sign.id}`)}
      >
        {tr(S.openQuestion)}<ArrowRight size={16} />
      </a>
    </div>
  {/if}

  {#snippet footer()}
    {#if sign}
      {#if learned}
        <div class="flex flex-1 items-center justify-between gap-2">
          <span class="flex animate-pop items-center gap-1.5 font-display font-bold text-leaf-600 dark:text-leaf-400">
            <CircleCheckBig size={20} />{tr(S.youKnowIt)}
          </span>
          <button class="btn btn-ghost btn-sm" onclick={() => mark(false)}>{tr(S.unmark)}</button>
        </div>
      {:else}
        <button class="btn btn-success flex-1 whitespace-nowrap sm:max-w-xs sm:flex-none sm:px-8" onclick={() => mark(true)}>
          <Check size={18} strokeWidth={3} />{tr(S.markLearned)}
        </button>
      {/if}
    {/if}
  {/snippet}
</Modal>
