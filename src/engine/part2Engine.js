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

  // Q4 reached + hybrid type, but respond-dominant is still a clear signal (not fragmented)
  const germaneFragmented =
    answers.q4 !== undefined &&
    result.type === 'hybrid' &&
    dominant(answers.q4?.ranked) !== 'respond';

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

// ─── analyzeInteractions ──────────────────────────────────────────
const INTERACTION_RULES = {
  bloque: {
    recommended: "Collaboration immédiate",
    rationale: "Ce blocage coûte du throughput à chaque sprint. Une session de clarification des frontières est urgente avant tout autre chantier.",
  },
  frotte: {
    recommended: "Frontière à clarifier",
    rationale: "La friction régulière signale une frontière floue ou une capacité manquante d'un côté ou de l'autre. À diagnostiquer avant que ça devienne un blocage.",
  },
  roule: {
    recommended: "Protéger ce mode",
    rationale: "Cette relation fonctionne. Documenter ce qui la rend fluide pour reproduire le pattern ailleurs.",
  },
};

function analyzeInteractions(deps, result, teams) {
  if (!deps || deps.length === 0) return [];

  return deps.map(dep => {
    const target = teams.find(t => t.id === dep.targetId);
    const rule = INTERACTION_RULES[dep.mode] ?? INTERACTION_RULES.roule;
    return {
      teamId:      dep.targetId,
      teamName:    target?.name ?? dep.targetId,
      teamType:    target?.result?.type ?? null,
      current:     dep.mode,
      recommended: rule.recommended,
      rationale:   rule.rationale,
    };
  });
}

// ─── recommendFutureState ─────────────────────────────────────────
function recommendFutureState(result, triggers, cognitiveLoadGap) {
  if (result.confidence === 'low') {
    return {
      type: null,
      label: "Diagnostic incomplet",
      priority: null,
      enablingTeam: 'Recommandée',
      confidence: 'faible',
      message: "Les signaux sont insuffisants pour une recommandation fiable. La Partie 2 peut quand même vous aider à lire vos interactions.",
    };
  }

  const triggerDominantId = triggers.all[0]?.id ?? null;
  const { dominantAxis } = cognitiveLoadGap;
  const hasTrigger = (id) => triggers.all.some(t => t.id === id);

  const rule = (type, label, priority, enablingTeam, confidence) =>
    ({ type, label, priority, enablingTeam, confidence, message: null });

  if (result.type === 'stream_aligned') {
    if (triggerDominantId === 'T-L2-04')
      return rule('stream_aligned', "SA en urgence",
        "Intervention immédiate sur les interfaces — l'équipe ne peut pas livrer dans cet état",
        'Recommandée', 'fort');
    if (triggerDominantId === 'T-L1-03')
      return rule('stream_aligned', "SA à clarifier",
        "Définir le domaine avant tout arbitrage de backlog",
        'Recommandée', 'moyen');
    if (triggerDominantId === 'T-L2-01b')
      return rule('stream_aligned', "SA autonome",
        "Résoudre les dépendances bloquantes avant tout changement structurel",
        'Optionnelle', 'fort');
    if (triggerDominantId === 'T-L2-05')
      return rule('stream_aligned', "SA avec ownership",
        "Reprendre l'arbitrage du backlog — arrêter la réactivité comme mode par défaut",
        'Recommandée', 'fort');
    if (triggerDominantId === 'T-L2-03b' && result.secondarySignals.includes('platform'))
      return rule('platform', "SA → Platform émergente",
        "Identifier les services stables rendus aux autres équipes et les extraire progressivement",
        'Recommandée', 'moyen');
    if (triggerDominantId === 'T-L2-08')
      return rule('stream_aligned', "SA fluidifiée",
        "Clarifier les frontières avec les équipes sources de friction — cartographier avant d'agir",
        'Optionnelle', 'moyen');
    // SA-1 — no trigger
    return rule('stream_aligned', "SA confirmée",
      "Protéger l'ownership du domaine — documenter les frontières",
      'Optionnelle', 'fort');
  }

  if (result.type === 'platform') {
    // PL-5: T-L1-01 dominant AND T-L2-08 also active
    if (triggerDominantId === 'T-L1-01' && hasTrigger('T-L2-08'))
      return rule('platform', "Platform en transition",
        "Le goulot et la friction coexistent — l'ordre est : self-service d'abord, SLA ensuite",
        'Optionnelle', 'fort');
    if (triggerDominantId === 'T-L1-01')
      return rule('platform', "Platform produit",
        "Passer à l'accès self-service avant toute réorganisation",
        'Optionnelle', 'fort');
    if (triggerDominantId === 'T-L2-03b' && dominantAxis === 'germane')
      return rule('platform', "Platform + Enabling à séparer",
        "Séparer explicitement les missions de service et d'accompagnement",
        'Recommandée', 'moyen');
    if (triggerDominantId === 'T-L2-01b')
      return rule('platform', "Platform déchargée",
        "Réduire la surface de contact — toutes les demandes ne méritent pas le même niveau de service",
        'Optionnelle', 'moyen');
    // PL-1 — no trigger
    return rule('platform', "Platform confirmée",
      "Mesurer l'adoption self-service — c'est le seul indicateur qui compte",
      'Optionnelle', 'fort');
  }

  if (result.type === 'enabling') {
    if (triggerDominantId === 'T-L1-02')
      return rule('enabling', "Enabling clarifiée",
        "Arrêter la livraison directe — redéfinir chaque engagement avec une date de fin",
        'Non pertinente', 'fort');
    if (triggerDominantId === 'T-L2-01b')
      return rule('enabling', "Enabling + exit accéléré",
        "Planifier le désengagement sur les missions bloquées en priorité",
        'Non pertinente', 'moyen');
    if (triggerDominantId === 'T-L2-03b')
      return rule('enabling', "Enabling spécialisée",
        "Concentrer la mission sur un domaine de compétence — pas tout pour tout le monde",
        'Non pertinente', 'moyen');
    // EN-1 — no trigger
    return rule('enabling', "Enabling confirmée",
      "Vérifier que chaque mission a un exit plan explicite",
      'Non pertinente', 'fort');
  }

  if (result.type === 'complicated_subsystem') {
    if (triggerDominantId === 'T-L2-06')
      return rule('complicated_subsystem', "CS protégée",
        "Formaliser une interface claire vers les équipes dépendantes — réduire les demandes informelles",
        'Optionnelle', 'moyen');
    if (triggerDominantId === 'T-L2-13')
      return rule('platform', "CS → Platform",
        "Évaluer ce qui peut être exposé en self-service sans perdre la maîtrise du domaine",
        'Recommandée', 'moyen');
    if (triggerDominantId === 'T-L2-01b')
      return rule('complicated_subsystem', "CS avec interfaces",
        "Clarifier qui peut accéder à quoi — pas tout le sous-système n'est également critique",
        'Optionnelle', 'fort');
    // CS-1 — no trigger
    return rule('complicated_subsystem', "CS consolidée",
      "Documenter et protéger la connaissance — la concentration de savoir est le risque principal",
      'Non pertinente', 'fort');
  }

  if (result.type === 'hybrid') {
    if (triggerDominantId === 'T-L2-02')
      return rule(null, "Diagnostic incomplet",
        "L'outil ne peut pas trancher — une conversation avec un coach est la meilleure prochaine étape",
        'Recommandée', 'faible');
    if (triggerDominantId === 'T-L1-03')
      return rule(null, "Mission à construire",
        "Clarifier la mission avant de parler de topologie — le type viendra ensuite",
        'Recommandée', 'moyen');
    if (triggerDominantId === 'T-L2-09')
      return rule('stream_aligned', "SA probable",
        "Les signaux pointent vers un domaine — le tester explicitement avant de réorganiser",
        'Recommandée', 'moyen');
    if (triggerDominantId === 'T-L2-07')
      return rule(null, "Conversation requise",
        "Le parcours était trop court pour conclure — relancer le diagnostic avec plus de contexte",
        'Recommandée', 'faible');
    // HY default
    return rule(null, "Diagnostic incomplet",
      "L'outil ne peut pas trancher — une conversation avec un coach est la meilleure prochaine étape",
      'Recommandée', 'faible');
  }

  return { type: null, label: "Type non reconnu", priority: null, enablingTeam: 'Non pertinente', confidence: 'faible', message: null };
}

// ─── generateActionPlan ───────────────────────────────────────────
const QUICK_WIN_RULES = {
  'T-L2-04': {
    titre: "Cartographier les dépendances bloquantes avec les équipes concernées",
    critere: "Chaque dépendance a un propriétaire identifié et une date de résolution",
  },
  'T-L2-01b': {
    titre: "Cartographier les dépendances bloquantes avec les équipes concernées",
    critere: "Chaque dépendance a un propriétaire identifié et une date de résolution",
  },
  'T-L1-01': {
    titre: "Identifier les 3 demandes les plus fréquentes et documenter leur mode d'accès actuel",
    critere: "Un document partagé liste les demandes avec leur fréquence et le temps de traitement moyen",
  },
  'T-L1-02': {
    titre: "Lister les livrables produits et identifier lesquels pourraient être faits par les équipes elles-mêmes",
    critere: "Chaque livrable a une note : transférable / non transférable + pourquoi",
  },
  'T-L1-03': {
    titre: "Organiser une session de 30 minutes avec le manager pour répondre : quel problème métier disparaîtrait si l'équipe cessait d'exister ?",
    critere: "Une phrase de mission — imparfaite est OK, inexistante ne l'est pas",
  },
  'T-L2-05': {
    titre: "Lister les 5 dernières décisions de backlog — qui les a réellement prises ?",
    critere: "La liste révèle le vrai décideur vs le décideur déclaré",
  },
  'T-L2-08': {
    titre: "Nommer les 2 relations les plus frictionnelles et poser une question à chaque équipe : qu'est-ce qui nous ralentit dans notre collaboration ?",
    critere: "Chaque équipe a répondu — même si les réponses se contredisent",
  },
};

function generateActionPlan(futureState, triggers, cognitiveLoadGap, interactionGaps) {
  const { dominantAxis } = cognitiveLoadGap;

  // Quick wins — iterate displayed triggers, cap at 3, dedupe bloque actions
  const seen = new Set();
  const quickWins = [];
  for (const trigger of triggers.displayed) {
    const qw = QUICK_WIN_RULES[trigger.id];
    if (!qw) continue;
    const dedupeKey = (trigger.id === 'T-L2-04' || trigger.id === 'T-L2-01b') ? 'bloque' : trigger.id;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    quickWins.push({
      titre:   qw.titre,
      critere: qw.critere,
      source:  `${trigger.id} — confiance : ${trigger.confiance}`,
      horizon: '48h',
    });
    if (quickWins.length >= 3) break;
  }

  // Structural checklist
  const structural = [];
  let priorite = 1;

  if (futureState.enablingTeam === 'Recommandée') {
    structural.push({
      action: "Activer une Enabling team de transition",
      priorite: priorite++,
      condition: "Enabling team recommandée pour accompagner la transition",
    });
  }

  if (dominantAxis === 'extraneous') {
    structural.push({
      action: "Réduire la charge extrinsèque — clarifier les frontières d'équipe et réduire les interruptions",
      priorite: priorite++,
      condition: "Axe extrinsèque dominant",
    });
  } else if (dominantAxis === 'intrinsic') {
    structural.push({
      action: "Documenter et structurer la connaissance critique — réduire la complexité perçue",
      priorite: priorite++,
      condition: "Axe intrinsèque dominant",
    });
  } else if (dominantAxis === 'germane') {
    structural.push({
      action: "Créer des espaces protégés pour le travail de fond — réduire les interruptions non planifiées",
      priorite: priorite++,
      condition: "Axe germinale insuffisant",
    });
  }

  for (const t of triggers.all.filter(t => t.niveau === 1)) {
    if (t.id === 'T-L1-01')
      structural.push({ action: "Mettre en place un accès self-service pour les services les plus sollicités", priorite: priorite++, condition: "Goulot d'étranglement détecté" });
    if (t.id === 'T-L1-02')
      structural.push({ action: "Redéfinir chaque engagement Enabling avec une date de fin explicite", priorite: priorite++, condition: "Enabling drift détecté" });
    if (t.id === 'T-L1-03')
      structural.push({ action: "Formaliser la mission de l'équipe avec la direction — une phrase, pas une liste", priorite: priorite++, condition: "Mission non définie" });
  }

  structural.splice(5);

  // Systemic — 3 fixed steps
  const systemic = [
    { etape: 1, titre: "Stabiliser", description: "Stabiliser les interactions — cible : modes fluides sur toutes les dépendances actives" },
    { etape: 2, titre: "Formaliser", description: "Formaliser le Team API — rendre les interfaces explicites et accessibles" },
    { etape: 3, titre: "Réévaluer", description: "Réévaluer la topologie dans 6 mois — relancer la Partie 1 avec les mêmes équipes" },
  ];

  return { quickWins, structural, systemic };
}

// ─── prefillTeamApi ───────────────────────────────────────────────
function prefillTeamApi(team, futureState, interactionGaps) {
  const { answers, deps = [], result } = team;
  const missionRaw    = dominant(answers.q1?.ranked);
  const outputsRaw    = answers.q2?.selected ?? [];
  const modeAccesRaw  = answers.q3c;

  return {
    nom:         { value: team.name,                                           status: 'complete', editable: false },
    typeActuel:  { value: TYPE_META[result.type]?.label ?? result.type,        status: 'complete', editable: false },
    typeCible:   { value: futureState.type,                                    status: 'complete', editable: false },
    mission:     { value: missionRaw ?? null,                                  status: missionRaw    ? 'partial' : 'empty', editable: true },
    outputs:     { value: outputsRaw,                                          status: outputsRaw.length > 0 ? 'partial' : 'empty', editable: true },
    modeAcces:   { value: modeAccesRaw ?? null,                                status: modeAccesRaw !== undefined ? 'partial' : 'empty', editable: true },
    partenaires: { value: interactionGaps,                                     status: deps.length > 0 ? 'complete' : 'empty', editable: false },
    alertes:     { value: result.alerts.map(a => ALERT_META[a]?.title ?? a),   status: 'complete', editable: false },
    slo:         { value: null, status: 'empty', editable: true },
    cadence:     { value: null, status: 'empty', editable: true },
    contact:     { value: null, status: 'empty', editable: true },
  };
}

// ─── derivePart2 — public API ─────────────────────────────────────
export function derivePart2(team, teams = []) {
  const { answers, deps = [], result } = team;

  const triggers         = detectTriggers(result, deps, answers, team.id, teams);
  const cognitiveLoadGap = computeCognitiveLoad(answers, deps, result);
  const interactionGaps  = analyzeInteractions(deps, result, teams);
  const futureState      = recommendFutureState(result, triggers, cognitiveLoadGap);
  const actionPlan       = generateActionPlan(futureState, triggers, cognitiveLoadGap, interactionGaps);
  const teamApiDraft     = prefillTeamApi(team, futureState, interactionGaps);

  return { triggers, cognitiveLoadGap, interactionGaps, futureState, actionPlan, teamApiDraft };
}
