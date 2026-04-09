import { QUESTIONS } from './types'

export const QUESTION_DEFINITIONS = {
  [QUESTIONS.Q1]: {
    id: QUESTIONS.Q1,
    text: "D'où vient principalement le travail de votre équipe ?",
    instruction: "Sélectionnez tout ce qui s'applique, puis classez par ordre d'importance.",
    type: 'multiselect_rank',
    options: [
      {
        id: 'A',
        label: "D'un domaine ou processus métier dont notre équipe est responsable en continu",
      },
      {
        id: 'B',
        label: "D'un domaine technique précis que nous sommes les seuls à maîtriser, et que d'autres équipes sollicitent",
      },
      {
        id: 'C',
        label: "De demandes variées que d'autres équipes nous adressent",
      },
      {
        id: 'D',
        label: "De problèmes ou besoins que notre équipe identifie elle-même",
      },
    ],
  },

  [QUESTIONS.Q1B]: {
    id: QUESTIONS.Q1B,
    text: "Qui arbitre réellement les priorités de votre équipe ?",
    instruction: null,
    type: 'single_choice',
    options: [
      {
        id: 'us',
        label: "Nous — notre domaine et notre stratégie guident nos choix, même si nous recevons des demandes",
      },
      {
        id: 'incoming',
        label: "Les demandes entrantes — ce sont elles qui dictent notre backlog en pratique",
      },
    ],
  },

  [QUESTIONS.Q2]: {
    id: QUESTIONS.Q2,
    text: "Quand les autres équipes font appel à vous, qu'est-ce qu'elles viennent chercher ?",
    instruction: "Sélectionnez tout ce qui s'applique, puis classez par ordre d'importance.",
    type: 'multiselect_rank',
    options: [
      {
        id: '1',
        label: "Un service ou outil qu'elles utilisent directement, sans avoir besoin de nous à chaque fois",
      },
      {
        id: '2',
        label: "Du coaching ou de la formation — notre rôle est de les aider à progresser, pas de faire à leur place",
      },
      {
        id: '3',
        label: "Des livrables ou recommandations — nous produisons quelque chose qu'elles consomment ensuite",
      },
      {
        id: '4',
        label: "La gestion d'un système dont la complexité justifie une équipe dédiée",
      },
    ],
  },

  [QUESTIONS.Q3]: {
    id: QUESTIONS.Q3,
    text: "Quel est l'objectif de votre relation avec ces équipes ?",
    instruction: null,
    type: 'single_choice',
    options: [
      {
        id: 'autonomous',
        label: "Les rendre plus autonomes — notre rôle est de combler un manque, puis de nous retirer",
      },
      {
        id: 'operational',
        label: "Les maintenir opérationnelles — elles ont besoin de nous de façon durable, ce n'est pas temporaire par nature",
      },
    ],
  },

  [QUESTIONS.Q3B]: {
    id: QUESTIONS.Q3B,
    text: "Si votre équipe cessait d'exister demain, qui en souffrirait le plus ?",
    instruction: null,
    type: 'single_choice',
    options: [
      {
        id: 'majority',
        label: "La majorité des équipes de l'organisation — elles perdraient un service ou outil qu'elles utilisent régulièrement",
      },
      {
        id: 'few_critical',
        label: "Un nombre restreint d'équipes — mais de façon critique, car personne d'autre ne peut prendre en charge ce que nous faisons",
      },
    ],
  },

  [QUESTIONS.Q3C]: {
    id: QUESTIONS.Q3C,
    text: "Comment ces équipes accèdent-elles à ce que vous fournissez ?",
    instruction: null,
    type: 'single_choice',
    options: [
      {
        id: 'self_service',
        label: "En autonomie — elles utilisent ce qu'on a construit sans avoir besoin de notre intervention",
      },
      {
        id: 'via_us',
        label: "Via nous — elles doivent nous solliciter directement pour obtenir ce dont elles ont besoin",
      },
    ],
  },

  [QUESTIONS.Q4]: {
    id: QUESTIONS.Q4,
    text: "Classez ces trois réalités selon leur poids réel dans le travail quotidien de votre équipe.",
    instruction: "Du plus fréquent au moins fréquent — glissez pour réordonner.",
    type: 'rank_only',
    options: [
      {
        id: 'domain',
        label: "Notre équipe gère un domaine métier précis dont elle est responsable",
      },
      {
        id: 'respond',
        label: "Notre équipe répond aux demandes d'autres équipes de l'organisation",
      },
      {
        id: 'initiative',
        label: "Notre équipe prend des initiatives pour améliorer les capacités de l'organisation",
      },
    ],
  },
}
