import { useState } from 'react'
import { C, TYPE_CLR } from '../styles'

const TYPE_SHORT = {
  stream_aligned: 'SA', platform: 'PL',
  enabling: 'EN', complicated_subsystem: 'CS', hybrid: '?'
}
const CONF_CLR = { high: C.vert, medium: C.warning, low: C.danger }

export default function Sidebar({ teams, activeTeamId, screen, onGoHome, onGoEcosystem, onViewTeam }) {
  const [collapsed, setCollapsed] = useState(false)

  const completed = teams.filter(t => t.result)
  const pending = teams.filter(t => !t.result)

  return (
    <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Agrandir' : 'Réduire'}>
        <div className="logo-mark">TT</div>
        {!collapsed && (
          <div className="logo-text">
            <span className="logo-name">Team Topology</span>
            <span className="logo-sub">Collaboration Solved</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {/* Navigation */}
        {!collapsed && <div className="sidebar-section">Navigation</div>}
        <div
          className={`sidebar-item${screen === 'home' ? ' active' : ''}`}
          onClick={onGoHome}
        >
          <span style={{ fontSize: 13, flexShrink: 0 }}>⊞</span>
          <span className="sidebar-item-text">Accueil</span>
        </div>
        <div
          className={`sidebar-item${screen === 'ecosystem' ? ' active' : ''}`}
          onClick={completed.length >= 2 ? onGoEcosystem : undefined}
          style={completed.length < 2 ? { opacity: 0.4, cursor: 'default' } : {}}
          title={completed.length < 2 ? 'Évaluez au moins 2 équipes' : ''}
        >
          <span style={{ fontSize: 13, flexShrink: 0 }}>◈</span>
          <span className="sidebar-item-text">Écosystème</span>
          {!collapsed && completed.length >= 2 && (
            <span className="sidebar-pct">{completed.length}</span>
          )}
        </div>

        {/* Completed teams */}
        {completed.length > 0 && (
          <>
            {!collapsed && <div className="sidebar-section" style={{ marginTop: 8 }}>Équipes</div>}
            {completed.map(t => {
              const clr = CONF_CLR[t.result?.confidence] ?? C.textLight
              const tc = TYPE_CLR[t.result?.type] ?? C.textLight
              return (
                <div
                  key={t.id}
                  className={`sidebar-item${t.id === activeTeamId && (screen === 'result') ? ' active' : ''}`}
                  onClick={() => onViewTeam(t.id)}
                >
                  <span className="sidebar-dot" style={{ background: clr }} />
                  <span className="sidebar-item-text" style={{ flex: 1 }}>{t.name}</span>
                  {!collapsed && (
                    <span className="sidebar-pct" style={{ color: tc }}>
                      {TYPE_SHORT[t.result?.type] ?? '?'}
                    </span>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* Pending teams */}
        {pending.length > 0 && (
          <>
            {!collapsed && <div className="sidebar-section" style={{ marginTop: 8 }}>En attente</div>}
            {pending.map(t => (
              <div key={t.id} className="sidebar-item" style={{ opacity: 0.5 }}>
                <span className="sidebar-dot dashed" />
                <span className="sidebar-item-text">{t.name}</span>
              </div>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
            v2.0 · Pierre-Cyril Denant
          </p>
        )}
      </div>
    </div>
  )
}
