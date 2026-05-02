# Changelog

Toutes les modifications notables sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [Unreleased]

### Added
- `generateActionPlan` — contenu structurel exact par source (enabling team, axes CL, triggers L1, interaction gaps bloque/frotte)
- `generateActionPlan` — card T-L2-01a ajoutée ; skip silencieux pour les triggers non mappés
- `generateActionPlan` — `buildStructural()` + `TYPE_STRUCTURAL_FALLBACKS` par `futureState.type` (minimum 3 items garanti)
- `prefillTeamApi` — labels lisibles pour mission (Q1), outputs (Q2), modeAcces (Q3c)
- `prefillTeamApi` — `buildPartenaires()` : structure `PartenaireItem[]` avec `{teamId, teamName, mode, recommended}`
- `prefillTeamApi` — `getTypeLabel` / `getAlertLabel` avec fallbacks défensifs sur TYPE_META / ALERT_META
- 38 tests d'étape 8 : validation actionPlan + teamApiDraft sur les 7 personas

### Fixed
- `generateActionPlan` — format `source` corrigé : `"ID — confiance"` (était `"ID — confiance : value"`)
- `prefillTeamApi` — `typeCible.status = 'empty'` quand `futureState.type === null`
- `prefillTeamApi` — `alertes.status = 'empty'` quand `result.alerts = []`
- `prefillTeamApi` — statuts `mission` / `outputs` basés sur l'existence de la clé, pas la valeur

---

## [0.7.0] — 2026-05-01 — Phase 3 : ActionPlanScreen

### Added
- `ActionPlanScreen.jsx` — plan d'action 3 horizons : quick wins (48h), structurel (1–3 mois), systémique (3–6 mois)
- `ActionPlanScreen.jsx` — section Team API draft avec différenciation visuelle `complete / partial / empty`
- Câblage App.jsx : `future-state → confirme → action-plan`

---

## [0.6.0] — 2026-05-01 — Fix germaneFragmented (Gap 3.2)

### Fixed
- `computeCognitiveLoad` — `germaneFragmented` exclut le cas hybrid avec `respond` dominant (signal clair, pas fragmentation)

---

## [0.5.0] — 2026-05-01 — Phase 2 : FutureStateScreen

### Added
- `FutureStateScreen.jsx` — affichage triggers, Future State recommandé, charge cognitive, interaction gaps
- Confirmation ou ajustement du Future State par l'utilisateur
- Câblage App.jsx : `result → future-state`

---

## [0.4.0] — 2026-05-01 — Phase 1 : part2Engine

### Added
- `part2Engine.js` — moteur de dérivation P2 complet :
  - `detectTriggers` — 15 triggers L1/L2 avec ordre de priorité et déduplication T-L2-04/T-L2-01b
  - `computeCognitiveLoad` — 3 axes (Intrinsèque, Extrinsèque, Germinale) avec poids et dégradation
  - `analyzeInteractions` — gaps relationnels avec recommandations par mode
  - `recommendFutureState` — 24 règles par type + règle absolue confidence:low
  - `generateActionPlan` — quick wins, checklist structurelle, 3 étapes systémiques fixes
  - `prefillTeamApi` — 11 champs avec statuts complete / partial / empty
- `engine/index.js` — export barrel `derivePart2`
- 57 tests unitaires couvrant les 7 personas de validation

---

## [0.3.0] — 2026-04-30 — M1 + M2 : améliorations P1

### Added
- M1 — `ResultScreen.jsx` : phrase de transition vers P2 (*"Le type identifie où tu es…"*)
- M2 — `DepScreen.jsx` : recadrage sémantique de "Ça frotte" (signal ambre + 🔍, jamais warning rouge)
- M2 — `EcosystemScreen.jsx` : badges de dépendances recadrés en cohérence

---

## [0.2.0] — 2026-04-30 — Phase 0 : stabilisation

### Added
- Dépendances épinglées dans `package.json`
- Vitest 2 configuré + premier passage de tests (23/23 moteur P1)
- ESLint strict activé

### Removed
- Fichiers morts supprimés

---

## [0.1.0] — 2026-04-30 — Phase 1 initiale : moteur P1 + UI

### Added
- Questionnaire adaptatif : arbre de décision 7 questions max, 5 en parcours standard
- Moteur de classification P1 : `branching.js`, `computeResult()`, `getNextQuestion()`
- 5 types d'équipes : Stream-aligned, Platform, Enabling, Complicated Subsystem, Hybrid
- Niveaux de confiance : Claire / Brouillée / Absente
- Alertes P1 : `bottleneck`, `enabling_drift`, `undefined_mission`
- Déclaration de dépendances inter-équipes : roule / frotte / bloque
- Vue écosystème multi-équipes avec 7 diagnostics automatiques
- Persistence localStorage (`tt-classifier-teams-v2`)
- Export Markdown + JSON par équipe
- Design system complet (tokens, palette, composants)
- `HomeScreen`, `QuizScreen`, `ResultScreen`, `DepScreen`, `EcosystemScreen`
