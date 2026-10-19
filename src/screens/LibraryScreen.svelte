<script module lang="ts">
  import { QUESTIONS, searchText } from '../lib/data'

  /** Accent-insensitive search text per question id, built once. */
  const HAYSTACK = new Map<number, string>(QUESTIONS.map((q) => [q.id, searchText(q)]))
</script>

<script lang="ts">
  import Bookmark from '@lucide/svelte/icons/bookmark'
  import CircleCheck from '@lucide/svelte/icons/circle-check'
  import CircleDashed from '@lucide/svelte/icons/circle-dashed'
  import CircleX from '@lucide/svelte/icons/circle-x'
  import Dumbbell from '@lucide/svelte/icons/dumbbell'
  import LibraryBig from '@lucide/svelte/icons/library-big'
  import Search from '@lucide/svelte/icons/search'
  import X from '@lucide/svelte/icons/x'
  import { SvelteSet } from 'svelte/reactivity'
  import EmptyState from '../lib/components/EmptyState.svelte'
  import PageHeader from '../lib/components/PageHeader.svelte'
  import { normalize, QUESTIONS_BY_TOPIC } from '../lib/data'
  import { shuffle } from '../lib/engine/random'
  import { isMastered, isWeak } from '../lib/engine/srs'
  import { tr, T } from '../lib/i18n'
  import { href, navigate, route } from '../lib/router.svelte'
  import { progress } from '../lib/state/progress.svelte'
  import { TOPIC_BY_ID, TOPICS } from '../lib/topics'
  import type { L10n, Question, TopicId } from '../lib/types'
  import LibraryRow from './library/LibraryRow.svelte'

  type Filter = 'all' | 'bookmarked' | 'mistakes' | 'new' | 'mastered'

  /** Rows rendered per "Show more" step. */
  const PAGE = 40

  const FILTERS: { id: Filter; label: L10n; icon: typeof Bookmark; idle: string; active: string }[] = [
    { id: 'all', label: { en: 'All', rw: 'Byose' }, icon: LibraryBig, idle: 'text-brand-500', active: 'border-brand-500 bg-brand-500 text-white' },
    {
      id: 'bookmarked',
      label: T.bookmarked,
      icon: Bookmark,
      idle: 'text-sun-500',
      active: 'border-sun-400 bg-sun-400 text-brand-950',
    },
    { id: 'mistakes', label: T.mistakes, icon: CircleX, idle: 'text-flame-500', active: 'border-flame-500 bg-flame-500 text-white' },
    { id: 'new', label: { en: 'New', rw: 'Bishya' }, icon: CircleDashed, idle: 'text-grape-500', active: 'border-grape-500 bg-grape-500 text-white' },
    { id: 'mastered', label: T.mastered, icon: CircleCheck, idle: 'text-leaf-500', active: 'border-leaf-500 bg-leaf-500 text-white' },
  ]
  const FILTER_IDS = FILTERS.map((f) => f.id)

  /** Only topics that actually have questions get a chip. */
  const VISIBLE_TOPICS = TOPICS.filter((t) => QUESTIONS_BY_TOPIC[t.id]?.length)

  function asTopic(v: string | undefined): TopicId | null {
    return v && v in TOPIC_BY_ID && QUESTIONS_BY_TOPIC[v as TopicId]?.length ? (v as TopicId) : null
  }

  function asFilter(v: string | undefined): Filter {
    return FILTER_IDS.includes(v as Filter) ? (v as Filter) : 'all'
  }

  /**
   * Text search over both languages. "#12" jumps to question 12; a bare number puts that
   * question first, followed by questions that mention the number (e.g. "50" km/h).
   */
  function searchQuestions(raw: string): Question[] {
    const q = normalize(raw.trim())
    if (!q) return QUESTIONS
    const num = /^(#)?\s*(\d+)$/.exec(q)
    if (num) {
      const n = Number(num[2])
      const exact = QUESTIONS.filter((x) => x.id === n)
      if (num[1]) return exact
      const word = new RegExp(`(^|\\D)${n}(\\D|$)`)
      return [...exact, ...QUESTIONS.filter((x) => x.id !== n && word.test(HAYSTACK.get(x.id) ?? ''))]
    }
    const tokens = q.split(/\s+/).filter(Boolean)
    return QUESTIONS.filter((x) => {
      const hay = HAYSTACK.get(x.id) ?? ''
      return tokens.every((t) => hay.includes(t))
    })
  }

  function matchesFilter(q: Question, f: Filter, bookmarks: ReadonlySet<number>): boolean {
    const s = progress.q[q.id]
    switch (f) {
      case 'bookmarked':
        return bookmarks.has(q.id)
      case 'mistakes':
        return isWeak(s)
      case 'new':
        return !s?.seen
      case 'mastered':
        return isMastered(s)
      default:
        return true
    }
  }

  // ---- State (initialised from the query string) -------------------------------------------

  const initialQuery = route.query.q ?? ''
  const initialTopic = asTopic(route.query.topic)
  const initialFilter = asFilter(route.query.filter)
  /** Row to re-open and scroll to when coming back from a question page. */
  const initialOpen = Number(route.query.open) || 0

  let query = $state(initialQuery)
  let topic: TopicId | null = $state(initialTopic)
  let filter: Filter = $state(initialFilter)
  let showAnswers = $state(route.query.answers !== '0')
  let limit = $state(initialLimit())
  const expanded = new SvelteSet<number>(initialOpen ? [initialOpen] : [])
  const revealed = new SvelteSet<number>()
  let searchEl: HTMLInputElement | undefined = $state()

  function initialLimit(): number {
    if (!initialOpen) return PAGE
    const marks = new Set(progress.bookmarks)
    const list = searchQuestions(initialQuery).filter(
      (q) => (!initialTopic || q.topic === initialTopic) && matchesFilter(q, initialFilter, marks),
    )
    const idx = list.findIndex((q) => q.id === initialOpen)
    return idx < 0 ? PAGE : Math.ceil((idx + 1) / PAGE) * PAGE
  }

  // ---- Derived lists -----------------------------------------------------------------------

  const bookmarks = $derived(new Set(progress.bookmarks))
  const searched = $derived(searchQuestions(query))
  const results = $derived(searched.filter((q) => (!topic || q.topic === topic) && matchesFilter(q, filter, bookmarks)))
  const visible = $derived(results.slice(0, limit))

  /** Matches per status filter inside the current topic + search. */
  const filterCounts = $derived.by(() => {
    const c: Record<Filter, number> = { all: 0, bookmarked: 0, mistakes: 0, new: 0, mastered: 0 }
    for (const q of searched) {
      if (topic && q.topic !== topic) continue
      for (const f of FILTER_IDS) if (matchesFilter(q, f, bookmarks)) c[f]++
    }
    return c
  })

  /** Matches per topic for the current search + status filter. */
  const topicCounts = $derived.by(() => {
    const c: Partial<Record<TopicId, number>> = {}
    let all = 0
    for (const q of searched) {
      if (!matchesFilter(q, filter, bookmarks)) continue
      c[q.topic] = (c[q.topic] ?? 0) + 1
      all++
    }
    return { byTopic: c, all }
  })

  /** Whole-book reading progress for the header strip. */
  const book = $derived.by(() => {
    let seen = 0
    let mastered = 0
    for (const q of QUESTIONS) {
      const s = progress.q[q.id]
      if (s?.seen) seen++
      if (isMastered(s)) mastered++
    }
    return { seen, mastered, total: QUESTIONS.length }
  })

  const filtered = $derived(query.trim() !== '' || topic !== null || filter !== 'all')

  // ---- URL sync ----------------------------------------------------------------------------

  function libraryUrl(open?: number): string {
    return href('/library', {
      topic: topic ?? undefined,
      filter: filter === 'all' ? undefined : filter,
      q: query.trim() || undefined,
      answers: showAnswers ? undefined : 0,
      open,
    })
  }

  /**
   * Keep filters in the query string without re-routing: navigate(..., replace=true) fires a
   * hashchange, which remounts the screen (App keys screens by path + query) and would steal
   * focus from the search box on every keystroke.
   */
  function writeUrl(open?: number) {
    if (!location.hash.startsWith('#/library')) return
    const url = libraryUrl(open)
    if (location.hash !== url) history.replaceState(history.state, '', url)
  }

  $effect(() => {
    writeUrl()
  })

  // Coming back from a question page: bring the row that was opened back into view.
  $effect(() => {
    if (!initialOpen) return
    const frame = requestAnimationFrame(() => document.getElementById(`lib-q-${initialOpen}`)?.scrollIntoView({ block: 'center' }))
    return () => cancelAnimationFrame(frame)
  })

  // ---- Actions -----------------------------------------------------------------------------

  function setQuery(v: string) {
    query = v
    limit = PAGE
  }

  function setTopic(t: TopicId | null) {
    topic = t
    limit = PAGE
  }

  function setFilter(f: Filter) {
    filter = f
    limit = PAGE
  }

  function clearAll() {
    query = ''
    topic = null
    filter = 'all'
    limit = PAGE
  }

  function toggleRow(id: number) {
    if (expanded.has(id)) expanded.delete(id)
    else expanded.add(id)
  }

  /** Start a practice session with what is on screen, using the smartest matching mode. */
  function practise() {
    const plain = query.trim() === ''
    if (plain && !topic) {
      if (filter === 'all') return navigate('/practice', { mode: 'smart' })
      if (filter === 'mistakes') return navigate('/practice', { mode: 'mistakes' })
      if (filter === 'bookmarked') return navigate('/practice', { mode: 'bookmarks' })
      if (filter === 'new') return navigate('/practice', { mode: 'unseen' })
    }
    if (plain && topic && filter === 'all') return navigate('/practice', { mode: 'topic', topic })
    const ids = shuffle(results.map((q) => q.id)).slice(0, 20)
    navigate('/practice', { mode: 'ids', ids: ids.join(',') })
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
    const t = e.target as HTMLElement | null
    if (t && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable)) return
    if (document.querySelector('dialog[open]')) return
    e.preventDefault()
    searchEl?.focus()
  }

  const countLabel = (n: number) => (n === 1 ? tr({ en: '1 question', rw: 'Ikibazo 1' }) : tr({ en: '{n} questions', rw: 'Ibibazo {n}' }, { n }))

  const pill = 'inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition'
  const idlePill = 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink'
</script>

<svelte:window {onkeydown} />

<PageHeader title={tr(T.library)} subtitle={tr({ en: 'Read the whole book, at your own pace', rw: 'Soma igitabo cyose ku muvuduko wawe' })}>
  {#snippet actions()}
    <button class="btn btn-primary btn-sm" onclick={practise} disabled={!results.length}>
      <Dumbbell size={18} /><span class="hidden sm:inline">{tr({ en: 'Practise these', rw: 'Bikoreho imyitozo' })}</span><span
        class="sm:hidden">{tr({ en: 'Practise', rw: 'Itoze' })}</span
      >
    </button>
  {/snippet}
</PageHeader>

<!-- Whole-book reading progress -->
<section class="card-flat mb-5 p-4" aria-label={tr({ en: 'Your reading progress', rw: 'Aho ugeze usoma' })}>
  <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
    <p class="font-bold">
      {tr({ en: 'You have seen {s} of {n}', rw: 'Umaze kubona {s} kuri {n}' }, { s: book.seen, n: book.total })}
    </p>
    <p class="flex items-center gap-3 text-xs font-bold text-ink-muted">
      <span class="inline-flex items-center gap-1.5"><span class="size-2.5 rounded-full bg-leaf-500"></span>{tr(T.mastered)} {book.mastered}</span>
      <span class="inline-flex items-center gap-1.5"
        ><span class="size-2.5 rounded-full bg-brand-400"></span>{tr({ en: 'Learning', rw: 'Biri kwigwa' })} {book.seen - book.mastered}</span
      >
    </p>
  </div>
  <div
    class="bar mt-3 h-2.5"
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={book.total}
    aria-valuenow={book.seen}
    aria-label={tr({ en: 'Questions seen', rw: 'Ibibazo umaze kubona' })}
  >
    <span class="bg-brand-400" style:width="{book.total ? (book.seen / book.total) * 100 : 0}%"></span>
    <span class="bg-leaf-500" style:width="{book.total ? (book.mastered / book.total) * 100 : 0}%"></span>
  </div>
</section>

<!-- Search -->
<div class="relative">
  <label for="library-search" class="sr-only">{tr({ en: 'Search questions', rw: 'Shakisha ibibazo' })}</label>
  <Search size={20} class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
  <input
    id="library-search"
    bind:this={searchEl}
    type="search"
    class="input pr-12 pl-12 [&::-webkit-search-cancel-button]:hidden"
    placeholder={tr({ en: 'Search any word or #number', rw: 'Shakisha ijambo cyangwa #nimero' })}
    value={query}
    oninput={(e) => setQuery(e.currentTarget.value)}
    onkeydown={(e) => {
      if (e.key === 'Escape' && query) {
        e.preventDefault()
        setQuery('')
      }
    }}
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    enterkeyhint="search"
  />
  {#if query}
    <button
      type="button"
      class="btn btn-ghost btn-icon btn-sm absolute top-1/2 right-1.5 -translate-y-1/2"
      onclick={() => {
        setQuery('')
        searchEl?.focus()
      }}
      aria-label={tr({ en: 'Clear search', rw: 'Siba ibyo washakishije' })}
    >
      <X size={18} />
    </button>
  {:else}
    <kbd
      class="pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 rounded-md border border-line bg-surface-2 px-1.5 font-sans text-xs font-bold text-ink-faint lg:block"
      aria-hidden="true">/</kbd
    >
  {/if}
</div>

<!-- Topic chips -->
{#if VISIBLE_TOPICS.length > 1}
  <div
    class="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    role="group"
    aria-label={tr({ en: 'Topic', rw: 'Isomo' })}
  >
    <button type="button" class="{pill} {topic === null ? 'border-ink bg-ink text-bg' : idlePill}" aria-pressed={topic === null} onclick={() => setTopic(null)}>
      {tr({ en: 'All topics', rw: 'Amasomo yose' })}
      <span class="tabular-nums opacity-70">{topicCounts.all}</span>
    </button>
    {#each VISIBLE_TOPICS as t (t.id)}
      {@const n = topicCounts.byTopic[t.id] ?? 0}
      <button
        type="button"
        class="{pill} {topic === t.id ? 'border-ink bg-ink text-bg' : idlePill} {n === 0 && topic !== t.id ? 'opacity-55' : ''}"
        aria-pressed={topic === t.id}
        onclick={() => setTopic(topic === t.id ? null : t.id)}
      >
        <span aria-hidden="true">{t.emoji}</span>{tr(t.name)}
        <span class="tabular-nums opacity-70">{n}</span>
      </button>
    {/each}
  </div>
{/if}

<!-- Status filter -->
<div
  class="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
  role="group"
  aria-label={tr({ en: 'Status', rw: 'Uko bihagaze' })}
>
  {#each FILTERS as f (f.id)}
    {@const Icon = f.icon}
    {@const on = filter === f.id}
    <button type="button" class="{pill} {on ? f.active : idlePill}" aria-pressed={on} onclick={() => setFilter(f.id)}>
      <Icon size={16} strokeWidth={2.5} class={on ? '' : f.idle} aria-hidden="true" />
      {tr(f.label)}
      <span class="tabular-nums {on ? 'opacity-80' : 'opacity-70'}">{filterCounts[f.id]}</span>
    </button>
  {/each}
</div>

<!-- Result count + answers toggle -->
<div class="mt-5 mb-3 flex items-center justify-between gap-3">
  <div class="flex min-w-0 items-baseline gap-2">
    <p class="font-display font-bold text-ink-muted" aria-live="polite">{countLabel(results.length)}</p>
    {#if filtered}
      <button
        type="button"
        class="rounded-md text-sm font-bold text-brand-600 underline-offset-2 hover:underline dark:text-brand-300"
        onclick={clearAll}
      >
        {tr({ en: 'Clear', rw: 'Kuraho' })}
      </button>
    {/if}
  </div>
  <button
    type="button"
    role="switch"
    aria-checked={showAnswers}
    class="flex items-center gap-2.5 rounded-full py-1 pr-1 pl-3 text-sm font-bold text-ink-muted transition hover:text-ink"
    onclick={() => (showAnswers = !showAnswers)}
  >
    {tr({ en: 'Show answers', rw: 'Erekana ibisubizo' })}
    <span class="relative h-7 w-12 shrink-0 rounded-full transition-colors {showAnswers ? 'bg-leaf-500' : 'bg-surface-3'}" aria-hidden="true">
      <span
        class="absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform {showAnswers ? 'translate-x-5' : ''}"
      ></span>
    </span>
  </button>
</div>

{#if results.length}
  <ol class="flex flex-col gap-2.5">
    {#each visible as q (q.id)}
      <LibraryRow
        question={q}
        qstate={progress.q[q.id]}
        bookmarked={bookmarks.has(q.id)}
        {showAnswers}
        expanded={expanded.has(q.id)}
        revealed={revealed.has(q.id)}
        ontoggle={() => toggleRow(q.id)}
        onreveal={() => revealed.add(q.id)}
        onopen={() => writeUrl(q.id)}
      />
    {/each}
  </ol>

  {#if results.length > visible.length}
    <div class="mt-5 flex flex-col items-center gap-2">
      <button type="button" class="btn btn-soft w-full sm:w-auto sm:min-w-64" onclick={() => (limit += PAGE)}>
        {tr({ en: 'Show {n} more', rw: 'Erekana ibindi {n}' }, { n: Math.min(PAGE, results.length - visible.length) })}
      </button>
      <p class="text-xs font-bold text-ink-faint">
        {tr({ en: 'Showing {a} of {b}', rw: 'Herekanywe {a} kuri {b}' }, { a: visible.length, b: results.length })}
      </p>
    </div>
  {:else if results.length > PAGE}
    <p class="mt-6 text-center text-sm font-bold text-ink-faint">
      🏁 {tr({ en: 'You reached the end of the list', rw: 'Ugeze ku iherezo ry’urutonde' })}
    </p>
  {/if}
{:else if filter === 'bookmarked' && !query.trim() && !topic}
  <EmptyState
    title={tr({ en: 'No bookmarks yet', rw: 'Nta kibazo urabika' })}
    body={tr({
      en: 'Open any question and tap the bookmark to save it here for later.',
      rw: 'Fungura ikibazo icyo ari cyo cyose maze ukande ku kimenyetso cyo kubika kugira ngo kize hano.',
    })}
  >
    <button class="btn btn-primary" onclick={() => setFilter('all')}>{tr({ en: 'Browse all questions', rw: 'Reba ibibazo byose' })}</button>
  </EmptyState>
{:else if filter === 'mistakes' && !query.trim()}
  <EmptyState
    mood="happy"
    title={tr({ en: 'No mistakes here', rw: 'Nta makosa ahari' })}
    body={tr({
      en: 'Questions you get wrong show up here so you can fix them.',
      rw: 'Ibibazo wishe bizajya bigaragara hano kugira ngo ubikosore.',
    })}
  >
    <button class="btn btn-primary" onclick={() => setFilter('all')}>{tr({ en: 'Browse all questions', rw: 'Reba ibibazo byose' })}</button>
  </EmptyState>
{:else if filter === 'mastered' && !query.trim()}
  <EmptyState
    title={tr({ en: 'Nothing mastered yet', rw: 'Nta kibazo uramenya neza' })}
    body={tr({
      en: 'Answer a question right 3 times in a row to master it.',
      rw: 'Subiza ikibazo neza inshuro 3 zikurikiranye kugira ngo ukimenye neza.',
    })}
  >
    <a class="btn btn-primary" href={topic ? href('/practice', { mode: 'topic', topic }) : href('/practice', { mode: 'smart' })}>
      <Dumbbell size={18} />{tr({ en: 'Start practising', rw: 'Tangira imyitozo' })}
    </a>
  </EmptyState>
{:else}
  <EmptyState
    title={tr({ en: 'No questions match', rw: 'Nta kibazo gihuye n’ibyo ushaka' })}
    body={tr({ en: 'Try another word or clear the filters.', rw: 'Gerageza irindi jambo cyangwa ukureho ibyo wahisemo.' })}
  >
    <button class="btn btn-primary" onclick={clearAll}>{tr({ en: 'Clear filters', rw: 'Kuraho ibyo wahisemo' })}</button>
  </EmptyState>
{/if}
