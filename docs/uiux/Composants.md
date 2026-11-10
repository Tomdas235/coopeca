# COOPECA — Composants réutilisables

**Date** : 10/11/2026
**Statut** : proposition d'architecture de composants

---

## 1. Principes

- Un composant doit avoir une seule responsabilité.
- Un composant doit être testable indépendamment du contexte métier.
- Un composant ne doit pas exporter de règle métier ; les règles métier sont imposées par la couche d'État.
- Un composant partagé est accessible à la fois depuis mobile et Web selon les contraintes du runtime.
- Chaque composant expose un état `"default"`, `"loading"`, `"error"`, `"empty"`, `"success"`, `"disabled"`.

---

## 2. Composants existants et recommandés

| Composant | État actuel | Action |
|---|---|---|
| `AppButton` | Mobile, OK | Unifier variantes `primary`, `secondary`, `ghost`, `danger`, `loading` |
| `AppScreen` | Mobile | Garder, adapter aux écrans, rajouter états de chargement |
| `InputTexte` | Mobile, OK | Conserver, expose `onBlur`, état d'erreur |
| `InputMontantXAF` | Mobile, OK | Conserver, centraliser le format XAF |
| `InputRecherche` | Mobile, OK | Devenir un champ générique `InputSearch` |
| `SelecteurSimple` | Mobile | Unifier dans un `Selecteur<T>` générique |
| `SelecteurClient` | Mobile | Conserver le template, sortir du composant |
| `SelecteurDossier` | Mobile | Conserver le template, sortir du composant |
| `MetricCard` | Mobile | Réaffecter à la synthèse des KPIs |
| `ActionCard` | Mobile | Standardiser, supprimer le symbole d'emoji |
| `AppCard` | Mobile | Peu utilisable seul : supprimer ou conserver comme sac |
| `StatusPill` | Mobile | Standardiser sur la palette et le libellé |
| `EmptyState` | Mobile | Réutiliser dans toutes les listes |
| `ErrorState` | Mobile | Réutiliser avec retry |
| `LoadingState` | Mobile | Réutiliser avec libellé de contexte |
| `AppNotice` | Mobile | Réutiliser pour infobulles et avis |
| `SyncStatusBanner` | Mobile | Réutiliser pour le sync mobile et Web |
| `DialogConfirmation` | Mobile | Utiliser pour les actions sensibles |
| `ScreenPlaceholder` | Mobile | Supprimer ou remplacer par un état métier concret |
| `FeatureScreen` | Mobile | Supprimer ou remplacer par un état métier concret |

---

## 3. Composants narratifs recommandés (à créer)

| Composant | Usage |
|---|---|
| `InputSearchField` | Recherche globale, champ filtre, recherche d'agent/marché |
| `InputSelectField<T>` | Sélecteur générique, liste imbriquée, recherche par mots clés |
| `InputDateField` | Date de début/fin, date ouvrable |
| `InputTextArea` | Text long, motif de réouverture, commentaire |
| `KpiCard` | Synthèse de l'accueil (clients, dossiers, collectes, versements) |
| `ProgressCard` | Progression d'un cycle 31 versements |
| `ProgressBadge` | Taille d'une fraction, combien de versements |
| `ClientCard` | Carte client avec statut et agence |
| `DossierCard` | Carte dossier avec état du cycle et prochaine action |
| `CollecteCard` | Résumé d'une collecte sélectionnée, montant, statut |
| `ResultCard` | Résultat d'une opération, montant, message de succès |
| `ReceiptCard` | Reçu numérique et code de suivi |
| `Table` | Tableau principal Admin, tri, pagination, filtres |
| `TableHeader` | En-tête de tableau, ordre, colonnes cachables |
| `TableRow` | Ligne tableau avec états |
| `Pagination` | Pagination minimale |
| `FilterBar` | Barre de filtre au-dessus du tableau |
| `SyncPill` | Bouchon de statut synchro dans une liste |
| `ConflictBanner` | Conflit de synchronisation + résolution |
| `LoadingScreen` | Écran de chargement global ou local |

---

## 4. Couleurs sémantiques à réserver

| État | Palette |
|---|---|
| Succès | `#15803D`, fond `#EFF6F1` |
| Attention | `#B45309`, fond `#FFF7ED` |
| Erreur | `#B91C1C`, fond `#FEF2F2` |
| Neutral | `#4A5A53`, fond `#EDF1EE` |
| Acquit | `#1F5B4B`, fond `#E8F0EC` |
| Innocent | `#123F35`, fond `#E7EEE9` |

---

## 5. Règles de contenu

- Les champs obligatoires doivent être marqués avec un astérisque rouge.
- Les libellés doivent être courts et compréhensibles.
- Les messages d'erreur doivent respecter le modèle : problème, champ, action.
- Les messages de succès doivent être d'une phrase, avec un retour à l'action.
- Les messages de conflit doivent proposer deux actions : ignorer / résoudre.

---

## 6. Test et non-régression

- Chaque composant expose des tests unitaires pour `default`, `error`, `disabled`, `loading`.
- Chaque composant expose un snapshot ou une vérification visuelle.
- Les changements de composants doivent ne pas casser les écrans existants.
- Les composants partagés doivent être testés en mobile et Web au maximum.
