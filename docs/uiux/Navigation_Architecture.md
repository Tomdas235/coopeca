# COOPECA — Architecture de navigation proposée

**Date** : 10/11/2026
**Périmètre** : structure des routes, de la navigation et des permissions. Cette architecture est préliminaire et doit être validée avec les écrans avant d'être figée.

---

## 1. Principes

1. **Une navigation stable** : l'utilisateur ne doit jamais perdre sa position dans l'espace métier.
2. **Une hiérarchie claire** : action principale, actions secondaires, module d'audit.
3. **Un état explicite hors ligne** : l'écran indique toujours ce qui est saisi localement, ce qui est en attente, ce qui est accepté.
4. **Une cohérence mobile / web** : termes métier, statuts, formats de montant et règles de confirmation sont partagés.
5. **Une séparation des responsabilités** : les écrans métier ne contiennent pas de logique de synchronisation.

---

## 2. Navigation mobile — agent

### 2.1 TabBar principal

| Onglet | Rôle | Écrans associés |
|---|---|---|
| Accueil | Synthèse de l'agent, KPI, parcours rapides | `AccueilAgent` |
| Clients | Liste, recherche, filtres, fiche, création/édition | `Clients`, `ClientDetail`, `ClientForm` |
| Dossiers | Liste, filtre par statut, fiche, progression, historique, collecte | `Dossiers`, `DossierDetail`, `DossierFlow` |
| Collectes | Parcours de saisie, confirmation, résultat, reçu | `Collectes`, `CollecteForm`, `CollecteResult`, `CollecteReceipt` |
| Menu | Profil, synchronisation, paramètres, aide, déconnexion | `Menu`, `Profile`, `Sync`, `Settings`, `Help` |

> **Décision validée** : la barre d'onglets principale utilise uniquement **Accueil, Clients, Dossiers, Collectes, Menu**. Les modules d'audit (remises, clôture, cycles, comptable, audit, rapports) sont accessibles dans le panneau `Menu` ou dans la navigation web admin, en fonction du rôle.

### 2.2 Navigation ordonnée pour les formulaires

| Parcours | Pile | Règle |
|---|---|---|
| Client nouvel | `Clients` → `ClientForm` (création) | `ClientDetail` après validation |
| Client existant | `Clients` → onglet → `ClientDetail` | `ClientForm` en édition |
| Dossier | `Dossiers` → `DossierDetail` → `DossierFlow` | La progression suit le dossier, pas l'agent |
| Collecte | `Collectes` → `CollecteForm` → `CollecteResult` | `CollecteReceipt` après confirmation |
| Historique | `DossierDetail` → `Historique` | Touche retour, pas de retour arrière explicite |

### 2.3 Mise en œuvre technique

- **Routing** : Expo Router, avec le groupe `(tabs)` pour l'interface principale.
- **Repositories** : `mobile/src/database/repositories` pour l'état local.
- **Services** : `src/services/api` pour l'API, `src/features/auth` pour la session.
- **Sync** : fichier `src/services/sync.ts` centralisé qui expose `syncPending()`, `syncOne()`, `retry()`, `clearPending()`.
- **Erreurs réseau** : `NetworkListener` du client injecté dans l'`AppScreen` racine des écrans interactifs.

---

## 3. Navigation mobile — admin (supérieur)

Le menu supérieur doit être dédié au parcours de l'agent :

| Élément | Comportement |
|---|---|
| Profil | Affiche nom, rôle, agences, session courante |
| Synchronisation | Affiche le nombre de deux états, bouton retry, barre de progression |
| Paramètres | Gestion de la session, langue, unité |
| Aide | Documentation, support, fichiers de logs |
| Déconnexion | Confirme la fermeture de session |

---

## 4. Navigation web admin

### 4.1 Layout

| Élément | Rôle |
|---|---|
| Sidebar | Navigation principale par périmètre |
| Navbar | Recherche, profil, synchronisation, déconnexion |
| Contenu | Tableau de bord, listes, formulaires, détails |

### 4.2 Sidebar

| Section | Éléments |
|---|---|
| Synthèse | Tableau de bord, indicateurs, agences autorisées |
| Gestion | Clients, agents, agences/marchés, paramètres |
| Opérations | Dossiers, cycles, collectes, retraits en attente, remises |
| Audits | Piste d'audit, rapports, conflits |

### 4.3 Filtrage par agence

Chaque écran Admin doit filtrer les données par les agences de l'acteur connecté. Un accès multi-agence est possible seulement pour les rôles explicitement autorisés (ADMIN, SUPERVISOR multi-agence).

---

## 5. Routes de la navigation web

| Route | Rôle | Statut |
|---|---|---|
| `/` | Tableau de bord | À refondre |
| `/clients` | Liste, recherche, filtres | À refondir |
| `/clients/:id` | Fiche client | À créer |
| `/dossiers` | Liste des dossiers | À créer |
| `/dossiers/:id` | Fiche dossier | À créer |
| `/collectes` | Parcours de collecte | À créer |
| `/retraits` | Retraits en attente | À compléter |
| `/agents` | Gestion agents | À compléter |
| `/branches` | Gestion agences | À compléter |
| `/markets` | Gestion marchés | À compléter |
| `/rapports` | Rapports d'opérations | À créer |
| `/sync/conflicts` | Résolution des conflits | À créer |

---

## 6. Modèle d'état de navigation

| État | Règle |
|---|---|
| `idle` | L'écran ne possède pas encore les données |
| `loading` | Requête en cours |
| `success` | Données reçues |
| `error` | Échec réseau ou métier |
| `offline` | Données locales disponibles, aucun accès serveur |
| `sync_pending` | Opérations locales en attente |
| `conflict` | Conflit à résoudre avant validation |

---

## 7. Cas d'utilisation de navigation

### 7.1 Agent collecte

1. `AccueilAgent` → aperçu de la journée.
2. `Collectes` → sélectionner le client ou le dossier concerné.
3. Saisie du montant, validation, retour au résultat.
4. Reçu lu.
5. Retour à l'accueil.

### 7.2 Agent dossier

1. `Dossiers` → filtre, recherche.
2. `DossierDetail` → progression sur 31 versements.
3. `DossierFlow` → ouvrir un cycle, suspendre/représenter, enregistrer une collecte.
4. `Historique` → voir l'ensemble des opérations.

### 7.3 Superviseur

1. `Dossiers` → filtre par statut.
2. `DossierDetail` → voir les retraits en attente.
3. `Retraits` → approuver/refuser, commission.
4. `Historique` → vérifier la traçabilité.

### 7.4 Administrateur

1. `Clients` → créer, modifier, revue des doublons.
2. `Dossiers` → créer, fermer, réouvrir.
3. `Agents`, `Agences`, `Marchés` → gestion des permissions.
4. `Rapports` → export, filtres, périmètre d'agence.
