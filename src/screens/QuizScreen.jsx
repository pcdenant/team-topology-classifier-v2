import { useState } from 'react'
import { QUESTION_DEFINITIONS } from '../engine'
import MultiSelectRank from '../components/MultiSelectRank'
import SingleChoice from '../components/SingleChoice'
import RankOnly from '../components/RankOnly'
import { C } from '../styles'

const SEGMENTS = 5

function initialValue(q, existing) {
  if (existing) return existing
  if (q.type === 'rank_only') return { ranked: q.options.map(o => o.id) }
  return null
}

export default function QuizScreen({ questionId, answers, onAnswer, onBack, step, teamName }) {
  const q = QUESTION_DEFINITIONS[questionId]
  const [local, setLocal] = useState(() => initialValue(q, answers[questionId]))

  const ready = () => {
    if (q.type === 'rank_only') return Boolean(local?.ranked?.length)
    if (q.type === 'multiselect_rank') return Boolean(local?.selected?.length)
    if (q.type === 'single_choice') return Boolean(local)
    return false
  }

  const handleSingle = (val) => {
    setLocal(val)
    onAnswer(questionId, val)
  }

  const handleContinue = () => {
    if (ready()) onAnswer(questionId, local)
  }

  return (
    <div>
      {/* Progress segments */}
      <div className="eval-prog">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div key={i} className={`eval-seg${i < step ? ' done' : ''}`} />
        ))}
      </div>

      {/* Header */}
      <div className="quiz-header">
        <button className="btn btn-sec btn-sm" onClick={onBack} type="button">← Retour</button>
        <div style={{ textAlign: 'center' }}>
          {teamName && <p style={{ fontSize: 12, fontWeight: 700, color: C.vert, marginBottom: 2 }}>{teamName}</p>}
          <span className="quiz-step">Question {step} / {SEGMENTS} max</span>
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Question card */}
      <div className="card" style={{ marginBottom: 14 }}>
        <h2 className="quiz-question">{q.text}</h2>
        {q.instruction && <p className="quiz-inst">{q.instruction}</p>}

        {q.type === 'multiselect_rank' && (
          <MultiSelectRank options={q.options} value={local} onChange={setLocal} />
        )}
        {q.type === 'single_choice' && (
          <SingleChoice options={q.options} value={local} onChange={handleSingle} />
        )}
        {q.type === 'rank_only' && (
          <RankOnly options={q.options} value={local} onChange={setLocal} />
        )}

        {q.type !== 'single_choice' && (
          <div className="quiz-actions">
            <div />
            <button
              className="btn btn-prim"
              onClick={handleContinue}
              disabled={!ready()}
              type="button"
            >
              Continuer →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
