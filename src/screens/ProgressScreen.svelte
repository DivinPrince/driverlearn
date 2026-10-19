<script lang="ts">
  import PageHeader from '../lib/components/PageHeader.svelte'
  import StatTile from '../lib/components/StatTile.svelte'
  import { QUESTIONS } from '../lib/data'
  import { dayKey } from '../lib/engine/dates'
  import { bestStreak, currentStreak } from '../lib/engine/gamify'
  import { isMastered } from '../lib/engine/srs'
  import { readiness } from '../lib/engine/stats'
  import { tr, T } from '../lib/i18n'
  import { progress } from '../lib/state/progress.svelte'
  import { settings } from '../lib/state/settings.svelte'
  import { ui } from '../lib/state/ui.svelte'
  import AchievementGrid from './progress/AchievementGrid.svelte'
  import ActivityHeatmap from './progress/ActivityHeatmap.svelte'
  import ExamHistory from './progress/ExamHistory.svelte'
  import { formatNumber, percent } from './progress/format'
  import LevelCard from './progress/LevelCard.svelte'
  import ReadinessCard from './progress/ReadinessCard.svelte'
  import TopicMastery from './progress/TopicMastery.svelte'
  import WeekChart from './progress/WeekChart.svelte'

  const today = dayKey(Date.now())
  const total = QUESTIONS.length

  const seen = $derived(QUESTIONS.filter((q) => progress.q[q.id]?.seen).length)
  const mastered = $derived(QUESTIONS.filter((q) => isMastered(progress.q[q.id])).length)
  const answers = $derived.by(() => {
    let right = 0
    let all = 0
    for (const s of Object.values(progress.q)) {
      right += s.right
      all += s.seen
    }
    return { right, all }
  })
  const accuracy = $derived(answers.all ? answers.right / answers.all : null)

  const streak = $derived(currentStreak(progress.days, today))
  const best = $derived(Math.max(bestStreak(progress.days), streak))
  const practisedToday = $derived((progress.days[today]?.answered ?? 0) > 0)

  const examsPassed = $derived(progress.exams.filter((e) => e.passed).length)
  const ready = $derived(readiness(QUESTIONS, progress.q, progress.exams))
  const goal = $derived(Math.max(1, settings.dailyGoal))
</script>

<PageHeader
  title={tr(T.progress)}
  subtitle={tr({ en: 'Every question brings you closer to your licence.', rw: 'Buri kibazo kikwegereza uruhushya rwawe.' })}
/>

<div class="flex flex-col gap-4 sm:gap-5">
  <!-- Level + readiness -->
  <div class="grid gap-4 sm:gap-5 md:grid-cols-5">
    <div class="md:col-span-3"><LevelCard
        xp={progress.xp}
        xpToday={progress.days[today]?.xp ?? 0}
        answeredToday={progress.days[today]?.answered ?? 0}
        {goal}
      /></div>
    <div class="md:col-span-2"><ReadinessCard value={ready} examCount={progress.exams.length} totalQuestions={total} /></div>
  </div>

  <!-- Headline numbers -->
  <h2 class="sr-only">{tr({ en: 'Summary', rw: 'Incamake' })}</h2>
  <!-- On phones the shared StatTile stacks its badge above the text so Kinyarwanda labels have room to wrap. -->
  <div
    class="grid grid-cols-2 gap-3 sm:grid-cols-3 max-sm:[&_.truncate]:whitespace-normal max-sm:[&>*]:flex-col max-sm:[&>*]:items-start max-sm:[&>*]:gap-2.5"
  >
    <StatTile
      emoji="👀"
      value="{formatNumber(seen)}/{formatNumber(total)}"
      label={tr({ en: 'Questions seen', rw: 'Ibibazo wabonye' })}
      hint={tr({ en: '{p}% of the bank', rw: '{p}% by’ibibazo byose' }, { p: percent(total ? seen / total : 0) })}
    />
    <StatTile
      emoji="⭐"
      tone="bg-sun-100 dark:bg-sun-600/25"
      value={formatNumber(mastered)}
      label={tr(T.mastered)}
      hint={tr({ en: '{p}% of the bank', rw: '{p}% by’ibibazo byose' }, { p: percent(total ? mastered / total : 0) })}
    />
    <StatTile
      emoji="🎯"
      tone="bg-leaf-100 dark:bg-leaf-700/30"
      value={accuracy === null ? '—' : `${percent(accuracy)}%`}
      label={tr({ en: 'Accuracy', rw: 'Ukuri' })}
      hint={accuracy === null
        ? tr({ en: 'No answers yet', rw: 'Nta bisubizo biratangwa' })
        : tr({ en: '{c} of {n} right', rw: '{c} kuri {n} ni byo' }, { c: formatNumber(answers.right), n: formatNumber(answers.all) })}
    />
    <StatTile
      emoji="🔥"
      tone="bg-orange-100 dark:bg-orange-500/20"
      value={streak}
      label={tr(T.streak)}
      hint={practisedToday
        ? tr({ en: 'Done for today ✓', rw: 'Wize uyu munsi ✓' })
        : streak > 0
          ? tr({ en: 'Practise today to keep it', rw: 'Iga uyu munsi uyikomeze' })
          : tr({ en: 'Start one today!', rw: 'Tangira uyu munsi!' })}
    />
    <StatTile
      emoji="🏆"
      tone="bg-grape-100 dark:bg-grape-500/25"
      value={best}
      label={tr({ en: 'Best streak', rw: 'Agahigo k’iminsi' })}
      hint={tr({ en: 'days in a row', rw: 'iminsi ikurikiranye' })}
    />
    <StatTile
      emoji="📝"
      tone="bg-flame-100 dark:bg-flame-700/30"
      value="{examsPassed}/{progress.exams.length}"
      label={tr({ en: 'Mock exams passed', rw: 'Ibizamini watsinze' })}
      hint={progress.exams.length
        ? tr({ en: '{p}% pass rate', rw: 'Watsinze {p}%' }, { p: percent(examsPassed / progress.exams.length) })
        : tr({ en: 'None taken yet', rw: 'Nta na kimwe urakora' })}
    />
  </div>

  <!-- Activity -->
  <div class="grid gap-4 sm:gap-5 lg:grid-cols-5">
    <div class="lg:col-span-3"><ActivityHeatmap days={progress.days} {today} {goal} /></div>
    <div class="lg:col-span-2"><WeekChart days={progress.days} {today} {goal} /></div>
  </div>

  <ExamHistory exams={progress.exams} />

  <TopicMastery states={progress.q} />

  <AchievementGrid unlocked={progress.achievements} fresh={ui.freshAchievements} />
</div>
