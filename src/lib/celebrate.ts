import confetti from 'canvas-confetti'

const COLORS = ['#1597dc', '#fad201', '#1fb455', '#ffffff', '#8b5cf6']

function reducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Short confetti burst, e.g. for a correct-answer streak. */
export function burst(x = 0.5, y = 0.6) {
  if (reducedMotion()) return
  void confetti({ particleCount: 60, spread: 70, startVelocity: 35, origin: { x, y }, colors: COLORS, scalar: 0.9 })
}

/** Big two-sided celebration, e.g. for passing an exam or levelling up. */
export function celebrate(durationMs = 1600) {
  if (reducedMotion()) return
  const end = performance.now() + durationMs
  const frame = () => {
    void confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COLORS })
    void confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COLORS })
    if (performance.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
