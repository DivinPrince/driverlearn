import { describe, expect, test } from 'bun:test'
import { seeded } from '../../lib/engine/random'
import type { L10n, Question, TopicId } from '../../lib/types'
import { buildQuiz, clean, explanationOf, hasText, orderForStudy, pickDistractors, signSearchText } from './signs'

function sign(id: number, meaning: L10n, topic: TopicId = 'signs', explain: L10n = { en: '…', rw: '…' }): Question {
  return {
    id,
    src: id,
    topic,
    q: { rw: `q${id}`, en: `q${id}` },
    images: [`p${id}_0`],
    options: [0, 1, 2, 3].map((i) => ({ rw: `o${i}`, en: `o${i}`, image: '' })),
    answer: 0,
    explain,
    sign: meaning,
  }
}

const POOL = Array.from({ length: 12 }, (_, i) =>
  sign(i + 1, { en: `Meaning ${i + 1}`, rw: `Igisobanuro ${i + 1}` }, i % 3 === 0 ? 'markings' : 'signs'),
)

describe('signs helpers', () => {
  test('placeholders count as empty text', () => {
    expect(clean('…')).toBe('')
    expect(clean(' ... ')).toBe('')
    expect(clean(' Stop ')).toBe('Stop')
    expect(hasText({ en: '', rw: '…' })).toBe(false)
    expect(hasText({ en: '', rw: 'Hagarara' })).toBe(true)
    expect(explanationOf(sign(1, { en: 'a', rw: 'b' }))).toBeNull()
    expect(explanationOf(sign(1, { en: 'a', rw: 'b' }, 'signs', { en: 'Why', rw: '…' }))).toEqual({ en: 'Why', rw: '' })
  })

  test('search text is accent and case insensitive and skips placeholders', () => {
    const s = signSearchText(sign(7, { en: 'Turn LEFT only', rw: 'Kata ibumoso gusa' }))
    expect(s).toContain('turn left only')
    expect(s).toContain('kata ibumoso')
    expect(s).toContain('#7')
    expect(s).not.toContain('…')
  })

  test('study order puts unlearned signs first', () => {
    const learned = new Set([1, 2, 3, 4, 5, 6])
    const order = orderForStudy(POOL, learned, seeded(3))
    expect(order).toHaveLength(POOL.length)
    expect(order.slice(0, 6).every((q) => !learned.has(q.id))).toBe(true)
    expect(order.slice(6).every((q) => learned.has(q.id))).toBe(true)
  })

  test('distractors are distinct, exclude the answer and prefer the same topic', () => {
    const pool = [
      ...POOL,
      sign(50, { en: 'Meaning 1', rw: 'Ikindi' }), // same English as sign 1
      sign(51, { en: 'Another', rw: 'Igisobanuro 1' }), // same Kinyarwanda as sign 1
      sign(52, { en: 'Meaning 2', rw: 'Igisobanuro 2' }), // duplicate of sign 2
    ]
    for (let seed = 1; seed < 40; seed++) {
      const d = pickDistractors(pool[0], pool, 3, seeded(seed))
      expect(d).toHaveLength(3)
      const keys = d.flatMap((x) => [x.en.toLowerCase(), x.rw.toLowerCase()])
      expect(new Set(keys).size).toBe(keys.length)
      expect(keys).not.toContain('meaning 1')
      expect(keys).not.toContain('igisobanuro 1')
    }
    // sign 1 is a 'markings' sign: the other markings (4, 7, 10) are used first
    const d = pickDistractors(POOL[0], POOL, 3, seeded(9))
    expect(d.map((x) => x.en).sort()).toEqual(['Meaning 10', 'Meaning 4', 'Meaning 7'])
  })

  test('quiz rounds have unique signs and a valid answer index', () => {
    const quiz = buildQuiz(POOL, new Set(), 10, seeded(5))
    expect(quiz).toHaveLength(10)
    expect(new Set(quiz.map((i) => i.sign.id)).size).toBe(10)
    for (const item of quiz) {
      expect(item.choices).toHaveLength(4)
      expect(item.choices[item.answer]).toBe(item.sign.sign)
    }
  })

  test('quiz degrades with tiny pools', () => {
    expect(buildQuiz([POOL[0]], new Set(), 10)).toHaveLength(0)
    const two = buildQuiz(POOL.slice(0, 2), new Set(), 10, seeded(1))
    expect(two).toHaveLength(2)
    expect(two.every((i) => i.choices.length === 2)).toBe(true)
  })
})
