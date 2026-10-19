import type { Settings } from '../types'

const KEY = 'driverlearn:settings'

export const DEFAULT_SETTINGS: Settings = {
  lang: 'rw',
  showTranslation: false,
  theme: 'system',
  sound: true,
  dailyGoal: 20,
  examSize: 20,
  examMinutes: 20,
  onboarded: false,
}

function load(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return { ...DEFAULT_SETTINGS, ...saved }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export const settings: Settings = $state(load())

const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null

function applyTheme() {
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && !!media?.matches)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.lang = settings.lang === 'rw' ? 'rw' : 'en'
}

media?.addEventListener('change', applyTheme)

$effect.root(() => {
  $effect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings))
    applyTheme()
  })
})
