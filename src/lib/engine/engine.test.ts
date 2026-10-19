import { describe, expect, test } from 'bun:test'
import type { Progress, Question, QState, TopicId } from '../types'
import { dayKey, lastDays, shiftDay } from './dates'
import {
  ACHIEVEMENTS,
  answerXp,
  bestStreak,
  currentStreak,
  examXp,
  isPass,
  levelInfo,
  newlyUnlocked,
  xpForLevel,
} from './gamify'
import { seeded, shuffle } from './random'
import { selectExam, selectMistakes, selectPractice } from './select'
import { INTERVALS_MS, isDue, isMastered, masteryOf, MAX_BOX, review } from './srs'
import { overallMastery, readiness, topicStats } from './stats'

const NOW = new Date(2026, 9, 12, 10, 0, 0).getTime()

function q(id: number, topic: TopicId = 'rules'): Question {
  return {
    id,
    src: id,
    topic,
    q: { rw: `q${id}`, en: `q${id}` },
    images: [],
    options: [0, 1, 2, 3].map((i) => ({ rw: `o${i}`, en: `o${i}`, image: '' })),
    answer: id % 4,
    explain: { rw: '', en: '' },
    sign: { rw: '', en: '' },
  }
}

function emptyProgress(): Progress {
  return { version: 1, q: {}, xp: 0, days: {}, exams: [], bookmarks: [], achievements: {}, signsLearned: [] }
}

describe('dates', () => {
  test('dayKey formats local dates', () => {
    expect(dayKey(NOW)).toBe('2026-10-12')
  })
  test('shiftDay crosses month and year boundaries', () => {
    expect(shiftDay('2026-10-01', -1)).toBe('2026-09-30')
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01')
    expect(shiftDay('2024-02-28', 1)).toBe('2024-02-29')
  })
  test('lastDays returns oldest first and ends today', () => {
    expect(lastDays('2026-10-12', 3)).toEqual(['2026-10-10', '2026-10-11', '2026-10-12'])
  })
})

describe('random', () => {
  test('seeded rng is deterministic', () => {
    const a = seeded(42)
    const b = seeded(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  test('shuffle keeps every element and does not mutate', () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8]
    const out = shuffle(src, seeded(1))
    expect(out.slice().sort()).toEqual(src)
    expect(src).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
})

describe('srs', () => {
  test('correct answers climb boxes up to the max', () => {
    let s: QState | undefined
    for (let i = 0; i < 10; i++) s = review(s, true, NOW)
    expect(s!.box).toBe(MAX_BOX)
    expect(s!.right).toBe(10)
    expect(s!.streak).toBe(10)
    expect(s!.due).toBe(NOW + INTERVALS_MS[MAX_BOX])
  })
  test('a wrong answer resets to box 0 and is due soon', () => {
    let s = review(undefined, true, NOW)
    s = review(s, true, NOW)
    s = review(s, false, NOW)
    expect(s.box).toBe(0)
    expect(s.streak).toBe(0)
    expect(s.wrong).toBe(1)
    expect(s.seen).toBe(3)
    expect(isDue(s, NOW)).toBe(false)
    expect(isDue(s, NOW + INTERVALS_MS[0])).toBe(true)
  })
  test('mastery and mastered thresholds', () => {
    expect(masteryOf(undefined)).toBe(0)
    let s = review(undefined, true, NOW)
    expect(isMastered(s)).toBe(false)
    s = review(review(s, true, NOW), true, NOW)
    expect(isMastered(s)).toBe(true)
    expect(masteryOf(s)).toBe(1)
  })
  test('unseen questions are never due', () => {
    expect(isDue(undefined, NOW)).toBe(false)
  })
})

describe('select', () => {
  const pool = Array.from({ length: 40 }, (_, i) => q(i + 1))

  test('practice returns the requested count without duplicates', () => {
    const out = selectPractice({ pool, states: {}, now: NOW, count: 15, rng: seeded(3) })
    expect(out.length).toBe(15)
    expect(new Set(out.map((x) => x.id)).size).toBe(15)
  })

  test('practice prioritises due reviews but keeps room for new questions', () => {
    const states: Record<number, QState> = {}
    for (let i = 1; i <= 20; i++) states[i] = { ...review(undefined, false, NOW - 3600_000), due: NOW - 1 }
    const out = selectPractice({ pool, states, now: NOW, count: 10, rng: seeded(9) })
    const due = out.filter((x) => x.id <= 20).length
    expect(due).toBe(6)
    expect(out.length - due).toBe(4)
  })

  test('practice never exceeds the pool size', () => {
    expect(selectPractice({ pool: pool.slice(0, 3), states: {}, now: NOW, count: 10 }).length).toBe(3)
  })

  test('mistakes are the questions answered wrong last time, weakest first', () => {
    const states: Record<number, QState> = {
      1: review(undefined, false, NOW),
      2: review(review(undefined, false, NOW), true, NOW),
      3: review(undefined, true, NOW),
    }
    const ids = selectMistakes(pool, states).map((x) => x.id)
    expect(ids).toEqual([1])
  })

  test('exam draws proportionally from topics', () => {
    const big = [
      ...Array.from({ length: 100 }, (_, i) => q(i + 1, 'signs')),
      ...Array.from({ length: 100 }, (_, i) => q(i + 101, 'rules')),
      ...Array.from({ length: 200 }, (_, i) => q(i + 201, 'safety')),
    ]
    const exam = selectExam(big, 20, seeded(5))
    expect(exam.length).toBe(20)
    expect(new Set(exam.map((x) => x.id)).size).toBe(20)
    const count = (t: TopicId) => exam.filter((x) => x.topic === t).length
    expect(count('signs')).toBe(5)
    expect(count('rules')).toBe(5)
    expect(count('safety')).toBe(10)
  })

  test('exam with uneven topics still returns exactly the requested size', () => {
    const odd = [...Array.from({ length: 7 }, (_, i) => q(i + 1, 'signs')), ...Array.from({ length: 5 }, (_, i) => q(i + 8, 'speed'))]
    for (let seed = 0; seed < 20; seed++) expect(selectExam(odd, 10, seeded(seed)).length).toBe(10)
    expect(selectExam(odd, 50).length).toBe(12)
  })
})

describe('gamify', () => {
  test('xp rewards and combos', () => {
    expect(answerXp(false, 0)).toBe(1)
    expect(answerXp(true, 1)).toBe(10)
    expect(answerXp(true, 3)).toBe(14)
    expect(answerXp(true, 50)).toBe(20)
    expect(examXp(15, true)).toBe(125)
  })
  test('pass mark is 60% (12/20)', () => {
    expect(isPass(12, 20)).toBe(true)
    expect(isPass(11, 20)).toBe(false)
    expect(isPass(0, 0)).toBe(false)
  })
  test('levels are monotonic and consistent', () => {
    expect(xpForLevel(1)).toBe(0)
    expect(levelInfo(0)).toEqual({ level: 1, into: 0, span: 100, ratio: 0 })
    expect(levelInfo(100).level).toBe(2)
    expect(levelInfo(299).level).toBe(2)
    expect(levelInfo(300).level).toBe(3)
    for (let xp = 0; xp < 5000; xp += 37) {
      const info = levelInfo(xp)
      expect(info.into).toBeGreaterThanOrEqual(0)
      expect(info.into).toBeLessThan(info.span)
    }
  })
  test('streak counts consecutive days and survives an inactive today', () => {
    const days = {
      '2026-10-09': { xp: 1, answered: 1, correct: 1 },
      '2026-10-10': { xp: 1, answered: 1, correct: 1 },
      '2026-10-11': { xp: 1, answered: 1, correct: 1 },
    }
    expect(currentStreak(days, '2026-10-11')).toBe(3)
    expect(currentStreak(days, '2026-10-12')).toBe(3)
    expect(currentStreak(days, '2026-10-13')).toBe(0)
    expect(bestStreak({ ...days, '2026-10-01': { xp: 1, answered: 1, correct: 1 } })).toBe(3)
  })
  test('achievements unlock once', () => {
    const p = emptyProgress()
    const ctx = {
      progress: p,
      today: '2026-10-12',
      totalQuestions: 10,
      totalSigns: 0,
      topicSizes: { rules: 1 },
      topicOf: () => 'rules',
      hour: 12,
    }
    expect(newlyUnlocked(ctx)).toEqual([])
    p.q[1] = review(review(review(undefined, true, NOW), true, NOW), true, NOW)
    const first = newlyUnlocked(ctx)
    expect(first).toContain('first-step')
    expect(first).toContain('topic-master')
    for (const id of first) p.achievements[id] = NOW
    expect(newlyUnlocked(ctx)).toEqual([])
  })
  test('achievement ids are unique', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
  })
})

describe('stats', () => {
  const pool = [q(1, 'signs'), q(2, 'signs'), q(3, 'signs'), q(4, 'signs')]
  test('topic stats', () => {
    const states = { 1: review(undefined, true, NOW), 2: review(undefined, false, NOW) }
    const s = topicStats('signs', pool, states)
    expect(s.total).toBe(4)
    expect(s.seen).toBe(2)
    expect(s.accuracy).toBe(0.5)
    expect(s.mastery).toBeCloseTo(1 / 3 / 4)
  })
  test('readiness without exams is capped at 80', () => {
    const states: Record<number, QState> = {}
    for (const x of pool) states[x.id] = { ...review(undefined, true, NOW), box: 5 }
    expect(overallMastery(pool, states)).toBe(1)
    expect(readiness(pool, states, [])).toBe(80)
  })
  test('readiness blends mastery with recent exams', () => {
    const exam = { id: 'a', date: NOW, score: 20, total: 20, passed: true, durationSec: 600, questions: [], answers: [] }
    expect(readiness(pool, {}, [exam])).toBe(50)
  })
})
