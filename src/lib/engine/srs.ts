import type { QState } from '../types'
import { DAY_MS } from './dates'

export const MAX_BOX = 5

/** Review interval after landing in each Leitner box. */
export const INTERVALS_MS = [10 * 60 * 1000, 1 * DAY_MS, 3 * DAY_MS, 7 * DAY_MS, 14 * DAY_MS, 30 * DAY_MS]

/** Box at which a question counts as mastered. */
export const MASTERED_BOX = 3

export function newState(): QState {
  return { box: 0, seen: 0, right: 0, wrong: 0, streak: 0, last: 0, due: 0 }
}

/** Apply one answer to a question's state (pure). */
export function review(prev: QState | undefined, correct: boolean, now: number): QState {
  const s = prev ?? newState()
  const box = correct ? Math.min(s.box + 1, MAX_BOX) : 0
  return {
    box,
    seen: s.seen + 1,
    right: s.right + (correct ? 1 : 0),
    wrong: s.wrong + (correct ? 0 : 1),
    streak: correct ? s.streak + 1 : 0,
    last: now,
    due: now + INTERVALS_MS[box],
  }
}

export function isDue(s: QState | undefined, now: number): boolean {
  return !!s && s.seen > 0 && s.due <= now
}

export function isMastered(s: QState | undefined): boolean {
  return !!s && s.box >= MASTERED_BOX
}

/** A question is "weak" when it was answered wrong last time or has more misses than hits. */
export function isWeak(s: QState | undefined): boolean {
  return !!s && s.seen > 0 && (s.streak === 0 || s.wrong > s.right)
}

/** Mastery of one question in [0, 1]. */
export function masteryOf(s: QState | undefined): number {
  if (!s || s.seen === 0) return 0
  return Math.min(s.box, MASTERED_BOX) / MASTERED_BOX
}
