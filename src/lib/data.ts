import raw from '../data/questions.json'
import { TOPICS } from './topics'
import type { Lang, L10n, Question, TopicId } from './types'

export const QUESTIONS: Question[] = raw as Question[]

export const QUESTION_BY_ID: Map<number, Question> = new Map(QUESTIONS.map((q) => [q.id, q]))

export function getQuestion(id: number): Question | undefined {
  return QUESTION_BY_ID.get(id)
}

export const QUESTIONS_BY_TOPIC: Record<TopicId, Question[]> = Object.fromEntries(
  TOPICS.map((t) => [t.id, QUESTIONS.filter((q) => q.topic === t.id)]),
) as Record<TopicId, Question[]>

/** Questions that teach one specific road sign or marking (have a stem image and a sign meaning). */
export const SIGN_QUESTIONS: Question[] = QUESTIONS.filter((q) => q.images.length > 0 && q.sign.en.trim() !== '')

/** Public URL of a question image id. */
export function imageUrl(id: string): string {
  return `${import.meta.env.BASE_URL}q/${id}.webp`
}

/** Pick the string for a language, falling back to the other language when empty. */
export function pick(text: L10n, lang: Lang): string {
  const other: Lang = lang === 'rw' ? 'en' : 'rw'
  return text[lang]?.trim() ? text[lang] : text[other]
}

/** The other language's string, or '' if it is identical / empty (used for "show translation"). */
export function translation(text: L10n, lang: Lang): string {
  const other: Lang = lang === 'rw' ? 'en' : 'rw'
  const t = text[other]?.trim() ?? ''
  return t && t !== text[lang]?.trim() ? t : ''
}

export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const

/** Lower-cased, accent-insensitive text used for search. */
export function searchText(q: Question): string {
  const parts = [q.q.rw, q.q.en, q.sign.rw, q.sign.en, ...q.options.flatMap((o) => [o.rw, o.en]), String(q.id), String(q.src)]
  return normalize(parts.join(' '))
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`]/g, "'")
}
