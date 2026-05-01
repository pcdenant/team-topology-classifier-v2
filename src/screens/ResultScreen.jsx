import { C, TYPE_CLR, badge, transitionHint } from '../styles'
import {
  TEAM_TYPES,
  TYPE_META, CONFIDENCE_META, ALERT_META, SECONDARY_META,
  getSecondaryKey
} from '../engine'

const CONF_CLS   = { high: 'clarity-high', medium: 'clarity-medium', low: 'clarity-low' }
const CONF_LABEL = { high: 'Claire', medium: 'Brouillée', low: 'Absente' }
const CONF_BARS  = { high: 3, medium: 2, low: 1 }
const CONF_CLR   = { high: C.vert, medium: C.warning, low: C.danger }

export default function ResultScreen({ result, onContinue, onEdit, onGoHome, onGoFutureState }) {
  const { type, confidence, secondarySignals = [], alerts = [], teamName } = result
  // Fallback on HYBRID for unknown types (stale localStorage, engine drift) — never crash.
  const meta      = TYPE_META[type] ?? TYPE_META[TEAM_TYPES.HYBRID]
  const typeColor = TYPE_CLR[type] ?? C.textLight
  const confColor = CONF_CLR[confidence] ?? C.textLight

  const exportMD = () => {
    const lines = [
      `# Diagnostic Team Topology — ${teamName || 'Mon équipe'}`,
      `**Date :** ${new Date().toLocaleDateString('fr-CA')}`,
      '', `## Type : ${meta.label}`, '', meta.description, '',
      `## Indice de Clarté : ${CONF_LABEL[confidence]}`, '',
    ]
    if (secondarySignals.length > 0) {
      lines.push('## Signaux secondaires', '')
      secondarySignals.forEach(s => {
        const sm = SECONDARY_META[getSecondaryKey(type, s)]
        if (sm) lines.push(`### ${sm.title}`, sm.body, '')
      })
    }
    if (alerts.length > 0) {
      lines.push('## Points de vigilance', '')
      alerts.forEach(a => {
        const am = ALERT_META[a]
        if (am) lines.push(`### ${am.title}`, am.body, '')
      })
    }
    lines.push("## Plan d'action", '')
    meta.actions.forEach((a, i) => lines.push(
      `### ${i + 1}. ${a.title}`,
      `**Pourquoi :** ${a.why}`,
      `**Pourquoi maintenant :** ${a.why_now}`,
      `**Comment commencer :** ${a.how}`, ''
    ))
    lines.push('---', '*Team Topology Classifier — Collaboration Solved*')
    const b = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const u = URL.createObjectURL(b)
    const a = document.createElement('a')
    a.href = u; a.download = `diagnostic-${teamName || 'equipe'}.md`; a.click()
  }

  const exportJSON = () => {
    const data = {
      date: new Date().toISOString().split('T')[0],
      team_name: teamName || 'Non renseigné',
      type_dominant: type, score_confiance: confidence,
      signaux_secondaires: secondarySignals, alertes: alerts,
    }
    const b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const u = URL.createObjectURL(b)
    const a = document.createElement('a')
    a.href = u; a.download = `diagnostic-${teamName || 'equipe'}.json`; a.click()
  }

  return (
    <div>
      <div className="page-header">
        <p className="lbl" style={{ marginBottom: 6 }}>Résultats du diagnostic</p>
        <h1 className="page-title">{teamName || 'Mon équipe'}</h1>
      </div>

      {/* Type + Clarity */}
      <div className="bento-2col">
        <div className="type-card" style={{ '--type-color': typeColor }}>
          <p className="type-sub">{meta?.subtitle ?? type}</p>
          <h2 className="type-name">{meta.label}</h2>
          <p className="type-desc">{meta.description}</p>
        </div>
        <div className={`clarity-card ${CONF_CLS[confidence]}`}>
          <span className="clarity-label">Indice de Clarté</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="clarity-title">{CONF_LABEL[confidence]}</span>
              <span style={badge(confColor + '22', confColor)}>{CONF_LABEL[confidence]}</span>
            </div>
            <div className="clarity-bars" style={{ color: confColor }}>
              {[1, 2, 3].map(n => (
                <div key={n} className={`c-bar${n <= CONF_BARS[confidence] ? ' on' : ''}`} />
              ))}
            </div>
          </div>
          <p className="clarity-desc">{CONFIDENCE_META[confidence]?.description}</p>
        </div>
      </div>

      {/* M1 — Phrase de transition */}
      <p style={transitionHint}>
        Le type identifie <strong>où tu es</strong>.
        Tes interactions révèlent <strong>pourquoi ça coince</strong>.
      </p>

      {/* Secondary signals */}
      {secondarySignals.length > 0 && (
        <div className="bento-1col">
          <h3 className="section-title">Signaux secondaires</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {secondarySignals.map(s => {
              const sm = SECONDARY_META[getSecondaryKey(type, s)]
              const sc = TYPE_CLR[s] ?? C.textLight
              if (!sm) return null
              return (
                <div key={s} className="signal-card" style={{ '--sig-color': sc }}>
                  <div className="signal-hdr"><span className="signal-dot" /><span className="signal-title">{sm.title}</span></div>
                  <p className="signal-body">{sm.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bento-1col">
          <h3 className="section-title">Points de vigilance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map(a => {
              const am = ALERT_META[a]
              if (!am) return null
              const isWarn = a === 'bottleneck' || a === 'enabling_drift'
              return (
                <div key={a} className={`flag ${isWarn ? 'flag-warning' : 'flag-danger'}`}>
                  <div className="flag-title">{am.icon} {am.title}</div>
                  <div className="flag-body">{am.body}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action plan */}
      <div className="bento-1col">
        <h3 className="section-title">Plan d'action prioritaire</h3>
        <div className="card-creme">
          <p className="lbl" style={{ marginBottom: 14 }}>3 actions pour commencer cette semaine</p>
          <div className="action-list">
            {meta.actions.map((action, i) => (
              <div key={i} className="action-item">
                <div className="action-num">{i + 1}</div>
                <div className="action-body">
                  <div className="action-title">{action.title}</div>
                  <div className="action-rows">
                    {[['Pourquoi', action.why], ['Pourquoi maintenant', action.why_now], ['Comment commencer', action.how]].map(([l, v]) => (
                      <div key={l} className="action-row">
                        <span className="action-lbl">{l}</span>
                        <span className="action-txt">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phase 2 CTA */}
      <div className="bento-1col">
        <div className="p2-card">
          <p className="p2-title">Ce diagnostic reflète votre situation aujourd'hui.</p>
          <p className="p2-body">Il ne dit pas encore comment les autres vous perçoivent, ce que vous devriez devenir, ni comment gérer vos interactions.</p>
          <div className="p2-list">
            {['→ Perception externe', '→ Type cible', '→ Interactions souhaitées', '→ Plan de transformation complet'].map(x => (
              <span key={x} className="p2-item">{x}</span>
            ))}
          </div>
          {onGoFutureState
            ? <button className="btn btn-prim" onClick={onGoFutureState}>Phase 2 — État cible →</button>
            : <button className="btn btn-ghost" disabled style={{ opacity: 0.5 }}>Phase 2 — Bientôt disponible</button>
          }
        </div>
      </div>

      {/* Actions footer */}
      <div className="bento-1col">
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="export-row">
            <button className="btn btn-tert" onClick={exportMD}>↓ Markdown</button>
            <button className="btn btn-tert" onClick={exportJSON}>↓ JSON</button>
            <button className="btn btn-tert" onClick={onEdit}>✎ Modifier</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sec" onClick={onGoHome}>← Accueil</button>
            <button className="btn btn-prim" onClick={onContinue}>Continuer →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
