/**
 * Minimal hash router. Routes look like `#/exam/result/abc?x=1`.
 * `route.parts` holds the path segments, `route.query` the search params.
 */
export interface Route {
  path: string
  parts: string[]
  query: Record<string, string>
  /** Changes on every real navigation (hashchange) but not on replaceQuery(); used to re-create screens. */
  key: string
}

function parse(): Route {
  const raw = location.hash.replace(/^#/, '') || '/'
  const [pathPart, queryPart = ''] = raw.split('?')
  const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`
  return {
    path,
    parts: path.split('/').filter(Boolean),
    query: Object.fromEntries(new URLSearchParams(queryPart)),
    key: raw,
  }
}

export const route: Route = $state(parse())

window.addEventListener('hashchange', () => {
  const next = parse()
  route.path = next.path
  route.parts = next.parts
  route.query = next.query
  route.key = next.key
  window.scrollTo({ top: 0 })
})

/** Build an href for a route path, e.g. href('/practice', { topic: 'signs' }). */
export function href(path: string, query?: Record<string, string | number | undefined>): string {
  const q = query
    ? new URLSearchParams(
        Object.entries(query)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : ''
  return `#${path}${q ? `?${q}` : ''}`
}

export function navigate(path: string, query?: Record<string, string | number | undefined>, replace = false) {
  const url = href(path, query)
  if (replace) history.replaceState(null, '', url)
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'))
  else location.hash = url
}

/**
 * Update the query string of the current route without a hashchange, so the screen is not
 * re-created and scroll position is kept (e.g. live search filters). Keeps `route.query` in sync.
 */
export function replaceQuery(query: Record<string, string | number | undefined>) {
  const url = href(route.path, query)
  history.replaceState(history.state, '', url)
  route.query = parse().query
}

export function back(fallback = '/') {
  if (history.length > 1) history.back()
  else navigate(fallback)
}
