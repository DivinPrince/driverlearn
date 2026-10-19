/**
 * Merge the enriched question chunks into src/data/questions.json.
 *
 *   bun scripts/build-data.ts [chunkDir]   (default /tmp/dl/enriched)
 *
 * - validates every question against the app schema
 * - drops exact duplicates (same stem, options and images), keeping the first
 * - renumbers ids 1..N in source order
 * - writes reviewer flags to scripts/data-flags.json (not shipped)
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const TOPICS = new Set(['rules', 'signs', 'markings', 'signals', 'priority', 'speed', 'overtaking', 'parking', 'lights', 'vehicle', 'safety', 'vulnerable'])
const dir = process.argv[2] ?? '/tmp/dl/enriched'
const root = join(import.meta.dir, '..')

interface Raw {
  id: number
  src: number
  topic: string
  q: { rw: string; en: string }
  images: string[]
  options: { rw: string; en: string; image: string }[]
  answer: number
  explain: { rw: string; en: string }
  sign: { rw: string; en: string }
  flags?: string[]
}

const files = readdirSync(dir)
  .filter((f) => /^chunk_\d+\.json$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
const all: Raw[] = files.flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as Raw[])
all.sort((a, b) => a.id - b.id)

const errors: string[] = []
const clean = (s: string) => s.replace(/\s+/g, ' ').trim()
for (const q of all) {
  const e = (m: string) => errors.push(`#${q.id}: ${m}`)
  if (!TOPICS.has(q.topic)) e(`bad topic ${q.topic}`)
  if (!q.q?.rw?.trim() || !q.q?.en?.trim()) e('empty stem')
  if (!q.explain?.rw?.trim() || !q.explain?.en?.trim()) e('empty explanation')
  if (q.options.length < 2) e('fewer than 2 options')
  if (!(q.answer >= 0 && q.answer < q.options.length)) e('answer out of range')
  for (const img of [...q.images, ...q.options.map((o) => o.image).filter(Boolean)])
    if (!existsSync(join(root, 'public/q', `${img}.webp`))) e(`missing image ${img}`)
  q.options.forEach((o, i) => {
    if (!o.image && (!o.rw.trim() || !o.en.trim())) e(`option ${i} empty`)
  })
}
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const seen = new Map<string, number>()
const kept: Raw[] = []
const dropped: { id: number; duplicateOf: number }[] = []
for (const q of all) {
  const key = [norm(q.q.rw), ...q.options.map((o) => norm(o.rw) + o.image).sort(), ...q.images].join('|')
  const first = seen.get(key)
  if (first !== undefined) {
    dropped.push({ id: q.id, duplicateOf: first })
    continue
  }
  seen.set(key, q.id)
  kept.push(q)
}

const flags: Record<string, { src: number; flags: string[] }> = {}
const out = kept.map((q, i) => {
  const id = i + 1
  if (q.flags?.length) flags[id] = { src: q.src, flags: q.flags }
  return {
    id,
    src: q.src,
    topic: q.topic,
    q: { rw: clean(q.q.rw), en: clean(q.q.en) },
    images: q.images,
    options: q.options.map((o) => ({ rw: clean(o.rw), en: clean(o.en), image: o.image })),
    answer: q.answer,
    explain: { rw: clean(q.explain.rw), en: clean(q.explain.en) },
    sign: { rw: clean(q.sign.rw), en: clean(q.sign.en) },
  }
})

writeFileSync(join(root, 'src/data/questions.json'), JSON.stringify(out))
writeFileSync(join(root, 'scripts/data-flags.json'), JSON.stringify({ dropped, flags }, null, 2))

const byTopic: Record<string, number> = {}
for (const q of out) byTopic[q.topic] = (byTopic[q.topic] ?? 0) + 1
console.log(`wrote ${out.length} questions (dropped ${dropped.length} duplicates) from ${files.length} chunks`)
console.log(byTopic)
console.log(`signs with meaning: ${out.filter((q) => q.images.length && q.sign.en).length}`)
console.log(`flagged: ${Object.keys(flags).length}`)
