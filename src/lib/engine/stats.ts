import type { ExamRecord, QState, Question, TopicId } from '../types'
import { isMastered, masteryOf } from './srs'

export interface TopicStats {
  topic: TopicId
  total: number
  seen: number
  mastered: number
  /** 0..1 */
  mastery: number
  /** Share of answers that were correct, or null when never answered. */
  accuracy: number | null
}

export function topicStats(topic: TopicId, questions: readonly Question[], states: Record<number, QState>): TopicStats {
  let seen = 0
  let mastered = 0
  let m = 0
  let right = 0
  let answered = 0
  for (const q of questions) {
    const s = states[q.id]
    if (s?.seen) seen++
    if (isMastered(s)) mastered++
    m += masteryOf(s)
    right += s?.right ?? 0
    answered += s?.seen ?? 0
  }
  return {
    topic,
    total: questions.length,
    seen,
    mastered,
    mastery: questions.length ? m / questions.length : 0,
    accuracy: answered ? right / answered : null,
  }
}

export function overallMastery(questions: readonly Question[], states: Record<number, QState>): number {
  if (!questions.length) return 0
  return questions.reduce((s, q) => s + masteryOf(states[q.id]), 0) / questions.length
}

/**
 * Exam readiness 0..100: blends question-bank mastery with recent mock exam results
 * (last 5, newest weighted most). Without exams it is mastery only, capped at 80 so
 * learners are nudged to sit a mock exam before feeling "ready".
 */
export function readiness(questions: readonly Question[], states: Record<number, QState>, exams: readonly ExamRecord[]): number {
  const mastery = overallMastery(questions, states)
  const recent = exams.slice(-5)
  if (!recent.length) return Math.round(Math.min(mastery * 100, 80))
  let w = 0
  let acc = 0
  recent.forEach((e, i) => {
    const weight = i + 1
    w += weight
    acc += weight * (e.total ? e.score / e.total : 0)
  })
  const examScore = acc / w
  return Math.round((mastery * 0.5 + examScore * 0.5) * 100)
}
