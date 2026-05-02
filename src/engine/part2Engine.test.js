import { describe, it, expect } from 'vitest';
import { derivePart2 } from './part2Engine';

// ─── Builders ────────────────────────────────────────────────────
const ms = (ranked, selected) => ({ ranked, selected: selected ?? [...ranked] });
const ro = (ranked) => ({ ranked });
const mkResult = (type, confidence, alerts = [], secondarySignals = []) =>
  ({ type, confidence, alerts, secondarySignals });
const mkTeam = (id, name, answers, deps, result) =>
  ({ id, name, answers, deps, result });

// ════════════════════════════════════════════════════════════════
// 7 personas de validation — Phase 1
// spec: P2-phase1-spec-part2Engine.md §11
// ════════════════════════════════════════════════════════════════

describe('Persona 1 — SA clair, deps saines', () => {
  // Q1=[A,C] A dominant + Q1b=us → SA/HIGH terminal
  // deps roule×2 — zero triggers expected, germane=ÉLEVÉ (2 protectors)
  const team = mkTeam('p1', 'SA claire',
    { q1: ms(['A', 'C']), q1b: 'us' },
    [{ targetId: 'x', mode: 'roule' }, { targetId: 'y', mode: 'roule' }],
    mkResult('stream_aligned', 'high'),
  );
  const out = derivePart2(team, [team]);

  it('aucun trigger actif', () => {
    expect(out.triggers.all).toHaveLength(0);
  });
  it('CL : I=FAIBLE  E=FAIBLE  G=ÉLEVÉ', () => {
    expect(out.cognitiveLoadGap.intrinsic).toBe('FAIBLE');
    expect(out.cognitiveLoadGap.extraneous).toBe('FAIBLE');
    expect(out.cognitiveLoadGap.germane).toBe('ÉLEVÉ');
  });
  it('SA-1 — SA confirmée', () => {
    expect(out.futureState.type).toBe('stream_aligned');
    expect(out.futureState.label).toBe('SA confirmée');
    expect(out.futureState.confidence).toBe('fort');
  });
  it('interactionGaps résolus (2 entrées)', () => {
    expect(out.interactionGaps).toHaveLength(2);
    expect(out.interactionGaps[0].current).toBe('roule');
  });
});

describe('Persona 2 — SA + Q1b incoming', () => {
  // q1b=incoming + q3=operational → 2 signaux ÉLEVÉ extraneous → E:ÉLEVÉ
  const team = mkTeam('p2', 'SA incoming',
    { q1: ms(['A', 'C']), q1b: 'incoming', q3: 'operational' },
    [],
    mkResult('stream_aligned', 'medium'),
  );
  const out = derivePart2(team, []);

  it('T-L2-05 est le trigger dominant', () => {
    expect(out.triggers.all[0].id).toBe('T-L2-05');
  });
  it('CL : I=FAIBLE  E=ÉLEVÉ  G=FAIBLE', () => {
    expect(out.cognitiveLoadGap.intrinsic).toBe('FAIBLE');
    expect(out.cognitiveLoadGap.extraneous).toBe('ÉLEVÉ');
    expect(out.cognitiveLoadGap.germane).toBe('FAIBLE');
  });
  it('SA-3 — SA avec ownership', () => {
    expect(out.futureState.label).toBe('SA avec ownership');
    expect(out.futureState.enablingTeam).toBe('Recommandée');
  });
});

describe('Persona 3 — SA + 2 bloque (non total)', () => {
  // bloque×2 + roule×1 → allBlocked=false → T-L2-01b (not T-L2-04)
  const team = mkTeam('p3', 'SA bloquée',
    { q1: ms(['A']) },
    [{ targetId: 'a', mode: 'bloque' }, { targetId: 'b', mode: 'bloque' }, { targetId: 'c', mode: 'roule' }],
    mkResult('stream_aligned', 'high'),
  );
  const out = derivePart2(team, []);

  it('T-L2-01b est le trigger dominant', () => {
    expect(out.triggers.all[0].id).toBe('T-L2-01b');
  });
  it('T-L2-04 absent (pas tous bloqués)', () => {
    expect(out.triggers.all.map(t => t.id)).not.toContain('T-L2-04');
  });
  it('CL : I=FAIBLE  E=ÉLEVÉ  G=FAIBLE', () => {
    expect(out.cognitiveLoadGap.intrinsic).toBe('FAIBLE');
    expect(out.cognitiveLoadGap.extraneous).toBe('ÉLEVÉ');
    expect(out.cognitiveLoadGap.germane).toBe('FAIBLE');
  });
  it('SA-4 — SA autonome', () => {
    expect(out.futureState.label).toBe('SA autonome');
    expect(out.futureState.enablingTeam).toBe('Optionnelle');
  });
});

describe('Persona 4 — Platform + bottleneck', () => {
  // q3=operational + q3b=majority + q3c=via_us → bottleneck alert in result
  // → 3 signaux ÉLEVÉ extraneous (operational + majority + via_us) + 1 MODÉRÉ (q1=C)
  const team = mkTeam('p4', 'Platform goulot',
    { q1: ms(['C']), q2: ms(['1']), q3: 'operational', q3b: 'majority', q3c: 'via_us' },
    [],
    mkResult('platform', 'high', ['bottleneck']),
  );
  const out = derivePart2(team, []);

  it('T-L1-01 est le trigger dominant', () => {
    expect(out.triggers.all[0].id).toBe('T-L1-01');
  });
  it('CL : I=FAIBLE  E=ÉLEVÉ  G=FAIBLE', () => {
    expect(out.cognitiveLoadGap.intrinsic).toBe('FAIBLE');
    expect(out.cognitiveLoadGap.extraneous).toBe('ÉLEVÉ');
    expect(out.cognitiveLoadGap.germane).toBe('FAIBLE');
  });
  it('PL-2 — Platform produit', () => {
    expect(out.futureState.label).toBe('Platform produit');
    expect(out.futureState.type).toBe('platform');
  });
});

describe('Persona 5 — Enabling + drift', () => {
  // q2=3 + q3=autonomous → enabling_drift alert
  // extraneous: q1=C (MODÉRÉ) + q2=3 (MODÉRÉ) → E:MODÉRÉ
  // germane: q3=autonomous (1 protecteur) → G:MODÉRÉ
  const team = mkTeam('p5', 'Enabling drift',
    { q1: ms(['C']), q2: ms(['3']), q3: 'autonomous' },
    [],
    mkResult('enabling', 'medium', ['enabling_drift']),
  );
  const out = derivePart2(team, []);

  it('T-L1-02 est le trigger dominant', () => {
    expect(out.triggers.all[0].id).toBe('T-L1-02');
  });
  it('CL : I=FAIBLE  E=MODÉRÉ  G=MODÉRÉ', () => {
    expect(out.cognitiveLoadGap.intrinsic).toBe('FAIBLE');
    expect(out.cognitiveLoadGap.extraneous).toBe('MODÉRÉ');
    expect(out.cognitiveLoadGap.germane).toBe('MODÉRÉ');
  });
  it('EN-2 — Enabling clarifiée', () => {
    expect(out.futureState.label).toBe('Enabling clarifiée');
    expect(out.futureState.enablingTeam).toBe('Non pertinente');
  });
});

describe('Persona 6 — CS isolée (sans dépendances entrantes)', () => {
  // q1=D + q2=4 + q3b=few_critical → CS/HIGH
  // intrinsic: q2=4 (ÉLEVÉ) + few_critical (ÉLEVÉ) + type=CS (MODÉRÉ) → I:ÉLEVÉ
  // germane: q1=D (1 protecteur), ext=FAIBLE → G:MODÉRÉ
  const team = mkTeam('p6', 'CS isolée',
    { q1: ms(['D']), q2: ms(['4']), q3b: 'few_critical' },
    [],
    mkResult('complicated_subsystem', 'high'),
  );
  // teams = [team] only → no other team has a dep targeting 'p6'
  const out = derivePart2(team, [team]);

  it('aucun trigger ou uniquement T-L2-06 si 2+ équipes entrantes (ici 0)', () => {
    const ids = out.triggers.all.map(t => t.id);
    expect(ids.filter(id => id !== 'T-L2-06')).toHaveLength(0);
    expect(ids).not.toContain('T-L2-06');
  });
  it('CL : I=ÉLEVÉ  E=FAIBLE  G=MODÉRÉ', () => {
    expect(out.cognitiveLoadGap.intrinsic).toBe('ÉLEVÉ');
    expect(out.cognitiveLoadGap.extraneous).toBe('FAIBLE');
    expect(out.cognitiveLoadGap.germane).toBe('MODÉRÉ');
  });
  it('CS-1 — CS consolidée', () => {
    expect(out.futureState.label).toBe('CS consolidée');
    expect(out.futureState.type).toBe('complicated_subsystem');
    expect(out.futureState.enablingTeam).toBe('Non pertinente');
  });
});

describe('Persona 7 — Hybride indéfini (confidence=low)', () => {
  // confidence=low → early return "Diagnostic incomplet" (règle absolue)
  // result.alerts=[undefined_mission] → T-L1-03 fires, NOT T-L2-07 (alerts.length > 0)
  // result.type=hybrid+low → T-L2-02 fires
  // q4 defined + type=hybrid → germaneFragmented=true → G:FAIBLE
  const team = mkTeam('p7', 'Hybride indéfini',
    { q1: ms([]), q4: ro(['domain', 'respond', 'initiative']) },
    [],
    mkResult('hybrid', 'low', ['undefined_mission']),
  );
  const out = derivePart2(team, []);

  it('T-L1-03 et T-L2-02 actifs', () => {
    const ids = out.triggers.all.map(t => t.id);
    expect(ids).toContain('T-L1-03');
    expect(ids).toContain('T-L2-02');
  });
  it('T-L2-07 absent (alerte présente → alerts.length > 0)', () => {
    expect(out.triggers.all.map(t => t.id)).not.toContain('T-L2-07');
  });
  it('T-L1-03 précède T-L2-02 dans l\'ordre de priorité', () => {
    const ids = out.triggers.all.map(t => t.id);
    expect(ids.indexOf('T-L1-03')).toBeLessThan(ids.indexOf('T-L2-02'));
  });
  it('CL : I=FAIBLE  E=FAIBLE  G=FAIBLE (germaneFragmented)', () => {
    expect(out.cognitiveLoadGap.intrinsic).toBe('FAIBLE');
    expect(out.cognitiveLoadGap.extraneous).toBe('FAIBLE');
    expect(out.cognitiveLoadGap.germane).toBe('FAIBLE');
    expect(out.cognitiveLoadGap.germaneFragmented).toBe(true);
  });
  it('Règle absolue confidence=low → Diagnostic incomplet', () => {
    expect(out.futureState.label).toBe('Diagnostic incomplet');
    expect(out.futureState.type).toBeNull();
    expect(out.futureState.confidence).toBe('faible');
    expect(out.futureState.enablingTeam).toBe('Recommandée');
  });
});

// ─── Edge cases ──────────────────────────────────────────────────

describe('T-L2-04 absorbe T-L2-01b', () => {
  const team = mkTeam('e1', 'Tout bloqué',
    {},
    [{ targetId: 'a', mode: 'bloque' }, { targetId: 'b', mode: 'bloque' }],
    mkResult('stream_aligned', 'high'),
  );
  const { triggers } = derivePart2(team, []);

  it('T-L2-04 présent', () => {
    expect(triggers.all.map(t => t.id)).toContain('T-L2-04');
  });
  it('T-L2-01b absent (déduplication)', () => {
    expect(triggers.all.map(t => t.id)).not.toContain('T-L2-01b');
  });
  it('T-L2-04 est le trigger dominant', () => {
    expect(triggers.all[0].id).toBe('T-L2-04');
  });
});

// ─── germaneFragmented — condition opérationnelle (Gap 3.2) ──────────────────

describe('germaneFragmented — respond dominant → false', () => {
  // q4 reached + hybrid type, but respond is a clear dominant → NOT fragmented
  const team = mkTeam('gf1', 'Hybrid respond',
    { q4: ro(['respond', 'domain', 'initiative']) },
    [],
    mkResult('hybrid', 'medium'),
  );
  const { cognitiveLoadGap } = derivePart2(team, []);

  it('germaneFragmented est false (respond domine → pas équivalent)', () => {
    expect(cognitiveLoadGap.germaneFragmented).toBe(false);
  });
  it('germane se calcule normalement — 0 protecteur → FAIBLE', () => {
    expect(cognitiveLoadGap.germane).toBe('FAIBLE');
  });
});

describe('germaneFragmented — q4 non atteinte → false', () => {
  // q4 undefined → germaneFragmented must be false regardless of type
  const team = mkTeam('gf2', 'SA sans q4',
    { q1: ms(['A']), q1b: 'us' },
    [],
    mkResult('stream_aligned', 'high'),
  );
  const { cognitiveLoadGap } = derivePart2(team, []);

  it('germaneFragmented est false (q4 non atteinte)', () => {
    expect(cognitiveLoadGap.germaneFragmented).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// generateActionPlan — gaps 6.1 à 6.6
// ════════════════════════════════════════════════════════════════

describe('Gap 6.3 — source format "ID — confiance"', () => {
  // Persona 4 : T-L1-01 (confiance fort) doit produire source exacte
  const team = mkTeam('g63', 'Platform goulot',
    { q1: ms(['C']), q2: ms(['1']), q3: 'operational', q3b: 'majority', q3c: 'via_us' },
    [],
    mkResult('platform', 'high', ['bottleneck']),
  );
  const { actionPlan } = derivePart2(team, []);

  it('source = "T-L1-01 — fort" (sans "confiance :")', () => {
    expect(actionPlan.quickWins[0].source).toBe('T-L1-01 — fort');
  });
});

describe('Gap 6.2 — triggers sans card skippés silencieusement', () => {
  // T-L2-09 (Identité hybride) n'a pas de card → doit être ignoré
  const team = mkTeam('g62a', 'Hybrid medium',
    {},
    [],
    mkResult('hybrid', 'medium'), // T-L2-09 actif, pas de card
  );
  const { actionPlan } = derivePart2(team, []);

  it('quickWins vide si aucun trigger affiché n\'a de card (Gap 6.5 ok)', () => {
    expect(actionPlan.quickWins).toHaveLength(0);
  });
});

describe('Gap 6.2 — T-L2-01a a sa propre card', () => {
  // 1 bloque + 1 roule → T-L2-04 n'active pas (pas tous bloqués) → T-L2-01a dominant
  const team = mkTeam('g62b', 'SA 1 bloque',
    { q1: ms(['A']) },
    [{ targetId: 'x', mode: 'bloque' }, { targetId: 'y', mode: 'roule' }],
    mkResult('stream_aligned', 'high'),
  );
  const { actionPlan } = derivePart2(team, []);

  it('T-L2-01a est le premier trigger (dominant)', () => {
    expect(actionPlan.quickWins[0].source).toMatch(/^T-L2-01a —/);
  });
  it('card T-L2-01a contient "30 minutes"', () => {
    expect(actionPlan.quickWins[0].titre).toContain('30 minutes');
  });
});

describe('Gap 6.1 — contenu exact de l\'item Enabling team', () => {
  // Persona 2 : enablingTeam=Recommandée → item exact en position 1
  const team = mkTeam('g61a', 'SA incoming',
    { q1: ms(['A', 'C']), q1b: 'incoming', q3: 'operational' },
    [],
    mkResult('stream_aligned', 'medium'),
  );
  const { actionPlan } = derivePart2(team, []);

  it('item 1 contient "Enabling team" et "6 à 8"', () => {
    expect(actionPlan.structural[0].action).toContain('Enabling team');
    expect(actionPlan.structural[0].action).toContain('6 à 8');
    expect(actionPlan.structural[0].priorite).toBe(1);
  });
});

describe('Gap 6.1 — contenu exact par dominantAxis (extraneous)', () => {
  // Persona 2 : extraneous ÉLEVÉ → item "interruptions entrantes"
  const team = mkTeam('g61b', 'SA incoming',
    { q1: ms(['A', 'C']), q1b: 'incoming', q3: 'operational' },
    [],
    mkResult('stream_aligned', 'medium'),
  );
  const { actionPlan } = derivePart2(team, []);

  it('item axe extrinsèque contient "interruptions entrantes"', () => {
    const extrItem = actionPlan.structural.find(i => i.action.includes('interruptions entrantes'));
    expect(extrItem).toBeDefined();
  });
});

describe('Gap 6.1 — contenu exact L1 structural items', () => {
  // Persona 4 : T-L1-01 → "Définir un SLA"
  const team = mkTeam('g61c', 'Platform goulot',
    { q1: ms(['C']), q2: ms(['1']), q3: 'operational', q3b: 'majority', q3c: 'via_us' },
    [],
    mkResult('platform', 'high', ['bottleneck']),
  );
  const { actionPlan } = derivePart2(team, []);

  it('T-L1-01 structural item contient "SLA de réponse"', () => {
    const item = actionPlan.structural.find(i => i.action.includes('SLA de réponse'));
    expect(item).toBeDefined();
  });
  it('condition T-L1-01 mentionne "Goulot détecté"', () => {
    const item = actionPlan.structural.find(i => i.action.includes('SLA de réponse'));
    expect(item.condition).toContain('Goulot détecté');
  });
});

describe('Gap 6.4 — minimum 3 items structurels garantis (persona 1)', () => {
  // Persona 1 : aucun trigger, dominantAxis=null, enablingTeam=Optionnelle
  // Sans fallback → 0 items ; avec fallback → ≥3
  const team = mkTeam('g64', 'SA clair',
    { q1: ms(['A', 'C']), q1b: 'us' },
    [{ targetId: 'x', mode: 'roule' }, { targetId: 'y', mode: 'roule' }],
    mkResult('stream_aligned', 'high'),
  );
  const { actionPlan } = derivePart2(team, [team]);

  it('structural a exactement 2 fallbacks (stream_aligned, 0 condition remplie)', () => {
    expect(actionPlan.structural.length).toBeGreaterThanOrEqual(2);
  });
  it('fallback SA contient "frontières du domaine"', () => {
    const f = actionPlan.structural.find(i => i.action.includes('frontières du domaine'));
    expect(f).toBeDefined();
  });
  it('priorite commence à 1', () => {
    expect(actionPlan.structural[0].priorite).toBe(1);
  });
  it('priorite est séquentielle', () => {
    actionPlan.structural.forEach((item, i) => {
      expect(item.priorite).toBe(i + 1);
    });
  });
});

describe('Gap 6.4 — minimum 3 items pour futureState.type=null', () => {
  // Persona 7 : confidence=low → futureState.type=null → fallbacks null/hybrid
  const team = mkTeam('g64b', 'Hybride indéfini',
    { q1: ms([]), q4: ro(['domain', 'respond', 'initiative']) },
    [],
    mkResult('hybrid', 'low', ['undefined_mission']),
  );
  const { actionPlan } = derivePart2(team, []);

  it('structural ≥ 3 items même avec futureState.type=null', () => {
    expect(actionPlan.structural.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Gap 6.6 — T-L2-04 et T-L2-01b donnent la même card (pas de doublon)', () => {
  // T-L2-04 actif (tout bloqué) → displayed[0]=T-L2-04
  // T-L2-01b absent (déduplication), donc pas de risque de doublon
  const team = mkTeam('g66', 'Tout bloqué',
    {},
    [{ targetId: 'a', mode: 'bloque' }, { targetId: 'b', mode: 'bloque' }],
    mkResult('stream_aligned', 'high'),
  );
  const { actionPlan } = derivePart2(team, []);

  it('1 seul quick win bloque (T-L2-04)', () => {
    const bloqueCards = actionPlan.quickWins.filter(qw =>
      qw.titre.includes('dépendances bloquantes')
    );
    expect(bloqueCards).toHaveLength(1);
  });
  it('source est T-L2-04', () => {
    expect(actionPlan.quickWins[0].source).toBe('T-L2-04 — fort');
  });
});

describe('Gap 6.1 — interactionGaps bloque génère item structurel', () => {
  // 1 dep bloque → gap bloque → item "Résoudre le blocage avec..."
  const teamX = mkTeam('tx', 'Équipe X', {}, [], mkResult('platform', 'high'));
  const team = mkTeam('g61d', 'SA 1 bloque',
    { q1: ms(['A']) },
    [{ targetId: 'tx', mode: 'bloque' }],
    mkResult('stream_aligned', 'high'),
  );
  const { actionPlan } = derivePart2(team, [teamX]);

  it('item bloque contient "Résoudre le blocage avec Équipe X"', () => {
    const item = actionPlan.structural.find(i => i.action.includes('Résoudre le blocage avec Équipe X'));
    expect(item).toBeDefined();
  });
  it('condition bloque mentionne throughput', () => {
    const item = actionPlan.structural.find(i => i.action.includes('Résoudre le blocage avec Équipe X'));
    expect(item.condition).toContain('throughput');
  });
});

describe('Structurel — cap à 5 items', () => {
  // Enabling + extraneous + T-L1-01 + T-L1-02 + T-L1-03 + 2 bloque = 7 items brut → capped à 5
  const team = mkTeam('cap5', 'Multi-item',
    { q1: ms(['A', 'C']), q1b: 'incoming', q3: 'operational' },
    [{ targetId: 'a', mode: 'bloque' }, { targetId: 'b', mode: 'bloque' }],
    mkResult('stream_aligned', 'medium', ['bottleneck', 'enabling_drift', 'undefined_mission']),
  );
  const { actionPlan } = derivePart2(team, []);

  it('structural ne dépasse pas 5 items', () => {
    expect(actionPlan.structural.length).toBeLessThanOrEqual(5);
  });
});

describe('derivePart2 — deps undefined safe', () => {
  it('fonctionne sans deps', () => {
    const team = { id: 't', name: 'T', answers: {}, result: mkResult('stream_aligned', 'high') };
    expect(() => derivePart2(team)).not.toThrow();
  });
});

describe('teamApiDraft — statuts champs', () => {
  const team = mkTeam('api1', 'Mon Équipe',
    { q1: ms(['A', 'C']), q1b: 'us', q3c: 'self_service' },
    [{ targetId: 'z', mode: 'roule' }],
    mkResult('stream_aligned', 'high'),
  );
  const { teamApiDraft } = derivePart2(team, []);

  it('nom est complete', () => expect(teamApiDraft.nom.status).toBe('complete'));
  it('typeActuel est complete', () => expect(teamApiDraft.typeActuel.status).toBe('complete'));
  it('mission est partial (q1 répondu)', () => expect(teamApiDraft.mission.status).toBe('partial'));
  it('modeAcces est partial (q3c renseigné)', () => expect(teamApiDraft.modeAcces.status).toBe('partial'));
  it('partenaires est complete (deps présentes)', () => expect(teamApiDraft.partenaires.status).toBe('complete'));
  it('slo est empty', () => expect(teamApiDraft.slo.status).toBe('empty'));

  it('modeAcces est empty si q3c absent', () => {
    const t2 = mkTeam('api2', 'T2', { q1: ms(['A']) }, [], mkResult('stream_aligned', 'high'));
    const { teamApiDraft: d2 } = derivePart2(t2, []);
    expect(d2.modeAcces.status).toBe('empty');
  });
});

// ════════════════════════════════════════════════════════════════
// prefillTeamApi — gaps 7.1 à 7.7
// ════════════════════════════════════════════════════════════════

describe('Gap 7.3 — mission : label lisible (pas ID brut)', () => {
  const team = mkTeam('g73a', 'SA',
    { q1: ms(['A', 'C']), q1b: 'us' },
    [],
    mkResult('stream_aligned', 'high'),
  );
  const { teamApiDraft } = derivePart2(team, []);

  it('mission.value contient le label Q1-A (pas "A")', () => {
    expect(teamApiDraft.mission.value).toContain('domaine ou processus métier');
    expect(teamApiDraft.mission.value).not.toBe('A');
  });
});

describe('Gap 7.3 — outputs : labels lisibles (pas IDs bruts)', () => {
  const team = mkTeam('g73b', 'Platform',
    { q1: ms(['C']), q2: ms(['1', '2']) },
    [],
    mkResult('platform', 'high'),
  );
  const { teamApiDraft } = derivePart2(team, []);

  it('outputs.value contient des labels lisibles (pas "1", "2")', () => {
    expect(teamApiDraft.outputs.value).not.toContain('1');
    expect(teamApiDraft.outputs.value[0]).toContain('service ou outil');
  });
  it('outputs.status est partial (q2 défini)', () => {
    expect(teamApiDraft.outputs.status).toBe('partial');
  });
});

describe('Gap 7.3 — modeAcces : label lisible (pas ID brut)', () => {
  const team = mkTeam('g73c', 'Platform via_us',
    { q1: ms(['C']), q2: ms(['1']), q3: 'operational', q3b: 'majority', q3c: 'via_us' },
    [],
    mkResult('platform', 'high', ['bottleneck']),
  );
  const { teamApiDraft } = derivePart2(team, []);

  it('modeAcces.value contient le label Q3c (pas "via_us")', () => {
    expect(teamApiDraft.modeAcces.value).toContain("Via l'équipe");
    expect(teamApiDraft.modeAcces.value).not.toBe('via_us');
  });
});

describe('Gap 7.2 — typeActuel : label lisible via TYPE_META', () => {
  const team = mkTeam('g72a', 'SA',
    { q1: ms(['A']) },
    [],
    mkResult('stream_aligned', 'high'),
  );
  const { teamApiDraft } = derivePart2(team, []);

  it('typeActuel.value est le label lisible (pas "stream_aligned")', () => {
    expect(teamApiDraft.typeActuel.value).toBe('Équipe orientée valeur');
  });
});

describe('Gap 7.2 — alertes : labels courts (pas titres verbeux de ALERT_META)', () => {
  const team = mkTeam('g72b', 'Platform goulot',
    { q1: ms(['C']), q2: ms(['1']), q3: 'operational', q3b: 'majority', q3c: 'via_us' },
    [],
    mkResult('platform', 'high', ['bottleneck']),
  );
  const { teamApiDraft } = derivePart2(team, []);

  it('alertes.value[0] est le label court (pas le titre ALERT_META)', () => {
    expect(teamApiDraft.alertes.value[0]).toBe("Goulot d'étranglement");
    expect(teamApiDraft.alertes.value[0]).not.toContain('Point de vigilance');
  });
  it('alertes.status est complete (alertes présentes)', () => {
    expect(teamApiDraft.alertes.status).toBe('complete');
  });
});

describe('Gap 7.6 — alertes : status empty si result.alerts = []', () => {
  const team = mkTeam('g76', 'SA sans alerte',
    { q1: ms(['A']) },
    [],
    mkResult('stream_aligned', 'high'),
  );
  const { teamApiDraft } = derivePart2(team, []);

  it('alertes.status est empty (aucune alerte)', () => {
    expect(teamApiDraft.alertes.status).toBe('empty');
  });
  it('alertes.value est un tableau vide', () => {
    expect(teamApiDraft.alertes.value).toHaveLength(0);
  });
});

describe('Gap 7.5 — typeCible : empty quand futureState.type === null', () => {
  // Persona 7 : confidence=low → futureState.type=null
  const team = mkTeam('g75', 'Hybride indéfini',
    { q1: ms([]), q4: ro(['domain', 'respond', 'initiative']) },
    [],
    mkResult('hybrid', 'low', ['undefined_mission']),
  );
  const { teamApiDraft } = derivePart2(team, []);

  it('typeCible.status est empty (type null)', () => {
    expect(teamApiDraft.typeCible.status).toBe('empty');
  });
  it('typeCible.value est null', () => {
    expect(teamApiDraft.typeCible.value).toBeNull();
  });
});

describe('Gap 7.4 — partenaires : structure PartenaireItem[]', () => {
  const teamZ = mkTeam('z', 'Équipe Z', {}, [], mkResult('platform', 'high'));
  const team = mkTeam('g74', 'SA avec dep',
    { q1: ms(['A']) },
    [{ targetId: 'z', mode: 'frotte' }],
    mkResult('stream_aligned', 'high'),
  );
  const { teamApiDraft } = derivePart2(team, [teamZ]);

  it('partenaires.value[0] a teamId, teamName, mode, recommended', () => {
    const p = teamApiDraft.partenaires.value[0];
    expect(p.teamId).toBe('z');
    expect(p.teamName).toBe('Équipe Z');
    expect(p.mode).toBe('frotte');
    expect(p.recommended).toBe('Frontière à clarifier');
  });
  it('partenaires.status est complete', () => {
    expect(teamApiDraft.partenaires.status).toBe('complete');
  });
});

describe('Gap 7.4 — partenaires : fallback sur teamId si équipe non trouvée', () => {
  const team = mkTeam('g74b', 'SA dep inconnue',
    { q1: ms(['A']) },
    [{ targetId: 'unknown-id', mode: 'bloque' }],
    mkResult('stream_aligned', 'high'),
  );
  const { teamApiDraft } = derivePart2(team, []);

  it('teamName fallback sur targetId', () => {
    expect(teamApiDraft.partenaires.value[0].teamName).toBe('unknown-id');
  });
});

describe('Gap 7.1 — outputs : status partial basé sur existence de q2 (pas longueur)', () => {
  // q2 défini avec selected vide → status doit être partial (q2 existe)
  const team = mkTeam('g71', 'SA q2 vide',
    { q1: ms(['A']), q2: { selected: [], ranked: [] } },
    [],
    mkResult('stream_aligned', 'high'),
  );
  const { teamApiDraft } = derivePart2(team, []);

  it('outputs.status est partial même si selected est vide (q2 défini)', () => {
    expect(teamApiDraft.outputs.status).toBe('partial');
  });
});

// ════════════════════════════════════════════════════════════════
// Étape 8 — Validation actionPlan + teamApiDraft par persona
// spec: P2-phase1-implementationplan.md §étape-8
// ════════════════════════════════════════════════════════════════

describe('Étape 8 — Persona 1 : SA confirmée (no triggers, G=ÉLEVÉ)', () => {
  const team = mkTeam('p1', 'SA claire',
    { q1: ms(['A', 'C']), q1b: 'us' },
    [{ targetId: 'x', mode: 'roule' }, { targetId: 'y', mode: 'roule' }],
    mkResult('stream_aligned', 'high'),
  );
  const { actionPlan, teamApiDraft } = derivePart2(team, [team]);

  // dominantAxis=null (G=ÉLEVÉ ne déclenche pas d'item), enablingTeam=Optionnelle
  // → 0 conditions remplies → 2 fallbacks stream_aligned
  it('quickWins vide (aucun trigger mappé)', () => {
    expect(actionPlan.quickWins).toHaveLength(0);
  });
  it('structural : fallbacks stream_aligned (frontières du domaine)', () => {
    expect(actionPlan.structural[0].action).toContain('frontières du domaine');
  });
  it('systemic : 3 étapes fixes', () => {
    expect(actionPlan.systemic).toHaveLength(3);
    expect(actionPlan.systemic[0].titre).toBe('Stabiliser');
  });
  it('teamApiDraft : alertes empty (aucune alerte)', () => {
    expect(teamApiDraft.alertes.status).toBe('empty');
  });
  it('teamApiDraft : typeCible complete (SA confirmée)', () => {
    expect(teamApiDraft.typeCible.status).toBe('complete');
    expect(teamApiDraft.typeCible.value).toBe('Équipe orientée valeur');
  });
  it('teamApiDraft : mission label lisible (pas "A")', () => {
    expect(teamApiDraft.mission.value).toContain('domaine ou processus métier');
  });
});

describe('Étape 8 — Persona 2 : SA avec ownership (T-L2-05, E=ÉLEVÉ, Enabling=Recommandée)', () => {
  const team = mkTeam('p2', 'SA incoming',
    { q1: ms(['A', 'C']), q1b: 'incoming', q3: 'operational' },
    [],
    mkResult('stream_aligned', 'medium'),
  );
  const { actionPlan, teamApiDraft } = derivePart2(team, []);

  it('quickWins[0] : T-L2-05 — backlog', () => {
    expect(actionPlan.quickWins[0].source).toBe('T-L2-05 — moyen');
    expect(actionPlan.quickWins[0].titre).toContain('décisions de backlog');
  });
  it('structural[0] : Enabling team en position 1 (Recommandée)', () => {
    expect(actionPlan.structural[0].action).toContain('Enabling team');
    expect(actionPlan.structural[0].priorite).toBe(1);
  });
  it('structural[1] : axe extrinsèque', () => {
    expect(actionPlan.structural[1].action).toContain('interruptions entrantes');
  });
  it('structural ≥ 3 items', () => {
    expect(actionPlan.structural.length).toBeGreaterThanOrEqual(3);
  });
  it('teamApiDraft : alertes empty (aucune alerte)', () => {
    expect(teamApiDraft.alertes.status).toBe('empty');
  });
});

describe('Étape 8 — Persona 3 : SA autonome (T-L2-01b, 2 bloque + 1 roule)', () => {
  const team = mkTeam('p3', 'SA bloquée',
    { q1: ms(['A']) },
    [
      { targetId: 'a', mode: 'bloque' },
      { targetId: 'b', mode: 'bloque' },
      { targetId: 'c', mode: 'roule' },
    ],
    mkResult('stream_aligned', 'high'),
  );
  const { actionPlan, teamApiDraft } = derivePart2(team, []);

  it('quickWins[0] : T-L2-01b — dépendances bloquantes', () => {
    expect(actionPlan.quickWins[0].source).toBe('T-L2-01b — fort');
    expect(actionPlan.quickWins[0].titre).toContain('dépendances bloquantes');
  });
  it('structural[0] : axe extrinsèque (enablingTeam=Optionnelle)', () => {
    expect(actionPlan.structural[0].action).toContain('interruptions entrantes');
  });
  it('structural : items bloque pour a et b', () => {
    const bloques = actionPlan.structural.filter(i => i.action.includes('Résoudre le blocage'));
    expect(bloques).toHaveLength(2);
  });
  it('structural : 3 items exacts (axis + 2 bloque)', () => {
    expect(actionPlan.structural).toHaveLength(3);
  });
  it('teamApiDraft : partenaires 3 entrées (2 bloque + 1 roule)', () => {
    expect(teamApiDraft.partenaires.value).toHaveLength(3);
  });
});

describe('Étape 8 — Persona 4 : Platform produit (T-L1-01, E=ÉLEVÉ)', () => {
  const team = mkTeam('p4', 'Platform goulot',
    { q1: ms(['C']), q2: ms(['1']), q3: 'operational', q3b: 'majority', q3c: 'via_us' },
    [],
    mkResult('platform', 'high', ['bottleneck']),
  );
  const { actionPlan, teamApiDraft } = derivePart2(team, []);

  it('quickWins[0] : T-L1-01 — 3 demandes fréquentes', () => {
    expect(actionPlan.quickWins[0].source).toBe('T-L1-01 — fort');
    expect(actionPlan.quickWins[0].titre).toContain('3 demandes les plus fréquentes');
  });
  it('structural : T-L1-01 item SLA', () => {
    const item = actionPlan.structural.find(i => i.action.includes('SLA de réponse'));
    expect(item).toBeDefined();
  });
  it('structural ≥ 3 items (axis + SLA + fallback platform)', () => {
    expect(actionPlan.structural.length).toBeGreaterThanOrEqual(3);
  });
  it('teamApiDraft : alertes "Goulot d\'étranglement" — label court', () => {
    expect(teamApiDraft.alertes.value[0]).toBe("Goulot d'étranglement");
    expect(teamApiDraft.alertes.status).toBe('complete');
  });
  it('teamApiDraft : modeAcces label "Via l\'équipe"', () => {
    expect(teamApiDraft.modeAcces.value).toContain("Via l'équipe");
  });
  it('teamApiDraft : typeCible "Équipe plateforme"', () => {
    expect(teamApiDraft.typeCible.value).toBe('Équipe plateforme');
  });
});

describe('Étape 8 — Persona 5 : Enabling clarifiée (T-L1-02, E=MODÉRÉ, G=MODÉRÉ)', () => {
  const team = mkTeam('p5', 'Enabling drift',
    { q1: ms(['C']), q2: ms(['3']), q3: 'autonomous' },
    [],
    mkResult('enabling', 'medium', ['enabling_drift']),
  );
  const { actionPlan, teamApiDraft } = derivePart2(team, []);

  // dominantAxis=null (E=MODÉRÉ, I=FAIBLE, G=MODÉRÉ — aucun ÉLEVÉ ni G=FAIBLE)
  it('quickWins[0] : T-L1-02 — livrables', () => {
    expect(actionPlan.quickWins[0].source).toBe('T-L1-02 — fort');
    expect(actionPlan.quickWins[0].titre).toContain('livrables produits');
  });
  it('structural[0] : T-L1-02 item (enablingTeam=Non pertinente, axis=null)', () => {
    expect(actionPlan.structural[0].action).toContain('date de fin explicite');
  });
  it('structural : 3 items (T-L1-02 + 2 fallbacks enabling)', () => {
    expect(actionPlan.structural).toHaveLength(3);
    const fallback = actionPlan.structural.find(i => i.action.includes('équipes accompagnées'));
    expect(fallback).toBeDefined();
  });
  it('teamApiDraft : alertes "Enabling en dérive"', () => {
    expect(teamApiDraft.alertes.value[0]).toBe('Enabling en dérive');
  });
});

describe('Étape 8 — Persona 6 : CS consolidée (I=ÉLEVÉ, no triggers)', () => {
  const team = mkTeam('p6', 'CS isolée',
    { q1: ms(['D']), q2: ms(['4']), q3b: 'few_critical' },
    [],
    mkResult('complicated_subsystem', 'high'),
  );
  const { actionPlan, teamApiDraft } = derivePart2(team, [team]);

  it('quickWins vide (T-L2-06 sans card, 0 autres triggers)', () => {
    expect(actionPlan.quickWins).toHaveLength(0);
  });
  it('structural[0] : axe intrinsèque (connaissance critique)', () => {
    expect(actionPlan.structural[0].action).toContain('connaissance critique');
  });
  it('structural : 3 items (intrinsic + 2 fallbacks CS)', () => {
    expect(actionPlan.structural).toHaveLength(3);
    const busFactorItem = actionPlan.structural.find(i => i.action.includes('bus factor'));
    expect(busFactorItem).toBeDefined();
  });
  it('teamApiDraft : alertes empty (aucune alerte)', () => {
    expect(teamApiDraft.alertes.status).toBe('empty');
  });
  it('teamApiDraft : typeCible "Équipe sous-système"', () => {
    expect(teamApiDraft.typeCible.value).toBe('Équipe sous-système');
  });
});

describe('Étape 8 — Persona 7 : Diagnostic incomplet (T-L1-03+T-L2-02, confidence=low)', () => {
  const team = mkTeam('p7', 'Hybride indéfini',
    { q1: ms([]), q4: ro(['domain', 'respond', 'initiative']) },
    [],
    mkResult('hybrid', 'low', ['undefined_mission']),
  );
  const { actionPlan, teamApiDraft } = derivePart2(team, []);

  // dominantAxis=germane (G=FAIBLE via germaneFragmented), enablingTeam=Recommandée
  it('quickWins[0] : T-L1-03 — session 30 min (T-L2-02 skippé, pas de card)', () => {
    expect(actionPlan.quickWins).toHaveLength(1);
    expect(actionPlan.quickWins[0].source).toBe('T-L1-03 — fort');
    expect(actionPlan.quickWins[0].titre).toContain('30 minutes');
  });
  it('structural[0] : Enabling team en position 1 (Recommandée)', () => {
    expect(actionPlan.structural[0].action).toContain('Enabling team');
    expect(actionPlan.structural[0].priorite).toBe(1);
  });
  it('structural[1] : axe germinale (temps de travail profond)', () => {
    expect(actionPlan.structural[1].action).toContain('temps de travail profond');
  });
  it('structural[2] : T-L1-03 mission', () => {
    expect(actionPlan.structural[2].action).toContain('phrase de mission');
  });
  it('structural : 3 items exacts (enabling + germane + T-L1-03)', () => {
    expect(actionPlan.structural).toHaveLength(3);
  });
  it('teamApiDraft : typeCible empty (futureState.type=null)', () => {
    expect(teamApiDraft.typeCible.status).toBe('empty');
    expect(teamApiDraft.typeCible.value).toBeNull();
  });
  it('teamApiDraft : alertes "Mission non définie"', () => {
    expect(teamApiDraft.alertes.value[0]).toBe('Mission non définie');
    expect(teamApiDraft.alertes.status).toBe('complete');
  });
});
