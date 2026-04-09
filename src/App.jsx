import { useState, useCallback } from 'react'
import { QUESTIONS, getNextQuestion, computeResult } from './engine'
import Sidebar from './components/Sidebar'
import HomeScreen from './screens/HomeScreen'
import QuizScreen from './screens/QuizScreen'
import ResultScreen from './screens/ResultScreen'
import './styles/main.css'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [answers, setAnswers] = useState({})
  const [qId, setQId] = useState(QUESTIONS.Q1)
  const [history, setHistory] = useState([])
  const [result, setResult] = useState(null)
  const [teamName, setTeamName] = useState('')

  const start = useCallback((name) => {
    setTeamName(name); setAnswers({}); setQId(QUESTIONS.Q1)
    setHistory([]); setResult(null); setScreen('quiz')
  }, [])

  const answer = useCallback((id, val) => {
    const na = { ...answers, [id]: val }
    setAnswers(na)
    const next = getNextQuestion(id, na)
    if (next === null) {
      const r = computeResult(na)
      setResult({ ...r, teamName }); setScreen('result')
    } else {
      setHistory(h => [...h, qId]); setQId(next)
    }
  }, [answers, qId, teamName])

  const back = useCallback(() => {
    if (history.length === 0) { setScreen('home'); return }
    const prev = history[history.length - 1]
    const na = { ...answers }; delete na[qId]
    setHistory(h => h.slice(0, -1)); setAnswers(na); setQId(prev)
  }, [history, qId, answers])

  const restart = useCallback(() => {
    setScreen('home'); setAnswers({}); setResult(null); setHistory([])
  }, [])

  return (
    <div className="app-shell">
      <Sidebar teamName={teamName} screen={screen} />
      <main className="main-content">
        {screen === 'home' && <HomeScreen onStart={start} />}
        {screen === 'quiz' && (
          <QuizScreen
            questionId={qId} answers={answers}
            onAnswer={answer} onBack={back}
            step={history.length + 1}
          />
        )}
        {screen === 'result' && result && (
          <ResultScreen result={result} onRestart={restart} />
        )}
      </main>
    </div>
  )
}
