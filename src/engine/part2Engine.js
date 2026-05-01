import { TYPE_META, ALERT_META } from './content';

// ─── Helpers ──────────────────────────────────────────────────────
const dominant = (ranked) => ranked?.[0] ?? null;
const depsCount = (deps, mode) => deps.filter(d => d.mode === mode).length;
const incomingDepsCount = (teamId, teams) =>
  teams.filter(t => t.deps?.some(d => d.targetId === teamId)).length;

// ─── Trigger priority order (index 0 = highest) ───────────────────
const TRIGGER_ORDER = [
  'T-L2-04', 'T-L1-01', 'T-L1-02', 'T-L1-03',
  'T-L2-01b', 'T-L2-01a', 'T-L2-02', 'T-L2-05',
  'T-L2-03b', 'T-L2-08', 'T-L2-09', 'T-L2-06',
  'T-L2-13', 'T-L2-03a', 'T-L2-07',
];

// ─── detectTriggers ───────────────────────────────────────────────
function detectTriggers(result, deps, answers, teamId, teams) {
  const active = [];

  // L1 — read P1 alerts (never recompute)
  if (result.alerts.includes('bottleneck')) {
    active.push({
      id: 'T-L1-01', niveau: 1, nom: 'Goulot d\'étranglement',
      severite: 'danger', confiance: 'fort',
      message: "Les autres équipes doivent passer par la tienne pour accéder à ce que tu fournis. Chaque demande crée une file d'attente invisible.",
      source: "Q3c = via_us + Q3b = majority",
    });
  }
  if (result.alerts.includes('enabling_drift')) {
    active.push({
      id: 'T-L1-02', niveau: 1, nom: 'Enabling en dérive',
      severite: 'danger', confiance: 'fort',
      message: "Tu livres des choses à la place de former les équipes à les faire elles-mêmes. La dépendance que tu crées est l'opposé de ta mission.",
      source: "Q2 = livrables + Q3 = autonomous",
    });
  }
  if (result.alerts.includes('undefined_mission')) {
    active.push({
      id: 'T-L1-03', niveau: 1, nom: 'Mission non définie',
      severite: 'danger', confiance: 'fort',
      message: "Aucune source de travail ne domine clairement. Ton backlog n'est pas une stratégie — c'est un agrégat de sollicitations.",
      source: "Q4 sans dominant clair",
    });
  }

  // L2 — dependency patterns
  const allBlocked = deps.length > 0 && deps.every(d => d.mode === 'bloque');
  if (allBlocked) {
    active.push({
      id: 'T-L2-04', niveau: 2, nom: 'Isolement total',
      severite: 'danger', confiance: 'fort',
      message: "Toutes les équipes dont tu dépends sont des blocages actifs. Ton équipe ne peut pas livrer de valeur dans cette configuration.",
      source: "Toutes dépendances = bloque",
    });
  }
  // T-L2-01b is absorbed by T-L2-04 when every dep is blocked
  if (!allBlocked && depsCount(deps, 'bloque') >= 2) {
    active.push({
      id: 'T-L2-01b', niveau: 2, nom: 'Dépendances bloquantes multiples',
      severite: 'danger', confiance: 'fort',
      message: "Plusieurs de tes dépendances bloquent ta livraison. Ce n'est plus un problème relationnel — c'est un problème d'architecture.",
      source: "2+ dépendances en mode bloque",
    });
  }
  if (depsCount(deps, 'bloque') === 1) {
    active.push({
      id: 'T-L2-01a', niveau: 2, nom: 'Dépendance bloquante',
      severite: 'warning', confiance: 'moyen',
      message: "Une relation bloque activement ta livraison. Ce n'est pas encore un pattern systémique — mais c'est le point de départ d'une conversation urgente.",
      source: "1 dépendance en mode bloque",
    });
  }
  if (depsCount(deps, 'frotte') >= 2) {
    active.push({
      id: 'T-L2-08', niveau: 2, nom: 'Friction systémique',
      severite: 'warning', confiance: 'moyen',
      message: "Plusieurs de tes relations créent de la friction régulière. Ça ne bloque pas encore — mais ça érode le débit de tout le monde en silence.",
      source: "2+ dépendances en mode frotte",
    });
  }

  // L2 — type and clarity patterns
  if (result.type === 'hybrid' && result.confidence === 'low') {
    active.push({
      id: 'T-L2-02', niveau: 2, nom: 'Identité absente',
      severite: 'danger', confiance: 'fort',
      message: "L'outil ne peut pas identifier ce que fait ton équipe. Pas parce que l'outil est insuffisant — parce que la mission n'est pas définie assez clairement pour être observable.",
      source: "Type = hybrid, clarté = absente",
    });
  }
  if (result.type === 'hybrid' && result.confidence === 'medium') {
    active.push({
      id: 'T-L2-09', niveau: 2, nom: 'Identité hybride',
      severite: 'warning', confiance: 'moyen',
      message: "Ton équipe a des comportements de types différents. Ce n'est pas un diagnostic d'échec — c'est un signal que la spécialisation n'a pas encore eu lieu.",
      source: "Type = hybrid, clarté = brouillée",
    });
  }
  if (result.secondarySignals.length >= 2) {
    active.push({
      id: 'T-L2-03b', niveau: 2, nom: 'Identité fragmentée',
      severite: 'warning', confiance: 'fort',
      message: "Plusieurs types coexistent dans tes réponses. L'équipe joue des rôles différents selon les semaines — c'est un signal de fragmentation de mission.",
      source: "2+ signaux secondaires détectés",
    });
  } else if (result.secondarySignals.length === 1) {
    active.push({
      id: 'T-L2-03a', niveau: 2, nom: 'Signal secondaire',
      severite: 'info', confiance: 'moyen',
      message: "Un type secondaire a été détecté dans tes réponses. Ton équipe a probablement deux rôles que l'organisation n'a pas encore séparés.",
      source: "1 signal secondaire détecté",
    });
  }
  if (result.type === 'complicated_subsystem' && incomingDepsCount(teamId, teams) >= 2) {
    active.push({
      id: 'T-L2-06', niveau: 2, nom: 'Sous-système à risque',
      severite: 'warning', confiance: 'moyen',
      message: "Plusieurs équipes dépendent d'un domaine que vous êtes les seuls à maîtriser. C'est une concentration de risque — pour elles, et pour vous.",
      source: "2+ équipes dépendantes entrantes",
    });
  }
  if (result.type === 'complicated_subsystem' && result.secondarySignals.includes('platform')) {
    active.push({
      id: 'T-L2-13', niveau: 2, nom: 'Opportunité platformisation',
      severite: 'info', confiance: 'moyen',
      message: "Des comportements Platform coexistent avec ton sous-système. Si ce que tu gères peut être exposé en self-service, une évolution Platform est envisageable.",
      source: "Signal secondaire Platform détecté",
    });
  }
  if (result.confidence === 'low' && result.alerts.length === 0) {
    active.push({
      id: 'T-L2-07', niveau: 2, nom: 'Signal insuffisant',
      severite: 'info', confiance: 'faible',
      message: "Le questionnaire n'a pas capturé assez de signal pour une recommandation fiable. L'outil a ses limites — une conversation avec un coach est la meilleure prochaine étape.",
      source: "Clarté absente, aucune alerte",
    });
  }

  // L2 — questionnaire pattern
  if (answers.q1b === 'incoming') {
    active.push({
      id: 'T-L2-05', niveau: 2, nom: 'Backlog capturé',
      severite: 'warning', confiance: 'moyen',
      message: "En pratique, ce sont les demandes entrantes qui décident de tes priorités. Ton équipe est réactive, pas stratégique — même si elle a un domaine assigné.",
      source: "Q1b = incoming",
    });
  }

  const sorted = active.sort(
    (a, b) => TRIGGER_ORDER.indexOf(a.id) - TRIGGER_ORDER.indexOf(b.id)
  );
  return { all: sorted, displayed: sorted.slice(0, 3) };
}

// ─── computeCognitiveLoad ─────────────────────────────────────────
// result is required for intrinsic CS signals
function computeCognitiveLoad(answers, deps, result) {
  const computeCharge = (signals) => {
    const eleves  = signals.filter(s => s.niveau === 'ÉLEVÉ').reduce((a, s) => a + s.poids, 0);
    const moderes = signals.filter(s => s.niveau === 'MODÉRÉ').reduce((a, s) => a + s.poids, 0);
    if (eleves >= 2)                   return 'ÉLEVÉ';
    if (eleves === 1 || moderes >= 2)  return 'MODÉRÉ';
    return 'FAIBLE';
  };

  const intrinsicSignals = [];
  if (dominant(answers.q1?.ranked) === 'B')
    intrinsicSignals.push({ niveau: 'ÉLEVÉ', poids: 1 });
  if (dominant(answers.q2?.ranked) === '4')
    intrinsicSignals.push({ niveau: 'ÉLEVÉ', poids: 1 });
  if (answers.q3b === 'few_critical')
    intrinsicSignals.push({ niveau: 'ÉLEVÉ', poids: 1 });
  if (result.type === 'complicated_subsystem')
    intrinsicSignals.push({ niveau: 'MODÉRÉ', poids: 1 });
  if (result.secondarySignals.includes('complicated_subsystem'))
    intrinsicSignals.push({ niveau: 'MODÉRÉ', poids: 1 });

  const extraneousSignals = [];
  if (dominant(answers.q1?.ranked) === 'C')
    extraneousSignals.push({ niveau: 'MODÉRÉ', poids: 1 });
  if (answers.q1b === 'incoming')
    extraneousSignals.push({ niveau: 'ÉLEVÉ', poids: 1 });
  if (dominant(answers.q2?.ranked) === '3')
    extraneousSignals.push({ niveau: 'MODÉRÉ', poids: 1 });
  if (answers.q3 === 'operational')
    extraneousSignals.push({ niveau: 'ÉLEVÉ', poids: 1 });
  if (answers.q3b === 'majority')
    extraneousSignals.push({ niveau: 'ÉLEVÉ', poids: 1 });
  if (answers.q3c === 'via_us')
    extraneousSignals.push({ niveau: 'ÉLEVÉ', poids: 1 });
  if (dominant(answers.q4?.ranked) === 'respond')
    extraneousSignals.push({ niveau: 'ÉLEVÉ', poids: 1 });
  if (depsCount(deps, 'bloque') >= 2)
    extraneousSignals.push({ niveau: 'ÉLEVÉ', poids: 2 });
  else if (depsCount(deps, 'bloque') === 1)
    extraneousSignals.push({ niveau: 'MODÉRÉ', poids: 2 });
  if (depsCount(deps, 'frotte') >= 2)
    extraneousSignals.push({ niveau: 'MODÉRÉ', poids: 2 });

  const germaneSignals = [];
  if (dominant(answers.q1?.ranked) === 'A' && answers.q1b !== 'incoming')
    germaneSignals.push({ poids: 1 });
  if (dominant(answers.q1?.ranked) === 'D')
    germaneSignals.push({ poids: 1 });
  if (answers.q1b === 'us')
    germaneSignals.push({ poids: 1 });
  if (answers.q3 === 'autonomous')
    germaneSignals.push({ poids: 1 });
  if (dominant(answers.q4?.ranked) === 'domain')
    germaneSignals.push({ poids: 1 });
  if (dominant(answers.q4?.ranked) === 'initiative')
    germaneSignals.push({ poids: 1 });
  if (dominant(answers.q2?.ranked) === '2' && answers.q3 === 'autonomous')
    germaneSignals.push({ poids: 1 });

  // Q4 reached with no discriminating result → hybrid type → fragmented germane
  const germaneFragmented = answers.q4 !== undefined && result.type === 'hybrid';

  const intrinsic  = computeCharge(intrinsicSignals);
  const extraneous = computeCharge(extraneousSignals);

  const computeGermane = (protecteurs, ext, fragmented) => {
    if (fragmented) return 'FAIBLE';
    const total = protecteurs.reduce((a, s) => a + s.poids, 0);
    let niveau;
    if (total >= 2 && ext !== 'ÉLEVÉ') niveau = 'ÉLEVÉ';
    else if (total >= 1)               niveau = 'MODÉRÉ';
    else                               niveau = 'FAIBLE';
    if (ext === 'ÉLEVÉ') {
      if (niveau === 'ÉLEVÉ')       niveau = 'MODÉRÉ';
      else if (niveau === 'MODÉRÉ') niveau = 'FAIBLE';
    }
    return niveau;
  };

  const germane = computeGermane(germaneSignals, extraneous, germaneFragmented);

  const questionsAnswered = ['q1', 'q1b', 'q2', 'q3', 'q3b', 'q3c', 'q4']
    .filter(q => answers[q] !== undefined).length;
  const dataQuality = questionsAnswered <= 2 ? 'sparse'
                    : questionsAnswered <= 3 ? 'partial'
                    : 'rich';

  const dominantAxis = extraneous === 'ÉLEVÉ' ? 'extraneous'
                     : intrinsic  === 'ÉLEVÉ' ? 'intrinsic'
                     : germane    === 'FAIBLE' ? 'germane'
                     : null;

  return { intrinsic, extraneous, germane, germaneFragmented, dataQuality, dominantAxis };
}
