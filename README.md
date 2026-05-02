# Team Topology Classifier — Collaboration Solved

Outil de diagnostic d'équipe basé sur le framework Team Topologies (Skelton & Pais).
Aide les managers et coachs à identifier le type d'équipe, analyser les interactions, et produire un plan d'action.

**Audience :** Managers et Directeurs IT en contexte enterprise, Coachs Agiles et Scrum Masters.

---

## Fonctionnalités

### Phase 1 — Diagnostic aujourd'hui
- Questionnaire adaptatif (5 questions maximum, arbre de décision)
- Classification en 4 types : Stream-aligned, Platform, Enabling, Complicated Subsystem (+ Hybrid)
- Indice de clarté (Claire / Brouillée / Absente)
- Alertes organisationnelles : goulot, enabling drift, mission non définie
- Déclaration de dépendances inter-équipes (roule / frotte / bloque)
- Vue écosystème multi-équipes avec diagnostics automatiques
- Export Markdown + JSON par équipe

### Phase 2 — Trajectoire demain
- 15 triggers étendus (L1 depuis alertes P1 + L2 nouveaux patterns)
- Analyse de charge cognitive par axe (Intrinsèque / Extrinsèque / Germinale)
- 24 règles de recommandation Future State
- Plan d'action en 3 horizons : quick wins (48h), structurel (1–3 mois), systémique (3–6 mois)
- Team API draft prérempli depuis les données P1

---

## Stack technique

| Composant | Technologie |
|---|---|
| Framework | React 19 + Vite |
| Tests | Vitest 2 + Testing Library |
| Persistence | localStorage (`tt-classifier-teams-v2`) |
| Déploiement | Vercel via GitHub |
| Dépendances UI | Aucune (zéro bibliothèque tierce) |

---

## Structure du projet

```
src/
├── engine/
│   ├── types.js            — constantes TEAM_TYPES, CONFIDENCE, ALERT_TYPES
│   ├── questions.js        — QUESTION_DEFINITIONS (7 questions)
│   ├── branching.js        — getNextQuestion(), computeResult()
│   ├── content.js          — TYPE_META, CONFIDENCE_META, SECONDARY_META, ALERT_META
│   ├── part2Engine.js      — derivePart2() — moteur de dérivation P2
│   ├── index.js            — barrel export
│   ├── engine.test.js      — 43 tests moteur P1
│   └── part2Engine.test.js — 110 tests moteur P2
├── components/
│   ├── MultiSelectRank.jsx — sélection multiple + ranking drag & drop
│   ├── SingleChoice.jsx    — choix unique (auto-avance)
│   ├── RankOnly.jsx        — ranking pur (Q4)
│   └── Sidebar.jsx         — navigation persistante
└── screens/
    ├── HomeScreen.jsx       — dashboard multi-équipes
    ├── QuizScreen.jsx       — questionnaire adaptatif
    ├── ResultScreen.jsx     — résultats par équipe
    ├── DepScreen.jsx        — déclaration de dépendances
    ├── EcosystemScreen.jsx  — vue écosystème
    ├── FutureStateScreen.jsx — confirmation Future State P2
    └── ActionPlanScreen.jsx  — plan d'action + Team API draft
```

---

## Démarrage

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 153 tests
npm run build
```

---

## Moteur P2 — API publique

```js
import { derivePart2 } from './engine/part2Engine';

const {
  triggers,        // { all: Trigger[], displayed: Trigger[] }
  cognitiveLoadGap, // { intrinsic, extraneous, germane, dominantAxis, dataQuality }
  interactionGaps,  // InteractionGap[]
  futureState,      // { type, label, priority, enablingTeam, confidence }
  actionPlan,       // { quickWins[], structural[], systemic[] }
  teamApiDraft      // { nom, typeActuel, typeCible, mission, outputs, ... }
} = derivePart2(team, teams);
```

`part2Engine.js` est en lecture seule sur tous les fichiers `engine/` existants — les 43 tests P1 ne doivent jamais régresser.

---

## Tests

```
src/engine/engine.test.js       43 tests  — moteur P1 (branching, computeResult)
src/engine/part2Engine.test.js 110 tests  — moteur P2
  ├── 7 personas de validation (triggers + CL + futureState + actionPlan + teamApiDraft)
  ├── 33 tests gaps 6 & 7 (generateActionPlan + prefillTeamApi)
  └── edge cases (déduplication, fallbacks, germaneFragmented)
```

**Règle absolue :** aucun commit ne doit faire passer le total sous 153 tests ou introduire une régression sur les 43 tests P1.

---

## Contraintes moteur

- `branching.js`, `types.js`, `questions.js`, `content.js` — **ne jamais modifier**
- Les alertes P1 (`bottleneck`, `enabling_drift`, `undefined_mission`) sont des **inputs** de P2, jamais recalculées
- `part2Engine.js` ne persiste rien — la persistence appartient à `App.jsx`

---

*Auteur : Pierre-Cyril Denant — Collaboration Solved*
