import { TEAM_TYPES, CONFIDENCE, ALERT_TYPES } from './types'

// ─── Type metadata ──────────────────────────────────────────────
export const TYPE_META = {
  [TEAM_TYPES.STREAM_ALIGNED]: {
    label: 'Équipe orientée valeur',
    subtitle: 'Stream-aligned team',
    color: '#2563EB',
    description:
      "Votre équipe est responsable d'un domaine ou processus métier de bout en bout. Elle possède ce domaine, prend ses propres décisions et livre de la valeur sans dépendre d'autres équipes pour compléter son travail. C'est le type d'équipe le plus courant et le plus directement connecté aux résultats business.",
    actions: [
      {
        title: "Cartographiez vos dépendances entrantes et sortantes",
        why: "Les équipes Stream-aligned accumulent souvent des dépendances invisibles qui ralentissent leur flux sans qu'on s'en rende compte.",
        why_now: "Chaque dépendance non identifiée est une source potentielle de blocage lors de votre prochain cycle de livraison.",
        how: "Listez les 5 dernières fois où votre équipe a attendu une autre équipe ou a été attendue. Ce sont vos dépendances prioritaires.",
      },
      {
        title: "Clarifiez votre périmètre avec les équipes adjacentes",
        why: "Un domaine flou crée des zones grises qui deviennent des tensions ou des travaux en double.",
        why_now: "Plus le périmètre reste imprécis, plus il est coûteux à redéfinir quand les tensions apparaissent.",
        how: "Organisez un atelier d'une heure avec les équipes qui partagent votre espace — listez ce qui vous appartient et ce qui ne vous appartient pas.",
      },
      {
        title: "Mesurez votre flux de livraison",
        why: "Sans mesure, il est impossible de savoir si l'organisation de votre équipe améliore ou ralentit la livraison.",
        why_now: "Les données de flux révèlent les vrais goulots — avant qu'ils ne deviennent des crises.",
        how: "Commencez par mesurer le cycle time de vos 10 derniers éléments livrés. C'est votre baseline.",
      },
    ],
  },

  [TEAM_TYPES.PLATFORM]: {
    label: 'Équipe plateforme',
    subtitle: 'Platform team',
    color: '#7C3AED',
    description:
      "Votre équipe construit et maintient des services ou outils réutilisés par d'autres équipes de l'organisation. Son rôle est de réduire la charge cognitive et les dépendances des équipes consommatrices en leur proposant des capacités en libre-service. La qualité de l'expérience des équipes qui vous utilisent est votre principal indicateur de succès.",
    actions: [
      {
        title: "Identifiez votre service le plus sollicité",
        why: "C'est là que votre impact est maximal — et souvent là que se trouvent vos plus grands goulots.",
        why_now: "Concentrer l'amélioration sur un seul service produit des résultats visibles plus rapidement qu'une refonte globale.",
        how: "Analysez vos 20 dernières sollicitations. Quel service revient le plus souvent ? Commencez par lui.",
      },
      {
        title: "Demandez aux équipes clientes ce qui leur manque",
        why: "Votre perception de ce qui est utile diverge souvent de ce que les équipes vivent réellement.",
        why_now: "Les besoins non exprimés deviennent des workarounds que vous découvrez trop tard.",
        how: "Posez cette question à trois équipes : \"Si vous ne pouviez garder qu'une seule chose de ce qu'on vous fournit, ce serait quoi ?\"",
      },
      {
        title: "Réduisez d'une étape le chemin pour accéder à vos services",
        why: "Chaque friction dans l'accès est une raison de ne pas vous utiliser — ou de vous contacter manuellement.",
        why_now: "L'objectif est le self-service. Chaque ticket manuel que vous évitez libère de la capacité pour les deux équipes.",
        how: "Prenez votre service le plus utilisé. Comptez les étapes pour y accéder. Supprimez-en une cette semaine.",
      },
    ],
  },

  [TEAM_TYPES.ENABLING]: {
    label: 'Équipe d\'accompagnement',
    subtitle: 'Enabling team',
    color: '#059669',
    description:
      "Votre équipe aide d'autres équipes à progresser sur un sujet précis — technique, organisationnel ou méthodologique. Votre objectif est de rendre les équipes que vous accompagnez plus autonomes, pas de devenir indispensable. Quand votre accompagnement fonctionne bien, les équipes n'ont plus besoin de vous sur ce sujet.",
    actions: [
      {
        title: "Mesurez l'autonomie réelle des équipes que vous avez accompagnées",
        why: "Sans mesure de l'autonomie acquise, il est impossible de savoir si votre accompagnement fonctionne ou crée une dépendance.",
        why_now: "Une équipe Enabling qui n'augmente pas l'autonomie de ses clients dérive vers un rôle de support permanent.",
        how: "Contactez deux équipes que vous avez accompagnées il y a 3+ mois. Ont-elles besoin de vous sur le même sujet ? Pourquoi ?",
      },
      {
        title: "Définissez des critères de sortie pour chaque accompagnement",
        why: "Sans fin définie, un accompagnement Enabling devient une dépendance par défaut.",
        why_now: "Formaliser la sortie en début d'accompagnement protège les deux parties — et donne un objectif clair.",
        how: "Pour votre prochain accompagnement, définissez en début d'engagement : \"Nous saurons que c'est terminé quand...\"",
      },
      {
        title: "Identifiez les sujets où vous intervenez de façon récurrente",
        why: "Si les mêmes équipes vous sollicitent sur les mêmes sujets, le transfert de compétence n'a pas eu lieu.",
        why_now: "C'est le signal d'alerte le plus précoce d'une dérive Enabling vers un rôle de support.",
        how: "Listez vos interventions des 3 derniers mois. Repérez les patterns répétitifs — sujet, équipe, type de demande.",
      },
    ],
  },

  [TEAM_TYPES.COMPLICATED_SUBSYSTEM]: {
    label: 'Équipe sous-système',
    subtitle: 'Complicated subsystem team',
    color: '#D97706',
    description:
      "Votre équipe gère un système ou composant dont la complexité dépasse ce que les équipes consommatrices peuvent raisonnablement prendre en charge. Cette spécialisation est intentionnelle et précieuse — mais elle crée aussi des dépendances structurelles. Votre rôle est de gérer cette complexité de façon à ne pas devenir un goulot pour l'organisation.",
    actions: [
      {
        title: "Documentez ce que vous êtes les seuls à savoir faire",
        why: "La connaissance tacite concentrée dans votre équipe est à la fois votre valeur et votre vulnérabilité.",
        why_now: "Si deux personnes clés quittent l'équipe, qu'est-ce que l'organisation perd définitivement ?",
        how: "Identifiez les trois compétences les plus rares de votre équipe. Commencez à documenter la première cette semaine.",
      },
      {
        title: "Clarifiez votre interface avec les équipes consommatrices",
        why: "Une interface floue crée des sollicitations informelles qui contournent vos processus et surchargent votre équipe.",
        why_now: "Chaque sollicitation hors-interface est du travail non planifié qui perturbe votre capacité.",
        how: "Définissez clairement : comment on vous sollicite, dans quels délais, pour quel type de demande. Partagez-le.",
      },
      {
        title: "Évaluez si une partie de votre système peut être simplifiée",
        why: "La complexité d'un sous-système croît souvent par accumulation historique, pas par nécessité réelle.",
        why_now: "Moins de complexité à gérer = plus de capacité pour ce qui a vraiment besoin de votre expertise.",
        how: "Listez les fonctionnalités ou composants les moins utilisés de votre système. L'un d'eux peut-il être délégué ou retiré ?",
      },
    ],
  },

  [TEAM_TYPES.HYBRID]: {
    label: 'Équipe non définie',
    subtitle: 'Profil hybride',
    color: '#6B7280',
    description:
      "Les signaux de votre équipe ne convergent pas vers un type dominant. Ce n'est pas un problème — c'est une information précieuse. La plupart des équipes en transformation se trouvent dans cet espace intermédiaire. L'objectif n'est pas de forcer une catégorie, mais de comprendre pourquoi les signaux sont mixtes.",
    actions: [
      {
        title: "Identifiez d'où vient réellement votre backlog",
        why: "Un backlog sans source principale claire est le signe d'une mission non définie — pas d'une équipe polyvalente.",
        why_now: "Clarifier l'origine du travail est la première étape avant toute décision organisationnelle.",
        how: "Listez les 15 derniers éléments de votre backlog. Classez-les par source. Quelle source domine réellement ?",
      },
      {
        title: "Organisez une conversation sur la mission avec votre direction",
        why: "Un profil hybride est souvent le résultat d'une mission définie par accumulation, pas par intention.",
        why_now: "Plus la mission reste floue, plus votre équipe absorbe des responsabilités qui ne lui appartiennent pas.",
        how: "Préparez trois slides : ce qu'on vous demande de faire, ce que vous faites réellement, ce que vous devriez faire. Présentez-les.",
      },
      {
        title: "Tentez de nommer votre équipe en une phrase sans liste",
        why: "Si vous avez besoin d'une liste pour décrire votre mission, c'est qu'elle n'est pas encore définie.",
        why_now: "Une mission exprimable en une phrase est le point de départ de toute clarification organisationnelle.",
        how: "Essayez : \"Notre équipe existe pour [faire quoi] pour [qui] afin que [quel résultat].\" Si vous ne pouvez pas compléter cette phrase seul, demandez à votre directeur.",
      },
    ],
  },
}

// ─── Confidence label ───────────────────────────────────────────
export const CONFIDENCE_META = {
  [CONFIDENCE.HIGH]: {
    label: 'Élevé',
    description: 'Les signaux convergent clairement vers ce type.',
    bars: 3,
  },
  [CONFIDENCE.MEDIUM]: {
    label: 'Moyen',
    description: 'Le type est probable mais quelques signaux restent mixtes.',
    bars: 2,
  },
  [CONFIDENCE.LOW]: {
    label: 'Faible',
    description: 'Les signaux sont contradictoires. Ce résultat est à prendre comme point de départ de discussion.',
    bars: 1,
  },
}

// ─── Secondary signal descriptions ─────────────────────────────
export const SECONDARY_META = {
  [`${TEAM_TYPES.STREAM_ALIGNED}_${TEAM_TYPES.COMPLICATED_SUBSYSTEM}`]: {
    title: 'Signal CS détecté',
    body: "Votre équipe porte un domaine métier clair — mais elle héberge aussi un composant technique spécialisé que d'autres équipes consomment. Ce composant mérite d'être examiné séparément : est-il à sa place dans votre équipe, ou devrait-il avoir sa propre équipe dédiée ?",
  },
  [`${TEAM_TYPES.PLATFORM}_${TEAM_TYPES.ENABLING}`]: {
    title: 'Signal Enabling détecté',
    body: "Vous fournissez des services réutilisables — mais vous accompagnez aussi les équipes lors des intégrations. Vérifiez que cet accompagnement reste temporaire et vise l'autonomie. Sinon il devient une dépendance déguisée.",
  },
  [`${TEAM_TYPES.COMPLICATED_SUBSYSTEM}_${TEAM_TYPES.PLATFORM}`]: {
    title: 'Signal Platform détecté',
    body: "Votre système est spécialisé et critique — mais une partie de ce que vous fournissez est consommée en self-service. Cette partie pourrait évoluer vers un modèle Platform plus explicite, allégeant la charge perçue sur votre équipe.",
  },
  [`${TEAM_TYPES.ENABLING}_${TEAM_TYPES.COMPLICATED_SUBSYSTEM}`]: {
    title: 'Signal CS détecté',
    body: "Votre équipe accompagne d'autres équipes — mais aussi gère un domaine très spécialisé. Assurez-vous que cette spécialisation ne crée pas une dépendance permanente contraire à votre mission d'Enabling.",
  },
}

// ─── Alert descriptions ─────────────────────────────────────────
export const ALERT_META = {
  [ALERT_TYPES.BOTTLENECK]: {
    title: 'Point de vigilance — Dépendance organisationnelle',
    icon: '⚠️',
    body: "Les équipes doivent passer par vous pour accéder à ce que vous fournissez. Si ce n'est pas un choix intentionnel, c'est un signal de goulot d'étranglement. Une Platform saine se consomme en autonomie — sans ticket, sans attente.",
  },
  [ALERT_TYPES.ENABLING_DRIFT]: {
    title: 'Point de vigilance — Faire à la place de',
    icon: '⚠️',
    body: "Votre intention est de rendre les équipes autonomes — mais ce que vous livrez ressemble à un service qu'elles consomment sans progresser. Vérifiez si votre accompagnement transfère réellement de la compétence ou crée une dépendance confortable pour les deux parties.",
  },
  [ALERT_TYPES.UNDEFINED_MISSION]: {
    title: 'Point de vigilance — Mission non définie',
    icon: '⚠️',
    body: "Votre backlog vient de sources multiples sans priorité claire. Ce n'est pas un problème de votre équipe — c'est souvent le signe que la mission n'a pas été définie explicitement par l'organisation. C'est un excellent point de départ pour une conversation avec votre direction.",
  },
}

// ─── Export helpers ─────────────────────────────────────────────
export function getSecondaryKey(primaryType, secondaryType) {
  return `${primaryType}_${secondaryType}`
}
