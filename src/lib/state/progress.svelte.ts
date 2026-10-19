import { getQuestion, QUESTIONS, QUESTIONS_BY_TOPIC, SIGN_QUESTIONS } from '../data'
import { dayKey } from '../engine/dates'
import { ACHIEVEMENTS, answerXp, examXp, isPass, levelInfo, newlyUnlocked } from '../engine/gamify'
import { review } from '../engine/srs'
import { tr, T } from '../i18n'
import { sfx } from '../sound'
import type { DayStats, ExamRecord, Progress, QState } from '../types'
import { announceAchievement, ui } from './ui.svelte'

const KEY = 'driverlearn:progress'

export function emptyProgress(): Progress {
  return { version: 1, q: {}, xp: 0, days: {}, exams: [], bookmarks: [], achievements: {}, signsLearned: [] }
}

function isProgress(v: unknown): v is Progress {
  const p = v as Progress
  return !!p && typeof p === 'object' && p.version === 1 && typeof p.q === 'object' && Array.isArray(p.exams)
}

function load(): Progress {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (isProgress(saved)) return { ...emptyProgress(), ...saved }
  } catch {
    /* corrupted storage: start fresh */
  }
  return emptyProgress()
}

/** The learner's persistent progress. Mutate only through the functions below. */
export const progress: Progress = $state(load())

let saveTimer: ReturnType<typeof setTimeout> | undefined
$effect.root(() => {
  $effect(() => {
    const json = JSON.stringify(progress)
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => localStorage.setItem(KEY, json), 150)
  })
})
addEventListener('pagehide', () => localStorage.setItem(KEY, JSON.stringify(progress)))

function today(): DayStats {
  const k = dayKey(Date.now())
  progress.days[k] ??= { xp: 0, answered: 0, correct: 0 }
  return progress.days[k]
}

function addXp(amount: number) {
  const before = levelInfo(progress.xp).level
  progress.xp += amount
  today().xp += amount
  const after = levelInfo(progress.xp).level
  if (after > before) {
    ui.levelUp = after
    sfx.levelUp()
  }
}

const topicSizes = Object.fromEntries(Object.entries(QUESTIONS_BY_TOPIC).map(([t, qs]) => [t, qs.length]))

/** Unlock any achievements whose conditions are now met and announce them. */
export function checkAchievements() {
  const now = new Date()
  const ids = newlyUnlocked({
    progress,
    today: dayKey(now.getTime()),
    totalQuestions: QUESTIONS.length,
    totalSigns: SIGN_QUESTIONS.length,
    topicSizes,
    topicOf: (id) => getQuestion(id)?.topic,
    hour: now.getHours(),
  })
  for (const id of ids) {
    progress.achievements[id] = now.getTime()
    const def = ACHIEVEMENTS.find((a) => a.id === id)!
    announceAchievement(def, `${tr(T.achievementUnlocked)}: ${tr(def.name)}`, tr(def.desc))
  }
}

export interface AnswerResult {
  correct: boolean
  xp: number
  state: QState
}

/**
 * Record a practice answer: updates spaced repetition, daily stats and XP.
 * `combo` = correct answers in a row in the current session including this one (0 if wrong).
 */
export function recordAnswer(questionId: number, chosen: number, combo: number): AnswerResult {
  const q = getQuestion(questionId)
  const correct = !!q && q.answer === chosen
  const state = review(progress.q[questionId], correct, Date.now())
  progress.q[questionId] = state
  const d = today()
  d.answered++
  if (correct) d.correct++
  const xp = answerXp(correct, combo)
  addXp(xp)
  checkAchievements()
  return { correct, xp, state }
}

/**
 * Record a finished mock exam. Every answered question also feeds spaced repetition
 * (unanswered count as wrong). Returns the stored record.
 */
export function recordExam(questions: number[], answers: (number | null)[], durationSec: number): ExamRecord {
  const now = Date.now()
  let score = 0
  questions.forEach((id, i) => {
    const q = getQuestion(id)
    const correct = !!q && answers[i] === q.answer
    if (correct) score++
    progress.q[id] = review(progress.q[id], correct, now)
  })
  const passed = isPass(score, questions.length)
  const record: ExamRecord = {
    id: now.toString(36),
    date: now,
    score,
    total: questions.length,
    passed,
    durationSec,
    questions,
    answers,
  }
  progress.exams.push(record)
  const d = today()
  d.answered += questions.length
  d.correct += score
  addXp(examXp(score, passed))
  checkAchievements()
  return record
}

export function isBookmarked(id: number): boolean {
  return progress.bookmarks.includes(id)
}

export function toggleBookmark(id: number) {
  const i = progress.bookmarks.indexOf(id)
  if (i >= 0) progress.bookmarks.splice(i, 1)
  else progress.bookmarks.push(id)
  checkAchievements()
}

export function setSignLearned(id: number, learned: boolean) {
  const i = progress.signsLearned.indexOf(id)
  if (learned && i < 0) {
    progress.signsLearned.push(id)
    addXp(2)
  }
  if (!learned && i >= 0) progress.signsLearned.splice(i, 1)
  checkAchievements()
}

export function resetProgress() {
  Object.assign(progress, emptyProgress())
  localStorage.setItem(KEY, JSON.stringify(progress))
}

export function exportProgress(): string {
  return JSON.stringify(progress)
}

/** Replace progress with an exported backup. Returns false when the JSON is not a valid backup. */
export function importProgress(json: string): boolean {
  try {
    const data = JSON.parse(json)
    if (!isProgress(data)) return false
    Object.assign(progress, emptyProgress(), data)
    return true
  } catch {
    return false
  }
}
