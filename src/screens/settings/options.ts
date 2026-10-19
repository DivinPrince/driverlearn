import type { L10n } from '../../lib/types'

export interface GoalOption {
  /** Questions per day. */
  value: number
  name: L10n
  emoji: string
  /** Rough study time per day (about 30 s per question). */
  minutes: number
}

/** Daily goal presets, shared by Settings and the first-run onboarding. */
export const GOALS: readonly GoalOption[] = [
  { value: 10, name: { en: 'Casual', rw: 'Buhoro' }, emoji: '🐢', minutes: 5 },
  { value: 20, name: { en: 'Regular', rw: 'Bisanzwe' }, emoji: '🚗', minutes: 10 },
  { value: 30, name: { en: 'Serious', rw: 'Nta mikino' }, emoji: '🏎️', minutes: 15 },
  { value: 50, name: { en: 'Intense', rw: 'Imbaraga zose' }, emoji: '🚀', minutes: 25 },
]

export const EXAM_SIZES: readonly number[] = [10, 20, 30]
export const EXAM_MINUTES: readonly number[] = [10, 20, 30]

/** The official Rwanda provisional licence theory test format. */
export const OFFICIAL_EXAM = { size: 20, minutes: 20 } as const
