import { describe, it, expect } from 'vitest'
import { generateMarkdownPart2 } from './exportPart2'
import { derivePart2 } from '../engine'

// ─── Builders (mirror part2Engine.test.js) ────────────────────────
const ms = (ranked, selected) => ({ ranked, selected: selected ?? [...ranked] })
const ro = (ranked) => ({ ranked })
const mkResult = (type, confidence, alerts = [], secondarySignals = []) =>
  ({ type, confidence, alerts, secondarySignals })
const mkTeam = (id, name, answers, deps, result) =>
  ({ id, name, answers, deps, result })

// ─── Fixtures ─────────────────────────────────────────────────────
const teamSA = mkTeam('sa1', 'Équipe Alpha',
  { q1: ms(['A', 'C']), q1b: 'us' },
  [{ targetId: 'x', mode: 'roule' }, { targetId: 'y', mode: 'roule' }],
  mkResult('stream_aligned', 'high'),
)

const teamPlatform = mkTeam('pl1', 'Équipe Platform',
  { q1: ms(['C']), q2: ms(['1']), q3: 'operational', q3b: 'majority', q3c: 'via_us' },
  [],
  mkResult('platform', 'high', ['bottleneck']),
)

const teamHybrid = mkTeam('hy1', 'Équipe Hybride',
  { q1: ms([]), q4: ro(['domain', 'respond', 'initiative']) },
  [],
  mkResult('hybrid', 'low', ['undefined_mission']),
)

const teamSAIncoming = mkTeam('sa2', 'Équipe Beta',
  { q1: ms(['A', 'C']), q1b: 'incoming', q3: 'operational' },
  [],
  mkResult('stream_aligned', 'medium'),
)

// Enabling clarifiée → enablingTeam: 'Non pertinente'
const teamEnabling = mkTeam('en1', 'Équipe Enabling',
  { q1: ms(['C']), q2: ms(['3']), q3: 'autonomous' },
  [],
  mkResult('enabling', 'medium', ['enabling_drift']),
)

// ─── Helpers ──────────────────────────────────────────────────────
const md = (team) => generateMarkdownPart2(team, derivePart2(team, []))

// ════════════════════════════════════════════════════════════════════
// Structure générale
// ════════════════════════════════════════════════════════════════════

describe('generateMarkdownPart2 — structure générale', () => {
  const out = md(teamSA)

  it('contient le nom de l\'équipe dans le titre', () => {
    expect(out).toContain('# Rapport Partie 2 — Équipe Alpha')
  })
  it('contient le footer Team Topology Classifier', () => {
    expect(out).toContain('Team Topology Classifier — Collaboration Solved')
  })
  it('contient les 4 sections obligatoires', () => {
    expect(out).toContain('## Future State')
    expect(out).toContain('## Charge cognitive')
    expect(out).toContain("## Plan d'action")
    expect(out).toContain('## Team API Draft')
  })
  it('contient les 3 sous-sections du plan d\'action', () => {
    expect(out).toContain('### Quick wins')
    expect(out).toContain('### Structurel')
    expect(out).toContain('### Systémique')
  })
  it('contient les 3 axes de charge cognitive', () => {
    expect(out).toContain('Intrinsèque')
    expect(out).toContain('Extrinsèque')
    expect(out).toContain('Germinale')
  })
})

// ════════════════════════════════════════════════════════════════════
// Section Signaux détectés
// ════════════════════════════════════════════════════════════════════

describe('generateMarkdownPart2 — signaux détectés', () => {
  it('section absente si 0 triggers (SA claire)', () => {
    expect(md(teamSA)).not.toContain('## Signaux détectés')
  })

  it('section présente avec triggers (Platform bottleneck)', () => {
    const out = md(teamPlatform)
    expect(out).toContain('## Signaux détectés')
  })
  it('🔴 présent pour trigger danger (T-L1-01)', () => {
    expect(md(teamPlatform)).toContain('🔴')
  })
  it('nom du trigger présent dans le rapport', () => {
    expect(md(teamPlatform)).toContain("Goulot d'étranglement")
  })
  it('confiance du trigger présente', () => {
    expect(md(teamPlatform)).toContain('confiance : fort')
  })
})

// ════════════════════════════════════════════════════════════════════
// Section Future State
// ════════════════════════════════════════════════════════════════════

describe('generateMarkdownPart2 — future state', () => {
  it('label du Future State présent', () => {
    expect(md(teamSA)).toContain('SA confirmée')
  })
  it('type null → pas de ligne **Type :** null (Hybrid low)', () => {
    const out = md(teamHybrid)
    expect(out).not.toContain('**Type :** null')
    expect(out).not.toContain('**Type :** undefined')
  })
  it('label Diagnostic incomplet pour Hybrid low', () => {
    expect(md(teamHybrid)).toContain('Diagnostic incomplet')
  })
  it('enabling team présente si "Optionnelle" (SA confirmée)', () => {
    expect(md(teamSA)).toContain('**Enabling team :** Optionnelle')
  })
  it('enabling team absente si "Non pertinente" (Enabling clarifiée)', () => {
    expect(md(teamEnabling)).not.toContain('**Enabling team :**')
  })
  it('enabling team présente si "Recommandée" (SA incoming)', () => {
    expect(md(teamSAIncoming)).toContain('**Enabling team :** Recommandée')
  })
})

// ════════════════════════════════════════════════════════════════════
// Charge cognitive — germaneFragmented
// ════════════════════════════════════════════════════════════════════

describe('generateMarkdownPart2 — germaneFragmented', () => {
  it('flag absent si false (SA claire)', () => {
    expect(md(teamSA)).not.toContain('Charge germinale fragmentée')
  })
  it('flag présent si true (Hybrid low)', () => {
    expect(md(teamHybrid)).toContain('Charge germinale fragmentée')
  })
})

// ════════════════════════════════════════════════════════════════════
// Plan d'action
// ════════════════════════════════════════════════════════════════════

describe('generateMarkdownPart2 — quick wins', () => {
  it('message vide si aucun quick win (SA claire)', () => {
    expect(md(teamSA)).toContain('_Aucune action prioritaire identifiée._')
  })
  it('checkboxes [ ] présentes si quick wins (Platform)', () => {
    expect(md(teamPlatform)).toContain('- [ ]')
  })
  it('critère de succès présent', () => {
    expect(md(teamPlatform)).toContain('Critère :')
  })
  it('signal source présent', () => {
    expect(md(teamPlatform)).toContain('Source  :')
  })
})

describe('generateMarkdownPart2 — systémique', () => {
  it('contient les 3 étapes numérotées', () => {
    const out = md(teamSA)
    expect(out).toContain('1. **Stabiliser**')
    expect(out).toContain('2. **Formaliser**')
    expect(out).toContain('3. **Réévaluer**')
  })
})

// ════════════════════════════════════════════════════════════════════
// Team API Draft
// ════════════════════════════════════════════════════════════════════

describe('generateMarkdownPart2 — Team API table', () => {
  const out = md(teamSA)

  it('contient le header de table', () => {
    expect(out).toContain('| Champ | Valeur | Statut |')
    expect(out).toContain('|---|---|---|')
  })
  it('nom de l\'équipe dans la table', () => {
    expect(out).toContain('| Équipe Alpha |')
  })
  it('statut ✅ Complet pour le nom', () => {
    expect(out).toContain('✅ Complet')
  })
  it('statut ❌ À compléter pour SLO (toujours vide)', () => {
    expect(out).toContain('❌ À compléter')
  })
  it('11 lignes de données dans la table', () => {
    const rows = out.split('\n').filter(l => l.startsWith('|') && !l.startsWith('| Champ') && !l.startsWith('|---'))
    expect(rows).toHaveLength(11)
  })
})
