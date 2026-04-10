import { useState } from 'react'
import { C, TYPE_CLR, badge } from '../styles'

const TYPE_LABEL = {
  stream_aligned: 'Orientée valeur', platform: 'Plateforme',
  enabling: 'Accompagnement', complicated_subsystem: 'Sous-système', hybrid: 'Non définie'
}

const MODES = [
  { id: 'roule',  label: '🟢 Ça roule',  desc: 'Auto-service, pas de friction',      clr: C.vert },
  { id: 'frotte', label: '🟡 Ça frotte', desc: 'Collaboration mais lente ou complexe', clr: C.warning },
  { id: 'bloque', label: '🔴 Ça bloque', desc: 'Dépendance qui ralentit livraison',    clr: C.danger },
]

export default function DepScreen({ team, otherTeams, onSave }) {
  // deps: [{ targetId, mode }]
  const [deps, setDeps] = useState(team?.deps ?? [])

  const toggleTeam = (targetId) => {
    if (deps.find(d => d.targetId === targetId)) {
      setDeps(prev => prev.filter(d => d.targetId !== targetId))
    } else {
      setDeps(prev => [...prev, { targetId, mode: 'roule' }])
    }
  }

  const setMode = (targetId, mode) => {
    setDeps(prev => prev.map(d => d.targetId === targetId ? { ...d, mode } : d))
  }

  const isSelected = (targetId) => deps.some(d => d.targetId === targetId)
  const getMode    = (targetId) => deps.find(d => d.targetId === targetId)?.mode ?? 'roule'

  return (
    <div>
      <div className="page-header">
        <p className="lbl" style={{ marginBottom: 6 }}>Dépendances</p>
        <h1 className="page-title">{team?.name ?? 'Équipe'}</h1>
        <p className="page-sub">De quelles équipes cette équipe dépend-elle pour livrer sa valeur ?</p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
          Sélectionnez les équipes dont <strong>{team?.name}</strong> dépend, puis qualifiez chaque dépendance.
          Ignorez cette étape si l'équipe est totalement indépendante.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {otherTeams.map(t => {
            const tc  = TYPE_CLR[t.result?.type] ?? C.textLight
            const sel = isSelected(t.id)
            const mode = getMode(t.id)

            return (
              <div key={t.id} style={{
                border: `1.5px solid ${sel ? tc : C.border}`,
                borderRadius: 12,
                overflow: 'hidden',
                transition: 'border-color 0.15s ease',
              }}>
                {/* Team header — click to toggle */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    background: sel ? tc + '10' : C.white,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onClick={() => toggleTeam(t.id)}
                >
                  <span style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${sel ? tc : C.border}`,
                    background: sel ? tc : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 10, color: C.white, fontWeight: 800,
                    transition: 'all 0.15s',
                  }}>
                    {sel && '✓'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: C.textMuted }}>{TYPE_LABEL[t.result?.type] ?? '—'}</p>
                  </div>
                  {sel && (
                    <span style={badge(tc + '22', tc)}>
                      {MODES.find(m => m.id === mode)?.label ?? '—'}
                    </span>
                  )}
                </div>

                {/* Mode selector — shown when selected */}
                {sel && (
                  <div style={{
                    padding: '10px 16px 14px',
                    background: C.bg,
                    borderTop: `1px solid ${C.borderLight}`,
                    display: 'flex', gap: 8, flexWrap: 'wrap',
                  }}>
                    {MODES.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(t.id, m.id)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 8,
                          border: `1.5px solid ${mode === m.id ? m.clr : C.border}`,
                          background: mode === m.id ? m.clr + '15' : C.white,
                          color: mode === m.id ? m.clr : C.textMuted,
                          fontSize: 13, fontWeight: mode === m.id ? 700 : 400,
                          cursor: 'pointer', transition: 'all 0.15s ease',
                          fontFamily: 'inherit',
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                    <p style={{ width: '100%', fontSize: 12, color: C.textLight, marginTop: 4 }}>
                      {MODES.find(m => m.id === mode)?.desc}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <p style={{ fontSize: 13, color: C.textMuted }}>
          {deps.length === 0
            ? 'Aucune dépendance — équipe indépendante'
            : `${deps.length} dépendance${deps.length > 1 ? 's' : ''} déclarée${deps.length > 1 ? 's' : ''}`
          }
        </p>
        <button className="btn btn-prim" onClick={() => onSave(deps)}>
          Terminer →
        </button>
      </div>
    </div>
  )
}
