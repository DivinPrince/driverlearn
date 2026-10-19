<script lang="ts">
  import BookOpen from '@lucide/svelte/icons/book-open'
  import ChartColumn from '@lucide/svelte/icons/chart-column'
  import ClipboardCheck from '@lucide/svelte/icons/clipboard-check'
  import Flame from '@lucide/svelte/icons/flame'
  import GraduationCap from '@lucide/svelte/icons/graduation-cap'
  import House from '@lucide/svelte/icons/house'
  import Library from '@lucide/svelte/icons/library'
  import Settings from '@lucide/svelte/icons/settings'
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert'
  import type { Component } from 'svelte'
  import { dayKey } from './lib/engine/dates'
  import { currentStreak, levelInfo } from './lib/engine/gamify'
  import LevelUp from './lib/components/LevelUp.svelte'
  import Toasts from './lib/components/Toasts.svelte'
  import { tr, T } from './lib/i18n'
  import { href, route } from './lib/router.svelte'
  import { progress } from './lib/state/progress.svelte'
  import { settings } from './lib/state/settings.svelte'
  import type { L10n } from './lib/types'
  import ExamIntro from './screens/exam/ExamIntro.svelte'
  import ExamResult from './screens/exam/ExamResult.svelte'
  import ExamRun from './screens/exam/ExamRun.svelte'
  import HomeScreen from './screens/HomeScreen.svelte'
  import LearnScreen from './screens/LearnScreen.svelte'
  import LibraryScreen from './screens/LibraryScreen.svelte'
  import Onboarding from './screens/Onboarding.svelte'
  import PracticeScreen from './screens/PracticeScreen.svelte'
  import ProgressScreen from './screens/ProgressScreen.svelte'
  import QuestionScreen from './screens/QuestionScreen.svelte'
  import SettingsScreen from './screens/SettingsScreen.svelte'
  import SignsScreen from './screens/SignsScreen.svelte'

  interface NavItem {
    path: string
    label: L10n
    icon: Component<{ size?: number; strokeWidth?: number }>
    /** Shown in the mobile bottom bar. */
    mobile: boolean
  }

  const NAV: NavItem[] = [
    { path: '/', label: T.home, icon: House, mobile: true },
    { path: '/learn', label: T.learn, icon: GraduationCap, mobile: true },
    { path: '/exam', label: T.exam, icon: ClipboardCheck, mobile: true },
    { path: '/signs', label: T.signs, icon: TriangleAlert, mobile: true },
    { path: '/progress', label: T.progress, icon: ChartColumn, mobile: true },
    { path: '/library', label: T.library, icon: Library, mobile: false },
    { path: '/settings', label: T.settings, icon: Settings, mobile: false },
  ]

  /** Screens that take over the full viewport (no navigation chrome). */
  const focused = $derived(route.path === '/practice' || route.path === '/exam/run')

  const screen = $derived.by((): Component => {
    const [a, b] = route.parts
    switch (a) {
      case undefined:
        return HomeScreen
      case 'learn':
        return LearnScreen
      case 'practice':
        return PracticeScreen
      case 'exam':
        return b === 'run' ? ExamRun : b === 'result' ? ExamResult : ExamIntro
      case 'signs':
        return SignsScreen
      case 'library':
        return LibraryScreen
      case 'q':
        return QuestionScreen
      case 'progress':
        return ProgressScreen
      case 'settings':
        return SettingsScreen
      default:
        return HomeScreen
    }
  })

  function active(path: string) {
    if (path === '/') return route.path === '/'
    return route.path === path || route.path.startsWith(`${path}/`)
  }

  const streak = $derived(currentStreak(progress.days, dayKey(Date.now())))
  const level = $derived(levelInfo(progress.xp))
</script>

<Toasts />
<LevelUp />
{#if !settings.onboarded}
  <Onboarding />
{/if}

{#if focused}
  <main
    class="mx-auto min-h-dvh w-full px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-10 sm:px-6 {route.path === '/exam/run'
      ? 'max-w-6xl'
      : 'max-w-3xl'}"
  >
    {#key route.key}
      {@const Screen = screen}
      <Screen />
    {/key}
  </main>
{:else}
  <div class="lg:flex">
    <!-- Desktop sidebar -->
    <aside class="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
      <a href={href('/')} class="mb-8 flex items-center gap-3 px-2">
        <img src="/favicon.svg" alt="" class="size-10" />
        <span class="font-display text-xl font-black tracking-tight">Driver<span class="text-brand-500">Learn</span></span>
      </a>
      <nav class="flex flex-1 flex-col gap-1" aria-label="Main">
        {#each NAV as item (item.path)}
          {@const Icon = item.icon}
          <a
            href={href(item.path)}
            class="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-display font-semibold transition {active(item.path)
              ? 'bg-brand-50 text-brand-600 ring-2 ring-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:ring-brand-800'
              : 'text-ink-muted hover:bg-surface-2 hover:text-ink'}"
            aria-current={active(item.path) ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={2.2} />
            {tr(item.label)}
          </a>
        {/each}
      </nav>
      <div class="rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
        <p class="text-xs font-bold opacity-80">{tr(T.level)} {level.level}</p>
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
          <div class="h-full rounded-full bg-sun-400 transition-[width] duration-500" style:width="{level.ratio * 100}%"></div>
        </div>
        <p class="mt-2 text-xs opacity-80">{level.into} / {level.span} XP</p>
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <!-- Mobile top bar -->
      <header
        class="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-bg/85 px-4 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2.5 backdrop-blur-lg lg:hidden"
      >
        <a href={href('/')} class="flex min-w-0 flex-1 items-center gap-2" aria-label="DriverLearn">
          <img src="/favicon.svg" alt="" class="size-8 shrink-0" />
          <span class="truncate font-display text-lg font-black tracking-tight max-[400px]:hidden">Driver<span class="text-brand-500">Learn</span></span>
        </a>
        <a href={href('/progress')} class="chip shrink-0 text-sm whitespace-nowrap" aria-label={tr(T.streak)}>
          <Flame size={16} class={streak > 0 ? 'text-orange-500' : ''} />{streak}
        </a>
        <a href={href('/progress')} class="chip shrink-0 text-sm whitespace-nowrap text-sun-600 dark:text-sun-300" aria-label={tr(T.xp)}>⚡ {progress.xp}</a>
        <a href={href('/library')} class="btn btn-ghost btn-icon btn-sm" aria-label={tr(T.library)}><BookOpen size={20} /></a>
        <a href={href('/settings')} class="btn btn-ghost btn-icon btn-sm" aria-label={tr(T.settings)}><Settings size={20} /></a>
      </header>

      <main class="mx-auto w-full max-w-5xl px-4 pt-5 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
        {#key route.key}
          {@const Screen = screen}
          <div class="animate-rise">
            <Screen />
          </div>
        {/key}
      </main>
    </div>

    <!-- Mobile bottom navigation -->
    <nav
      class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 px-1 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden"
      aria-label="Main"
    >
      {#each NAV.filter((n) => n.mobile) as item (item.path)}
        {@const Icon = item.icon}
        <a
          href={href(item.path)}
          class="flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[0.7rem] font-bold transition {active(item.path)
            ? 'text-brand-600 dark:text-brand-300'
            : 'text-ink-faint'}"
          aria-current={active(item.path) ? 'page' : undefined}
        >
          <span class="grid h-8 w-12 place-items-center rounded-full transition {active(item.path) ? 'bg-brand-100 dark:bg-brand-900/60' : ''}">
            <Icon size={22} strokeWidth={active(item.path) ? 2.6 : 2.1} />
          </span>
          <span class="max-w-full truncate px-1">{tr(item.label)}</span>
        </a>
      {/each}
    </nav>
  </div>
{/if}
