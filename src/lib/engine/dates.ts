export const DAY_MS = 24 * 60 * 60 * 1000

/** Local calendar date key 'YYYY-MM-DD' for an epoch-ms timestamp. */
export function dayKey(ts: number): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Shift a 'YYYY-MM-DD' key by n calendar days (DST-safe). */
export function shiftDay(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d + n, 12)
  return dayKey(date.getTime())
}

/** The last n day keys ending at `today` (oldest first). */
export function lastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => shiftDay(today, i - n + 1))
}
