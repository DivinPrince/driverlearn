import { DAY_MS } from '../../lib/engine/dates'
import { isMastered, isWeak } from '../../lib/engine/srs'
import type { L10n, QState } from '../../lib/types'

/** Where the learner stands with one question. */
export type QStatus = 'new' | 'learning' | 'weak' | 'mastered'

export function statusOf(s: QState | undefined): QStatus {
  if (!s?.seen) return 'new'
  if (isMastered(s)) return 'mastered'
  if (isWeak(s)) return 'weak'
  return 'learning'
}

export const STATUS_LABEL: Record<QStatus, L10n> = {
  new: { en: 'New', rw: 'Gishya' },
  learning: { en: 'Learning', rw: 'Kiri kwigwa' },
  weak: { en: 'Needs review', rw: 'Gikeneye gusubirwamo' },
  mastered: { en: 'Mastered', rw: 'Cyamenyekanye' },
}

/** Placeholder text the data pipeline uses before real content exists. */
const PLACEHOLDERS = new Set(['', '…', '...'])

/** True when a bilingual text has real content in at least one language. */
export function hasText(t: L10n | undefined): boolean {
  if (!t) return false
  return !PLACEHOLDERS.has(t.en?.trim() ?? '') || !PLACEHOLDERS.has(t.rw?.trim() ?? '')
}

const MIN_MS = 60_000
const HOUR_MS = 60 * MIN_MS

/** "3 days ago" style text for a past timestamp. */
export function timeAgo(ts: number, now: number): L10n {
  const d = Math.max(0, now - ts)
  if (d < MIN_MS) return { en: 'just now', rw: 'ubu nyine' }
  if (d < HOUR_MS) {
    const n = Math.round(d / MIN_MS)
    return n === 1 ? { en: '1 minute ago', rw: 'hashize umunota umwe' } : { en: `${n} minutes ago`, rw: `hashize iminota ${n}` }
  }
  if (d < DAY_MS) {
    const n = Math.round(d / HOUR_MS)
    return n === 1 ? { en: '1 hour ago', rw: 'hashize isaha imwe' } : { en: `${n} hours ago`, rw: `hashize amasaha ${n}` }
  }
  const n = Math.round(d / DAY_MS)
  return n === 1 ? { en: 'yesterday', rw: 'ejo hashize' } : { en: `${n} days ago`, rw: `hashize iminsi ${n}` }
}

/** "in 3 days" style text for a future timestamp ("now" when it has passed). */
export function timeUntil(ts: number, now: number): L10n {
  const d = ts - now
  if (d <= 0) return { en: 'due now', rw: 'igihe kirageze' }
  if (d < HOUR_MS) {
    const n = Math.max(1, Math.ceil(d / MIN_MS))
    return n === 1 ? { en: 'in 1 minute', rw: 'mu munota umwe' } : { en: `in ${n} minutes`, rw: `mu minota ${n}` }
  }
  if (d < DAY_MS) {
    const n = Math.round(d / HOUR_MS)
    return n === 1 ? { en: 'in 1 hour', rw: 'mu isaha imwe' } : { en: `in ${n} hours`, rw: `mu masaha ${n}` }
  }
  const n = Math.round(d / DAY_MS)
  return n === 1 ? { en: 'tomorrow', rw: 'ejo' } : { en: `in ${n} days`, rw: `mu minsi ${n}` }
}
