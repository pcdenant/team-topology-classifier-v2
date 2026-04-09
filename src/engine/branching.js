import { QUESTIONS, TEAM_TYPES, CONFIDENCE, ALERT_TYPES } from './types'

// ─── Helper: get dominant selection from ranked multiselect ────
const getDominant = (ranked) => ranked?.[0] ?? null

const hasSelection = (ranked, id) => ranked?.includes(id)

// ─── Next question logic ────────────────────────────────────────
export function getNextQuestion(currentQuestion, answers) {
  const { q1, q1b, q2, q3, q3b } = answers

  switch (currentQuestion) {

    case QUESTIONS.Q1: {
      const ranked = q1?.ranked ?? []
      const selected = q1?.selected ?? []
      const dominant = getDominant(ranked)

      // A alone → Stream-aligned, no more questions
      if (dominant === 'A' && selected.length === 1) return null

      // B dominant → shortcut to Q3b
      if (dominant === 'B') return QUESTIONS.Q3B

      // A dominant + C also selected → Q1b
      if (dominant === 'A' && hasSelection(selected, 'C')) return QUESTIONS.Q1B

      // A dominant (no C) → Stream-aligned
      if (dominant === 'A') return null

      // C or D dominant → Q2
      if (dominant === 'C' || dominant === 'D') return QUESTIONS.Q2

      // A + B equal (both in top 2, no clear winner)
      if (hasSelection(selected, 'A') && hasSelection(selected, 'B') && ranked.indexOf('A') <= 1 && ranked.indexOf('B') <= 1) return QUESTIONS.Q3B

      // No dominant → Q4
      return QUESTIONS.Q4
    }

    case QUESTIONS.Q1B: {
      if (q1b === 'us') return null          // Stream-aligned confirmed
      if (q1b === 'incoming') return QUESTIONS.Q2
      return null
    }

    case QUESTIONS.Q2: {
      const ranked = q2?.ranked ?? []
      const dominant = getDominant(ranked)

      if (dominant === '4') return QUESTIONS.Q3B
      if (dominant === '1' || dominant === '2' || dominant === '3') return QUESTIONS.Q3
      return QUESTIONS.Q4
    }

    case QUESTIONS.Q3: {
      if (q3 === 'autonomous') return null   // Enabling (with possible alert)
      if (q3 === 'operational') return QUESTIONS.Q3B
      return null
    }

    case QUESTIONS.Q3B: {
      if (q3b === 'few_critical') return null  // CS confirmed
      if (q3b === 'majority') return QUESTIONS.Q3C
      return null
    }

    case QUESTIONS.Q3C:
      return null   // Always terminal

    case QUESTIONS.Q4:
      return null   // Always terminal

    default:
      return null
  }
}

// ─── Compute final result ───────────────────────────────────────
export function computeResult(answers) {
  const { q1, q1b, q2, q3, q3b, q3c, q4 } = answers

  const q1Ranked = q1?.ranked ?? []
  const q1Selected = q1?.selected ?? []
  const q1Dominant = getDominant(q1Ranked)

  const q2Ranked = q2?.ranked ?? []
  const q2Dominant = getDominant(q2Ranked)

  let type = TEAM_TYPES.HYBRID
  let confidence = CONFIDENCE.LOW
  let secondarySignals = []
  let alerts = []

  // ── PATH: A dominant (alone or with Q1b=us) ──────────────────
  if (
    (q1Dominant === 'A' && q1Selected.length === 1) ||
    (q1Dominant === 'A' && q1b === 'us')
  ) {
    type = TEAM_TYPES.STREAM_ALIGNED
    confidence = q1Selected.length === 1 ? CONFIDENCE.HIGH : CONFIDENCE.MEDIUM

    // CS secondary signal if B also selected
    if (hasSelection(q1Selected, 'B')) {
      secondarySignals.push(TEAM_TYPES.COMPLICATED_SUBSYSTEM)
    }
  }

  // ── PATH: B dominant → Q3b ───────────────────────────────────
  else if (q1Dominant === 'B') {
    if (q3b === 'few_critical') {
      type = TEAM_TYPES.COMPLICATED_SUBSYSTEM
      confidence = CONFIDENCE.HIGH
    } else if (q3b === 'majority') {
      if (q3c === 'self_service') {
        type = TEAM_TYPES.PLATFORM
        confidence = CONFIDENCE.MEDIUM
      } else if (q3c === 'via_us') {
        type = TEAM_TYPES.PLATFORM
        confidence = CONFIDENCE.MEDIUM
        alerts.push(ALERT_TYPES.BOTTLENECK)
      }
    }
    // A+B equal — hybrid SA/CS
    if (
      hasSelection(q1Selected, 'A') &&
      q1Ranked.indexOf('A') <= 1 &&
      q1Ranked.indexOf('B') <= 1 &&
      !q3b
    ) {
      type = TEAM_TYPES.HYBRID
      confidence = CONFIDENCE.LOW
      secondarySignals = [TEAM_TYPES.STREAM_ALIGNED, TEAM_TYPES.COMPLICATED_SUBSYSTEM]
    }
  }

  // ── PATH: C or D dominant → Q2 → Q3/Q3b/Q3c ─────────────────
  else if (q1Dominant === 'C' || q1Dominant === 'D') {

    // Q2 #4 dominant → Q3b
    if (q2Dominant === '4') {
      if (q3b === 'few_critical') {
        type = TEAM_TYPES.COMPLICATED_SUBSYSTEM
        confidence = CONFIDENCE.HIGH
      } else if (q3b === 'majority') {
        if (q3c === 'self_service') {
          type = TEAM_TYPES.PLATFORM
          confidence = CONFIDENCE.MEDIUM
        } else if (q3c === 'via_us') {
          type = TEAM_TYPES.PLATFORM
          confidence = CONFIDENCE.MEDIUM
          alerts.push(ALERT_TYPES.BOTTLENECK)
        }
      }
    }

    // Q2 #1 dominant → Q3
    else if (q2Dominant === '1') {
      if (q3 === 'autonomous') {
        type = TEAM_TYPES.ENABLING
        confidence = CONFIDENCE.MEDIUM
        // Rare case — service + autonomous = possible drift
      } else if (q3 === 'operational') {
        if (q3b === 'few_critical') {
          type = TEAM_TYPES.COMPLICATED_SUBSYSTEM
          confidence = CONFIDENCE.MEDIUM
          secondarySignals.push(TEAM_TYPES.PLATFORM)
        } else if (q3b === 'majority') {
          if (q3c === 'self_service') {
            type = TEAM_TYPES.PLATFORM
            confidence = CONFIDENCE.HIGH
          } else if (q3c === 'via_us') {
            type = TEAM_TYPES.PLATFORM
            confidence = CONFIDENCE.HIGH
            alerts.push(ALERT_TYPES.BOTTLENECK)
          }
        }
      }
    }

    // Q2 #2 dominant → Q3 (Enabling path)
    else if (q2Dominant === '2') {
      if (q3 === 'autonomous') {
        type = TEAM_TYPES.ENABLING
        confidence = CONFIDENCE.HIGH
      } else if (q3 === 'operational') {
        // Enabling that became permanent dependency
        type = TEAM_TYPES.ENABLING
        confidence = CONFIDENCE.MEDIUM
        alerts.push(ALERT_TYPES.ENABLING_DRIFT)
        if (q3b === 'majority') {
          if (q3c === 'self_service') {
            type = TEAM_TYPES.PLATFORM
          } else {
            alerts.push(ALERT_TYPES.BOTTLENECK)
          }
        }
      }
    }

    // Q2 #3 dominant → Q3 (ambiguous Enabling/CS)
    else if (q2Dominant === '3') {
      if (q3 === 'autonomous') {
        type = TEAM_TYPES.ENABLING
        confidence = CONFIDENCE.MEDIUM
        alerts.push(ALERT_TYPES.ENABLING_DRIFT)
      } else if (q3 === 'operational') {
        if (q3b === 'few_critical') {
          type = TEAM_TYPES.COMPLICATED_SUBSYSTEM
          confidence = CONFIDENCE.MEDIUM
        } else if (q3b === 'majority') {
          if (q3c === 'self_service') {
            type = TEAM_TYPES.PLATFORM
            confidence = CONFIDENCE.MEDIUM
          } else {
            type = TEAM_TYPES.PLATFORM
            confidence = CONFIDENCE.LOW
            alerts.push(ALERT_TYPES.BOTTLENECK)
          }
        }
      }
    }
  }

  // ── PATH: Q4 (no dominant in Q1) ─────────────────────────────
  else if (q4) {
    const q4Ranked = q4.ranked ?? []
    const q4Dominant = getDominant(q4Ranked)

    if (q4Dominant === 'domain') {
      type = TEAM_TYPES.STREAM_ALIGNED
      confidence = CONFIDENCE.MEDIUM
    } else if (q4Dominant === 'respond') {
      // Would need Q2 but Q4 is terminal — flag as hybrid
      type = TEAM_TYPES.HYBRID
      confidence = CONFIDENCE.LOW
    } else if (q4Dominant === 'initiative') {
      type = TEAM_TYPES.ENABLING
      confidence = CONFIDENCE.LOW
    } else {
      type = TEAM_TYPES.HYBRID
      confidence = CONFIDENCE.LOW
      alerts.push(ALERT_TYPES.UNDEFINED_MISSION)
    }
  }

  // ── PATH: A+B equal → Hybrid SA/CS ───────────────────────────
  if (
    q1Dominant === 'A' &&
    hasSelection(q1Selected, 'B') &&
    !q1b &&
    type === TEAM_TYPES.HYBRID
  ) {
    secondarySignals = [TEAM_TYPES.STREAM_ALIGNED, TEAM_TYPES.COMPLICATED_SUBSYSTEM]
    confidence = CONFIDENCE.LOW
  }

  // ── Enabling secondary for Platform with Q2 mix ──────────────
  if (
    type === TEAM_TYPES.PLATFORM &&
    q2?.selected?.includes('2')
  ) {
    if (!secondarySignals.includes(TEAM_TYPES.ENABLING)) {
      secondarySignals.push(TEAM_TYPES.ENABLING)
    }
  }

  // ── CS secondary for SA with B selected ──────────────────────
  if (
    type === TEAM_TYPES.STREAM_ALIGNED &&
    hasSelection(q1Selected, 'B') &&
    !secondarySignals.includes(TEAM_TYPES.COMPLICATED_SUBSYSTEM)
  ) {
    secondarySignals.push(TEAM_TYPES.COMPLICATED_SUBSYSTEM)
  }

  return {
    type,
    confidence,
    secondarySignals: [...new Set(secondarySignals)],
    alerts: [...new Set(alerts)],
    answers,
  }
}
