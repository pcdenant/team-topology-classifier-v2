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

// Gap 6.6 — T-L2-04 and T-L2-01b share the same card (object reference)
const BLOQUE_CARD = {
  titre:   "Cartographier les dépendances bloquantes avec les équipes concernées",
  critere: "Chaque dépendance a un propriétaire identifié et une date de résolution",
};
// Gap 6.2 — T-L2-01a card added; all other unmapped triggers are skipped silently
const QUICK_WIN_CARDS = {
  'T-L2-04':  BLOQUE_CARD,
  'T-L2-01b': BLOQUE_CARD,
  'T-L2-01a': {
    titre:   "Organiser une session de 30 minutes avec l'équipe bloquante pour nommer le problème précisément",
    critere: "Les deux équipes ont une formulation commune du blocage et une première piste d'action identifiée",
  },
  'T-L1-01': {
    titre:   "Identifier les 3 demandes les plus fréquentes et documenter leur mode d'accès actuel",
    critere: "Un document partagé liste les demandes avec leur fréquence et le temps de traitement moyen",
  },
  'T-L1-02': {
    titre:   "Lister les livrables produits et identifier lesquels pourraient être faits par les équipes elles-mêmes",
    critere: "Chaque livrable a une note : transférable / non transférable + pourquoi",
  },
  'T-L1-03': {
    titre:   "Organiser une session de 30 minutes avec le manager pour répondre : quel problème métier disparaîtrait si l'équipe cessait d'exister ?",
    critere: "Une phrase de mission — imparfaite est OK, inexistante ne l'est pas",
  },
  'T-L2-05': {
    titre:   "Lister les 5 dernières décisions de backlog — qui les a réellement prises ?",
    critere: "La liste révèle le vrai décideur vs le décideur déclaré",
  },
  'T-L2-08': {
    titre:   "Nommer les 2 relations les plus frictionnelles et poser une question à chaque équipe : qu'est-ce qui nous ralentit dans notre collaboration ?",
    critere: "Chaque équipe a répondu — même si les réponses se contredisent",
  },
};

// Gap 6.1 — exact content for each structural item
const ENABLING_TEAM_ITEM = {
  action:    "Engager une Enabling team — identifier un coach ou référent disponible pour les 6 à 8 prochaines semaines",
  condition: "Enabling team recommandée par le diagnostic",
};

const AXIS_ITEMS = {
  extraneous: {
    action:    "Réduire les interruptions entrantes — bloquer des créneaux de travail sans sollicitation dans l'agenda de l'équipe",
    condition: "Charge extrinsèque élevée — dépendances et demandes dominent le temps de l'équipe",
  },
  intrinsic: {
    action:    "Documenter la connaissance critique — identifier les 3 domaines où une seule personne détient la compréhension complète",
    condition: "Charge intrinsèque élevée — la complexité du domaine est concentrée",
  },
  germane: {
    action:    "Protéger le temps de travail profond — supprimer ou déléguer au moins 2 réunions récurrentes non essentielles",
    condition: "Espace de travail profond insuffisant — l'équipe n'a pas de temps pour progresser sur son domaine",
  },
};

const L1_STRUCTURAL_ITEMS = {
  'T-L1-01': {
    action:    "Définir un SLA de réponse aux demandes — distinguer urgent et important, publier les délais attendus",
    condition: "Goulot détecté — les demandes entrantes ne sont pas triées",
  },
  'T-L1-02': {
    action:    "Redéfinir chaque engagement actif avec une date de fin explicite — aucun mandat ouvert ne reste sans échéance",
    condition: "Dérive Enabling détectée — les missions n'ont pas de fin prévue",
  },
  'T-L1-03': {
    action:    "Écrire une phrase de mission en moins de 20 mots et la faire valider par le responsable direct",
    condition: "Mission non définie — l'équipe n'a pas de domaine prioritaire identifié",
  },
};

// Gap 6.4 — fallbacks by futureState.type to guarantee minimum 3 structural items
const TYPE_STRUCTURAL_FALLBACKS = {
  stream_aligned: [
    { action: "Clarifier les frontières du domaine avec les équipes adjacentes — documenter qui peut faire quoi sans solliciter l'équipe", condition: "Fallback — frontières de domaine" },
    { action: "Définir le critère de Done du domaine — qu'est-ce qui signifie concrètement que la valeur a été livrée ?", condition: "Fallback — critère de valeur" },
  ],
  platform: [
    { action: "Mesurer le taux d'adoption self-service — combien d'équipes utilisent ce qui est fourni sans solliciter l'équipe directement ?", condition: "Fallback — adoption self-service" },
    { action: "Identifier les 3 services les plus sollicités et les exposer via une interface documentée et accessible", condition: "Fallback — services exposés" },
  ],
  enabling: [
    { action: "Lister les équipes accompagnées et vérifier que chacune a un critère de succès et une date de fin documentés", condition: "Fallback — missions actives" },
    { action: "Définir le critère de sortie de chaque mission d'accompagnement active — à partir de quand le désengagement est justifié ?", condition: "Fallback — critère de sortie" },
  ],
  complicated_subsystem: [
    { action: "Documenter les interfaces vers le sous-système — qui peut demander quoi, par quel canal, avec quel délai attendu", condition: "Fallback — interfaces sous-système" },
    { action: "Identifier le bus factor : combien de personnes comprennent entièrement le sous-système sans dépendre d'une seule ?", condition: "Fallback — bus factor" },
  ],
  null: [
    { action: "Réunir l'équipe pour répondre à une seule question : quel est le travail que personne d'autre ne peut faire à notre place ?", condition: "Fallback — mission fondamentale" },
    { action: "Demander au responsable de classer les 3 dernières livraisons par ordre de valeur perçue pour l'organisation", condition: "Fallback — valeur perçue" },
  ],
};
TYPE_STRUCTURAL_FALLBACKS.hybrid = TYPE_STRUCTURAL_FALLBACKS.null;

function buildStructural(futureState, triggers, cognitiveLoadGap, interactionGaps) {
  const items = [];

  // 1. Enabling team — always first if recommended
  if (futureState.enablingTeam === 'Recommandée') {
    items.push(ENABLING_TEAM_ITEM);
  }

  // 2. Dominant cognitive load axis
  if (cognitiveLoadGap.dominantAxis !== null) {
    items.push(AXIS_ITEMS[cognitiveLoadGap.dominantAxis]);
  }

  // 3. Active L1 triggers
  for (const t of triggers.all.filter(t => t.niveau === 1)) {
    if (L1_STRUCTURAL_ITEMS[t.id]) {
      items.push(L1_STRUCTURAL_ITEMS[t.id]);
    }
  }

  // 4. Interaction gaps — bloque (cap 2) then frotte (cap 1)
  const bloques = interactionGaps.filter(g => g.current === 'bloque').slice(0, 2);
  const frottes = interactionGaps.filter(g => g.current === 'frotte').slice(0, 1);
  for (const g of bloques) {
    items.push({
      action:    `Résoudre le blocage avec ${g.teamName} — organiser une session de clarification des frontières`,
      condition: "Dépendance bloquante — ce blocage coûte du throughput à chaque sprint",
    });
  }
  for (const g of frottes) {
    items.push({
      action:    `Clarifier la frontière avec ${g.teamName} — diagnostiquer la source de friction`,
      condition: "Friction régulière — à résoudre avant que ça devienne un blocage",
    });
  }

  // 5. Gap 6.4 — fill up to minimum 3 with type fallbacks
  const fallbacks = TYPE_STRUCTURAL_FALLBACKS[futureState.type ?? 'null'] ?? TYPE_STRUCTURAL_FALLBACKS.null;
  let fi = 0;
  while (items.length < 3 && fi < fallbacks.length) {
    items.push(fallbacks[fi]);
    fi++;
  }

  // 6. Cap at 5, assign priority
  return items.slice(0, 5).map((item, i) => ({ ...item, priorite: i + 1 }));
}

function generateActionPlan(futureState, triggers, cognitiveLoadGap, interactionGaps) {
  // Quick wins — iterate displayed triggers, skip unmapped (Gap 6.2), cap at 3
  const quickWins = [];
  for (const trigger of triggers.displayed) {
    const card = QUICK_WIN_CARDS[trigger.id];
    if (!card) continue; // Gap 6.2 — silent skip for unmapped triggers
    quickWins.push({
      titre:   card.titre,
      critere: card.critere,
      source:  `${trigger.id} — ${trigger.confiance}`, // Gap 6.3 — exact format
      horizon: '48h',
    });
    if (quickWins.length >= 3) break;
  }

  // Structural — Gap 6.1 + 6.4: exact content + minimum 3 guaranteed
  const structural = buildStructural(futureState, triggers, cognitiveLoadGap, interactionGaps);

  // Systemic — 3 fixed steps
  const systemic = [
    { etape: 1, titre: "Stabiliser", description: "Stabiliser les interactions — cible : modes fluides sur toutes les dépendances actives" },
    { etape: 2, titre: "Formaliser", description: "Formaliser le Team API — rendre les interfaces explicites et accessibles" },
    { etape: 3, titre: "Réévaluer", description: "Réévaluer la topologie dans 6 mois — relancer la Partie 1 avec les mêmes équipes" },
  ];

  return { quickWins, structural, systemic };
}

// ─── prefillTeamApi ───────────────────────────────────────────────

// Gap 7.3 — resolve raw answer IDs to readable labels locally (no questions.js dependency)
const Q1_OPTION_LABELS = {
  A: "D'un domaine ou processus métier dont notre équipe est responsable en continu",
  B: "D'un domaine technique précis que nous sommes les seuls à maîtriser, et que d'autres équipes sollicitent",
  C: "De demandes variées que d'autres équipes nous adressent",
  D: "De problèmes ou besoins que notre équipe identifie elle-même",
};

const Q2_OPTION_LABELS = {
  '1': "Un service ou outil qu'elles utilisent directement, sans avoir besoin de nous à chaque fois",
  '2': "Du coaching ou de la formation — notre rôle est de les aider à progresser, pas de faire à leur place",
  '3': "Des livrables ou recommandations — nous produisons quelque chose qu'elles consomment ensuite",
  '4': "La gestion d'un système dont la complexité justifie une équipe dédiée",
};

const Q3C_LABELS = {
  self_service: "En autonomie — les équipes utilisent ce que nous fournissons sans nous solliciter",
  via_us:       "Via l'équipe — les équipes doivent nous contacter directement pour obtenir ce dont elles ont besoin",
};

// Gap 7.2 — lookup helpers with defensive fallbacks
const TYPE_LABELS_FALLBACK = {
  stream_aligned:        'Équipe orientée valeur',
  platform:              'Équipe plateforme',
  enabling:              "Équipe d'accompagnement",
  complicated_subsystem: 'Équipe sous-système',
  hybrid:                'Équipe non définie',
};

const ALERT_LABELS_FALLBACK = {
  bottleneck:        "Goulot d'étranglement",
  enabling_drift:    "Enabling en dérive",
  undefined_mission: "Mission non définie",
};

const getTypeLabel  = (type)    => TYPE_META?.[type]?.label         ?? TYPE_LABELS_FALLBACK[type]  ?? type;
// ALERT_META uses .title (not .label) — fallback always provides the short label
const getAlertLabel = (alertId) => ALERT_META?.[alertId]?.label     ?? ALERT_LABELS_FALLBACK[alertId] ?? alertId;

// Gap 7.4 — build PartenaireItem[] by merging deps × interactionGaps on targetId
const buildPartenaires = (deps, interactionGaps) => {
  if (!deps || deps.length === 0) return [];
  return deps.map(dep => {
    const gap = interactionGaps.find(g => g.teamId === dep.targetId);
    return {
      teamId:      dep.targetId,
      teamName:    gap?.teamName ?? dep.targetId,
      mode:        dep.mode,
      recommended: gap?.recommended ?? null,
    };
  });
};

function prefillTeamApi(team, futureState, interactionGaps) {
  // Gap 7.7 — destructure name + defensive defaults
  const { name, answers = {}, deps = [], result } = team;

  const q1Dominant       = answers.q1?.ranked?.[0] ?? null;
  const q2Selected       = answers.q2?.selected ?? [];
  const partenairesList  = buildPartenaires(deps, interactionGaps);

  return {
    nom: {
      value:    name,
      status:   'complete',
      editable: false,
    },
    typeActuel: {
      value:    getTypeLabel(result.type),
      status:   'complete',
      editable: false,
    },
    // Gap 7.5 — empty when futureState.type is null
    typeCible: {
      value:    futureState.type !== null ? getTypeLabel(futureState.type) : null,
      status:   futureState.type !== null ? 'complete' : 'empty',
      editable: false,
    },
    // Gap 7.3 — resolve Q1 ID to readable label; status based on key existence
    mission: {
      value:    q1Dominant ? (Q1_OPTION_LABELS[q1Dominant] ?? q1Dominant) : null,
      status:   answers.q1 !== undefined ? 'partial' : 'empty',
      editable: true,
    },
    // Gap 7.3 — resolve Q2 IDs to readable labels
    outputs: {
      value:    q2Selected.map(id => Q2_OPTION_LABELS[id] ?? id),
      status:   answers.q2 !== undefined ? 'partial' : 'empty',
      editable: true,
    },
    // Gap 7.3 — resolve Q3c ID to readable label
    modeAcces: {
      value:    answers.q3c ? (Q3C_LABELS[answers.q3c] ?? answers.q3c) : null,
      status:   answers.q3c !== undefined ? 'partial' : 'empty',
      editable: true,
    },
    // Gap 7.4 — PartenaireItem[] with teamName + recommended
    partenaires: {
      value:    partenairesList,
      status:   partenairesList.length > 0 ? 'complete' : 'empty',
      editable: false,
    },
    // Gap 7.2 + 7.6 — short alert labels; empty when no alerts
    alertes: {
      value:    result.alerts.map(a => getAlertLabel(a)),
      status:   result.alerts.length > 0 ? 'complete' : 'empty',
      editable: false,
    },
    slo:     { value: null, status: 'empty', editable: true },
    cadence: { value: null, status: 'empty', editable: true },
    contact: { value: null, status: 'empty', editable: true },
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
