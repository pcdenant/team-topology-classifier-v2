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

// ─── analyzeInteractions — gaps 4.1 / 4.3 ───────────────────────────────────

describe('analyzeInteractions — mode inconnu → fallback explicite', () => {
  // Gap 4.3: dep.mode non reconnu ne doit jamais produire recommended=undefined
  const team = mkTeam('ai1', 'Fallback',
    {},
    [{ targetId: 'x', mode: 'unknown_mode' }],
    mkResult('stream_aligned', 'high'),
  );
  const { interactionGaps } = derivePart2(team, []);

  it('recommended est une string (pas undefined)', () => {
    expect(typeof interactionGaps[0].recommended).toBe('string');
    expect(interactionGaps[0].recommended).toBe('Mode inconnu');
  });
  it('rationale est une string (pas undefined)', () => {
    expect(typeof interactionGaps[0].rationale).toBe('string');
  });
  it('current conserve la valeur brute', () => {
    expect(interactionGaps[0].current).toBe('unknown_mode');
  });
});

describe('analyzeInteractions — teamType null si équipe cible absente', () => {
  // Gap 4.2: teamType doit être null (pas undefined) si l'équipe n'est pas dans teams[]
  const team = mkTeam('ai2', 'Orphelin',
    {},
    [{ targetId: 'absent', mode: 'roule' }],
    mkResult('stream_aligned', 'high'),
  );
  const { interactionGaps } = derivePart2(team, []);

  it('teamType est null (pas undefined) si cible absente', () => {
    expect(interactionGaps[0].teamType).toBeNull();
  });
  it('teamName replie sur targetId si cible absente', () => {
    expect(interactionGaps[0].teamName).toBe('absent');
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
