export type Lang = 'rw' | 'en'

/** A string available in both Kinyarwanda and English. */
export interface L10n {
  rw: string
  en: string
}

export type TopicId =
  | 'rules'
  | 'signs'
  | 'markings'
  | 'signals'
  | 'priority'
  | 'speed'
  | 'overtaking'
  | 'parking'
  | 'lights'
  | 'vehicle'
  | 'safety'
  | 'vulnerable'

export interface Option extends L10n {
  /** Image id (file in /public/q/<id>.webp) when the option is a picture, otherwise ''. */
  image: string
}

export interface Question {
  /** Sequential id used throughout the app (1-based). */
  id: number
  /** Number printed in the source PDF (not unique). */
  src: number
  topic: TopicId
  q: L10n
  /** Stem image ids. */
  images: string[]
  options: Option[]
  /** 0-based index into options. */
  answer: number
  explain: L10n
  /** Meaning of the road sign / marking shown in the stem image; empty strings when not a sign question. */
  sign: L10n
}

/** Spaced-repetition state for one question. */
export interface QState {
  /** Leitner box 0..5. 0 = new/failed, 5 = long-term mastered. */
  box: number
  seen: number
  right: number
  wrong: number
  /** Consecutive correct answers. */
  streak: number
  /** Epoch ms of the last answer. */
  last: number
  /** Epoch ms when the question is due for review again. */
  due: number
}

export interface DayStats {
  xp: number
  answered: number
  correct: number
}

export interface ExamRecord {
  id: string
  /** Epoch ms when the exam finished. */
  date: number
  score: number
  total: number
  passed: boolean
  durationSec: number
  questions: number[]
  /** Chosen option index per question, or null when unanswered. */
  answers: (number | null)[]
}

export interface Progress {
  version: 1
  q: Record<number, QState>
  xp: number
  /** Keyed by local date 'YYYY-MM-DD'. */
  days: Record<string, DayStats>
  exams: ExamRecord[]
  bookmarks: number[]
  /** Achievement id -> epoch ms when unlocked. */
  achievements: Record<string, number>
  /** Question ids whose road sign was marked as learned in the signs trainer. */
  signsLearned: number[]
}

export type Theme = 'system' | 'light' | 'dark'

export interface Settings {
  lang: Lang
  /** Show the other language's text under questions, options and explanations. */
  showTranslation: boolean
  theme: Theme
  sound: boolean
  /** Questions per day to hit the daily goal. */
  dailyGoal: number
  /** Number of questions in a mock exam. */
  examSize: number
  /** Mock exam time limit in minutes. */
  examMinutes: number
  /** Whether the onboarding welcome has been completed. */
  onboarded: boolean
}
