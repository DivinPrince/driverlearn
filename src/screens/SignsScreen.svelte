<script lang="ts">
  import Layers from '@lucide/svelte/icons/layers'
  import LayoutGrid from '@lucide/svelte/icons/layout-grid'
  import Zap from '@lucide/svelte/icons/zap'
  import type { Component } from 'svelte'
  import EmptyState from '../lib/components/EmptyState.svelte'
  import Mascot from '../lib/components/Mascot.svelte'
  import PageHeader from '../lib/components/PageHeader.svelte'
  import ProgressRing from '../lib/components/ProgressRing.svelte'
  import { tr, T } from '../lib/i18n'
  import { href, navigate, route } from '../lib/router.svelte'
  import { progress } from '../lib/state/progress.svelte'
  import type { L10n } from '../lib/types'
  import SignFlashcards from './signs/SignFlashcards.svelte'
  import SignGallery from './signs/SignGallery.svelte'
  import SignQuiz from './signs/SignQuiz.svelte'
  import { S, SIGN_TABS, SIGNS, type SignTab } from './signs/signs'

  const TABS: { id: SignTab; label: L10n; icon: Component<{ size?: number; strokeWidth?: number }> }[] = [
    { id: 'gallery', label: S.gallery, icon: LayoutGrid },
    { id: 'cards', label: S.flashcards, icon: Layers },
    { id: 'quiz', label: S.quiz, icon: Zap },
  ]

  const tab: SignTab = $derived(SIGN_TABS.find((t) => t === route.query.tab) ?? 'gallery')

  const total = SIGNS.length
  const learned = $derived.by(() => {
    const set = new Set(progress.signsLearned)
    return SIGNS.filter((q) => set.has(q.id)).length
  })
  const left = $derived(total - learned)

  /** Tabs are real links (deep-linkable), but switching replaces history so Back leaves the trainer. */
  function select(e: MouseEvent, id: SignTab) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    if (id !== tab) navigate('/signs', { tab: id }, true)
  }
</script>

{#if total === 0}
  <PageHeader title={tr(S.title)} />
  <EmptyState
    title={tr({ en: 'Road signs are on their way', rw: 'Ibyapa biri mu nzira' })}
    body={tr({
      en: 'We are still preparing the sign pictures and their meanings. Meanwhile, practise the exam questions.',
      rw: 'Turacyategura amafoto y’ibyapa n’ibisobanuro byabyo. Hagati aho, witoze ibibazo by’ikizamini.',
    })}
  >
    <a class="btn btn-primary" href={href('/practice', { mode: 'smart' })}>{tr({ en: 'Practise questions', rw: 'Witoze ibibazo' })}</a>
    <a class="btn btn-soft" href={href('/library')}>{tr(T.library)}</a>
  </EmptyState>
{:else}
  {#if tab !== 'gallery'}
    <!-- Phones: a slim header leaves room for the card / quiz. -->
    <header class="mb-3 flex items-center gap-3 sm:hidden">
      <h1 class="min-w-0 flex-1 truncate text-xl font-bold">{tr(S.title)}</h1>
      <span class="chip shrink-0 gap-2 bg-surface py-1 pr-3 pl-1 text-sm text-ink ring-1 ring-line">
        <ProgressRing value={learned / total} size={24} stroke={4} color="var(--color-leaf-500)" label={tr(S.learnedCount, { x: learned, y: total })}>
          <span></span>
        </ProgressRing>
        <span class="font-display tabular-nums" aria-hidden="true">{learned} / {total}</span>
      </span>
    </header>
  {/if}
  <header
    class="card relative mb-4 items-center gap-4 overflow-hidden px-4 py-3.5 sm:mb-5 sm:flex sm:gap-5 sm:p-6 {tab === 'gallery'
      ? 'flex'
      : 'hidden'}"
  >
    <ProgressRing
      value={learned / total}
      size={64}
      stroke={7}
      color="var(--color-leaf-500)"
      label={tr(S.learnedCount, { x: learned, y: total })}
    >
      <span class="flex flex-col items-center">
        <span class="font-display text-lg leading-none font-black tabular-nums">{learned}</span>
        <span class="mt-0.5 text-[0.6rem] font-bold text-ink-faint tabular-nums">/ {total}</span>
      </span>
    </ProgressRing>
    <div class="min-w-0 flex-1">
      <h1 class="text-xl leading-tight font-bold text-balance sm:text-3xl">{tr(S.title)}</h1>
      <p class="mt-0.5 text-sm font-semibold text-ink-muted">{tr(S.learnedCount, { x: learned, y: total })}</p>
      <p class="mt-0.5 hidden text-sm text-ink-faint sm:block">
        {left > 0
          ? tr({ en: 'Browse them, flip the cards, then test yourself.', rw: 'Reba ibyapa, hindura amakarita, hanyuma wisuzume.' })
          : tr({ en: 'You know every sign. Keep them fresh with a quiz!', rw: 'Uzi ibyapa byose. Ujye ubisubiramo ukora isuzuma!' })}
      </p>
    </div>
    <Mascot size={92} mood={left === 0 ? 'wow' : 'happy'} class="hidden shrink-0 animate-float text-ink sm:block" />
    <div class="road-stripes pointer-events-none absolute inset-x-0 bottom-0 h-1 opacity-70" aria-hidden="true"></div>
  </header>

  <nav
    class="mb-4 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-surface-2 p-1 sm:mx-auto sm:mb-6 sm:max-w-md"
    aria-label={tr({ en: 'Training mode', rw: 'Uburyo bwo kwiga' })}
  >
    {#each TABS as t (t.id)}
      {@const Icon = t.icon}
      {@const on = tab === t.id}
      <a
        href={href('/signs', { tab: t.id })}
        onclick={(e) => select(e, t.id)}
        aria-current={on ? 'page' : undefined}
        class="flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2 font-display sm:py-2.5 text-sm font-semibold transition sm:gap-2 {on
          ? 'bg-surface text-brand-600 shadow-sm ring-1 ring-line dark:bg-surface-3 dark:text-brand-300'
          : 'text-ink-muted hover:bg-surface/60 hover:text-ink'}"
      >
        <Icon size={18} strokeWidth={on ? 2.6 : 2.2} />
        <span class="truncate">{tr(t.label)}</span>
      </a>
    {/each}
  </nav>

  {#if tab === 'cards'}
    <SignFlashcards />
  {:else if tab === 'quiz'}
    <SignQuiz />
  {:else}
    <SignGallery />
  {/if}
{/if}
