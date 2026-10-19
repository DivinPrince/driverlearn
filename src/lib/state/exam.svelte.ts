import { getQuestion, QUESTIONS } from '../data'
import { selectExam } from '../engine/select'
import { recordExam } from './progress.svelte'
import { settings } from './settings.svelte'

const KEY = 'driverlearn:exam'

/** A mock exam that is currently being sat. Persisted so a refresh resumes it. */
export interface ExamSession {
  /** Question ids, in exam order. */
  questions: number[]
  /** Chosen option index per question, or null when not answered yet. */
  answers: (number | null)[]
  /** "Come back to this one" markers per question. */
  flagged: boolean[]
  /** Index of the question on screen. */
  current: number
  /** Epoch ms when the exam started (the timer is wall-clock based). */
  startedAt: number
  /** Time limit in seconds. */
  limitSec: number
}

function isSession(v: unknown): v is ExamSession {
  const s = v as ExamSession
  if (!s || typeof s !== 'object') return false
  if (!Array.isArray(s.questions) || !Array.isArray(s.answers) || !Array.isArray(s.flagged)) return false
  const n = s.questions.length
  return (
    n > 0 &&
    s.answers.length === n &&
    s.flagged.length === n &&
    s.questions.every((id) => typeof id === 'number' && !!getQuestion(id)) &&
    s.answers.every((a) => a === null || (typeof a === 'number' && Number.isInteger(a))) &&
    typeof s.current === 'number' &&
    typeof s.startedAt === 'number' &&
    typeof s.limitSec === 'number' &&
    s.limitSec > 0
  )
}

function load(): ExamSession | null {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (isSession(saved)) return { ...saved, current: clampIndex(saved.current, saved.questions.length) }
  } catch {
    /* corrupted storage: no exam in progress */
  }
  return null
}

function clampIndex(i: number, n: number): number {
  return Math.max(0, Math.min(n - 1, Math.trunc(i) || 0))
}

function persist() {
  try {
    if (exam.active) localStorage.setItem(KEY, JSON.stringify(exam.active))
    else localStorage.removeItem(KEY)
  } catch {
    /* storage full or unavailable: the exam still works for this page load */
  }
}

/**
 * Exam state. `active` is the exam in progress (or null). `justFinished` holds the id of the
 * exam submitted during this page load so the result screen celebrates it only once.
 */
export const exam: { active: ExamSession | null; justFinished: string | null } = $state({
  active: load(),
  justFinished: null,
})

$effect.root(() => {
  $effect(() => {
    // Track deeply so every answer / flag / navigation is saved right away.
    void JSON.stringify(exam.active)
    persist()
  })
})
addEventListener('pagehide', persist)

// Keep several open tabs in sync (the last write wins).
addEventListener('storage', (e) => {
  if (e.key === KEY) exam.active = load()
})

/** Start a fresh mock exam in the official format chosen in Settings. Replaces any exam in progress. */
export function startExam(): ExamSession {
  const questions = selectExam(QUESTIONS, settings.examSize).map((q) => q.id)
  const session: ExamSession = {
    questions,
    answers: questions.map(() => null),
    flagged: questions.map(() => false),
    current: 0,
    startedAt: Date.now(),
    limitSec: Math.max(1, Math.round(settings.examMinutes * 60)),
  }
  exam.active = session
  exam.justFinished = null
  return session
}

/** Choose an option for a question (defaults to the one on screen). */
export function answer(option: number | null, index = exam.active?.current ?? 0) {
  const s = exam.active
  if (!s || index < 0 || index >= s.questions.length) return
  s.answers[index] = option
}

/** Toggle the review flag of a question (defaults to the one on screen). */
export function toggleFlag(index = exam.active?.current ?? 0) {
  const s = exam.active
  if (!s || index < 0 || index >= s.questions.length) return
  s.flagged[index] = !s.flagged[index]
}

/** Jump to a question by index (clamped to the exam). */
export function goTo(index: number) {
  const s = exam.active
  if (!s) return
  s.current = clampIndex(index, s.questions.length)
}

/** Seconds since the exam started, never more than the limit. */
export function elapsedSec(s: ExamSession, now = Date.now()): number {
  return Math.max(0, Math.min(s.limitSec, Math.round((now - s.startedAt) / 1000)))
}

/** Seconds left on the clock (0 when time is up). */
export function remainingSec(s: ExamSession, now = Date.now()): number {
  return Math.max(0, Math.ceil(s.limitSec - (now - s.startedAt) / 1000))
}

/** Finish the exam: score it, store the ExamRecord, clear the session. Returns the record id. */
export function submit(): string | null {
  const s = exam.active
  if (!s) return null
  const record = recordExam([...s.questions], [...s.answers], elapsedSec(s))
  exam.active = null
  exam.justFinished = record.id
  persist()
  return record.id
}

/** Throw the exam in progress away without recording it. */
export function abandon() {
  exam.active = null
  persist()
}
