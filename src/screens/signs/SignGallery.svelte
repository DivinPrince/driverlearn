<script lang="ts">
  /** Browsable grid of every sign with learned filters, search and a detail modal. */
  import Check from '@lucide/svelte/icons/check'
  import Search from '@lucide/svelte/icons/search'
  import X from '@lucide/svelte/icons/x'
  import Zap from '@lucide/svelte/icons/zap'
  import Mascot from '../../lib/components/Mascot.svelte'
  import { normalize, pick } from '../../lib/data'
  import { tr } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import { sfx } from '../../lib/sound'
  import { progress } from '../../lib/state/progress.svelte'
  import { settings } from '../../lib/state/settings.svelte'
  import type { L10n } from '../../lib/types'
  import SignDetail from './SignDetail.svelte'
  import SignImage from './SignImage.svelte'
  import { S, SIGNS, signSearchText } from './signs'

  type Filter = 'all' | 'todo' | 'done'

  const FILTERS: { id: Filter; label: L10n }[] = [
    { id: 'all', label: { en: 'All', rw: 'Byose' } },
    { id: 'todo', label: { en: 'To learn', rw: 'Ibyo ntazi' } },
    { id: 'done', label: { en: 'Learned', rw: 'Ibyo nzi' } },
  ]

  const INDEX = new Map(SIGNS.map((q) => [q.id, signSearchText(q)]))

  let filter: Filter = $state('all')
  let query = $state('')
  let openId: number | null = $state(null)
  /** Snapshot of the visible ids when the modal opened, so marking a sign doesn't reshuffle prev/next. */
  let modalIds: number[] = $state.raw([])

  const learned = $derived(new Set(progress.signsLearned))
  const learnedCount = $derived(SIGNS.filter((q) => learned.has(q.id)).length)
  const counts: Record<Filter, number> = $derived({
    all: SIGNS.length,
    todo: SIGNS.length - learnedCount,
    done: learnedCount,
  })

  const needle = $derived(normalize(query.trim()))
  const visible = $derived(
    SIGNS.filter(
      (q) =>
        (filter === 'all' || (filter === 'done') === learned.has(q.id)) && (!needle || (INDEX.get(q.id) ?? '').includes(needle)),
    ),
  )

  function open(id: number) {
    sfx.tap()
    modalIds = visible.map((q) => q.id)
    openId = id
  }

  function reset() {
    query = ''
    filter = 'all'
  }
</script>

<section aria-label={tr(S.gallery)}>
  <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
    <div class="flex gap-1.5 overflow-x-auto sm:gap-2" role="group" aria-label={tr({ en: 'Filter signs', rw: 'Hitamo ibyapa' })}>
      {#each FILTERS as f (f.id)}
        {@const on = filter === f.id}
        <button
          class="flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1.5 font-display text-[0.8125rem] font-semibold transition sm:px-3.5 sm:text-sm {on
            ? 'border-brand-500 bg-brand-500 text-white'
            : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink'}"
          aria-pressed={on}
          onclick={() => (filter = f.id)}
        >
          {#if f.id === 'done'}<Check size={15} strokeWidth={3} />{/if}
          {tr(f.label)}
          <span
            class="rounded-full px-1.5 text-xs font-bold tabular-nums {on ? 'bg-white/25' : 'bg-surface-2 text-ink-faint'}"
            >{counts[f.id]}</span
          >
        </button>
      {/each}
    </div>

    <label class="relative block sm:ml-auto sm:w-72">
      <span class="sr-only">{tr({ en: 'Search signs', rw: 'Shakisha ibyapa' })}</span>
      <Search size={18} class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint" />
      <input
        class="input py-2.5 pr-10 pl-10 [&::-webkit-search-cancel-button]:appearance-none"
        type="search"
        bind:value={query}
        placeholder={tr({ en: 'Search signs…', rw: 'Shakisha icyapa…' })}
        autocomplete="off"
        enterkeyhint="search"
      />
      {#if query}
        <button
          type="button"
          class="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-faint hover:bg-surface-2 hover:text-ink"
          onclick={() => (query = '')}
          aria-label={tr({ en: 'Clear search', rw: 'Siba ibyo washakishije' })}
        >
          <X size={16} />
        </button>
      {/if}
    </label>
  </div>

  {#if visible.length}
    <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {#each visible as q (q.id)}
        {@const isLearned = learned.has(q.id)}
        <li>
          <button
            class="group card-flat relative flex h-full w-full flex-col overflow-hidden text-left transition duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg active:translate-y-0 dark:hover:border-brand-700"
            onclick={() => open(q.id)}
          >
            <SignImage
              id={q.images[0]}
              class="aspect-[4/3] w-full"
              imgClass="transition-transform duration-200 group-hover:scale-105"
            />
            <span
              class="flex flex-1 items-start border-t border-line px-3 py-2.5 text-sm leading-snug font-semibold {isLearned
                ? 'bg-leaf-100/60 dark:bg-leaf-700/15'
                : ''}"
            >
              <span class="line-clamp-3" lang={settings.lang}>{pick(q.sign, settings.lang)}</span>
            </span>
            {#if isLearned}
              <span
                class="absolute top-2 right-2 grid size-7 animate-pop place-items-center rounded-full bg-leaf-500 text-white shadow-md ring-2 ring-white"
                title={tr(S.learned)}
              >
                <Check size={16} strokeWidth={3.5} />
                <span class="sr-only">{tr(S.learned)}</span>
              </span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="card-flat flex flex-col items-center px-6 py-10 text-center">
      <Mascot size={96} mood={filter === 'todo' && !needle ? 'wow' : 'think'} class="text-ink" />
      {#if filter === 'todo' && !needle}
        <h2 class="mt-3 text-lg font-bold">{tr({ en: 'You know every sign!', rw: 'Uzi ibyapa byose!' })}</h2>
        <p class="mt-1 max-w-sm text-sm text-ink-muted">
          {tr({ en: 'Keep them fresh with a quick quiz.', rw: 'Ujye ubisubiramo ukora isuzuma rigufi.' })}
        </p>
      {:else if filter === 'done' && !needle}
        <h2 class="mt-3 text-lg font-bold">{tr({ en: 'No learned signs yet', rw: 'Nta cyapa uramenya' })}</h2>
        <p class="mt-1 max-w-sm text-sm text-ink-muted">
          {tr({
            en: 'Open a sign and tap “Mark as learned”, or use the flashcards.',
            rw: 'Fungura icyapa ukande “Shyira mu byo nzi”, cyangwa ukoreshe amakarita.',
          })}
        </p>
      {:else}
        <h2 class="mt-3 text-lg font-bold">
          {tr({ en: 'No signs match “{q}”', rw: 'Nta cyapa gihuye na “{q}”' }, { q: query.trim() })}
        </h2>
        <p class="mt-1 max-w-sm text-sm text-ink-muted">
          {tr({ en: 'Try another word, in English or Kinyarwanda.', rw: 'Gerageza irindi jambo, mu Kinyarwanda cyangwa mu Cyongereza.' })}
        </p>
      {/if}
      <div class="mt-5 flex flex-wrap justify-center gap-3">
        {#if filter === 'todo' && !needle}
          <a class="btn btn-primary btn-sm" href={href('/signs', { tab: 'quiz' })}><Zap size={16} />{tr(S.quiz)}</a>
        {/if}
        <button class="btn btn-soft btn-sm" onclick={reset}>{tr({ en: 'Show all signs', rw: 'Erekana ibyapa byose' })}</button>
      </div>
    </div>
  {/if}
</section>

<SignDetail id={openId} ids={modalIds} onclose={() => (openId = null)} onnavigate={(id) => (openId = id)} />
