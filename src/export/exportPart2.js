import { derivePart2 } from '../engine'

// ─── Mappings ──────────────────────────────────────────────────────
const SEVERITY_ICON  = { danger: '🔴', warning: '🟡' }
const STATUS_ICON    = { complete: '✅', partial: '⚠️', empty: '❌' }
const STATUS_LABEL   = { complete: 'Complet', partial: 'À préciser', empty: 'À compléter' }

const API_LABELS = {
  nom:         "Nom de l'équipe",
  typeActuel:  'Type actuel',
  typeCible:   'Type cible',
  mission:     'Mission',
  outputs:     'Outputs',
  modeAcces:   "Mode d'accès",
  partenaires: 'Partenaires',
  alertes:     'Alertes',
  slo:         'SLO / SLA',
  cadence:     'Cadence',
  contact:     'Contact',
}

function fmtValue(value) {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    if (typeof value[0] === 'object' && value[0]?.teamName)
      return value.map(g => g.teamName).join(', ')
    return value.join(', ')
  }
  return String(value)
}

// ─── generateMarkdownPart2 ────────────────────────────────────────
// Pure function: team + part2Output → markdown string.
// Never reads from the DOM — always generated from raw data.
export function generateMarkdownPart2(team, part2Output) {
  const { triggers, cognitiveLoadGap, actionPlan, teamApiDraft, futureState } = part2Output
  const date = new Date().toLocaleDateString('fr-CA')

  const L = []
  const push = (...lines) => L.push(...lines)

  // ── Header ──────────────────────────────────────────────────────
  push(
    `# Rapport Partie 2 — ${team.name}`,
    `Généré le ${date} · Team Topology Classifier — Collaboration Solved`,
    '',
  )

  // ── Future State ────────────────────────────────────────────────
  push('## Future State', '')
  push(`**Type cible :** ${futureState.label}`)
  if (futureState.type)
    push(`**Type :** ${futureState.type}`)
  push(`**Confiance :** ${futureState.confidence}`)
  if (futureState.enablingTeam && futureState.enablingTeam !== 'Non pertinente')
    push(`**Enabling team :** ${futureState.enablingTeam}`)
  if (futureState.message)
    push('', `> ${futureState.message}`)
  push('')

  // ── Signaux détectés ────────────────────────────────────────────
  if (triggers.all.length > 0) {
    push('## Signaux détectés', '')
    triggers.all.forEach(t => {
      const icon = SEVERITY_ICON[t.severite] ?? '⚪'
      push(`- ${icon} **${t.nom}** — confiance : ${t.confiance}`)
      push(`  ${t.message}`)
    })
    push('')
  }

  // ── Charge cognitive ────────────────────────────────────────────
  push(
    '## Charge cognitive', '',
    `- Intrinsèque : **${cognitiveLoadGap.intrinsic}**`,
    `- Extrinsèque : **${cognitiveLoadGap.extraneous}**`,
    `- Germinale   : **${cognitiveLoadGap.germane}**`,
  )
  if (cognitiveLoadGap.germaneFragmented)
    push('- ⚠️ Charge germinale fragmentée — plusieurs missions sans dominant clair')
  push('')

  // ── Plan d'action ───────────────────────────────────────────────
  push("## Plan d'action", '')

  push('### Quick wins (< 2 semaines)', '')
  if (actionPlan.quickWins.length > 0) {
    actionPlan.quickWins.forEach(qw => {
      push(`- [ ] ${qw.titre}`)
      push(`  - Critère : ${qw.critere}`)
      push(`  - Source  : ${qw.source}`)
    })
  } else {
    push('_Aucune action prioritaire identifiée._')
  }
  push('')

  push('### Structurel (1-3 mois)', '')
  if (actionPlan.structural.length > 0) {
    actionPlan.structural.forEach(s => push(`- [ ] ${s.action}`))
  } else {
    push('_Aucun chantier structurel identifié._')
  }
  push('')

  push('### Systémique (3-6 mois)', '')
  actionPlan.systemic.forEach(s => {
    push(`${s.etape}. **${s.titre}** — ${s.description}`)
  })
  push('')

  // ── Team API Draft ───────────────────────────────────────────────
  push('## Team API Draft', '')
  push('| Champ | Valeur | Statut |')
  push('|---|---|---|')
  Object.entries(API_LABELS).forEach(([key, label]) => {
    const field = teamApiDraft[key]
    const icon  = STATUS_ICON[field.status]  ?? '❌'
    const lbl   = STATUS_LABEL[field.status] ?? 'À compléter'
    push(`| ${label} | ${fmtValue(field.value)} | ${icon} ${lbl} |`)
  })
  push('')

  push('---', '_Team Topology Classifier — Collaboration Solved_')

  return L.join('\n')
}

// ─── downloadMarkdownPart2 ────────────────────────────────────────
// Derives part2 output, generates MD, triggers browser download.
export function downloadMarkdownPart2(team, teams) {
  const part2Output = derivePart2(team, teams)
  const md   = generateMarkdownPart2(team, part2Output)
  const blob = new Blob([md], { type: 'text/markdown' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `rapport-p2-${team.name.replace(/\s+/g, '-').toLowerCase()}.md`
  a.click()
  URL.revokeObjectURL(url)
}
