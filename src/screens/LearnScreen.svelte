<script lang="ts">
  import ArrowRight from '@lucide/svelte/icons/arrow-right'
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw'
  import Sparkles from '@lucide/svelte/icons/sparkles'
  import Timer from '@lucide/svelte/icons/timer'
  import Mascot from '../lib/components/Mascot.svelte'
  import PageHeader from '../lib/components/PageHeader.svelte'
  import ProgressRing from '../lib/components/ProgressRing.svelte'
  import { getQuestion, QUESTIONS, QUESTIONS_BY_TOPIC } from '../lib/data'
  import { selectMistakes } from '../lib/engine/select'
  import { isDue, isMastered, MAX_BOX } from '../lib/engine/srs'
  import { overallMastery, topicStats, type TopicStats } from '../lib/engine/stats'
  import { tr } from '../lib/i18n'
  import { href } from '../lib/router.svelte'
  import { sfx } from '../lib/sound'
  import { progress } from '../lib/state/progress.svelte'
  import { TOPICS, type TopicMeta } from '../lib/topics'
  import HowItWorks from './learn/HowItWorks.svelte'
  import ModeCard from './learn/ModeCard.svelte'
  import { loadSessionSize, saveSessionSize, SESSION_SIZES, sessionMinutes, type SessionSize } from './learn/session'
  import TopicTile from './learn/TopicTile.svelte'

  let size: SessionSize = $state(loadSessionSize())
  $effect(() => saveSessionSize(size))

  /** Snapshot of "now" for due checks; the screen remounts on every navigation. */
  const now = Date.now()

  const counts = $derived.by(() => {
    let due = 0
    let unseen = 0
    let mastered = 0
    const boxes: number[] = Array.from({ length: MAX_BOX + 1 }, () => 0)
    for (const q of QUESTIONS) {
      const s = progress.q[q.id]
      if (isDue(s, now)) due++
      if (!s?.seen) unseen++
      else boxes[Math.min(Math.max(s.box, 0), MAX_BOX)]++
      if (isMastered(s)) mastered++
    }
    return {
      due,
      unseen,
      mastered,
      boxes,
      mistakes: selectMistakes(QUESTIONS, progress.q).length,
      bookmarks: progress.bookmarks.filter((id) => getQuestion(id)).length,
    }
  })

  const mastery = $derived(overallMastery(QUESTIONS, progress.q))
  const smartCount = $derived(Math.min(size, QUESTIONS.length))

  interface TopicRow {
    topic: TopicMeta
    stats: TopicStats
  }

  const topicRows: TopicRow[] = $derived(
    TOPICS.map((topic) => ({ topic, stats: topicStats(topic.id, QUESTIONS_BY_TOPIC[topic.id] ?? [], progress.q) })),
  )
  const available = $derived(topicRows.filter((r) => r.stats.total > 0))
  const comingSoon = $derived(topicRows.filter((r) => r.stats.total === 0))

  /** The weakest topic worth flagging: enough answers to judge and accuracy below 70%. */
  const weakest = $derived.by(() => {
    let worst: TopicRow | undefined
    for (const r of available) {
      const acc = r.stats.accuracy
      if (acc === null || r.stats.seen < 5 || acc >= 0.7 || r.stats.mastered === r.stats.total) continue
      if (!worst || acc < (worst.stats.accuracy ?? 1)) worst = r
    }
    return worst?.topic.id
  })
</script>

<PageHeader
  title={tr({ en: 'Learn', rw: 'Kwiga' })}
  subtitle={tr(
    { en: '{total} questions · {m} mastered', rw: 'Ibibazo {total} · {m} wamenye neza' },
    { total: QUESTIONS.length, m: counts.mastered },
  )}
>
  {#snippet actions()}
    <ProgressRing
      value={mastery}
      size={52}
      stroke={6}
      color="var(--color-leaf-500)"
      label={tr({ en: 'Overall mastery {p}%', rw: 'Ubumenyi muri rusange {p}%' }, { p: Math.round(mastery * 100) })}
    />
  {/snippet}
</PageHeader>

<!-- Session length -->
<div class="card-flat mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5">
  <div class="flex items-center gap-3 sm:flex-1">
    <span
      class="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300"
      aria-hidden="true"><Timer size={20} /></span
    >
    <div class="min-w-0">
      <p id="session-size-label" class="leading-tight font-display font-bold">
        {tr({ en: 'Questions per session', rw: 'Ibibazo kuri buri myitozo' })}
      </p>
      <p class="text-xs text-ink-muted">{tr({ en: 'About {m} min', rw: 'Nk’iminota {m}' }, { m: sessionMinutes(size) })}</p>
    </div>
  </div>
  <div role="radiogroup" aria-labelledby="session-size-label" class="grid grid-cols-4 gap-1 rounded-2xl bg-surface-2 p-1 sm:w-72">
    {#each SESSION_SIZES as s (s)}
      <label class="relative">
        <input type="radio" name="session-size" value={s} bind:group={size} onchange={() => sfx.tap()} class="peer sr-only" />
        <span
          class="block cursor-pointer rounded-xl py-2 text-center font-display font-bold text-ink-muted tabular-nums transition peer-checked:bg-surface peer-checked:text-brand-600 peer-checked:shadow-sm peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-400 hover:text-ink dark:peer-checked:bg-surface-3 dark:peer-checked:text-brand-300"
          >{s}</span
        >
      </label>
    {/each}
  </div>
</div>

<!-- Practice modes -->
<section aria-labelledby="modes-heading" class="mb-10">
  <h2 id="modes-heading" class="sr-only">{tr({ en: 'Ways to practise', rw: 'Uburyo bwo kwitoza' })}</h2>

  {#if QUESTIONS.length}
    <a
      href={href('/practice', { mode: 'smart', n: size })}
      class="group relative mb-3 block overflow-hidden rounded-4xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 pb-8 text-white shadow-lg shadow-brand-500/25 transition hover:-translate-y-0.5 hover:shadow-xl sm:p-7 sm:pb-10 dark:shadow-black/30"
    >
      <span class="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-white/10" aria-hidden="true"></span>
      <span class="pointer-events-none absolute -bottom-24 left-1/3 size-48 rounded-full bg-white/5" aria-hidden="true"></span>

      <div class="relative flex items-start gap-4 sm:items-center sm:gap-6">
        <div class="min-w-0 flex-1">
          <span class="chip bg-sun-400 text-brand-950">⭐ {tr({ en: 'Recommended', rw: 'Byiza kuri wowe' })}</span>
          <h3 class="mt-3 text-2xl leading-tight font-black sm:text-3xl">{tr({ en: 'Smart practice', rw: 'Imyitozo y’ubwenge' })}</h3>
          <p class="mt-1 max-w-md text-sm text-white/85 sm:text-base">
            {tr({
              en: 'Reviews that are due plus new questions, mixed just for you. The fastest way to learn.',
              rw: 'Ibibazo bigeze igihe cyo gusubirwamo n’ibishya, bivanze ku bwawe. Ni bwo buryo bwihuse bwo kwiga.',
            })}
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <span class="chip {counts.due ? 'bg-sun-300 text-brand-950' : 'bg-white/15 text-white'}">
              <RotateCcw size={14} aria-hidden="true" />{tr({ en: '{n} to review', rw: '{n} byo gusubiramo' }, { n: counts.due })}
            </span>
            <span class="chip bg-white/15 text-white">
              <Sparkles size={14} aria-hidden="true" />{tr({ en: '{n} new', rw: '{n} bishya' }, { n: counts.unseen })}
            </span>
          </div>
          <span class="btn btn-sun mt-5">
            {tr({ en: 'Start {n} questions', rw: 'Tangira ibibazo {n}' }, { n: smartCount })}
            <ArrowRight size={18} class="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
        <span
          class="grid size-20 shrink-0 place-items-center rounded-full bg-white/95 shadow-lg shadow-brand-900/30 sm:size-36"
          aria-hidden="true"
        >
          <Mascot size={110} mood={counts.due ? 'wow' : 'happy'} class="h-auto w-16 animate-float text-brand-950 sm:w-28" />
        </span>
      </div>
      <span class="road-stripes absolute inset-x-0 bottom-3 h-1.5 opacity-90 sm:bottom-4" aria-hidden="true"></span>
    </a>
  {/if}

  <div class="grid gap-3 sm:grid-cols-3">
    <ModeCard
      href={href('/practice', { mode: 'unseen', n: size })}
      emoji="✨"
      tone="leaf"
      title={tr({ en: 'New questions', rw: 'Ibibazo bishya' })}
      description={tr({ en: 'Fresh questions you haven’t tried yet.', rw: 'Ibibazo utarabona na rimwe.' })}
      count={counts.unseen}
      countLabel={tr({ en: 'unseen', rw: 'utarabona' })}
      emptyHint={tr({ en: 'You’ve seen every question. Impressive!', rw: 'Wabonye ibibazo byose. Ni byiza cyane!' })}
    />
    <ModeCard
      href={href('/practice', { mode: 'mistakes', n: size })}
      emoji="🩹"
      tone="flame"
      title={tr({ en: 'Fix my mistakes', rw: 'Kosora amakosa yanjye' })}
      description={tr({
        en: 'Questions you missed. Review them until they stick.',
        rw: 'Ibibazo wishe. Bisubiremo kugeza ubimenye neza.',
      })}
      count={counts.mistakes}
      countLabel={tr({ en: 'to fix', rw: 'byo gukosora' })}
      emptyHint={tr({
        en: 'No mistakes to fix right now. Wrong answers will land here.',
        rw: 'Nta makosa yo gukosora ubu. Ibyo uzica bizajya biza hano.',
      })}
    />
    <ModeCard
      href={href('/practice', { mode: 'bookmarks', n: size })}
      emoji="🔖"
      tone="sun"
      title={tr({ en: 'Bookmarks', rw: 'Ibibazo nabitse' })}
      description={tr({ en: 'Questions you saved to come back to.', rw: 'Ibibazo wabitse ngo uzabisubiremo.' })}
      count={counts.bookmarks}
      countLabel={tr({ en: 'saved', rw: 'byabitswe' })}
      emptyHint={tr({
        en: 'Tap the bookmark icon on any question to save it here.',
        rw: 'Kanda ku kimenyetso cyo kubika ku kibazo kugira ngo kize hano.',
      })}
    />
  </div>
</section>

<!-- Topics -->
<section aria-labelledby="topics-heading" class="mb-10">
  <div class="mb-4">
    <h2 id="topics-heading" class="flex items-center gap-2 text-xl font-bold sm:text-2xl">
      {tr({ en: 'Topics', rw: 'Amasomo' })}
      {#if available.length}<span class="chip font-sans">{available.length}</span>{/if}
    </h2>
    <p class="mt-0.5 text-sm text-ink-muted">
      {tr({
        en: 'Practise one part of the highway code at a time.',
        rw: 'Itoze ibice by’amategeko y’umuhanda kimwe kimwe.',
      })}
    </p>
  </div>

  {#if available.length}
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {#each available as row (row.topic.id)}
        <TopicTile topic={row.topic} stats={row.stats} {size} weak={row.topic.id === weakest} />
      {/each}
    </div>
  {/if}

  {#if comingSoon.length}
    <div class="mt-4 rounded-3xl border-2 border-dashed border-line p-4 sm:p-5">
      <p class="font-display font-bold">
        🚧 {tr({ en: 'More topics coming soon', rw: 'Andi masomo araza vuba' })}
      </p>
      <p class="mt-0.5 text-sm text-ink-muted">
        {tr({ en: 'Questions for these topics are on the way.', rw: 'Ibibazo by’aya masomo biri mu nzira.' })}
      </p>
      <ul class="mt-3 flex flex-wrap gap-2">
        {#each comingSoon as row (row.topic.id)}
          <li class="chip py-1.5 text-sm"><span aria-hidden="true">{row.topic.emoji}</span>{tr(row.topic.name)}</li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

<HowItWorks boxes={counts.boxes} />
