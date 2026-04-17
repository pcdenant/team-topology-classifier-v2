import { useState } from 'react'
import { C, TYPE_CLR, badge } from '../styles'

const TYPE_LABEL = {
  stream_aligned: 'Orientée valeur', platform: 'Plateforme',
  enabling: 'Accompagnement', complicated_subsystem: 'Sous-système', hybrid: 'Non définie'
}
const TYPE_SHORT = {
  stream_aligned: 'SA', platform: 'PL',
  enabling: 'EN', complicated_subsystem: 'CS', hybrid: '?'
}
const CONF_LABEL = { high: 'Claire', medium: 'Brouillée', low: 'Absente' }
const CONF_CLR   = { high: C.vert, medium: C.warning, low: C.danger }
const CONF_BG    = { high: C.vertLight, medium: C.warningBg, low: C.dangerBg }

export default function HomeScreen({ teams, onStartNew, onViewTeam, onEvalTeam, onGoEcosystem, onReset }) {
  const [newName, setNewName] = useState('')
  const [showReset, setShowReset] = useState(false)

  const completed = teams.filter(t => t.result)
  const pending   = teams.filter(t => !t.result)

  const countByConf = (c) => completed.filter(t => t.result?.confidence === c).length

  // ── Empty state ───────────────────────────────────────────────
  if (teams.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-logo">TT</div>
        <h1 className="empty-title">Quel type d'équipe êtes-vous vraiment ?</h1>
        <p className="empty-desc">
          Diagnostiquez vos équipes en 3–5 minutes chacune. Identifiez les types,
          les gaps et les dépendances de votre directorate.
        </p>
        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted }}>
            Nom de la première équipe <span style={{ fontWeight: 400 }}>(optionnel)</span>
          </label>
          <input
            className="input"
            type="text"
            placeholder="ex. Équipe Paiement, Team Data..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onStartNew(newName)}
          />
        </div>
        <div className="empty-actions">
          <button className="btn btn-prim" onClick={() => onStartNew(newName)}>
            Commencer le diagnostic
          </button>
        </div>
        <div style={{ display: 'flex', gap: 20, color: C.textLight, fontSize: 12 }}>
          <span>⏱ 3–5 min / équipe</span>
          <span>❓ 5 questions max</span>
          <span>🔒 Aucune donnée transmise</span>
        </div>
      </div>
    )
  }

  // ── Dashboard state ───────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <p className="lbl" style={{ marginBottom: 4 }}>Tableau de bord</p>
        <h1 className="page-title">Vue d'ensemble</h1>
        <p className="page-sub">{teams.length} équipe{teams.length > 1 ? 's' : ''} · {completed.length} évaluée{completed.length > 1 ? 's' : ''}</p>
      </div>

      {/* Metrics — 3 tiles */}
      {completed.length > 0 && (
        <div className="bento-metrics" style={{ marginBottom: 14 }}>
          {[
            { label: 'Claire', key: 'high',   clr: C.vert,    bg: C.vertLight },
            { label: 'Brouillée', key: 'medium', clr: C.warning, bg: C.warningBg },
            { label: 'Absente', key: 'low',   clr: C.danger,  bg: C.dangerBg },
          ].map(({ label, key, clr, bg }) => (
            <div key={key} className="card-creme" style={{ background: bg, padding: '20px 24px' }}>
              <div className="metric-val" style={{ color: clr }}>{countByConf(key)}</div>
              <div className="metric-label">Clarté {label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Completed teams grid */}
      {completed.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h2 className="section-title">Équipes évaluées</h2>
          <div className="bento-2col">
            {completed.map(t => {
              const tc  = TYPE_CLR[t.result?.type] ?? C.textLight
              const cc  = CONF_CLR[t.result?.confidence] ?? C.textLight
              const cbg = CONF_BG[t.result?.confidence] ?? C.borderLight
              return (
                <div
                  key={t.id}
                  className="card-team"
                  style={{ '--team-border-color': tc }}
                  onClick={() => onViewTeam(t.id)}
                >
                  <div className="card-team-bar" style={{ background: tc }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{t.name}</p>
                      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{TYPE_LABEL[t.result?.type] ?? '—'}</p>
                    </div>
                    <span style={badge(cbg, cc)}>{CONF_LABEL[t.result?.confidence] ?? '—'}</span>
                  </div>
                  <div style={{ height: 6, background: C.borderLight, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: t.result?.confidence === 'high' ? '80%' : t.result?.confidence === 'medium' ? '55%' : '30%',
                      background: tc,
                      borderRadius: 3,
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                  <p style={{ fontSize: 11, color: C.textLight, marginTop: 8 }}>
                    {TYPE_SHORT[t.result?.type] ?? '?'} · Cliquez pour voir les résultats
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pending teams */}
      {pending.length > 0 && (
        <div className="bento-1col" style={{ marginBottom: 14 }}>
          <h2 className="section-title">En attente d'évaluation</h2>
          <div className="card-creme">
            {pending.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.borderLight}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px dashed ${C.textLight}`, display: 'inline-block' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t.name}</span>
                </div>
                <button className="btn btn-prim btn-sm" onClick={() => onEvalTeam(t.id)}>
                  Évaluer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bento-1col">
        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {/* Add team */}
          <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
            <input
              className="input"
              type="text"
              placeholder="Nom de la prochaine équipe..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && newName.trim() && onStartNew(newName)}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-prim"
              onClick={() => { onStartNew(newName); setNewName('') }}
              disabled={!newName.trim()}
            >
              + Ajouter
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {completed.length >= 2 && (
              <button className="btn btn-prim-vert" onClick={onGoEcosystem}>
                ◈ Voir l'écosystème
              </button>
            )}
            {showReset ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: C.danger }}>Supprimer tout ?</span>
                <button className="btn btn-danger btn-sm" onClick={onReset}>Confirmer</button>
                <button className="btn btn-tert btn-sm" onClick={() => setShowReset(false)}>Annuler</button>
              </div>
            ) : (
              <button className="btn btn-tert" onClick={() => setShowReset(true)}>↺ Réinitialiser</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
