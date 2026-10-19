/** Session length preference shared by every practice link on the Learn hub. */

export const SESSION_SIZES = [10, 15, 25, 40] as const
export type SessionSize = (typeof SESSION_SIZES)[number]

export const SESSION_SIZE_KEY = 'driverlearn:sessionSize'
export const DEFAULT_SESSION_SIZE: SessionSize = 15

function isSessionSize(n: number): n is SessionSize {
  return (SESSION_SIZES as readonly number[]).includes(n)
}

export function loadSessionSize(): SessionSize {
  try {
    const n = Number(localStorage.getItem(SESSION_SIZE_KEY))
    return isSessionSize(n) ? n : DEFAULT_SESSION_SIZE
  } catch {
    return DEFAULT_SESSION_SIZE
  }
}

export function saveSessionSize(n: SessionSize) {
  try {
    localStorage.setItem(SESSION_SIZE_KEY, String(n))
  } catch {
    /* storage unavailable (private mode): keep it in memory only */
  }
}

/** Rough session length in minutes (~30 s per question, including reading the explanation). */
export function sessionMinutes(n: number): number {
  return Math.max(1, Math.round(n * 0.5))
}
