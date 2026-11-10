# COOPECA — Couverture des tests et retours visuels

**Date** : 10/11/2026

---

## 1. Principes de test

- Un test doit valider un comportement, pas une apparence.
- Un test ne doit pas simuler un succès serveur, mais vérifier la réaction d'un échec.
- Les tests sont exécutés localement avant toute publication.
- Les tests prioritaires sont :
  1. L'authentification.
  2. L'ouverture d'un cycle à 31 versements.
  3. La validation d'une collecte.
  4. La suspension/reprise d'un dossier.
  5. Le retrait avec commission.
  6. La clôture totale.
  7. Le périmètre d'agence.
  8. La reproducibilité des écrans sur mobile.

---

## 2. Couverture recommandée

| Composant / Écran | Tests à ajouter |
|---|---|
| `InputTexte` | `default`, `required`, `maxLength`, `onBlur` asynchrone |
| `InputNumerique` | `decimal`, `integer`, `min`, `max`, `onBlur` |
| `InputMontantXAF` | `integer`, `flottant`, `NaN`, `formateur`, `onChange` |
| `InputSearch` / `InputRecherche` | `value`, `clear`, `disabled` |
| `Selecteur<T>` | `open`, `select`, `disabled`, `empty`, `error` |
| `ClientSelect` | `status PROVISOIRE`, `status CONFIRME`, `doublon` |
| `DossierSelect` | `syncStatus`, `open`, `empty` |
| `MetricCard` | `label`, `value`, `note`, `isEmpty` |
| `ActionCard` | `icon`, `symbol`, `onPress`, `disabled` |
| `StatusPill` | `success`, `pending`, `error`, `unknown` |
| `EmptyState` | `actionLabel`/`onAction`, `empty` |
| `ErrorState` | `retry`, `error`, `message` |
| `LoadingState` | `message`, `accessibility` |
| `SyncStatusBanner` | `unknown`, `online`, `offline`, `pending`, `error` |
| `DialogConfirmation` | `confirm`, `cancel`, `destructive`, `loading` |
| `AppScreen` | `padding`, `scroll`, `safeArea` |
| `AppButton` | `primary`, `secondary`, `danger`, `loading`, `disabled` |
| `AppTable` | `loading`, `error`, `empty`, `sort`, `pagination`, `filter` |
| `CollecteForm` | `validate`, `submit`, `state local`, `state server` |
| `DossierFlow` | `create`, `suspend`, `resume`, `progress` |
| `ClientForm` | `create`, `update`, `doublon`, `offline` |
| `ClientDetail` | `status`, `history`, `actions` |
| `DossierDetail` | `progress`, `balance`, `actions` |
| `ClientList` | `search`, `filter`, `pagination`, `sort` |
| `DossierList` | `filters`, `pagination`, `actions` |

---

## 3. Tests à exécuter en premier

1. `npm --prefix mobile run typecheck`.
2. `npm --prefix mobile test -- --runInBand`.
3. `npm --prefix admin run typecheck`.
4. `npm --prefix backend run lint`.
5. `npm --prefix backend test -- --runInBand`.

---

## 4. Tests manuels requis

| Écran | Test manuel |
|---|---|
| `AccueilAgent` | Vérifier les KPIs, la bannière sync, l'état hors ligne |
| `Clients` | Recherche, tri, statuts, doublon, filtre agence |
| `ClientForm` | Validation, error, envoi, statut `PROVISOIRE` |
| `Dossiers` | Filtres, pagination, statut, dossiers hors périmètre |
| `DossierDetail` | Progression 31, solde, actions |
| `Collectes` | Saisie, confirmation, état serveur |
| `CollecteResult` | Succès, erreur, conflit |
| `Menu` | Profil, sync, aide, déconnexion |
| `Dashboard` | Rôles, filtres, agences |
| `Retraits` | Approbation, commission, clôture |
| `Rapports` | Export, filtres, périmètre |
| `Audit` | Lecture seule, filtres, téléchargement |

---

## 5. Retours visuels

### 5.1 Mobile

- Vérifier les zones tactiles 48 px.
- Vérifier l'espacement des boutons, des champs, des listes.
- Vérifier les contrastes sur fond clair.
- Vérifier la largeur des contenus, les états `loading`.
- Vérifier que les labels sont toujours visibles.

### 5.2 Web

- Vérifier les états `loading` et `error`.
- Vérifier les tableaux, les titres, la lisibilité sur desktop.
- Vérifier la disposition mobile/tablette.
- Vérifier les comptes rendus de rôles.
- Vérifier l'ordre de navigation au clavier.

---

## 6. Cas de non-régression

- Ne jamais casser les comptes: `InputMontantXAF` reste entier.
- Ne jamais modifier les règles métier de cycle.
- Ne jamais rejeter un `PASS` envoyé par le serveur.
- Ne jamais supprimer les données locales sans confirmation.
- Ne jamais réinitialiser la base.
- Ne jamais lancer de migration destructive.

---

## 7. Indicateurs de succès

- Aucun écran ne présente un `FeatureScreen` ou `ScreenPlaceholder` dans le parcours principal.
- Aucun écran ne cache un état métier comme un bouton actif.
- Toutes les actions sensibles ont une confirmation.
- Toutes les erreurs ont un message explicite et une action de réessai.
- Aucune donnée de la base n'est simulée dans les écrans.

---

## 8. Membres de validation

- Agent terrain (2)
- Superviseur (1)
- Caissier (1)
- Administrateur (1)
- Auditeur (1)

---

## 9. Livrables de tests

- Résultats de test automatisés.
- Résultats de tests manuels.
- Captures d'écrans sur plusieurs modèles.
- Liste des cas ouverts et résolus.
