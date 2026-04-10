import { useState, useCallback, useEffect } from 'react'
import { QUESTIONS, getNextQuestion, computeResult } from './engine'
import Sidebar from './components/Sidebar'
import HomeScreen from './screens/HomeScreen'
import QuizScreen from './screens/QuizScreen'
import ResultScreen from './screens/ResultScreen'
import DepScreen from './screens/DepScreen'
import EcosystemScreen from './screens/EcosystemScreen'
import './styles/main.css'

const STORAGE_KEY = 'tt-classifier-teams-v2'

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function App() {
  const [teams, setTeams] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [screen, setScreen] = useState('home')

  // Quiz state
  const [activeTeamId, setActiveTeamId] = useState(null)
  const [answers, setAnswers] = useState({})
  const [qId, setQId] = useState(QUESTIONS.Q1)
  const [history, setHistory] = useState([])

  // ── Persistence ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setTeams(JSON.parse(saved))
    } catch (e) { /* silent */ }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(teams)) } catch (e) { /* silent */ }
  }, [teams, loaded])

  // ── Derived ───────────────────────────────────────────────────
  const activeTeam = teams.find(t => t.id === activeTeamId) ?? null
  const completedTeams = teams.filter(t => t.result)
  const pendingTeams = teams.filter(t => !t.result)

  // ── Team CRUD ─────────────────────────────────────────────────
  const addTeam = useCallback((name) => {
    const team = { id: genId(), name: name || 'Équipe sans nom', answers: {}, deps: [], result: null }
    setTeams(prev => [...prev, team])
    return team
  }, [])

  const updateTeamResult = useCallback((teamId, result, answers) => {
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, result, answers } : t
    ))
  }, [])

  const updateTeamDeps = useCallback((teamId, deps) => {
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, deps } : t
    ))
  }, [])

  const deleteTeam = useCallback((teamId) => {
    setTeams(prev => {
      const updated = prev.filter(t => t.id !== teamId)
      // Remove refs to deleted team from other teams' deps
      return updated.map(t => ({
        ...t,
        deps: (t.deps || []).filter(d => d.targetId !== teamId)
      }))
    })
  }, [])

  const resetAll = useCallback(() => {
    setTeams([])
    setScreen('home')
    try { localStorage.removeItem(STORAGE_KEY) } catch (e) { /* */ }
  }, [])

  // ── Navigation: Start quiz for new team ───────────────────────
  const startNewTeam = useCallback((name) => {
    const team = addTeam(name)
    setActiveTeamId(team.id)
    setAnswers({})
    setQId(QUESTIONS.Q1)
    setHistory([])
    setScreen('quiz')
  }, [addTeam])

  // ── Navigation: Re-evaluate existing team ─────────────────────
  const startExistingTeam = useCallback((teamId) => {
    const team = teams.find(t => t.id === teamId)
    if (!team) return
    setActiveTeamId(teamId)
    setAnswers(team.answers || {})
    setQId(QUESTIONS.Q1)
    setHistory([])
    setScreen('quiz')
  }, [teams])

  // ── Navigation: View result of team ──────────────────────────
  const viewTeamResult = useCallback((teamId) => {
    setActiveTeamId(teamId)
    setScreen('result')
  }, [])

  // ── Quiz: answer a question ───────────────────────────────────
  const answer = useCallback((id, val) => {
    const na = { ...answers, [id]: val }
    setAnswers(na)
    const next = getNextQuestion(id, na)
    if (next === null) {
      const r = computeResult(na)
      updateTeamResult(activeTeamId, r, na)
      setScreen('result')
    } else {
      setHistory(h => [...h, qId])
      setQId(next)
    }
  }, [answers, qId, activeTeamId, updateTeamResult])

  const back = useCallback(() => {
    if (history.length === 0) { setScreen('home'); return }
    const prev = history[history.length - 1]
    const na = { ...answers }; delete na[qId]
    setHistory(h => h.slice(0, -1))
    setAnswers(na)
    setQId(prev)
  }, [history, qId, answers])

  // ── After result: go to deps or home ─────────────────────────
  const afterResult = useCallback(() => {
    // Show dep screen if 2+ completed teams (current + at least 1 other)
    const otherCompleted = teams.filter(t => t.id !== activeTeamId && t.result)
    if (otherCompleted.length >= 1) {
      setScreen('dep')
    } else {
      setScreen('home')
    }
  }, [teams, activeTeamId])

  // ── Dep screen: save and go home ──────────────────────────────
  const saveDeps = useCallback((deps) => {
    updateTeamDeps(activeTeamId, deps)
    setScreen('home')
  }, [activeTeamId, updateTeamDeps])

  // ── Sidebar props ─────────────────────────────────────────────
  const goHome = useCallback(() => setScreen('home'), [])
  const goEcosystem = useCallback(() => setScreen('ecosystem'), [])

  if (!loaded) return null

  return (
    <div className="app-shell">
      <Sidebar
        teams={teams}
        activeTeamId={activeTeamId}
        screen={screen}
        onGoHome={goHome}
        onGoEcosystem={goEcosystem}
        onViewTeam={viewTeamResult}
      />
      <main className="main-content">
        {screen === 'home' && (
          <HomeScreen
            teams={teams}
            onStartNew={startNewTeam}
            onViewTeam={viewTeamResult}
            onEvalTeam={startExistingTeam}
            onDeleteTeam={deleteTeam}
            onGoEcosystem={goEcosystem}
            onReset={resetAll}
          />
        )}
        {screen === 'quiz' && (
          <QuizScreen
            questionId={qId}
            answers={answers}
            onAnswer={answer}
            onBack={back}
            step={history.length + 1}
            teamName={activeTeam?.name ?? ''}
          />
        )}
        {screen === 'result' && activeTeam?.result && (
          <ResultScreen
            result={{ ...activeTeam.result, teamName: activeTeam.name, answers: activeTeam.answers }}
            onContinue={afterResult}
            onEdit={() => startExistingTeam(activeTeamId)}
            onGoHome={goHome}
          />
        )}
        {screen === 'dep' && (
          <DepScreen
            team={activeTeam}
            otherTeams={teams.filter(t => t.id !== activeTeamId && t.result)}
            onSave={saveDeps}
          />
        )}
        {screen === 'ecosystem' && (
          <EcosystemScreen
            teams={teams}
            onViewTeam={viewTeamResult}
            onGoHome={goHome}
            onAddTeam={() => startNewTeam('')}
          />
        )}
      </main>
    </div>
  )
}
