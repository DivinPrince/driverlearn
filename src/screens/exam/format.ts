import { dayKey, shiftDay } from '../../lib/engine/dates'
import { PASS_RATIO } from '../../lib/engine/gamify'
import { tr } from '../../lib/i18n'
import { settings } from '../../lib/state/settings.svelte'
import type { ExamRecord, L10n } from '../../lib/types'

/** Questions needed to pass an exam of `total` questions (official rule: 60%, rounded up). */
export function passMark(total: number): number {
  return Math.ceil(total * PASS_RATIO)
}

/** 754 -> "12:34". Hours roll into minutes (exams never last that long). */
export function clock(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** Spoken-style duration for labels: "12 min 4 s" / "iminota 12 n’amasegonda 4". */
export function durationText(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m === 0) return tr({ en: '{s} s', rw: 'amasegonda {s}' }, { s: r })
  if (r === 0) return tr({ en: '{m} min', rw: 'iminota {m}' }, { m })
  return tr({ en: '{m} min {s} s', rw: 'iminota {m} n’amasegonda {s}' }, { m, s: r })
}

const RW_MONTHS = [
  'Mutarama',
  'Gashyantare',
  'Werurwe',
  'Mata',
  'Gicurasi',
  'Kamena',
  'Nyakanga',
  'Kanama',
  'Nzeri',
  'Ukwakira',
  'Ugushyingo',
  'Ukuboza',
]
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const TODAY: L10n = { en: 'Today', rw: 'Uyu munsi' }
const YESTERDAY: L10n = { en: 'Yesterday', rw: 'Ejo hashize' }

/** "Today · 14:05", "Yesterday · 09:30", "3 Oct · 18:20" (Kinyarwanda month names in rw). */
export function dateText(ts: number, now = Date.now()): string {
  const d = new Date(ts)
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const key = dayKey(ts)
  const today = dayKey(now)
  let day: string
  if (key === today) day = tr(TODAY)
  else if (key === shiftDay(today, -1)) day = tr(YESTERDAY)
  else {
    const sameYear = d.getFullYear() === new Date(now).getFullYear()
    const month = settings.lang === 'rw' ? RW_MONTHS[d.getMonth()] : EN_MONTHS[d.getMonth()]
    day = `${d.getDate()} ${month}${sameYear ? '' : ` ${d.getFullYear()}`}`
  }
  return `${day} · ${time}`
}

export interface ExamSummary {
  attempts: number
  passes: number
  /** Best attempt by ratio (ties: most recent), or null without attempts. */
  best: ExamRecord | null
  /** 0..1, or null without attempts. */
  passRate: number | null
}

export function summarize(exams: readonly ExamRecord[]): ExamSummary {
  let best: ExamRecord | null = null
  let passes = 0
  for (const e of exams) {
    if (e.passed) passes++
    const r = e.total ? e.score / e.total : 0
    if (!best || r >= (best.total ? best.score / best.total : 0)) best = e
  }
  return { attempts: exams.length, passes, best, passRate: exams.length ? passes / exams.length : null }
}
