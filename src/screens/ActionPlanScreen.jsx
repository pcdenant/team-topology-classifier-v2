import { useState, useMemo } from 'react'
import { derivePart2 } from '../engine'
import { C, badge } from '../styles'
import { downloadMarkdownPart2 } from '../export/exportPart2'

// ─── Constants ────────────────────────────────────────────────────
const API_LABELS = {
  nom:         "Nom de l'équipe",
  typeActuel:  'Type actuel',
  typeCible:   'Type cible',
  mission:     'Mission approximative',
  outputs:     'Nature des outputs',
  modeAcces:   "Mode d'accès",
  partenaires: 'Partenaires',
  alertes:     'Alertes actives',
  slo:         'SLO / SLA',
  cadence:     'Cadence de changement',
  contact:     'Comment nous contacter',
}

function formatValue(value) {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    if (typeof value[0] === 'object' && value[0]?.teamName)
      return value.map(g => g.teamName).join(', ')
    return value.join(', ')
  }
  return String(value)
}

// ─── QuickWinCard ──────────────────────────────────────────────────
function QuickWinCard({ item, index }) {
  return (
    <div className="card-creme" style={{ marginBottom: 10 }}>
      <p className="lbl" style={{ marginBottom: 8, color: C.vert }}>
        🧪 Expérience #{index + 1} — {item.horizon}
      </p>
      <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12, lineHeight: 1.5 }}>
        {item.titre}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.vert, marginBottom: 3 }}>
            Critère de succès
          </p>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.55 }}>{item.critere}</p>
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textLight, marginBottom: 3 }}>
            Signal source
          </p>
          <p style={{ fontSize: 12, color: C.textLight, fontStyle: 'italic' }}>{item.source}</p>
        </div>
      </div>
    </div>
  )
}

// ─── StructuralItem ────────────────────────────────────────────────
function StructuralItem({ item, checked, onToggle }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '11px 0', borderBottom: `1px solid ${C.borderLight}`,
        opacity: checked ? 0.5 : 1, cursor: 'pointer',
        transition: 'opacity 0.15s',
      }}
      onClick={onToggle}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
        border: `2px solid ${checked ? C.vert : C.border}`,
        background: checked ? C.vert : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: C.white, fontSize: 11, fontWeight: 800, transition: 'all 0.15s',
      }}>
        {checked && '✓'}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: 14, color: C.text, lineHeight: 1.5,
          textDecoration: checked ? 'line-through' : 'none',
        }}>
          <strong style={{ marginRight: 6 }}>{item.priorite}.</strong>{item.action}
        </p>
        <p style={{ fontSize: 11, color: C.textLight, marginTop: 3 }}>{item.condition}</p>
      </div>
    </div>
  )
}

// ─── ApiField ──────────────────────────────────────────────────────
function ApiField({ label, field }) {
  const BG = { complete: C.white, partial: '#FEF3C7', empty: C.creme }
  const bg = BG[field.status] ?? C.creme

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: 12, padding: '10px 12px', borderRadius: 8, background: bg, marginBottom: 6,
    }}>
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: C.textLight, marginBottom: 3,
        }}>
          {label}
        </p>
        <p style={{
          fontSize: 13, lineHeight: 1.5,
          color: field.status === 'empty' ? C.textLight : C.text,
          fontStyle: field.status === 'empty' ? 'italic' : 'normal',
        }}>
          {formatValue(field.value)}
        </p>
      </div>
      {field.status === 'partial' && (
        <span style={badge('#FEF3C7', C.warning)}>à préciser</span>
      )}
      {field.status === 'empty' && (
        <span style={badge(C.creme, C.textLight)}>à compléter</span>
      )}
    </div>
  )
}

// ─── ActionPlanScreen ──────────────────────────────────────────────
export default function ActionPlanScreen({ team, teams, onGoHome, onBack }) {
  const { actionPlan, teamApiDraft } = useMemo(
    () => derivePart2(team, teams),
    [team, teams],
  )

  const [checked, setChecked]         = useState({})
  const [apiExpanded, setApiExpanded] = useState(false)

  const toggleCheck = (key) =>
    setChecked(prev => ({ ...prev, [key]: !prev[key] }))

  const prefilledCount = Object.values(teamApiDraft).filter(f => f.status !== 'empty').length

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="page-header">
        <p className="lbl" style={{ marginBottom: 6 }}>Phase 2 — Plan d'action</p>
        <h1 className="page-title">{team?.name ?? 'Équipe'}</h1>
        <p className="page-sub">3 horizons d'action issus de votre diagnostic.</p>
      </div>

      {/* ── Bloc 1 — Quick wins ────────────────────────────────── */}
      <div className="bento-1col">
        <h3 className="section-title">Quick wins — 48h</h3>
        {actionPlan.quickWins.length > 0 ? (
          actionPlan.quickWins.map((qw, i) => (
            <QuickWinCard key={i} item={qw} index={i} />
          ))
        ) : (
          <div className="card-creme">
            <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
              Aucune action prioritaire identifiée — le diagnostic ne révèle pas de signal fort à traiter immédiatement.
            </p>
          </div>
        )}
      </div>

      {/* ── Bloc 2 — Structurel ────────────────────────────────── */}
      <div className="bento-1col">
        <h3 className="section-title">Structurel — 1 à 3 mois</h3>
        <div className="card" style={{ padding: '8px 20px 4px' }}>
          {actionPlan.structural.length > 0 ? (
            actionPlan.structural.map(item => (
              <StructuralItem
                key={item.priorite}
                item={item}
                checked={!!checked[item.priorite]}
                onToggle={() => toggleCheck(item.priorite)}
              />
            ))
          ) : (
            <p style={{ fontSize: 14, color: C.textMuted, padding: '12px 0' }}>
              Aucun chantier structurel identifié pour ce profil.
            </p>
          )}
        </div>
      </div>

      {/* ── Bloc 3 — Systémique ─────────────────────────────────── */}
      <div className="bento-1col">
        <h3 className="section-title">Systémique — 3 à 6 mois</h3>
        <div className="card-vert">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {actionPlan.systemic.map(s => (
              <div key={s.etape} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.18)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: '#FFF200',
                }}>
                  {s.etape}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 3 }}>
                    {s.titre}
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Team API Draft — collapsible ────────────────────────── */}
      <div className="bento-1col">
        <button
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            width: '100%', background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', marginBottom: apiExpanded ? 12 : 0,
          }}
          onClick={() => setApiExpanded(v => !v)}
        >
          <h3 className="section-title" style={{ marginBottom: 0 }}>Team API Draft</h3>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={badge(C.vertLight, C.vert)}>{prefilledCount} champs préremplis</span>
            <span style={{ fontSize: 11, color: C.textLight }}>{apiExpanded ? '▲' : '▼'}</span>
          </span>
        </button>

        {apiExpanded && (
          <div>
            {Object.entries(API_LABELS).map(([key, label]) => (
              <ApiField key={key} label={label} field={teamApiDraft[key]} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="bento-1col">
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sec" onClick={onBack}>← Retour</button>
            <button className="btn btn-tert" onClick={() => downloadMarkdownPart2(team, teams)}>↓ Markdown</button>
          </div>
          <button className="btn btn-prim" onClick={onGoHome}>Accueil →</button>
        </div>
      </div>
    </div>
  )
}
