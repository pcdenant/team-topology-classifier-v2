import { C, TYPE_CLR, badge } from '../styles'

const TYPE_LABEL = {
  stream_aligned: 'Orientée valeur', platform: 'Plateforme',
  enabling: 'Accompagnement', complicated_subsystem: 'Sous-système', hybrid: 'Non définie'
}
const TYPE_SHORT = { stream_aligned: 'SA', platform: 'PL', enabling: 'EN', complicated_subsystem: 'CS', hybrid: '?' }
const CONF_LABEL = { high: 'Claire', medium: 'Brouillée', low: 'Absente' }
const CONF_CLR   = { high: C.vert, medium: C.warning, low: C.danger }
const CONF_BG    = { high: C.vertLight, medium: C.warningBg, low: C.dangerBg }
const MODE_META  = {
  roule:  { label: 'Ça roule',  clr: C.vert,    icon: '🟢' },
  frotte: { label: 'Ça frotte', clr: C.warning, icon: '🟡' },
  bloque: { label: 'Ça bloque', clr: C.danger,  icon: '🔴' },
}
const TT_TYPES = ['stream_aligned', 'platform', 'enabling', 'complicated_subsystem']
const TT_NAMES = { stream_aligned: 'Orientée valeur', platform: 'Plateforme', enabling: 'Accompagnement', complicated_subsystem: 'Sous-système' }

function detectDiagnostics(teams) {
  const completed = teams.filter(t => t.result)
  const diags = []

  const countByType  = (type) => completed.filter(t => t.result.type === type).length
  const countByConf  = (conf) => completed.filter(t => t.result.confidence === conf).length
  const saCount      = countByType('stream_aligned')
  const plCount      = countByType('platform')
  const enCount      = countByType('enabling')
  const csCount      = countByType('complicated_subsystem')
  const lowCount     = countByConf('low')
  const mediumCount  = countByConf('medium')

  if (lowCount >= 2)
    diags.push({ sev: 'danger', msg: `${lowCount} équipes en clarté absente`, action: 'Clarifier leur mandat avant toute autre action.' })

  if (mediumCount >= 2 && lowCount === 0)
    diags.push({ sev: 'warning', msg: `${mediumCount} équipes en clarté brouillée`, action: 'Organiser des ateliers de définition de mission.' })

  if (plCount === 0 && saCount >= 2)
    diags.push({ sev: 'warning', msg: 'Aucune équipe Platform', action: 'Envisager de créer une Platform team pour absorber l\'outillage commun.' })

  if (enCount === 0 && saCount >= 3)
    diags.push({ sev: 'info', msg: 'Aucune équipe Enabling', action: 'Vérifier si des gaps de compétence sont absorbés par les équipes Stream-aligned.' })

  if (plCount + enCount + csCount > saCount && saCount > 0)
    diags.push({ sev: 'warning', msg: 'Ratio inversé — plus d\'équipes support que Stream-aligned', action: 'Réévaluer la structure. Les équipes support doivent servir les Stream-aligned, pas l\'inverse.' })

  // Goulot detection
  const depCounts = {}
  teams.forEach(t => {
    (t.deps || []).forEach(d => {
      depCounts[d.targetId] = (depCounts[d.targetId] || 0) + 1
    })
  })
  Object.entries(depCounts).forEach(([tid, count]) => {
    if (count >= 3) {
      const target = teams.find(t => t.id === tid)
      diags.push({ sev: 'danger', msg: `Goulot détecté — ${target?.name ?? 'Équipe'} est sollicitée par ${count} équipes`, action: 'Passer les interactions en libre-service ou créer une équipe dédiée.' })
    }
  })

  // Systemic blocking
  const blocking = teams.flatMap(t => (t.deps || []).filter(d => d.mode === 'bloque'))
  if (blocking.length >= 2)
    diags.push({ sev: 'danger', msg: `${blocking.length} interactions bloquantes dans l'écosystème`, action: 'Prioriser la résolution des dépendances bloquantes avant tout autre chantier.' })

  return diags
}

function generateSummary(teams) {
  const completed = teams.filter(t => t.result)
  if (completed.length === 0) return ''
  const low    = completed.filter(t => t.result.confidence === 'low').length
  const high   = completed.filter(t => t.result.confidence === 'high').length
  const diags  = detectDiagnostics(teams)
  const danger = diags.filter(d => d.sev === 'danger')

  const parts = []
  if (high === completed.length) parts.push(`Toutes les équipes ont une clarté élevée.`)
  else if (low > 0) parts.push(`${low} équipe${low > 1 ? 's' : ''} en clarté absente.`)
  if (danger.length > 0) parts.push(danger[0].msg + '.')
  else parts.push('Aucune alerte critique détectée.')

  return parts.join(' ')
}

export default function EcosystemScreen({ teams, onViewTeam, onGoHome, onAddTeam }) {
  const completed = teams.filter(t => t.result)
  const diags     = detectDiagnostics(teams)
  const summary   = generateSummary(teams)

  const countByConf = (c) => completed.filter(t => t.result?.confidence === c).length

  // Build dependency map: { targetId: [{ from, mode }] }
  const depsByTarget = {}
  teams.forEach(t => {
    (t.deps || []).forEach(d => {
      if (!depsByTarget[d.targetId]) depsByTarget[d.targetId] = []
      depsByTarget[d.targetId].push({ from: t, mode: d.mode })
    })
  })

  return (
    <div>
      <div className="page-header">
        <p className="lbl" style={{ marginBottom: 4 }}>Vue d'ensemble</p>
        <h1 className="page-title">Écosystème</h1>
        {summary && <p className="page-sub" style={{ marginTop: 6, fontStyle: 'italic' }}>{summary}</p>}
      </div>

      {/* Metrics */}
      <div className="bento-metrics" style={{ marginBottom: 14 }}>
        {[
          { label: 'Claire',     key: 'high',   clr: C.vert,    bg: C.vertLight },
          { label: 'Brouillée', key: 'medium', clr: C.warning, bg: C.warningBg },
          { label: 'Absente',   key: 'low',    clr: C.danger,  bg: C.dangerBg },
        ].map(({ label, key, clr, bg }) => (
          <div key={key} className="card-creme" style={{ background: bg, padding: '20px 24px' }}>
            <div className="metric-val" style={{ color: clr }}>{countByConf(key)}</div>
            <div className="metric-label">Clarté {label}</div>
          </div>
        ))}
      </div>

      {/* Movement map — 2x2 bento */}
      <div style={{ marginBottom: 14 }}>
        <h2 className="section-title">Carte de composition</h2>
        <div className="bento-2col">
          {TT_TYPES.map(typeKey => {
            const inType = completed.filter(t => t.result?.type === typeKey)
            const tc = TYPE_CLR[typeKey]
            return (
              <div key={typeKey} className="card" style={{ borderTop: `3px solid ${tc}` }}>
                <p className="lbl" style={{ color: tc, marginBottom: 10 }}>{TT_NAMES[typeKey]}</p>
                {inType.length === 0 ? (
                  <p style={{ color: C.textLight, fontSize: 14 }}>—</p>
                ) : (
                  inType.map(t => {
                    const cc = CONF_CLR[t.result?.confidence] ?? C.textLight
                    return (
                      <div
                        key={t.id}
                        onClick={() => onViewTeam(t.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: cc, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text, borderBottom: `1px dotted ${C.vert}44` }}>
                          {t.name}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Dependencies */}
      {Object.keys(depsByTarget).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h2 className="section-title">Dépendances inter-équipes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(depsByTarget).map(([targetId, deps]) => {
              const target = teams.find(t => t.id === targetId)
              if (!target) return null
              const tc = TYPE_CLR[target.result?.type] ?? C.textLight
              return (
                <div key={targetId} className="card" style={{ borderLeft: `3px solid ${tc}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{target.name}</span>
                    <span style={badge(tc + '18', tc)}>{deps.length} dépendance{deps.length > 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {deps.map(({ from, mode }, i) => {
                      const mm = MODE_META[mode] ?? MODE_META.roule
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                          <span style={{ color: C.textLight, fontSize: 11 }}>←</span>
                          <span
                            style={{ fontWeight: 600, color: C.text, cursor: 'pointer', borderBottom: `1px dotted ${C.vert}44` }}
                            onClick={() => onViewTeam(from.id)}
                          >
                            {from.name}
                          </span>
                          <span style={{ marginLeft: 'auto', color: mm.clr, fontWeight: 600, fontSize: 12 }}>
                            {mm.icon} {mm.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Diagnostics */}
      {diags.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h2 className="section-title">Diagnostics automatiques</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {diags.map((d, i) => (
              <div key={i} className={`flag flag-${d.sev === 'info' ? 'info' : d.sev === 'warning' ? 'warning' : 'danger'}`}>
                <div className="flag-title">
                  {d.sev === 'danger' ? '🔴' : d.sev === 'warning' ? '🟡' : '🔵'} {d.msg}
                </div>
                <div className="flag-body">→ {d.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bento-1col">
        <div className="card" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sec" onClick={onGoHome}>← Accueil</button>
            <button className="btn btn-prim" onClick={onAddTeam}>+ Ajouter une équipe</button>
          </div>
        </div>
      </div>
    </div>
  )
}
