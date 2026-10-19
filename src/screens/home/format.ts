import { DAY_MS, dayKey } from '../../lib/engine/dates'
import { tr } from '../../lib/i18n'
import { settings } from '../../lib/state/settings.svelte'
import type { L10n, Lang } from '../../lib/types'

/** Short weekday labels indexed by Date#getDay() (0 = Sunday). Kinyarwanda follows CLDR abbreviations. */
const WEEKDAY_SHORT: Record<Lang, string[]> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  rw: ['Cyu', 'Mbe', 'Kab', 'Gtu', 'Kan', 'Gnu', 'Gnd'],
}

const WEEKDAY_LONG: Record<Lang, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  rw: ['Ku cyumweru', 'Kuwa mbere', 'Kuwa kabiri', 'Kuwa gatatu', 'Kuwa kane', 'Kuwa gatanu', 'Kuwa gatandatu'],
}

const MONTHS: Record<Lang, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  rw: ['Mutarama', 'Gashyantare', 'Werurwe', 'Mata', 'Gicurasi', 'Kamena', 'Nyakanga', 'Kanama', 'Nzeri', 'Ukwakira', 'Ugushyingo', 'Ukuboza'],
}

/** Local noon of a 'YYYY-MM-DD' key, used for DST-safe day arithmetic. */
function noonOf(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function weekdayShort(key: string): string {
  return WEEKDAY_SHORT[settings.lang][noonOf(key).getDay()]
}

export function weekdayLong(key: string): string {
  return WEEKDAY_LONG[settings.lang][noonOf(key).getDay()]
}

/** e.g. "Monday, 12 October" / "Kuwa mbere, 12 Ukwakira". */
export function longDate(ts: number): string {
  const d = new Date(ts)
  return `${WEEKDAY_LONG[settings.lang][d.getDay()]}, ${d.getDate()} ${MONTHS[settings.lang][d.getMonth()]}`
}

/** e.g. "12 Oct" / "12 Ukwakira", with the year when it differs from `now`. */
export function shortDate(ts: number, now: number): string {
  const d = new Date(ts)
  const month = MONTHS[settings.lang][d.getMonth()]
  const name = settings.lang === 'en' ? month.slice(0, 3) : month
  const year = d.getFullYear() !== new Date(now).getFullYear() ? ` ${d.getFullYear()}` : ''
  return `${d.getDate()} ${name}${year}`
}

/** "Today", "Yesterday", "3 days ago" or a short date. */
export function relativeDay(ts: number, now: number): string {
  const diff = Math.round((noonOf(dayKey(now)).getTime() - noonOf(dayKey(ts)).getTime()) / DAY_MS)
  if (diff <= 0) return tr({ en: 'Today', rw: 'Uyu munsi' })
  if (diff === 1) return tr({ en: 'Yesterday', rw: 'Ejo hashize' })
  if (diff < 7) return tr({ en: '{n} days ago', rw: 'Hashize iminsi {n}' }, { n: diff })
  return shortDate(ts, now)
}

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night'

export function dayPart(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 23) return 'evening'
  return 'night'
}

export const GREETINGS: Record<DayPart, L10n> = {
  morning: { en: 'Good morning!', rw: 'Mwaramutse!' },
  afternoon: { en: 'Good afternoon!', rw: 'Mwiriwe!' },
  evening: { en: 'Good evening!', rw: 'Mwiriwe!' },
  night: { en: 'Still up? 🦉', rw: 'Uracyari maso? 🦉' },
}

/** "1 question" / "5 questions" in the UI language. */
export function questionsCount(n: number): string {
  return n === 1 ? tr({ en: '1 question', rw: 'ikibazo 1' }) : tr({ en: '{n} questions', rw: 'ibibazo {n}' }, { n })
}

/** Thousands separators that read well in both languages (1,240). */
export function num(n: number): string {
  return n.toLocaleString('en-US')
}
