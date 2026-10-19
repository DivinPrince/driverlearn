/**
 * "Install the app" (PWA) state. This module is loaded with the app shell (SettingsScreen is
 * imported statically), so it can catch the one-off `beforeinstallprompt` event early.
 * The browser's own install UI is left untouched (no preventDefault).
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallPlatform = 'ios' | 'android' | 'desktop'

function standalone(): boolean {
  try {
    const nav = navigator as Navigator & { standalone?: boolean }
    return matchMedia('(display-mode: standalone)').matches || nav.standalone === true
  } catch {
    return false
  }
}

function platform(): InstallPlatform {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

let deferred: BeforeInstallPromptEvent | null = null

export const install = $state({
  /** Running as an installed app (home screen / standalone window). */
  installed: standalone(),
  /** The browser offered an install prompt we can trigger from a button. */
  canPrompt: false,
  platform: platform(),
})

addEventListener('beforeinstallprompt', (e) => {
  deferred = e as BeforeInstallPromptEvent
  install.canPrompt = true
})

addEventListener('appinstalled', () => {
  deferred = null
  install.canPrompt = false
  install.installed = true
})

/** Show the browser's install dialog. Resolves true when the learner accepted. */
export async function promptInstall(): Promise<boolean> {
  const e = deferred
  if (!e) return false
  deferred = null
  install.canPrompt = false
  try {
    await e.prompt()
    const choice = await e.userChoice
    return choice.outcome === 'accepted'
  } catch {
    return false
  }
}
