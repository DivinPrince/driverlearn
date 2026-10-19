import { pick } from './data'
import { settings } from './state/settings.svelte'
import type { L10n } from './types'

/**
 * Translate an inline bilingual string for the current UI language.
 * Screens define their own copy inline: tr({ en: 'Start', rw: 'Tangira' }).
 * Reactive when called from a template or $derived (it reads settings.lang).
 */
export function tr(text: L10n, vars?: Record<string, string | number>): string {
  let s = pick(text, settings.lang)
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}

/** Shared UI copy used across several screens. */
export const T = {
  appName: { en: 'DriverLearn', rw: 'DriverLearn' },
  home: { en: 'Home', rw: 'Ahabanza' },
  learn: { en: 'Learn', rw: 'Kwiga' },
  exam: { en: 'Mock exam', rw: 'Ikizamini' },
  signs: { en: 'Signs', rw: 'Ibyapa' },
  library: { en: 'All questions', rw: 'Ibibazo byose' },
  progress: { en: 'Progress', rw: 'Aho ngeze' },
  settings: { en: 'Settings', rw: 'Igenamiterere' },
  back: { en: 'Back', rw: 'Subira inyuma' },
  close: { en: 'Close', rw: 'Funga' },
  next: { en: 'Next', rw: 'Komeza' },
  previous: { en: 'Previous', rw: 'Ibanziriza' },
  check: { en: 'Check', rw: 'Genzura' },
  continue: { en: 'Continue', rw: 'Komeza' },
  start: { en: 'Start', rw: 'Tangira' },
  finish: { en: 'Finish', rw: 'Soza' },
  retry: { en: 'Try again', rw: 'Ongera ugerageze' },
  correct: { en: 'Correct!', rw: 'Ni byo!' },
  wrong: { en: 'Not quite', rw: 'Si byo' },
  correctAnswer: { en: 'Correct answer', rw: 'Igisubizo cy’ukuri' },
  explanation: { en: 'Why?', rw: 'Kubera iki?' },
  question: { en: 'Question', rw: 'Ikibazo' },
  questions: { en: 'questions', rw: 'ibibazo' },
  of: { en: 'of', rw: 'kuri' },
  xp: { en: 'XP', rw: 'XP' },
  level: { en: 'Level', rw: 'Urwego' },
  streak: { en: 'Day streak', rw: 'Iminsi ikurikiranye' },
  dailyGoal: { en: 'Daily goal', rw: 'Intego y’umunsi' },
  mastered: { en: 'Mastered', rw: 'Byamenyekanye' },
  bookmark: { en: 'Bookmark', rw: 'Bika' },
  bookmarked: { en: 'Bookmarked', rw: 'Byabitswe' },
  mistakes: { en: 'Mistakes', rw: 'Amakosa' },
  readiness: { en: 'Exam readiness', rw: 'Kwitegura ikizamini' },
  passed: { en: 'Passed', rw: 'Watsinze' },
  failed: { en: 'Not passed', rw: 'Ntiwatsinze' },
  zoom: { en: 'Enlarge image', rw: 'Kuza ifoto' },
  translation: { en: 'Kinyarwanda', rw: 'English' },
  achievementUnlocked: { en: 'Achievement unlocked', rw: 'Igihembo gishya' },
  levelUp: { en: 'Level up!', rw: 'Wazamutse urwego!' },
} satisfies Record<string, L10n>
