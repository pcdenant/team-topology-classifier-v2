import { describe, it, expect } from 'vitest'
import { QUESTIONS, getNextQuestion, computeResult } from './index'

// Smoke tests — verifient juste que le moteur tourne sans lancer d'exception.
// La vérification fine des règles est volontairement reportée à la Phase 1/2
// (certains cas actuels ont des bugs connus — cf. plan de refacto).
describe('engine smoke', () => {
  it('getNextQuestion returns null for terminal Q4', () => {
    expect(getNextQuestion(QUESTIONS.Q4, {})).toBeNull()
  })

  it('getNextQuestion handles A dominant alone → terminal', () => {
    const answers = { q1: { selected: ['A'], ranked: ['A'] } }
    expect(getNextQuestion(QUESTIONS.Q1, answers)).toBeNull()
  })

  it('computeResult always returns an object with the expected shape', () => {
    const r = computeResult({ q1: { selected: ['A'], ranked: ['A'] } })
    expect(r).toMatchObject({
      type: expect.any(String),
      confidence: expect.any(String),
      secondarySignals: expect.any(Array),
      alerts: expect.any(Array),
    })
  })

  it('computeResult does not throw on empty answers', () => {
    expect(() => computeResult({})).not.toThrow()
  })
})
