# COOPECA — Audit UX/UI

**Date** : 10/11/2026
**Périmètre** : audit complet de l'interface mobile, de l'interface Web admin et des composants réutilisables.
**Règle d'audit** : un écran, un composant ou une route ne compte pas comme fonctionnel tant que le parcours complet jusqu'à la persistance serveur n'est pas démontré.

> **Note importante sur les sources** : les maquettes officielles `COOPECA_UX_UI_Design_Concept_v1.0.pptx`, `COOPECA_Wireframes_Ecrans_v1.0.pptx`, `COOPECA_Wireframes_Web_v1.0.pptx` et `COOPECA_Parcours_Web_Fonctionnels_v1.0.docx` sont des fichiers binaires non dépouillés dans ce dépôt. Le document `COOPECA_Branding_UIUX_Guidelines_v1.md` est la seule source textuelle disponible. Toute valeur de charte non confirmée dans ces fichiers est donc marquée **à valider**.

---

## 1. Synthèse exécutive

COOPECA possède une base architecturale solide et une identité visuelle provisoire cohérente : fond clair `#F4F6F3`, texte sombre `#23302B`, vert profond `#123F35`, vert action `#1F5B4B`, or `#E7B84B`, statuts textuels et contrastes respectés dans la plupart des composants. L'objectif de cette refonte n'est pas un relooking CSS, mais une architecture de navigation, des composants réutilisables, des parcours d'usage et une hiérarchie des informations.

### 1.1 Ce qui est bien

- Palette de marque provisoire cohérente entre mobile et admin.
- Composants de saisie avec validation de champ et `InputMontantXAF` respectant l'entier XAF.
- États vides, chargement et erreur existants, marqués comme foundations à déployer.
- Contrôle d'accès backend par rôle et par branche, transactionnel pour les écritures dossiers/cycles.
- Séparation du statut métier et de l'état de synchronisation en cours de formalisation.
- Bonne règle métier : montants FCFA entiers, cycle à 31 versements, commission unique au premier retrait approuvé.

### 1.2 Ce qui est problématique

- Absence de système de composants accélère la duplication des styles.
- Les écrans de la navigation mobile sont principalement des squelettes, pas des parcours métier clos.
- La hiérarchie visuelle et le feedback utilisateur sont trop variables.
- Les tableaux admin n'offrent pas encore les fonctionnalités de production attendues.
- Les états de chargement, d'erreur, de hors-ligne, de synchronisation et de conflit ne sont pas unifiés.


### 2.4 Composants et graphismes

| Élément | Problème | Action |
|---|---|---|
| Duplication | `InputTexte`, `InputNumerique`, `InputMontantXAF` et `InputRecherche` se ressemblent | Fusionner dans des composants UI standardisés |
| Boutons | `AppButton` propose `primary/secondary/danger`, mais l'usage diffère selon les écrans | Définir variantes `primary`, `secondary`, `ghost`, `danger`, `loading` et règles d'accessibilité |
| Sélecteurs | `SelecteurSimple`, `SelecteurClient`, `SelecteurDossier` se dupliquent | Standardiser un `Selecteur` générique avec templates client/dossier |
| Questionnaire | `AppNotice` existe, mais pas de bannière de synchro partagée | Réutiliser `SyncStatusBanner` et états de conflit |
| Icônes | Emoji, glyphes Unicode et `lucide-react-native` sont mélangés | Unifier les icônes en une palette durable |
| Affichage d'état | StatusPill utilise des couleurs brutes | Ajouter un indice sémantique textuel et une icône dédiée |
| Rapports | Admin a des tableaux incomplets | Standardiser les données brutes, les totaux, les périodes, les filtres et les exports |

### 2.5 Formulaires

| Élément | Problème | Action |
|---|---|---|
| Saisie | Champ requis, longueur, nombre entier, erreur d'un seul champ | Chaque champ a un label, une erreur locale, une action après validation |
| Confirmation | Les actions financières doivent être explicitement confirmées | `DialogConfirmation` pour collecte, remise, suppression, clôture |
| Masque | `InputMontantXAF` affiche un hint mais n'empêche pas un format brut | Le format sera normalisé côté serveur avant validation |
| Sauvegarde | La sauvegarde locale est exprimée, mais la liste d'état n'est pas centralisée | `SyncState` local, `pendingCount`, `retry`, `clearPending` |
| Erreur | Les messages d'erreur ne suivent pas un modèle unique | Modèle : problème, champ, action |
| Mot de passe | `LoginScreen` affiche le mot de passe, mais la sécurité est réservée au backend | Pas de règle d'UI visible, mais vérifier le mot de passe en visuel et la session |

### 2.6 État de chargement et erreur

| État | Problème | Action |
|---|---|---|
| Chargement | `LoadingState` et `Loading` existent mais sont incohérents | Uniformiser `Loading` mobile et `Loading` admin |
| Erreur | `ErrorState` est manuel; les écrans n'utilisent pas toutes le `ErrorState` | `ErrorBoundary` + `ErrorState` + retry + broadened du code |
| Hors ligne | Pas de mesure réseau fiable | `NetworkListener` + statut saisissable et visible |
| Conflit | Données locale et serveur divergent | Bannière de conflit + résolution explicite |
| Succès | L'action doit être confirmée par le serveur | Ajouter un état `CONFIRMED` dans le formulaire de collecte |

- Aucune maquette officielle exploitable n'est disponible pour figer la ligne directrice.



### 2.8 Interactions

- Boutons : `AppButton` a des états pressé/disabled, mais les écrans ne les utilisent pas toujours.
- Confirmations : `DialogConfirmation` existe mais n'est pas partout.
- Chargement : `LoadingState`, `Loading` existent, mais sont manuels.
- Erreurs : `ErrorState` existe mais pas toujours intégré.
- Sélection : `Selecteur*` existent, mais pas encore centralisés.
- Etats vides : `EmptyState` existe, mais pas toujours utilisé.

## 3. Liste de priorités P0/P1/P2

### P0 (critiques)

- Sécuriser et formaliser les contrôles d'accès dans les composants web :
  - `Dashboard`, `Clients`, `Cycles`, `Agents`, `Branches`, `Markets`, `WithdrawalsPending`, `Remittances`.
- Créer un design system mobile et web.
- Nettoyer la navigation principale mobile :
  - `AccueilAgent`, `Clients`, `Dossiers`, `Collectes`, `Menu`.
- Standardiser les composants de saisie et de sélection.
- Créer un état de chargement, de victoire, d'erreur et de conflit partagé.
- Mettre à jour `SelecteurClient`, `SelecteurDossier`, `InputMontantXAF` et `SelecteurSimple`.

### P1 (haute valeur)


## 4. Problèmes identifiés par fichier

| Fichier | Problème | Action |
|---|---|---|
| `mobile/src/components/ActionCard.tsx` | Symbole/emoji mélangé, icône par `symbol` ou `icon` | Unifier l'interface icône |
| `mobile/src/components/AppScreen.tsx` | Conteneur central large (`maxWidth: 560`) peut limiter sur grand écran | Adapter à l'écran, hiérarchiser la largeur |
| `mobile/src/components/InputRecherche.tsx` | Plage de recherche isolée, pas de composant `InputSearchField` réutilisable | Standardiser |
| `mobile/src/components/InputTexte.tsx` | `onBlur` ignoré dans la logique de validation réelle | Conserver pour validation asynchrone |
| `mobile/src/components/Selecteur*`.tsx | Surdoué pour un `SelecteurSimple` | Réduire vers un `Selecteur<T>` |

## 5. Incohérences et risques

1. **Champs obligatoires inconnus** : `clients` et `dossiers` existent, mais les référentiels de champs requis ne sont pas documentés en front.
2. **Règles de doublons** : `clientRepository` détecte un doublon potentiel, mais la boucle de revue est côté serveur.
3. **Références provisoires vs officielles** : `LOC-...`, `DOSS-...`, `DOSS-...` sont générés localement; le serveur attribue l'identifiant officiel.
4. **Définition du statut de client** : `PROVISOIRE`/`CONFIRME` est compris, mais le front n'applique pas encore les règles de revue.
5. **Périmètre d'agence** : les utilisateurs doivent voir les agences auxquelles ils ont accès; les écrans frontend doivent filtrer.
6. **Montants FCFA** : `InputMontantXAF` affiche un hint formaté, mais la règle d'acceptation est côté serveur.

## 6. Points à trancher avant le Lot 2

- Choix de la police pour mobile et Web (système vs embarquée).
- Définition des couleurs de statut `PROVISOIRE`, `CONFIRME`, `EN ATTENTE`, `CONFLIT`, `ERREUR`.
- Standardisation de l'icône de sélection.
- Définition des cinq composants UI communs.
- Contenus exacts du `Menu`.
- Parcours officiel de collecte.
- Parcours officiel de dossier.
- Parcours officiel de rapports.
- Validation des modèles PDF/impression.
- Validation des messages d'erreur francisés et de la traduction.

---

## 7. Décomposition du travail

| Phase | Livrable | État actuel |
|---|---|---|
| A | Audit complet | Documentaire |
| B | Design system | À créer |
| C | Navigation mobile | À réécrire |
| D | Parcours clients/dossiers/collectes | À créer |
| E | Admin | À refondre |
| F | Tests, responsive, accessibilité | À exécuter |

---

## 8. Jugement final

L'interface actuelle est un bon socle, mais elle n'est pas encore opérationnelle comme produit moderne. La refonte doit d'abord produire un système de composants, une navigation stable, des écrans fermés et des états de feedback unifiés. Les règles métier critiques sont déjà présentes dans le code et peuvent être validées après ces changements UI.

---

## 9. Attestations

- Audit réalisé sur le code des éléments lus et sur les documents de référence.
- Aucune modification de code n'a été effectuée pour cette étape.
- Maquettes officielles binaires non exploitées.
- Les données d'exemple citées dans `docs/COOPECA_Branding_UIUX_Guidelines_v1.md` sont des maquettes et non des données de production.

7. **Historique legacy** : la distinction entre les anciens flux et les cycles n'est pas visible dans l'interface.
8. **Sécurité du mot de passe** : le backend gère les sessions, mais le frontend doit masquer le mot de passe et respecter les politiques de session.

| `admin/src/pages/Dashboard.tsx` | `profile?.role` seul pour le menu d'administration | Exiger contrôles de permission backend |
| `admin/src/pages/Clients.tsx` | Tableau simple, aucun filtre, tri, pagination | Refonte |
| `admin/src/pages/Cycles.tsx` | Liste vide par défaut, pas de liaison client | Refonte |
| `admin/src/components/Sidebar.tsx` | Navigation globale non filtrée par agence | Filtrer par agence + rôles |
| `backend/src/dossiers/dossiers.service.ts` | Règle de dossier, mais la validation du montant journalier et du cycle n'est pas visible | Standardiser avec le cycle 31 versement |
| `backend/src/cycles/cycle.domain.ts` | Règles de cycle (31, montant fixe, commission) | Garder tel quel |

- Parcours de collecte complet :
  - sélection client/dossier, saisie du montant, confirmation, résultat, reçu, état de synchro.
- Parcours dossiers avec progression sur 31 versements.
- Page `Clients` avec recherche, filtres, fiche et historique.
- Page d'admin `Clients` et `Dossiers` avec liste et détail.
- Standardiser les tableaux.
- Accessibilité mobile et Web.

### P2 (amélioration continue)

- Tableau de bord par rôles.
- Rapports opérationnels.
- Résolution des conflits de synchro.
- Historique complet.
- Paramètres par rôles.
- Import/Export.

- Navigation : pas de retour clair dans les formulaires complexes.
