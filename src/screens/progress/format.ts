/**
 * Small bilingual date / number helpers for the Progress screen.
 * Hand-written names so Kinyarwanda works even where the browser's Intl data lacks 'rw'.
 */
import { tr } from '../../lib/i18n'
import type { L10n } from '../../lib/types'

/** Monday-first weekday names. */
export const WEEKDAYS_SHORT: L10n[] = [
  { en: 'Mon', rw: 'Mbe' },
  { en: 'Tue', rw: 'Kab' },
  { en: 'Wed', rw: 'Gtu' },
  { en: 'Thu', rw: 'Kan' },
  { en: 'Fri', rw: 'Gnu' },
  { en: 'Sat', rw: 'Gnd' },
  { en: 'Sun', rw: 'Cyu' },
]

export const WEEKDAYS_LONG: L10n[] = [
  { en: 'Monday', rw: 'Kuwa mbere' },
  { en: 'Tuesday', rw: 'Kuwa kabiri' },
  { en: 'Wednesday', rw: 'Kuwa gatatu' },
  { en: 'Thursday', rw: 'Kuwa kane' },
  { en: 'Friday', rw: 'Kuwa gatanu' },
  { en: 'Saturday', rw: 'Kuwa gatandatu' },
  { en: 'Sunday', rw: 'Ku cyumweru' },
]

export const MONTHS_SHORT: L10n[] = [
  { en: 'Jan', rw: 'Mut' },
  { en: 'Feb', rw: 'Gas' },
  { en: 'Mar', rw: 'Wer' },
  { en: 'Apr', rw: 'Mat' },
  { en: 'May', rw: 'Gic' },
  { en: 'Jun', rw: 'Kam' },
  { en: 'Jul', rw: 'Nya' },
  { en: 'Aug', rw: 'Kan' },
  { en: 'Sep', rw: 'Nze' },
  { en: 'Oct', rw: 'Ukw' },
  { en: 'Nov', rw: 'Ugu' },
  { en: 'Dec', rw: 'Uku' },
]

/** Local Date at noon for a 'YYYY-MM-DD' key (DST-safe). */
export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** Monday-based weekday index (Mon = 0 … Sun = 6). */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

/** "Mon 12 Oct" / "Mbe 12 Ukw" */
export function formatDayShort(key: string): string {
  const d = keyToDate(key)
  return `${tr(WEEKDAYS_SHORT[weekdayIndex(d)])} ${d.getDate()} ${tr(MONTHS_SHORT[d.getMonth()])}`
}

/** "Monday 12 Oct" / "Kuwa mbere 12 Ukw" */
export function formatDayLong(key: string): string {
  const d = keyToDate(key)
  return `${tr(WEEKDAYS_LONG[weekdayIndex(d)])} ${d.getDate()} ${tr(MONTHS_SHORT[d.getMonth()])}`
}

/** "12 Oct 2026" / "12 Ukw 2026" from epoch ms. */
export function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getDate()} ${tr(MONTHS_SHORT[d.getMonth()])} ${d.getFullYear()}`
}

/** "12 Oct" this year, otherwise "12 Oct 2025". */
export function formatDateShort(ts: number): string {
  const d = new Date(ts)
  return d.getFullYear() === new Date().getFullYear() ? `${d.getDate()} ${tr(MONTHS_SHORT[d.getMonth()])}` : formatDate(ts)
}

/** "14:05" (minutes:seconds). */
export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Thousands-separated integer, e.g. 12,480. */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

/** Whole percentage of a 0..1 ratio. */
export function percent(ratio: number): number {
  return Math.round((Number.isFinite(ratio) ? ratio : 0) * 100)
}
