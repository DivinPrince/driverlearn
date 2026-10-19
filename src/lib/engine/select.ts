import type { QState, Question, TopicId } from '../types'
import { shuffle, type Rng } from './random'
import { isDue, isWeak } from './srs'

export interface PracticeInput {
  pool: readonly Question[]
  states: Record<number, QState>
  now: number
  count: number
  rng?: Rng
}

/**
 * Pick a practice set: due reviews first (weakest box first), then a share of unseen questions,
 * then the least-known remaining ones. Each group is shuffled so sessions feel fresh.
 */
export function selectPractice({ pool, states, now, count, rng = Math.random }: PracticeInput): Question[] {
  const n = Math.min(count, pool.length)
  const due = shuffle(
    pool.filter((q) => isDue(states[q.id], now)),
    rng,
  ).sort((a, b) => states[a.id].box - states[b.id].box)
  const unseen = shuffle(
    pool.filter((q) => !states[q.id]?.seen),
    rng,
  )
  const rest = shuffle(
    pool.filter((q) => states[q.id]?.seen && !isDue(states[q.id], now)),
    rng,
  ).sort((a, b) => states[a.id].box - states[b.id].box)

  const picked: Question[] = []
  const take = (from: Question[], max: number) => {
    for (const q of from) {
      if (picked.length >= n || max <= 0) break
      if (!picked.includes(q)) {
        picked.push(q)
        max--
      }
    }
  }
  // Keep at least ~40% of the session for new material while there is any.
  take(due, unseen.length ? Math.ceil(n * 0.6) : n)
  take(unseen, n)
  take(due, n)
  take(rest, n)
  return shuffle(picked, rng)
}

/** Questions the learner got wrong last time (or misses more than hits), weakest first. */
export function selectMistakes(pool: readonly Question[], states: Record<number, QState>): Question[] {
  return pool
    .filter((q) => isWeak(states[q.id]))
    .sort((a, b) => states[a.id].box - states[b.id].box || states[b.id].wrong - states[a.id].wrong)
}

/**
 * Build a mock exam of `size` questions, drawn proportionally from every topic (largest-remainder
 * allocation) so each exam covers the whole syllabus, then shuffled.
 */
export function selectExam(all: readonly Question[], size: number, rng: Rng = Math.random): Question[] {
  const n = Math.min(size, all.length)
  const byTopic = new Map<TopicId, Question[]>()
  for (const q of all) {
    const list = byTopic.get(q.topic) ?? []
    list.push(q)
    byTopic.set(q.topic, list)
  }
  const groups = [...byTopic.entries()].map(([topic, qs]) => {
    const exact = (qs.length / all.length) * n
    return { topic, qs: shuffle(qs, rng), take: Math.floor(exact), frac: exact - Math.floor(exact) + rng() * 1e-6 }
  })
  let remaining = n - groups.reduce((s, g) => s + g.take, 0)
  for (const g of [...groups].sort((a, b) => b.frac - a.frac)) {
    if (remaining <= 0) break
    if (g.take < g.qs.length) {
      g.take++
      remaining--
    }
  }
  return shuffle(
    groups.flatMap((g) => g.qs.slice(0, g.take)),
    rng,
  )
}
