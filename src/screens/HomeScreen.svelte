<script lang="ts">
  import { burst } from '../lib/celebrate'
  import { dayKey } from '../lib/engine/dates'
  import { currentStreak } from '../lib/engine/gamify'
  import { progress } from '../lib/state/progress.svelte'
  import { settings } from '../lib/state/settings.svelte'
  import AchievementsCard from './home/AchievementsCard.svelte'
  import DailyGoalCard from './home/DailyGoalCard.svelte'
  import HeroCard from './home/HeroCard.svelte'
  import LastExamCard from './home/LastExamCard.svelte'
  import QuickActions from './home/QuickActions.svelte'
  import ReadinessCard from './home/ReadinessCard.svelte'
  import StreakCard from './home/StreakCard.svelte'
  import TopicsStrip from './home/TopicsStrip.svelte'

  /** Ticks every minute so the greeting, "today" and due counts stay fresh on a long-open tab. */
  let now = $state(Date.now())
  $effect(() => {
    const t = setInterval(() => (now = Date.now()), 60_000)
    return () => clearInterval(t)
  })

  const today = $derived(dayKey(now))
  const todayStats = $derived(progress.days[today])
  const answeredToday = $derived(todayStats?.answered ?? 0)
  const goal = $derived(Math.max(1, settings.dailyGoal))
  const goalMet = $derived(answeredToday >= goal)
  const streak = $derived(currentStreak(progress.days, today))
  const firstTime = $derived(progress.exams.length === 0 && !Object.values(progress.q).some((s) => s.seen > 0))

  /** A small confetti burst the first time Home is opened after the daily goal is met (once per day). */
  const CELEBRATED_KEY = 'driverlearn:home-goal-celebrated'
  $effect(() => {
    if (!goalMet) return
    const key = today
    try {
      if (localStorage.getItem(CELEBRATED_KEY) === key) return
      localStorage.setItem(CELEBRATED_KEY, key)
    } catch {
      return
    }
    const t = setTimeout(() => burst(0.5, 0.3), 450)
    return () => clearTimeout(t)
  })
</script>

<div class="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
  <div class="col-span-2">
    <HeroCard {now} {firstTime} todayAnswered={answeredToday} {goal} {streak} />
  </div>
  <div class="col-span-2 sm:col-span-1">
    <DailyGoalCard answered={answeredToday} {goal} xpToday={todayStats?.xp ?? 0} />
  </div>
  <div class="col-span-2 sm:col-span-1">
    <StreakCard {today} />
  </div>
  <div class="col-span-1">
    <ReadinessCard />
  </div>
  <div class="col-span-1">
    <LastExamCard {now} />
  </div>
  <div class="col-span-2 mt-2 lg:col-span-3">
    <QuickActions {now} />
  </div>
  <div class="col-span-2 lg:col-span-3">
    <TopicsStrip />
  </div>
  <div class="col-span-2 lg:col-span-3">
    <AchievementsCard {now} />
  </div>
</div>
