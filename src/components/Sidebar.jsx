import { useState } from 'react'
import { C } from '../styles'

export default function Sidebar({ teamName, screen }) {
  const [collapsed, setCollapsed] = useState(false)

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

      {/* Nav */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="sidebar-section">Diagnostic</div>}
        <div className={`sidebar-item${screen === 'quiz' || screen === 'home' ? ' active' : ''}`}>
          <span className="sidebar-dot" style={{ background: screen === 'home' ? 'rgba(255,255,255,0.35)' : C.jaune, border: screen === 'home' ? '1.5px dashed rgba(255,255,255,0.4)' : 'none' }} />
          <span className="sidebar-item-text">
            {teamName || 'Nouvelle équipe'}
          </span>
          {teamName && <span className="sidebar-pct">—</span>}
        </div>

        {!collapsed && <div className="sidebar-section" style={{ marginTop: 8 }}>Navigation</div>}
        {[
          { label: 'Accueil', icon: '⊞' },
          { label: 'Écosystème', icon: '◈', disabled: true },
        ].map(item => (
          <div key={item.label} className={`sidebar-item${item.disabled ? '' : ''}`}
            style={item.disabled ? { opacity: 0.45 } : {}}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
            <span className="sidebar-item-text">{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="btn btn-ghost btn-full" disabled style={{ opacity: 0.5, justifyContent: 'flex-start', gap: 8 }}>
          <span>↑</span>
          {!collapsed && <span>Exporter</span>}
        </button>
        {!collapsed && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 4 }}>
            v2.0 · Pierre-Cyril Denant
          </p>
        )}
      </div>
    </div>
  )
}
