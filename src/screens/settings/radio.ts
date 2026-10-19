/**
 * Keyboard support for custom radio groups (WAI-ARIA radio group pattern):
 * Arrow keys move to the previous / next option and select it, Home / End jump to the ends.
 * Options must be rendered as `[role="radio"]` elements inside `group`, in the same order as `values`.
 */
export function radioKeydown<T>(e: KeyboardEvent, group: HTMLElement | undefined, values: readonly T[], current: T, select: (v: T) => void) {
  if (!values.length) return
  const i = values.indexOf(current)
  let next: number
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = i < 0 ? 0 : (i + 1) % values.length
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      next = i < 0 ? values.length - 1 : (i - 1 + values.length) % values.length
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = values.length - 1
      break
    default:
      return
  }
  e.preventDefault()
  if (values[next] !== current) select(values[next])
  group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}

/** Roving tabindex: only the checked option (or the first one when none is checked) is in the tab order. */
export function rovingTabindex<T>(values: readonly T[], current: T, value: T): 0 | -1 {
  const i = values.indexOf(current)
  return values.indexOf(value) === (i < 0 ? 0 : i) ? 0 : -1
}
