<script lang="ts">
  import Zap from '@lucide/svelte/icons/zap'
  import { levelInfo, rankFor } from '../../lib/engine/gamify'
  import { tr, T } from '../../lib/i18n'
  import { formatNumber } from './format'

  interface Props {
    xp: number
    /** XP earned today. */
    xpToday: number
    /** Questions answered today. */
    answeredToday: number
    /** Daily goal in questions. */
    goal: number
  }

  let { xp, xpToday, answeredToday, goal }: Props = $props()

  const level = $derived(levelInfo(xp))
  const rank = $derived(rankFor(level.level))

  /** The next rank and the level it unlocks at (null when already at the top rank). */
  const nextRank = $derived.by(() => {
    for (let l = level.level + 1; l <= level.level + 60; l++) {
      const r = rankFor(l)
      if (r !== rank) return { level: l, rank: r }
    }
    return null
  })

  const toNext = $derived(level.span - level.into)
  const goalRatio = $derived(Math.min(answeredToday / goal, 1))
  const goalDone = $derived(answeredToday >= goal)
</script>

<section
  class="relative flex h-full flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-lg shadow-brand-700/20 sm:p-6 dark:from-brand-700 dark:to-brand-900 dark:shadow-none"
  aria-labelledby="level-title"
>
  <!-- decorative glow -->
  <div class="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-white/10" aria-hidden="true"></div>

  <div class="relative flex items-center gap-4">
    <div
      class="grid size-20 shrink-0 animate-float place-items-center rounded-3xl bg-white/15 text-5xl ring-2 ring-white/25 sm:size-24 sm:text-6xl"
      aria-hidden="true"
    >
      {rank.emoji}
    </div>
    <div class="min-w-0">
      <p class="text-xs font-extrabold tracking-[0.12em] text-white/75 uppercase">{tr(T.level)} {level.level}</p>
      <h2 id="level-title" class="mt-0.5 text-2xl leading-tight font-black sm:text-3xl">{tr(rank.name)}</h2>
      <p class="mt-1 flex items-center gap-1 font-display text-sm font-semibold text-sun-200">
        <Zap size={15} fill="currentColor" aria-hidden="true" />
        {tr({ en: '{n} XP in total', rw: 'XP zose hamwe: {n}' }, { n: formatNumber(xp) })}
      </p>
    </div>
  </div>

  <div class="relative mt-6">
    <div class="mb-1.5 flex items-baseline justify-between gap-3 text-sm font-bold">
      <span>{tr(T.level)} {level.level + 1}</span>
      <span class="font-display text-white/80 tabular-nums">{formatNumber(level.into)} / {formatNumber(level.span)} XP</span>
    </div>
    <div
      class="h-3.5 overflow-hidden rounded-full bg-white/20"
      role="progressbar"
      aria-label={tr({ en: 'Progress to the next level', rw: 'Aho ugeze ugana ku rwego rukurikira' })}
      aria-valuemin={0}
      aria-valuemax={level.span}
      aria-valuenow={level.into}
    >
      <div
        class="h-full rounded-full bg-gradient-to-r from-sun-300 to-sun-400 transition-[width] duration-700 ease-out"
        style:width="{Math.max(level.ratio * 100, level.into > 0 ? 3 : 0)}%"
      ></div>
    </div>
    <p class="mt-2 text-sm text-white/85">
      {tr({ en: '{n} XP to reach level {l}', rw: 'Usigaje XP {n} ngo ugere ku rwego rwa {l}' }, { n: formatNumber(toNext), l: level.level + 1 })}
    </p>
  </div>

  <!-- today -->
  <div class="relative mt-5 grid grid-cols-2 gap-3">
    <div class="rounded-2xl bg-white/10 px-3.5 py-3">
      <p class="text-xs font-bold text-white/75">{tr({ en: 'XP today', rw: 'XP z’uyu munsi' })}</p>
      <p class="mt-0.5 font-display text-2xl leading-tight font-black">+{formatNumber(xpToday)}</p>
    </div>
    <div class="rounded-2xl bg-white/10 px-3.5 py-3">
      <p class="flex items-center justify-between gap-2 text-xs font-bold text-white/75">
        {tr(T.dailyGoal)}
        {#if goalDone}<span class="rounded-full bg-leaf-500 px-1.5 text-[10px] leading-4 font-black text-white">✓</span>{/if}
      </p>
      <p class="mt-0.5 font-display text-2xl leading-tight font-black">
        {answeredToday}<span class="text-base font-bold text-white/70">/{goal}</span>
      </p>
      <div
        class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20"
        role="progressbar"
        aria-label={tr(T.dailyGoal)}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(answeredToday, goal)}
      >
        <div
          class="h-full rounded-full transition-[width] duration-700 {goalDone ? 'bg-leaf-400' : 'bg-sun-400'}"
          style:width="{goalRatio * 100}%"
        ></div>
      </div>
    </div>
  </div>

  <div class="relative mt-auto pt-5">
    {#if nextRank}
      <p class="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-semibold">
        <span class="text-xl" aria-hidden="true">{nextRank.rank.emoji}</span>
        <span class="min-w-0">
          {tr({ en: 'Next rank: {r} at level {l}', rw: 'Intera ikurikira: {r} ku rwego rwa {l}' }, { r: tr(nextRank.rank.name), l: nextRank.level })}
        </span>
      </p>
    {:else}
      <p class="rounded-2xl bg-white/10 px-3 py-2 text-sm font-semibold">
        🏁 {tr({ en: 'Top rank reached — legendary!', rw: 'Wageze ku ntera yo hejuru — uri intwari!' })}
      </p>
    {/if}
  </div>

  <!-- road decoration -->
  <div class="absolute inset-x-0 bottom-0 h-1.5 bg-brand-950/30" aria-hidden="true">
    <div class="road-stripes mx-auto mt-[3px] h-[2px] w-full opacity-70"></div>
  </div>
</section>
