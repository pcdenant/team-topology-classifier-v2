import { useState, useMemo } from 'react'
import { derivePart2, TYPE_META } from '../engine'
import { C, TYPE_CLR, badge } from '../styles'

// ─── Constants ────────────────────────────────────────────────────
const SEVERITE_CLS = { danger: 'flag-danger', warning: 'flag-warning' }

const CONF_TAG = {
  fort:   { label: 'Fort',   color: C.vert },
  moyen:  { label: 'Moyen',  color: C.warning },
  faible: { label: 'Faible', color: C.textLight },
}

// Germane is inverted — low germane is bad, high is good
const CL_CLR = {
  intrinsic:  { FAIBLE: C.vert,      MODÉRÉ: C.warning, ÉLEVÉ: C.danger },
  extraneous: { FAIBLE: C.vert,      MODÉRÉ: C.warning, ÉLEVÉ: C.danger },
  germane:    { FAIBLE: C.danger,    MODÉRÉ: C.warning, ÉLEVÉ: C.vert },
}

const INTERACTION_ICON = { bloque: '🔴', frotte: '🔍', roule: '✅' }
const INTERACTION_CLR  = { bloque: C.danger, frotte: C.warning, roule: C.vert }

const ALL_TYPES = ['stream_aligned', 'platform', 'enabling', 'complicated_subsystem']
const TYPE_LABEL_LONG = {
  stream_aligned:        'Orientée valeur (SA)',
  platform:              'Plateforme',
  enabling:              'Accompagnement',
  complicated_subsystem: 'Sous-système complexe',
}

// ─── TriggerCard ──────────────────────────────────────────────────
function TriggerCard({ trigger, expanded, onToggle }) {
  const cls    = SEVERITE_CLS[trigger.severite] ?? 'flag-warning'
  const ctag   = CONF_TAG[trigger.confiance] ?? CONF_TAG.moyen

  return (
    <div
      className={`flag ${cls}`}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={onToggle}
    >
      <div className="flag-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{trigger.nom}</span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <span style={badge(ctag.color + '22', ctag.color)}>{ctag.label}</span>
          <span style={{ fontSize: 10, opacity: 0.6 }}>{expanded ? '▲' : '▼'}</span>
        </span>
      </div>
      <div className="flag-body">{trigger.message}</div>
      {expanded && (
        <p style={{ fontSize: 11, color: C.textLight, marginTop: 6, fontStyle: 'italic' }}>
          Source : {trigger.source}
        </p>
      )}
    </div>
  )
}

// ─── CognitiveLoadRow ─────────────────────────────────────────────
function CognitiveLoadRow({ label, axis, value }) {
  const clr = CL_CLR[axis]?.[value] ?? C.textLight
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: `1px solid ${C.borderLight}`,
    }}>
      <span style={{ fontSize: 13, color: C.textMuted }}>{label}</span>
      <span style={badge(clr + '22', clr)}>{value}</span>
    </div>
  )
}

// ─── InteractionCard ──────────────────────────────────────────────
function InteractionCard({ gap }) {
  const clr = INTERACTION_CLR[gap.current] ?? C.textLight
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{gap.teamName}</p>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>{INTERACTION_ICON[gap.current] ?? ''}</span>
          <span style={badge(clr + '22', clr)}>{gap.current}</span>
        </div>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: C.vert, marginBottom: 4 }}>
        → {gap.recommended}
      </p>
      <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.55 }}>{gap.rationale}</p>
    </div>
  )
}

// ─── FutureStateScreen ────────────────────────────────────────────
export default function FutureStateScreen({ team, teams, onConfirm, onBack }) {
  const { triggers, cognitiveLoadGap, interactionGaps, futureState } = useMemo(
    () => derivePart2(team, teams),
    [team, teams],
  )

  const [expandedId, setExpandedId]     = useState(null)
  const [showAdjust, setShowAdjust]     = useState(false)
  const [adjustedType, setAdjustedType] = useState(null)

  const resolvedType  = adjustedType ?? futureState.type
  const resolvedMeta  = TYPE_META[resolvedType] ?? null
  const resolvedColor = TYPE_CLR[resolvedType] ?? C.textLight
  const confTag       = CONF_TAG[futureState.confidence] ?? CONF_TAG.faible

  const handleConfirm = () =>
    onConfirm({ ...futureState, type: resolvedType, adjusted: adjustedType !== null })

  const toggleExpand = (id) =>
    setExpandedId(prev => (prev === id ? null : id))

  const applyAdjust = (t) => {
    setAdjustedType(t)
    setShowAdjust(false)
  }

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="page-header">
        <p className="lbl" style={{ marginBottom: 6 }}>Phase 2 — État cible</p>
        <h1 className="page-title">{team?.name ?? 'Équipe'}</h1>
        <p className="page-sub">
          Ce que vos réponses révèlent sur votre type cible et vos interactions.
        </p>
      </div>

      {/* ── Zone 1 — Triggers ──────────────────────────────────── */}
      {triggers.displayed.length > 0 && (
        <div className="bento-1col">
          <h3 className="section-title">Signaux détectés</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {triggers.displayed.map(t => (
              <TriggerCard
                key={t.id}
                trigger={t}
                expanded={expandedId === t.id}
                onToggle={() => toggleExpand(t.id)}
              />
            ))}
            {triggers.all.length > 3 && (
              <p style={{ fontSize: 12, color: C.textLight, textAlign: 'center', paddingTop: 2 }}>
                +{triggers.all.length - 3} signal{triggers.all.length - 3 > 1 ? 's' : ''} supplémentaire{triggers.all.length - 3 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Zone 2 — Future State ──────────────────────────────── */}
      <div className="bento-1col">
        <h3 className="section-title">Recommandation de type cible</h3>

        {resolvedType ? (
          <div className="type-card" style={{ '--type-color': resolvedColor }}>
            <p className="type-sub">{resolvedMeta?.subtitle ?? resolvedType}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <h2 className="type-name">{futureState.label}</h2>
              <span style={{ ...badge(confTag.color + '22', confTag.color), flexShrink: 0 }}>
                {confTag.label}
              </span>
            </div>
            <p className="type-desc">{resolvedMeta?.description ?? '—'}</p>

            {futureState.message && (
              <p style={{ fontSize: 13, color: C.textMuted, marginTop: 8, fontStyle: 'italic', lineHeight: 1.5 }}>
                {futureState.message}
              </p>
            )}

            {futureState.enablingTeam !== 'Non pertinente' && (
              <div style={{
                marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, background: C.bg,
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: futureState.enablingTeam === 'Recommandée' ? C.warning : C.textMuted,
                }}>
                  Enabling team : {futureState.enablingTeam}
                </span>
              </div>
            )}

            {adjustedType && (
              <p style={{ fontSize: 11, color: C.warning, marginTop: 10 }}>
                ⚠ Type ajusté manuellement — diverge de la recommandation moteur.
              </p>
            )}
          </div>
        ) : (
          <div className="flag flag-danger">
            <div className="flag-title">{futureState.label}</div>
            <div className="flag-body">
              La clarté du diagnostic est insuffisante pour recommander un type cible.
              Complétez ou corrigez les réponses de la Phase 1 pour continuer.
            </div>
          </div>
        )}

        {/* ── Type adjuster ──────────────────────────────────────── */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-tert" onClick={() => setShowAdjust(v => !v)}>
            {showAdjust ? 'Annuler' : '✎ Ajuster le type'}
          </button>
          {adjustedType && (
            <button className="btn btn-tert" onClick={() => setAdjustedType(null)}>
              ↺ Réinitialiser
            </button>
          )}
        </div>

        {showAdjust && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_TYPES.map(t => {
              const tc  = TYPE_CLR[t]
              const sel = resolvedType === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => applyAdjust(t)}
                  style={{
                    padding: '8px 14px', borderRadius: 8,
                    border: `1.5px solid ${sel ? tc : C.border}`,
                    background: sel ? tc + '15' : C.white,
                    color: sel ? tc : C.textMuted,
                    fontSize: 13, fontWeight: sel ? 700 : 400,
                    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                  }}
                >
                  {TYPE_LABEL_LONG[t]}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Zone 2b — Cognitive Load ───────────────────────────── */}
      <div className="bento-1col">
        <h3 className="section-title">Charge cognitive</h3>
        <div className="card" style={{ padding: '16px 20px' }}>
          <CognitiveLoadRow
            axis="intrinsic"
            label="Intrinsèque — complexité du domaine"
            value={cognitiveLoadGap.intrinsic}
          />
          <CognitiveLoadRow
            axis="extraneous"
            label="Extrinsèque — friction organisationnelle"
            value={cognitiveLoadGap.extraneous}
          />
          <CognitiveLoadRow
            axis="germane"
            label="Germinale — capacité d'amélioration continue"
            value={cognitiveLoadGap.germane}
          />
          {cognitiveLoadGap.germaneFragmented && (
            <p style={{ fontSize: 12, color: C.warning, marginTop: 10, fontStyle: 'italic', lineHeight: 1.5 }}>
              ⚠ Charge germinale fragmentée — plusieurs missions simultanées sans dominant clair.
            </p>
          )}
        </div>
      </div>

      {/* ── Zone 3 — Interaction gaps ──────────────────────────── */}
      {interactionGaps.length > 0 && (
        <div className="bento-1col">
          <h3 className="section-title">Mode d'interaction recommandé</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {interactionGaps.map(gap => (
              <InteractionCard key={gap.teamId} gap={gap} />
            ))}
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="bento-1col">
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-sec" onClick={onBack}>← Retour</button>
          <button className="btn btn-prim" onClick={handleConfirm}>
            Confirmer →
          </button>
        </div>
      </div>
    </div>
  )
}
