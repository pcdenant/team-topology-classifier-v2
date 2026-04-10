import { useState, useEffect } from 'react'
import { QUESTION_DEFINITIONS } from '../engine'
import MultiSelectRank from '../components/MultiSelectRank'
import SingleChoice from '../components/SingleChoice'
import RankOnly from '../components/RankOnly'
import { C } from '../styles'

const SEGMENTS = 5

export default function QuizScreen({ questionId, answers, onAnswer, onBack, step, teamName }) {
  const [local, setLocal] = useState(answers[questionId] ?? null)
  const q = QUESTION_DEFINITIONS[questionId]

  useEffect(() => { setLocal(answers[questionId] ?? null) }, [questionId])

  const ready = () => {
    if (!local) return false
    if (q.type === 'multiselect_rank') return local.selected?.length >= 1
    if (q.type === 'rank_only') return true
    return true
  }

  const handleSingle = (val) => {
    setLocal(val)
    setTimeout(() => onAnswer(questionId, val), 280)
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
              onClick={() => ready() && onAnswer(questionId, local)}
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
