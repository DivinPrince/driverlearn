import { settings } from './state/settings.svelte'

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (!settings.sound) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12) {
  const ac = audio()
  if (!ac) return
  const t0 = ac.currentTime + start
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

/** Small synthesized sound effects (no audio files needed). */
export const sfx = {
  correct() {
    tone(660, 0, 0.12, 'triangle')
    tone(990, 0.08, 0.2, 'triangle')
  },
  wrong() {
    tone(196, 0, 0.22, 'sawtooth', 0.05)
    tone(147, 0.1, 0.26, 'sawtooth', 0.05)
  },
  tap() {
    tone(520, 0, 0.05, 'sine', 0.05)
  },
  complete() {
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, 'triangle'))
  },
  fail() {
    ;[392, 349, 311].forEach((f, i) => tone(f, i * 0.14, 0.26, 'triangle', 0.08))
  },
  levelUp() {
    ;[523, 784, 659, 1047, 1319].forEach((f, i) => tone(f, i * 0.07, 0.25, 'square', 0.05))
  },
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* unsupported */
  }
}
