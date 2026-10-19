import type { AchievementDef } from '../engine/gamify'

export interface Toast {
  id: number
  kind: 'achievement' | 'level' | 'info'
  emoji: string
  title: string
  body?: string
}

let nextId = 1

/** Global, non-persistent UI state. */
export const ui = $state({
  toasts: [] as Toast[],
  /** Level reached when a level-up celebration should be shown, else 0. */
  levelUp: 0,
  /** Ids of achievements unlocked in this session (for highlighting). */
  freshAchievements: [] as string[],
})

export function toast(t: Omit<Toast, 'id'>, ms = 4200) {
  const id = nextId++
  ui.toasts.push({ ...t, id })
  setTimeout(() => dismissToast(id), ms)
}

export function dismissToast(id: number) {
  const i = ui.toasts.findIndex((t) => t.id === id)
  if (i >= 0) ui.toasts.splice(i, 1)
}

export function announceAchievement(a: AchievementDef, title: string, body: string) {
  ui.freshAchievements.push(a.id)
  toast({ kind: 'achievement', emoji: a.emoji, title, body }, 5200)
}
