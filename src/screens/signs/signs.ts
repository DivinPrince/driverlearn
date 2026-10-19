import { normalize, SIGN_QUESTIONS } from '../../lib/data'
import { shuffle, type Rng } from '../../lib/engine/random'
import type { L10n, Question } from '../../lib/types'

/** Every question that teaches one road sign / marking (stem image + non-empty meaning). */
export const SIGNS: readonly Question[] = SIGN_QUESTIONS

/** Cards per flashcard round. */
export const FLASH_ROUND = 20
/** Questions per quiz round. */
export const QUIZ_ROUND = 10
/** Answer choices per quiz question (the right one + distractors). */
export const QUIZ_CHOICES = 4

export type SignTab = 'gallery' | 'cards' | 'quiz'
export const SIGN_TABS: readonly SignTab[] = ['gallery', 'cards', 'quiz']

/** Shared copy for the signs trainer. */
export const S = {
  title: { en: 'Road signs', rw: 'Ibyapa byo ku muhanda' },
  learned: { en: 'Learned', rw: 'Nakimenye' },
  learnedCount: { en: '{x} of {y} signs learned', rw: 'Umaze kumenya ibyapa {x} kuri {y}' },
  meaning: { en: 'Meaning', rw: 'Igisobanuro' },
  explanation: { en: 'Explanation', rw: 'Ibisobanuro' },
  markLearned: { en: 'Mark as learned', rw: 'Shyira mu byo nzi' },
  unmark: { en: 'Unmark', rw: 'Kura mu byo nzi' },
  youKnowIt: { en: 'You know this sign', rw: 'Uzi iki cyapa' },
  openQuestion: { en: 'Open the question', rw: 'Reba ikibazo' },
  newLearned: { en: 'New sign learned! +2 XP', rw: 'Wamenye icyapa gishya! +2 XP' },
  flashcards: { en: 'Flashcards', rw: 'Amakarita' },
  quiz: { en: 'Quiz', rw: 'Isuzuma' },
  gallery: { en: 'Gallery', rw: 'Urutonde' },
} satisfies Record<string, L10n>

const PLACEHOLDER = /^[\s.…-]*$/

/** Text with placeholder content ('…', '...', blanks) treated as empty. */
export function clean(text: string | undefined): string {
  const t = text?.trim() ?? ''
  return PLACEHOLDER.test(t) ? '' : t
}

/** True when at least one language has real content. */
export function hasText(text: L10n): boolean {
  return clean(text.en) !== '' || clean(text.rw) !== ''
}

/** The question's explanation with placeholders removed, or null when there is none. */
export function explanationOf(q: Question): L10n | null {
  const e = { en: clean(q.explain.en), rw: clean(q.explain.rw) }
  return e.en || e.rw ? e : null
}

/** Accent/case-insensitive text used to search the gallery. */
export function signSearchText(q: Question): string {
  return normalize([q.sign.rw, q.sign.en, q.explain.rw, q.explain.en, `#${q.id}`].map(clean).join(' '))
}

/** Unlearned signs first (shuffled), then the learned ones (shuffled). */
export function orderForStudy(pool: readonly Question[], learned: ReadonlySet<number>, rng: Rng = Math.random): Question[] {
  return [
    ...shuffle(
      pool.filter((q) => !learned.has(q.id)),
      rng,
    ),
    ...shuffle(
      pool.filter((q) => learned.has(q.id)),
      rng,
    ),
  ]
}

export interface QuizItem {
  sign: Question
  /** Meanings to choose from; `choices[answer]` is the sign's own meaning. */
  choices: L10n[]
  answer: number
}

function keysOf(t: L10n): string[] {
  return [normalize(clean(t.en)), normalize(clean(t.rw))].filter(Boolean)
}

/**
 * Up to `count` meanings of other signs to use as wrong answers. Meanings that read the same as the
 * right answer (or as each other) in either language are skipped. Signs from the same topic come
 * first so the choices are plausible (markings against markings, lights against lights...).
 */
export function pickDistractors(sign: Question, pool: readonly Question[], count: number, rng: Rng = Math.random): L10n[] {
  const taken = new Set(keysOf(sign.sign))
  const candidates = shuffle(
    pool.filter((q) => q.id !== sign.id && hasText(q.sign)),
    rng,
  ).sort((a, b) => Number(b.topic === sign.topic) - Number(a.topic === sign.topic))
  const out: L10n[] = []
  for (const q of candidates) {
    if (out.length >= count) break
    const keys = keysOf(q.sign)
    if (keys.some((k) => taken.has(k))) continue
    keys.forEach((k) => taken.add(k))
    out.push(q.sign)
  }
  return out
}

/** Build a quiz round: mostly signs not learned yet, each with shuffled, deduplicated choices. */
export function buildQuiz(
  pool: readonly Question[],
  learned: ReadonlySet<number>,
  size = QUIZ_ROUND,
  rng: Rng = Math.random,
): QuizItem[] {
  const picked = orderForStudy(pool, learned, rng).slice(0, size)
  const items: QuizItem[] = []
  for (const sign of shuffle(picked, rng)) {
    const choices = shuffle([sign.sign, ...pickDistractors(sign, pool, QUIZ_CHOICES - 1, rng)], rng)
    if (choices.length < 2) continue
    items.push({ sign, choices, answer: choices.indexOf(sign.sign) })
  }
  return items
}
