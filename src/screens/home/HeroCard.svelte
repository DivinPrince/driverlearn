<script lang="ts">
  import ClipboardCheck from '@lucide/svelte/icons/clipboard-check'
  import Play from '@lucide/svelte/icons/play'
  import Rocket from '@lucide/svelte/icons/rocket'
  import Mascot from '../../lib/components/Mascot.svelte'
  import { levelInfo, rankFor } from '../../lib/engine/gamify'
  import { tr, T } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import { progress } from '../../lib/state/progress.svelte'
  import { dayPart, GREETINGS, longDate, num, questionsCount } from './format'

  interface Props {
    now: number
    /** Nothing answered and no exam taken yet. */
    firstTime: boolean
    todayAnswered: number
    goal: number
    streak: number
  }

  let { now, firstTime, todayAnswered, goal, streak }: Props = $props()

  const level = $derived(levelInfo(progress.xp))
  const rank = $derived(rankFor(level.level))
  const greeting = $derived(GREETINGS[dayPart(new Date(now).getHours())])
  const goalMet = $derived(todayAnswered >= goal)
  const remaining = $derived(Math.max(goal - todayAnswered, 0))

  const subtitle = $derived.by(() => {
    if (firstTime)
      return tr({
        en: 'I’m Kago, your driving buddy. Let’s learn the rules of the road together, one small lesson at a time.',
        rw: 'Ndi Kago, mugenzi wawe mu kwiga gutwara. Reka twige amategeko y’umuhanda hamwe, buhoro buhoro.',
      })
    if (goalMet) return tr({ en: 'Daily goal reached. You’re on a roll! 🎉', rw: 'Wageze ku ntego y’uyu munsi. Komereza aho! 🎉' })
    if (todayAnswered > 0)
      return tr(
        { en: 'Just {q} away from today’s goal. You’ve got this!', rw: 'Usigaje {q} gusa ngo ugere ku ntego y’uyu munsi. Urabishoboye!' },
        { q: questionsCount(remaining) },
      )
    if (streak > 0)
      return tr(
        { en: 'Practise today to keep your {n}-day streak alive!', rw: 'Itoze uyu munsi kugira ngo iminsi {n} ikurikiranye idacika!' },
        { n: streak },
      )
    return tr({
      en: 'Welcome back! A few questions a day makes a big difference.',
      rw: 'Urakaza neza! Ibibazo bike buri munsi bigira akamaro kanini.',
    })
  })
</script>

<section
  class="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-5 pb-9 text-white shadow-[0_10px_30px_-12px_rgb(11_125_193/0.6)] sm:p-7 sm:pb-11 dark:from-brand-700 dark:via-brand-800 dark:to-brand-950 dark:shadow-none"
  aria-labelledby="home-greeting"
>
  <!-- Decorative rings -->
  <div class="pointer-events-none absolute -top-28 -right-24 size-80 rounded-full bg-white/6" aria-hidden="true"></div>
  <div class="pointer-events-none absolute -top-14 -right-10 size-52 rounded-full bg-white/8" aria-hidden="true"></div>

  <div class="relative flex items-start gap-3">
    <div class="min-w-0 flex-1">
      <p class="text-xs font-extrabold tracking-wide text-white/75 uppercase">{longDate(now)}</p>
      <h1 id="home-greeting" class="mt-1 text-3xl font-black sm:text-4xl">{tr(greeting)}</h1>
      <p class="mt-1.5 max-w-md text-[0.95rem] leading-snug font-semibold text-white/90">{subtitle}</p>
    </div>
    <div class="relative -mr-1 shrink-0 sm:mr-0" aria-hidden="true">
      <div
        class="absolute top-1/2 left-1/2 size-22 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sun-300 shadow-[0_0_0_8px_rgb(255_255_255/0.14)] sm:size-28 dark:bg-sun-400"
      ></div>
      <Mascot size={132} mood={goalMet ? 'wow' : 'happy'} class="relative h-auto w-26 animate-float text-brand-950 sm:w-33" />
    </div>
  </div>

  <!-- Rank, level and XP -->
  <div class="relative mt-5 rounded-3xl bg-white/12 p-3.5 ring-1 ring-white/20 dark:bg-white/8">
    <div class="flex items-center gap-3">
      <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-brand-50" aria-hidden="true"
        >{rank.emoji}</span
      >
      <div class="min-w-0 flex-1">
        <p class="truncate font-display text-lg leading-tight font-bold">{tr(rank.name)}</p>
        <p class="text-xs font-bold text-white/75">{tr(T.level)} {level.level} · ⚡ {num(progress.xp)} XP</p>
      </div>
    </div>
    <div
      class="mt-3 h-3 overflow-hidden rounded-full bg-white/20"
      role="progressbar"
      aria-label={tr({ en: 'Progress to level {n}', rw: 'Aho ugeze ugana ku rwego {n}' }, { n: level.level + 1 })}
      aria-valuemin={0}
      aria-valuemax={level.span}
      aria-valuenow={level.into}
    >
      <div
        class="h-full rounded-full bg-gradient-to-r from-sun-300 to-sun-400 transition-[width] duration-700 ease-out"
        style:width="{Math.max(level.ratio * 100, level.into > 0 ? 3 : 0)}%"
      ></div>
    </div>
    <p class="mt-1.5 flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-xs font-bold text-white/80">
      <span class="tabular-nums">{num(level.into)} / {num(level.span)} XP</span>
      <span>
        {tr({ en: '{xp} XP to level {n}', rw: 'XP {xp} ngo ugere ku rwego {n}' }, { xp: num(level.span - level.into), n: level.level + 1 })}
      </span>
    </p>
  </div>

  <!-- Calls to action -->
  <div class="relative mt-5 flex flex-col gap-3 sm:flex-row">
    {#if firstTime}
      <a class="btn btn-sun btn-lg flex-1" href={href('/practice', { mode: 'smart', n: 10 })}>
        <Rocket size={20} strokeWidth={2.4} />{tr({ en: 'Start your first lesson', rw: 'Tangira isomo rya mbere' })}
      </a>
    {:else}
      <a class="btn btn-sun btn-lg flex-1" href={href('/practice', { mode: 'smart' })}>
        <Play size={20} strokeWidth={2.4} fill="currentColor" />{tr({ en: 'Continue learning', rw: 'Komeza kwiga' })}
      </a>
    {/if}
    <a
      class="btn btn-lg bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25 sm:min-w-44"
      style:--edge="rgb(6 40 66 / 0.45)"
      href={href('/exam')}
    >
      <ClipboardCheck size={20} strokeWidth={2.4} />{tr(T.exam)}
    </a>
  </div>

  <!-- Road -->
  <div class="absolute inset-x-0 bottom-0 h-4 bg-brand-950/40" aria-hidden="true">
    <div class="road-stripes absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 opacity-90"></div>
  </div>
</section>
