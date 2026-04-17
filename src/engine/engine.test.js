import { describe, it, expect } from 'vitest'
import { QUESTIONS, TEAM_TYPES, CONFIDENCE, ALERT_TYPES } from './types'
import { getNextQuestion, computeResult } from './branching'

// ────────────────────────────────────────────────────────────────
// Helpers pour construire les réponses dans un shape correct.
const ms = (ranked, selected) => ({
  ranked,
  selected: selected ?? [...ranked],
})
const ro = (ranked) => ({ ranked })

// ════════════════════════════════════════════════════════════════
// getNextQuestion — couverture de chaque transition du PRD
// ════════════════════════════════════════════════════════════════
describe('getNextQuestion — Q1', () => {
  it('A seul → terminal (Stream-aligned pur)', () => {
    expect(getNextQuestion(QUESTIONS.Q1, { q1: ms(['A']) })).toBeNull()
  })

  it('A dominant + C sélectionné → Q1B', () => {
    expect(getNextQuestion(QUESTIONS.Q1, { q1: ms(['A', 'C']) })).toBe(QUESTIONS.Q1B)
  })

  it('A dominant sans C → terminal', () => {
    expect(getNextQuestion(QUESTIONS.Q1, { q1: ms(['A', 'D']) })).toBeNull()
  })

  it('B dominant → Q3B', () => {
    expect(getNextQuestion(QUESTIONS.Q1, { q1: ms(['B']) })).toBe(QUESTIONS.Q3B)
  })

  it('C dominant → Q2', () => {
    expect(getNextQuestion(QUESTIONS.Q1, { q1: ms(['C']) })).toBe(QUESTIONS.Q2)
  })

  it('D dominant → Q2', () => {
    expect(getNextQuestion(QUESTIONS.Q1, { q1: ms(['D']) })).toBe(QUESTIONS.Q2)
  })
})

describe('getNextQuestion — Q1B', () => {
  it('us → terminal', () => {
    expect(getNextQuestion(QUESTIONS.Q1B, { q1b: 'us' })).toBeNull()
  })
  it('incoming → Q2', () => {
    expect(getNextQuestion(QUESTIONS.Q1B, { q1b: 'incoming' })).toBe(QUESTIONS.Q2)
  })
})

describe('getNextQuestion — Q2', () => {
  it('dominant=4 → Q3B', () => {
    expect(getNextQuestion(QUESTIONS.Q2, { q2: ms(['4']) })).toBe(QUESTIONS.Q3B)
  })
  it.each(['1', '2', '3'])('dominant=%s → Q3', (id) => {
    expect(getNextQuestion(QUESTIONS.Q2, { q2: ms([id]) })).toBe(QUESTIONS.Q3)
  })
})

describe('getNextQuestion — Q3', () => {
  it('autonomous → terminal', () => {
    expect(getNextQuestion(QUESTIONS.Q3, { q3: 'autonomous' })).toBeNull()
  })
  it('operational → Q3B', () => {
    expect(getNextQuestion(QUESTIONS.Q3, { q3: 'operational' })).toBe(QUESTIONS.Q3B)
  })
})

describe('getNextQuestion — Q3B', () => {
  it('few_critical → terminal', () => {
    expect(getNextQuestion(QUESTIONS.Q3B, { q3b: 'few_critical' })).toBeNull()
  })
  it('majority → Q3C', () => {
    expect(getNextQuestion(QUESTIONS.Q3B, { q3b: 'majority' })).toBe(QUESTIONS.Q3C)
  })
})

describe('getNextQuestion — Q3C & Q4', () => {
  it('Q3C est toujours terminal', () => {
    expect(getNextQuestion(QUESTIONS.Q3C, { q3c: 'self_service' })).toBeNull()
    expect(getNextQuestion(QUESTIONS.Q3C, { q3c: 'via_us' })).toBeNull()
  })
  it('Q4 est toujours terminal', () => {
    expect(getNextQuestion(QUESTIONS.Q4, { q4: ro(['domain', 'respond', 'initiative']) })).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════
// computeResult — couverture de chaque chemin du PRD
// ════════════════════════════════════════════════════════════════
describe('computeResult — chemins Stream-aligned', () => {
  it('A seul → SA / HIGH', () => {
    const r = computeResult({ q1: ms(['A']) })
    expect(r.type).toBe(TEAM_TYPES.STREAM_ALIGNED)
    expect(r.confidence).toBe(CONFIDENCE.HIGH)
  })

  it('A + C + Q1B=us → SA / MEDIUM', () => {
    const r = computeResult({ q1: ms(['A', 'C']), q1b: 'us' })
    expect(r.type).toBe(TEAM_TYPES.STREAM_ALIGNED)
    expect(r.confidence).toBe(CONFIDENCE.MEDIUM)
  })

  it('A + B + Q1B=us → SA avec signal secondaire CS', () => {
    const r = computeResult({ q1: ms(['A', 'B']), q1b: 'us' })
    expect(r.type).toBe(TEAM_TYPES.STREAM_ALIGNED)
    expect(r.secondarySignals).toContain(TEAM_TYPES.COMPLICATED_SUBSYSTEM)
  })
})

describe('computeResult — chemins B dominant (CS ou Platform)', () => {
  it('B + Q3B=few_critical → CS / HIGH', () => {
    const r = computeResult({ q1: ms(['B']), q3b: 'few_critical' })
    expect(r.type).toBe(TEAM_TYPES.COMPLICATED_SUBSYSTEM)
    expect(r.confidence).toBe(CONFIDENCE.HIGH)
  })

  it('B + Q3B=majority + Q3C=self_service → Platform / MEDIUM (sans alerte)', () => {
    const r = computeResult({ q1: ms(['B']), q3b: 'majority', q3c: 'self_service' })
    expect(r.type).toBe(TEAM_TYPES.PLATFORM)
    expect(r.confidence).toBe(CONFIDENCE.MEDIUM)
    expect(r.alerts).not.toContain(ALERT_TYPES.BOTTLENECK)
  })

  it('B + Q3B=majority + Q3C=via_us → Platform / MEDIUM + BOTTLENECK', () => {
    const r = computeResult({ q1: ms(['B']), q3b: 'majority', q3c: 'via_us' })
    expect(r.type).toBe(TEAM_TYPES.PLATFORM)
    expect(r.alerts).toContain(ALERT_TYPES.BOTTLENECK)
  })
})

describe('computeResult — chemins C/D → Q2=4 (sous-système ou plateforme spécialisée)', () => {
  it('C + Q2=4 + Q3B=few_critical → CS / HIGH', () => {
    const r = computeResult({ q1: ms(['C']), q2: ms(['4']), q3b: 'few_critical' })
    expect(r.type).toBe(TEAM_TYPES.COMPLICATED_SUBSYSTEM)
    expect(r.confidence).toBe(CONFIDENCE.HIGH)
  })

  it('D + Q2=4 + Q3B=majority + Q3C=via_us → Platform + BOTTLENECK', () => {
    const r = computeResult({ q1: ms(['D']), q2: ms(['4']), q3b: 'majority', q3c: 'via_us' })
    expect(r.type).toBe(TEAM_TYPES.PLATFORM)
    expect(r.alerts).toContain(ALERT_TYPES.BOTTLENECK)
  })
})

describe('computeResult — chemins C/D → Q2=1 (service)', () => {
  it('C + Q2=1 + Q3=autonomous → Enabling / MEDIUM', () => {
    const r = computeResult({ q1: ms(['C']), q2: ms(['1']), q3: 'autonomous' })
    expect(r.type).toBe(TEAM_TYPES.ENABLING)
    expect(r.confidence).toBe(CONFIDENCE.MEDIUM)
  })

  it('C + Q2=1 + Q3=operational + Q3B=few_critical → CS / MEDIUM + Platform secondary', () => {
    const r = computeResult({ q1: ms(['C']), q2: ms(['1']), q3: 'operational', q3b: 'few_critical' })
    expect(r.type).toBe(TEAM_TYPES.COMPLICATED_SUBSYSTEM)
    expect(r.secondarySignals).toContain(TEAM_TYPES.PLATFORM)
  })

  it('C + Q2=1 + Q3=operational + Q3B=majority + Q3C=self_service → Platform / HIGH', () => {
    const r = computeResult({ q1: ms(['C']), q2: ms(['1']), q3: 'operational', q3b: 'majority', q3c: 'self_service' })
    expect(r.type).toBe(TEAM_TYPES.PLATFORM)
    expect(r.confidence).toBe(CONFIDENCE.HIGH)
  })

  it('C + Q2=1 + Q3=operational + Q3B=majority + Q3C=via_us → Platform / HIGH + BOTTLENECK', () => {
    const r = computeResult({ q1: ms(['C']), q2: ms(['1']), q3: 'operational', q3b: 'majority', q3c: 'via_us' })
    expect(r.type).toBe(TEAM_TYPES.PLATFORM)
    expect(r.alerts).toContain(ALERT_TYPES.BOTTLENECK)
  })
})

describe('computeResult — chemins C/D → Q2=2 (coaching)', () => {
  it('C + Q2=2 + Q3=autonomous → Enabling / HIGH', () => {
    const r = computeResult({ q1: ms(['C']), q2: ms(['2']), q3: 'autonomous' })
    expect(r.type).toBe(TEAM_TYPES.ENABLING)
    expect(r.confidence).toBe(CONFIDENCE.HIGH)
  })

  it('C + Q2=2 + Q3=operational → Enabling avec alerte DRIFT', () => {
    const r = computeResult({ q1: ms(['C']), q2: ms(['2']), q3: 'operational' })
    expect(r.alerts).toContain(ALERT_TYPES.ENABLING_DRIFT)
  })
})

describe('computeResult — chemins C/D → Q2=3 (livrables)', () => {
  it('C + Q2=3 + Q3=autonomous → Enabling / MEDIUM + DRIFT', () => {
    const r = computeResult({ q1: ms(['C']), q2: ms(['3']), q3: 'autonomous' })
    expect(r.type).toBe(TEAM_TYPES.ENABLING)
    expect(r.alerts).toContain(ALERT_TYPES.ENABLING_DRIFT)
  })

  it('C + Q2=3 + Q3=operational + Q3B=few_critical → CS / MEDIUM', () => {
    const r = computeResult({ q1: ms(['C']), q2: ms(['3']), q3: 'operational', q3b: 'few_critical' })
    expect(r.type).toBe(TEAM_TYPES.COMPLICATED_SUBSYSTEM)
    expect(r.confidence).toBe(CONFIDENCE.MEDIUM)
  })

  it('C + Q2=3 + Q3=operational + Q3B=majority + Q3C=via_us → Platform / LOW + BOTTLENECK', () => {
    const r = computeResult({ q1: ms(['C']), q2: ms(['3']), q3: 'operational', q3b: 'majority', q3c: 'via_us' })
    expect(r.type).toBe(TEAM_TYPES.PLATFORM)
    expect(r.confidence).toBe(CONFIDENCE.LOW)
    expect(r.alerts).toContain(ALERT_TYPES.BOTTLENECK)
  })
})

describe('computeResult — chemin Q4 (pas de dominant Q1)', () => {
  it('Q4 domain → SA / MEDIUM', () => {
    const r = computeResult({ q1: ms([]), q4: ro(['domain', 'respond', 'initiative']) })
    expect(r.type).toBe(TEAM_TYPES.STREAM_ALIGNED)
    expect(r.confidence).toBe(CONFIDENCE.MEDIUM)
  })

  it('Q4 initiative → Enabling / LOW', () => {
    const r = computeResult({ q1: ms([]), q4: ro(['initiative', 'domain', 'respond']) })
    expect(r.type).toBe(TEAM_TYPES.ENABLING)
    expect(r.confidence).toBe(CONFIDENCE.LOW)
  })

  it('Q4 respond → Hybride / LOW', () => {
    const r = computeResult({ q1: ms([]), q4: ro(['respond', 'domain', 'initiative']) })
    expect(r.type).toBe(TEAM_TYPES.HYBRID)
    expect(r.confidence).toBe(CONFIDENCE.LOW)
  })
})

describe('computeResult — robustesse', () => {
  it('shape stable même sur réponses vides', () => {
    const r = computeResult({})
    expect(r).toMatchObject({
      type: expect.any(String),
      confidence: expect.any(String),
      secondarySignals: expect.any(Array),
      alerts: expect.any(Array),
    })
  })

  it('secondarySignals et alerts sont dédupliqués', () => {
    const r = computeResult({ q1: ms(['C']), q2: ms(['1', '2']), q3: 'operational', q3b: 'majority', q3c: 'via_us' })
    expect(new Set(r.secondarySignals).size).toBe(r.secondarySignals.length)
    expect(new Set(r.alerts).size).toBe(r.alerts.length)
  })

  it('Platform + Q2=2 selected → ajoute signal secondaire Enabling', () => {
    const r = computeResult({ q1: ms(['C']), q2: ms(['1', '2']), q3: 'operational', q3b: 'majority', q3c: 'self_service' })
    expect(r.type).toBe(TEAM_TYPES.PLATFORM)
    expect(r.secondarySignals).toContain(TEAM_TYPES.ENABLING)
  })
})

// ════════════════════════════════════════════════════════════════
// Bugs connus — documentés, à corriger en Phase 2.
// Ces tests sont écrits selon l'intention du PRD, pas selon le
// comportement actuel du moteur. `.fails` signifie « on sait que ça
// échoue aujourd'hui » — ils redeviendront des `it` normaux quand
// Phase 2 corrigera le moteur.
// ════════════════════════════════════════════════════════════════
describe('bugs connus (Phase 2)', () => {
  it.fails('A dominant + B sans C, sans Q1B → devrait être SA (bug A2)', () => {
    const r = computeResult({ q1: ms(['A', 'B']) })
    expect(r.type).toBe(TEAM_TYPES.STREAM_ALIGNED)
  })

  it.fails('A+B equal → devrait passer par Q3B (bug A3 — branche morte)', () => {
    // Q1 renvoie null au lieu de Q3B pour A dominant sans C.
    const next = getNextQuestion(QUESTIONS.Q1, { q1: ms(['A', 'B']) })
    expect(next).toBe(QUESTIONS.Q3B)
  })

  // Note A4 (indexOf <= 1 passe pour des ids absents) : aujourd'hui protégé
  // par les `hasSelection` qui entourent les usages. À resserrer en Phase 2
  // quand le moteur sera réécrit en table de décision (la comparaison d'index
  // disparaîtra).
})
