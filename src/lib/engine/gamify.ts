import type { DayStats, L10n, Progress } from '../types'
import { shiftDay } from './dates'
import { MASTERED_BOX } from './srs'

export const PASS_RATIO = 0.6

/** XP for one practice answer. `combo` = correct answers in a row including this one. */
export function answerXp(correct: boolean, combo: number): number {
  if (!correct) return 1
  return 10 + Math.min(Math.max(combo - 1, 0) * 2, 10)
}

export function examXp(score: number, passed: boolean): number {
  return score * 5 + (passed ? 50 : 0)
}

export function isPass(score: number, total: number): boolean {
  return total > 0 && score >= Math.ceil(total * PASS_RATIO)
}

/** Cumulative XP needed to reach `level` (level 1 starts at 0). */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) * level
}

export interface LevelInfo {
  level: number
  /** XP earned inside the current level. */
  into: number
  /** XP span of the current level. */
  span: number
  /** 0..1 progress to the next level. */
  ratio: number
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level++
  const base = xpForLevel(level)
  const span = xpForLevel(level + 1) - base
  return { level, into: xp - base, span, ratio: (xp - base) / span }
}

export interface Rank {
  min: number
  name: L10n
  emoji: string
}

export const RANKS: Rank[] = [
  { min: 1, name: { en: 'Learner', rw: 'Umunyeshuri' }, emoji: '🐣' },
  { min: 3, name: { en: 'Road rookie', rw: 'Umutangizi' }, emoji: '🚲' },
  { min: 6, name: { en: 'Sign spotter', rw: 'Uzi ibyapa' }, emoji: '🛵' },
  { min: 10, name: { en: 'Safe driver', rw: 'Umuyobozi witonda' }, emoji: '🚗' },
  { min: 15, name: { en: 'Road expert', rw: 'Inzobere y’umuhanda' }, emoji: '🚌' },
  { min: 22, name: { en: 'Highway legend', rw: 'Intwari y’umuhanda' }, emoji: '🏆' },
]

export function rankFor(level: number): Rank {
  let r = RANKS[0]
  for (const x of RANKS) if (level >= x.min) r = x
  return r
}

/** The next rank above `level`, or null at the top rank. */
export function nextRank(level: number): Rank | null {
  return RANKS.find((r) => r.min > level) ?? null
}

/**
 * Current daily streak: consecutive active days ending today, or ending yesterday when today has
 * no activity yet (the streak is not broken until a full day is missed).
 */
export function currentStreak(days: Record<string, DayStats>, today: string): number {
  const active = (k: string) => (days[k]?.answered ?? 0) > 0
  let start = active(today) ? today : shiftDay(today, -1)
  let n = 0
  while (active(start)) {
    n++
    start = shiftDay(start, -1)
  }
  return n
}

export function bestStreak(days: Record<string, DayStats>): number {
  const keys = Object.keys(days)
    .filter((k) => days[k].answered > 0)
    .sort()
  let best = 0
  let run = 0
  let prev = ''
  for (const k of keys) {
    run = prev && shiftDay(prev, 1) === k ? run + 1 : 1
    best = Math.max(best, run)
    prev = k
  }
  return best
}

export interface AchievementDef {
  id: string
  emoji: string
  name: L10n
  desc: L10n
}

export interface AchievementContext {
  progress: Progress
  today: string
  totalQuestions: number
  totalSigns: number
  /** Number of questions per topic, used for topic mastery. */
  topicSizes: Record<string, number>
  /** Topic of every question id. */
  topicOf: (id: number) => string | undefined
  /** Local hour of "now" (0-23). */
  hour: number
}

type Check = (c: AchievementContext) => boolean

const totalCorrect = (p: Progress) => Object.values(p.q).reduce((s, q) => s + q.right, 0)
const seenCount = (p: Progress) => Object.values(p.q).filter((q) => q.seen > 0).length
const passes = (p: Progress) => p.exams.filter((e) => e.passed).length

export const ACHIEVEMENTS: (AchievementDef & { check: Check })[] = [
  {
    id: 'first-step',
    emoji: '👣',
    name: { en: 'First step', rw: 'Intambwe ya mbere' },
    desc: { en: 'Answer your first question', rw: 'Subiza ikibazo cya mbere' },
    check: ({ progress }) => seenCount(progress) >= 1,
  },
  {
    id: 'ten-right',
    emoji: '✅',
    name: { en: 'Warming up', rw: 'Gushyuha' },
    desc: { en: 'Get 10 answers right', rw: 'Subiza neza ibibazo 10' },
    check: ({ progress }) => totalCorrect(progress) >= 10,
  },
  {
    id: 'hundred-right',
    emoji: '💯',
    name: { en: 'Century', rw: 'Ijana' },
    desc: { en: 'Get 100 answers right', rw: 'Subiza neza ibibazo 100' },
    check: ({ progress }) => totalCorrect(progress) >= 100,
  },
  {
    id: 'five-hundred-right',
    emoji: '🧠',
    name: { en: 'Big brain', rw: 'Umuhanga' },
    desc: { en: 'Get 500 answers right', rw: 'Subiza neza ibibazo 500' },
    check: ({ progress }) => totalCorrect(progress) >= 500,
  },
  {
    id: 'explorer',
    emoji: '🧭',
    name: { en: 'Explorer', rw: 'Umushakashatsi' },
    desc: { en: 'See half of all questions', rw: 'Bona kimwe cya kabiri cy’ibibazo byose' },
    check: ({ progress, totalQuestions }) => seenCount(progress) >= Math.ceil(totalQuestions / 2),
  },
  {
    id: 'completionist',
    emoji: '📚',
    name: { en: 'Seen it all', rw: 'Nabibonye byose' },
    desc: { en: 'Answer every question at least once', rw: 'Subiza buri kibazo nibura rimwe' },
    check: ({ progress, totalQuestions }) => seenCount(progress) >= totalQuestions,
  },
  {
    id: 'first-exam',
    emoji: '📝',
    name: { en: 'Test drive', rw: 'Igerageza' },
    desc: { en: 'Finish your first mock exam', rw: 'Rangiza ikizamini cy’igerageza cya mbere' },
    check: ({ progress }) => progress.exams.length >= 1,
  },
  {
    id: 'first-pass',
    emoji: '🎉',
    name: { en: 'Passed!', rw: 'Natsinze!' },
    desc: { en: 'Pass a mock exam', rw: 'Tsinda ikizamini cy’igerageza' },
    check: ({ progress }) => passes(progress) >= 1,
  },
  {
    id: 'hat-trick',
    emoji: '🎩',
    name: { en: 'Hat-trick', rw: 'Gatatu gakurikirana' },
    desc: { en: 'Pass 3 mock exams in a row', rw: 'Tsinda ibizamini 3 bikurikiranye' },
    check: ({ progress }) => {
      const last = progress.exams.slice(-3)
      return last.length === 3 && last.every((e) => e.passed)
    },
  },
  {
    id: 'perfect',
    emoji: '🌟',
    name: { en: 'Flawless', rw: 'Nta kosa' },
    desc: { en: 'Score 100% in a mock exam', rw: 'Gira 100% mu kizamini' },
    check: ({ progress }) => progress.exams.some((e) => e.total > 0 && e.score === e.total),
  },
  {
    id: 'streak-3',
    emoji: '🔥',
    name: { en: 'On fire', rw: 'Birashyushye' },
    desc: { en: 'Practise 3 days in a row', rw: 'Iga iminsi 3 ikurikiranye' },
    check: ({ progress, today }) => currentStreak(progress.days, today) >= 3,
  },
  {
    id: 'streak-7',
    emoji: '📅',
    name: { en: 'Week warrior', rw: 'Icyumweru cyose' },
    desc: { en: 'Practise 7 days in a row', rw: 'Iga iminsi 7 ikurikiranye' },
    check: ({ progress, today }) => currentStreak(progress.days, today) >= 7,
  },
  {
    id: 'streak-30',
    emoji: '🏅',
    name: { en: 'Unstoppable', rw: 'Ntawe unsubiza inyuma' },
    desc: { en: 'Practise 30 days in a row', rw: 'Iga iminsi 30 ikurikiranye' },
    check: ({ progress, today }) => currentStreak(progress.days, today) >= 30,
  },
  {
    id: 'topic-master',
    emoji: '🎯',
    name: { en: 'Topic master', rw: 'Inzobere mu isomo' },
    desc: { en: 'Master every question of one topic', rw: 'Menya neza ibibazo byose by’isomo rimwe' },
    check: ({ progress, topicSizes, topicOf }) => {
      const mastered: Record<string, number> = {}
      for (const [id, s] of Object.entries(progress.q)) {
        if (s.box < MASTERED_BOX) continue
        const t = topicOf(Number(id))
        if (t) mastered[t] = (mastered[t] ?? 0) + 1
      }
      return Object.entries(topicSizes).some(([t, size]) => size > 0 && (mastered[t] ?? 0) >= size)
    },
  },
  {
    id: 'sign-reader',
    emoji: '🪧',
    name: { en: 'Sign reader', rw: 'Usoma ibyapa' },
    desc: { en: 'Learn every road sign in the Signs trainer', rw: 'Menya ibyapa byose' },
    check: ({ progress, totalSigns }) => totalSigns > 0 && progress.signsLearned.length >= totalSigns,
  },
  {
    id: 'night-owl',
    emoji: '🦉',
    name: { en: 'Night owl', rw: 'Igihunyira' },
    desc: { en: 'Study after 10 pm', rw: 'Iga nyuma ya saa yine z’ijoro' },
    check: ({ hour, progress }) => hour >= 22 && seenCount(progress) > 0,
  },
  {
    id: 'early-bird',
    emoji: '🐦',
    name: { en: 'Early bird', rw: 'Uzinduka' },
    desc: { en: 'Study before 7 am', rw: 'Iga mbere ya saa moya za mu gitondo' },
    check: ({ hour, progress }) => hour < 7 && seenCount(progress) > 0,
  },
  {
    id: 'collector',
    emoji: '🔖',
    name: { en: 'Collector', rw: 'Ukusanya' },
    desc: { en: 'Bookmark 10 questions', rw: 'Bika ibibazo 10' },
    check: ({ progress }) => progress.bookmarks.length >= 10,
  },
]

/** Ids of achievements whose condition holds now but are not unlocked yet. */
export function newlyUnlocked(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS.filter((a) => !ctx.progress.achievements[a.id] && a.check(ctx)).map((a) => a.id)
}
