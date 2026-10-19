import { describe, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { TOPICS } from '../lib/topics'
import type { Question } from '../lib/types'
import raw from './questions.json'

const questions = raw as Question[]
const publicDir = join(import.meta.dir, '../../public/q')
const topicIds = new Set(TOPICS.map((t) => t.id))

describe('question bank', () => {
  test('has the full bank with sequential ids', () => {
    expect(questions.length).toBeGreaterThan(390)
    questions.forEach((q, i) => expect(q.id).toBe(i + 1))
  })

  test('every question is well formed', () => {
    for (const q of questions) {
      expect(topicIds.has(q.topic)).toBe(true)
      expect(q.q.rw.trim().length).toBeGreaterThan(0)
      expect(q.q.en.trim().length).toBeGreaterThan(0)
      expect(q.options.length).toBeGreaterThanOrEqual(2)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(q.options.length)
      for (const o of q.options) {
        if (!o.image) {
          expect(o.rw.trim().length).toBeGreaterThan(0)
          expect(o.en.trim().length).toBeGreaterThan(0)
        }
      }
    }
  })

  test('every referenced image exists', () => {
    for (const q of questions)
      for (const img of [...q.images, ...q.options.map((o) => o.image).filter(Boolean)])
        expect(existsSync(join(publicDir, `${img}.webp`))).toBe(true)
  })

  test('every topic has questions', () => {
    for (const t of TOPICS) expect(questions.some((q) => q.topic === t.id)).toBe(true)
  })

  test('explanations are present in both languages', () => {
    for (const q of questions) {
      expect(q.explain.en.trim().length).toBeGreaterThan(10)
      expect(q.explain.rw.trim().length).toBeGreaterThan(10)
    }
  })

  test('no duplicate questions', () => {
    const keys = questions.map((q) => [q.q.rw, ...q.options.map((o) => o.rw + o.image), ...q.images].join('|').toLowerCase())
    expect(new Set(keys).size).toBe(keys.length)
  })
})
