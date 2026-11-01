# Audit fonctionnel et technique — MVP COOPECA

> **Date** : 01/11/2026  
> **Périmètre** : audit uniquement de l'existant (backend NestJS + Prisma/PostgreSQL, interface web `admin/`, mobile Expo, infrastructure).  
> **Règle d'audit** : un écran ou un contrôleur ne compte pas comme fonctionnel tant que le parcours complet jusqu'à la persistance en base n'est pas démontré.

---

## 1. Synthèse exécutive

L'audit porte sur un projet en phase de **squelette préliminaire**, avec des preuves de bonne intention (modèles Prisma, domaines de règles métier, contrôleurs partiels, écrans web et mobile) mais un **parcours fonctionnel dégoubli** pour le MVP d'une agence pilote.

### 1.1 Ce qui est démontré

- **Modèle de données Prisma** : présence d'un modèle cible pour marchés, cycles, transactions, retraits, commissions et événements, cohérent avec `DECISIONS_METIER.md` §3.15.
- **Domaine des cycles** (`backend/src/cycles/cycle.domain.ts` et `.spec.ts`) : règles de 31 versements, montant fixe, suspension/reprise, calcul de retrait, commission unique, clôture par retrait total.
- **Contrôle d'accès** : guard d'authentification (`AuthGuard`) qui recharge le rôle et les agences actives, serviette (`requireRole`), assertions de portefeuille d'agent.
- **Vue admin partielle** : login, tableau de bord, liste clients, cycles, retraits en attente, gestion limitée du marché, admin des agences/agents.
- **Mobile** : TypeScript compile, base SQLite locale avec repositories pour clients, schéma de migration, écrans de connexion et de consultation clients, mais **synchronisation non implémentée**.
- **Infrastructure** : Docker Compose de dev (PostgreSQL 16 + Redis), fichiers `.env.example` propres, Dockerfile, orchestration.

### 1.2 Ce qui manque ou est non démontré

- **Dossiers** : aucun contrôleur/service/écran. Le modèle Prisma possède `Dossier`, mais aucun parcours d'ouverture, de clôture, de liaison client.
- **Collectes, reçus, remises, clôtures** : schémas et repositories SQLite locaux, mais **aucun contrôleur NestJS**, aucune synchronisation, aucune clôture journalière serveur.
- **Système de synchronisation** : présent au niveau de la définition SQLite, **non implémenté**.
- **Audit complet** : seulement un filtre global, une table `audit_logs` dans le modèle, mais **aucune piste d'audit opérationnelle** pour les cycles, retraits ou commissions.
- **Tableaux de bord/rapports** : présence d'un dashboard RESTreint, mais pas de rapport de règles complet.
- **Configuration de l'admin** : tous les écrans ne corespondent pas aux controllers disponibles.

### 1.3 Indicateurs globaux

- **MVP exploitable en agence pilote** : **NON** — nécessite des centaines de jours.
- **Statuts des modules** : majoritairement `NON TESTÉ` ou `ABSENT`, deux ou trois services en `PARTIEL` (comme le domaine des cycles, le guard auth, le module clients).
## 2. Classement des modules

| Module | État | Fichiers concernés | Tests | Problèmes | Actions nécessaires |
| **1. Authentification et gestion des rôles** | **PARTIEL** | `backend/src/auth/*`, `backend/src/users/*`, `admin/src/pages/Login.tsx`, `admin/src/services/auth.ts` | Oui (guard, service) | Le service `users` ne contient que `createAgent`/`updateAgent` et `findAll`. Aucune création de comptes ADMIN/SUPERVISOR/CASHIER/CONTRÔLEUR/AUDITEUR par interface. Aucun renouvellement de token côté mobile. Aucune révocation. | 1) Développer l'interface d'administration de comptes et de rôles. 2) Implémenter `/auth/sessions/refresh` et le renouvellement côté mobile. 3) Vérifier les permissions par rôle côté serveur route par route. 4) Ajouter des seeds de test. |
| **2. Organisation : zones, marchés et agences** | **PARTIEL** | `backend/src/branches/*`, `backend/src/cycles/cycles.controller.ts`, `admin/src/pages/Markets.tsx`, `admin/src/pages/Branches.tsx` | Oui (branches.service.spec) | Les marchés sont créés via `/markets` mais il n'existe pas de contrôleur de marché dans le backend. `Branches` ne gère que les agences. La hiérarchie zone/marché/agence est modélisée dans le schema, mais `Zone` n'est pas exposé d'interface. Les marchés ne sont pas assignés à une agence. | 1) Ajouter un contrôleur `markets` ou bien restructurer pour utiliser un module `markets` indépendant. 2) Implémenter la création/activation des agences et des marchés. 3) Vérifier l'isolement par agence. 4) Exposer une interface d'administration de zones/marchés/agences. |
| **3. Gestion des utilisateurs et agents** | **PARTIEL** | `backend/src/users/*` | Oui (users.service.spec) | Seul `ADMIN` peut gérer les utilisateurs. `CASHIER`, `CONTRÔLEUR`, `AUDITEUR`, `SUPERVISOR` ne sont pas gérables. Aucune interface pour affecter un agent à une agence ou une agence à un marché. Aucun écran de gestion des agents dans l'admin. | 1) Développer l'interface d'admin des utilisateurs, des rôles, des droits par agence. 2) Implémenter la création et l'affectation d'agents. 3) Ajouter les contrôles d'attribution de branche par rôle. |
| **4. Gestion des clients** | **PARTIEL** | `admin/src/pages/Clients.tsx`, `mobile/app/(tabs)/clients.tsx`, `mobile/src/database/repositories/clientRepository.ts` | Oui (pas de test backend pour clients) | Le backend n'expose pas de contrôleur `clients`. Le mobile crée un client local en `PROVISOIRE`, mais la synchronisation vers le serveur n'existe pas. L'admin web liste des clients mais les routes `/clients` ne correspondent pas à un controller backend. | 1) Ajouter le contrôleur REST `clients` avec idempotence. 2) Implémenter la réception serveur des clients provisoires, avec vérification de doublons (aucune fusion automatique). 3) Synchroniser les clients locaux en `PROVISOIRE` puis `CONFIRME`. 4) Vérifier l'interface admin et mobile. |
| **5. Gestion des cycles de tontine** | **PARTIEL** | `backend/src/cycles/*`, `backend/src/domain/exceptions/CycleRuleError.ts`, `admin/src/pages/Cycles.tsx`, `mobile/app/(tabs)/cycles.tsx` | Oui (cycle.domain.spec) | Le domaine est testable et les contrôleurs sont en place, mais il n'existe pas de contrôleur `clients` pour ouvrir un cycle, ni de service `dossiers` (non implémenté). `Dossier` n'est pas géré côté serveur. L'ouverture d'un cycle nécessite un `clientOperationId` mais la route n'existe pas. | 1) Développer le module `dossiers` avec ouverture/clôture de dossier (réouverture serveur). 2) Ajouter les contrôleurs `clients/:id/cycles`, `dossiers/:id/cycles`. 3) Coder les endpoints de suspension, reprise, retrait et avancement du cycle. 4) Vérifier la sérialisation en entiers XAF et les transactions. |


| **6. Gestion des cotisations** | **NON TESTÉ** | `backend/src/cycles/cycle.domain.ts` (partie des versements) | Oui (partiel) | L'audit définit "cotisation" de façon ambiguë : le produit COOPECA est basé sur des versements fixes et non sur un lot de cotisations distinct. La règle métier est exprimée par `recordDeposit` et la cible `31`. | 1) Affiner la définition sémantique de "cotisation" pour ce produit. 2) Si un paramétrage global de montant est exigé, ajouter une table `tontine_cycle_settings` et l'exposer dans l'API. 3) Corriger les représentations de montants flottants ou chaînes. |
| **7. Gestion des reçus** | **NON TESTÉ** | `mobile/src/database/repositories/recusRepository.ts`, `mobile/app/recus/[id].tsx`, `backend/src/recus/.gitkeep` | Aucun | Les reçus sont traités localement dans le mobile, mais aucun contrôleur serveur, aucune synchronisation, aucun numéro officiel, aucune impression. | 1) Définir le parcours de génération, d'impression et de numérotation officielle. 2) Ajouter les contrôleurs `reçus` avec flux offline/serveur. 3) Implémenter l'impression (API d'impression ou abstraction). |
| **8. Retraits partiels et totaux** | **PARTIEL** | `backend/src/cycles/cycles.service.ts` (`requestWithdrawal`, `reviewWithdrawal`), `admin/src/pages/WithdrawalsPending.tsx` | Oui (partiel, domaine) | La demander d'un retrait fonctionne côté serveur. La révision côté superviseur est codée, mais les écrans de retrait pour les agents ne sont pas liés aux prix réels. Aucune interface pour suivre l'état d'un retrait sur mobile. La commande de commission est atomique, mais la vérification manuelle du solde n'est pas exposée. | 1) Ajouter un écran agent pour demander un retrait. 2) Exposer les retraits en attente et l'état de transaction. 3) Tester le parcours avec un cas réel (suspension après retrait partiel, reprise, pas de commission double). 4) Vérifier le calcul de commission exact avec des montants à virgule décimale (entier XAF). |
| **9. Suspension et reprise des cycles** | **PARTIEL** | `backend/src/cycles/cycles.service.ts` (`changeCycleState`), `backend/src/cycles/cycle.domain.ts` | Oui (partiel) | La logique `suspendCycle`, `resumeCycle`, `lockCycle`, et les événements sont présents. Mais aucune interface mobile ni web pour appeler `SUSPEND`/`RESUME`. Aucune vérification de la disponibilité du compteur sur reprise. | 1) Ajouter les endpoints `POST /cycles/:id/suspend` et `/resumes`. 2) Vérifier que le compteur et le solde sont conservés. 3) Ajouter les écrans correspondants. |
| **10. Gestion des commissions** | **NON TESTÉ** | `backend/src/cycles/cycles.service.ts` (`reviewWithdrawal` crée `cycle_commissions`) | Aucun test de la couche service | La commission est créée côté serveur lors de l'approbation d'un retrait, mais il n'existe pas de contrôleur séparé, ni d'affichage de la commission. Aucune règle d'audit pour la réintégration ou l'annulation. | 1) Ajouter une API de lecture de commissions. 2) Exposer les conditions de la commission (montant fixe = versement fixe). 3) Vérifier la non-facturation après reprise. |

| **11. Gestion de caisse et remises des collectes** | **NON IMPLÉMENTÉ** | `backend/src/remises/*`, `backend/src/clotures/*`, `admin/src/pages/Remittances.tsx` | Aucun | Contrôleurs existants mais les routes sont non utilisées, et le service est vide (non implémenté). `Admin` affiche des écrans de remise et de caisse, mais le backend ne les expose pas. | 1) Développer les contrôleurs `remittances`, `receipts`, `closures`. 2) Implémenter la déclaration de remise, la confirmation caisse, les écarts. 3) Ajouter les écrans de caisse et de clôture. |
| **12. Clôture journalière** | **NON IMPLÉMENTÉ** | `backend/src/clotures/.gitkeep`, `mobile/src/database/repositories/clotureRepository.ts` | Aucun | Le schéma local SQLite existe, mais aucun contrôleur serveur, aucune validation de rapprochement, aucune procédure de clôture officielle. | 1) Définir le flux de clôture journalière serveur avec rapprochement. 2) Ajouter la clôture comme opération atomique et auditée. 3) Synchroniser les statuts de clôture. |
| **13. Tableaux de bord et rapports** | **PARTIEL** | `admin/src/pages/Dashboard.tsx`, `backend/src/cycles/cycles.service.ts` (`getFinancialSummary`, `getReconciliationReport`) | Aucun test d'intégration | Les endpoints financiers existent côté backend mais ne sont pas utilisés dans l'admin ou mobile. Aucun rapport standardisé (clôtures, retraits, commissions). | 1) Exposer les tableaux de bord web et mobile avec les données financières. 2) Ajouter des filtres par agence, période, statut. 3) Implémenter les rapports de résultat, de trésorerie, de règlement. |
| **14. Audit et traçabilité** | **NON IMPLÉMENTÉ** | `backend/src/audit/.gitkeep` | Aucun | La table `audit_logs` existe dans le modèle, mais aucun contrôleur, aucun service, aucune interface. | 1) Développer l'API d'audit (liste des événements, filtres). 2) Exécuter les écritures auditées pour chaque opération sensible. 3) Expérimenter les rôles lecture de la piste. |
| **15. Paramétrage général** | **NON TESTÉ** | Aucun | Aucun | Aucun endpoint de paramétrage, pas de table `system_settings`, pas de gestion des préfixes de numérotation, des devises, des formes de date, des séquences de numérotation. | 1) Ajouter un module `settings` avec lecture/écriture restreinte. 2) Prévoir les paramètres de cadre (devise, langue, fuseau, thousands). |
| **16. Sauvegardes et sécurité** | **PARTIEL** | `infra/docker/compose.dev.yml`, `backend/.env.example`, `admin/.env.example` | Aucun | La sécurité est fondée sur JWT et le gestionnaire d'agences. Pas de politique de mots de passe, pas de verrouillage, pas de rotation, pas de chiffrement local mobile, pas de sauvegarde, pas de protection contre la fuite de secrets. | 1) Ajouter la gestion de sessions (expiration, renouvellement). 2) Chiffrer la base locale mobile (ou au moins éviter de stocker les identifiants du backend dans le build). 3) Mettre en place des sauvegardes PostgreSQL (dump/restore script, restauration en cas de panne). 4) Exiger un port sécurisé et un HTTPS en production. |
| **17. Application mobile Agent** | **PARTIEL** | `mobile/app/*`, `mobile/src/features/*`, `mobile/src/services/*` | Oui (jest-expo bloqué), TypeScript compile | Le TypeScript compile, les tests unitaires existent mais ne peuvent pas s'exécuter dans cet environnement. Les endpoints mobiles ne collent pas au backend (`/cycles/tontine-cycles/deposits` vs `/tontine-cycles/:id/deposits`). La synchronisation est non implémentée. Aucun parfait deux-ways. | 1) Corriger les endpoints du mobile pour correspondre au backend. 2) Ajouter un timeout et la gestion de token expiré. 3) Mettre en place la synchronisation avec file, hash de payload et gestion de conflit. 4) Tester l'application sur un émulateur. |
| **18. Interface d'administration** | **PARTIEL** | `admin/src/pages/*`, `admin/src/services/api.ts` | Aucun test React | Beaucoup de pages existent mais les services API ne les implémentent pas. Les contrôleurs backend ne servent pas toutes les pages. | 1) Harmoniser les services API avec les controllers. 2) Implémenter les endpoints manquants. 3) Ajouter les écrans de clients, dossiers, collectes, reçus, remises, caisse et audit. |
| **19. Déploiement cloud et configuration réseau** | **NON TESTÉ** | `infra/docker/*`, `backend/.env.example`, `admin/.env.example` | Aucun | L'infrastructure est fournie en local. Aucune configuration pour un VPS, un reverse proxy, une base externe, des variables de production, ni un Dockerfile pour le backend. | 1) Générer un Dockerfile pour le backend et l'admin (ou un multi-stage Docker Compose). 2) Documenter l'environnement de production et le réseau CSRF/Docker. 3) Exécuter un déploiement de test en mode volontaire (démo) pour valider le lancement. |


## 3. Règles métier vérifiées

| Règle | Vérification | Conclusion |
|---|---|---|
| Un cycle comporte 31 versements, pas nécessairement 31 jours. | `CYCLE_TARGET_INSTALLMENTS = 31` dans `cycle.domain.ts`. | ✅ Appliquée. |
| Plusieurs versements peuvent être enregistrés le même jour. | Les tests et la logique comptent les versements, pas les dates. | ✅ Appliquée. |
| Le montant de cotisation est défini par le paramétrage. | Non encore exprimé comme paramètre global : le montant est défini dans le modèle `TontineCycle.fixedAmountXaf`. | ⚠️ À clarifier : le paramétrage n'existe pas encore. |
| Un nouveau client peut être provisoire. | Modèle `ClientStatus.PROVISIONAL`, mobile, repositories, `clientRepository`. | ✅ Appliqué côté mobile. |
| La suspension sans retrait conserve les fonds. | `recordDeposit` interdit en `SUSPENDED` ; `calculateAvailableBalance` ignore la suspension. | ✅ Appliquée. |
| Le retrait partiel déclenche la commission prévue. | `calculateWithdrawal` applique la commission si `commissionAlreadyPaid` est faux. | ✅ Appliquée. |
| Après un retrait partiel et une reprise, la commission ne doit pas être facturée une deuxième fois. | `calculateWithdrawal` retourne `commissionToChargeXaf = 0` si `commissionAlreadyPaid` est vrai. | ✅ Appliquée dans le domaine, pas vérifié dans les transactions complètes. |
| Le retrait total clôture le cycle. | `reviewWithdrawal` précise `closesCycle` et met à jour `status = CLOSED`. | ✅ Partiellement démontré, point de terminaison non couvert. |
| Un nouveau cycle est ouvert lors du retour du client après un retrait total. | Le module `dossiers` n'existe pas, donc ce parcours n'est pas démontré. | ❌ À implémenter. |


## 4. Problèmes identifiés

### 4.1 Bloquants

1. **Aucun backend pour les dossiers** : l'ouverture d'un cycle dépend d'un `dossierId`, mais le dossier n'existe pas côté API.
2. **Synchronisation non implémentée** : la base SQLite locale n'est pas connectée au serveur ; aucun flux critique n'est fiable sans elle.
3. **Incohérence d'endpoints mobile/backend** : le mobile appelle `/dossiers/:dossierId/cycles`, `/tontine-cycles/:id/deposits` alors que le backend expose `/markets` et `/tontine-cycles/:id`. Cela invalide la preuve mobile/backend.
4. **Aucun module de caisse, de remise, de clôture et de réception** côté serveur, alors que l'admin et le mobile affichent des écrans pour ces fins.
5. **Audit non opérationnel** : rien dans l'interface pour consulter la traçabilité.

### 4.2 Importants à corriger

1. **Paramétrage absent** : pas de paramétrage de devise, de numérotation, de période. Le montant du cycle est fixé à l'ouverture, mais la règle « montant défini par paramétrage » n'est pas mise en œuvre.
2. **Pas de contrôle d'entreprise par agence** : le backend vérifie l'accès de l'utilisateur aux agences, mais les marchés ne sont pas rattachés aux agences, ni n'existe d'interface d'administration multifonction.
3. **L'audit de doublons reste décrit localement** mais sans API serveur.
4. **Aucun test d'intégration** du backend pour les cycles réels (dépôt, retrait, commission, clôture).
5. **Mobile sans timeout / sans gestion de token expiré** (voir `MOBILE_QA_REPORT.md` P3, P4).
6. **Aucune sauvegarde automatisée** ni procédure de restauration ne figure dans la documentation.


### 4.3 Risques financiers

1. **Montants en chaîne ou en flottant** : le domaine utilise `bigint`, ce qui est correct, mais il est essentiel que la couche API et frontend gardent l'entier pur.
2. **Idempotence fragile** : le code utilise `idempotencyKey` et `payloadHash`, mais aucun test de concurrence n'existe pour prouver qu'une clé répétée ne crée pas deux versements.
3. **La réouverture d'un dossier est définie à la lettre** mais n'est pas implémentée côté serveur.
4. **Retrait total après commission** : la règle « retrait total doit épuiser le solde net » est valide dans le domaine, mais le code n'empêche pas la création d'un retrait total si `closesCycle = false` et `remainingBalanceXaf = 0`.
5. **Commission une seule fois** : la condition `commissionAlreadyPaid` est calculée dans le domaine, mais la persistance n'est pas vérifiée par un test couvrant une suspension/reprise réelle.

### 4.4 Risques de sécurité

1. **JWT secret dans les fichiers `.env.example`** — légitime en dev, mais il faut s'assurer que `backend/.env` n'est jamais versionné.
2. **Aucun contrôle de balayage réseau** : la sécurité dépend du `AuthGuard`, mais les routes non sécurisées doivent être auditées.
3. **Base SQLite non chiffrée** et peut contenir des données sensibles hors ligne.
4. **Pas de protection CSRF** explicite pour le web admin (sauf si la sécurité du framework le gère).
5. **Pas de gestion de droits pour les retraits** : seuls les `SUPERVISOR` et `ADMIN` peuvent approuver, mais la logique d'attribution d'agent collecteur n'est pas vérifiée au niveau de l'API.


## 5. Dépendances techniques

| Dépendance | État | Notes |
|---|---|---|
| **NestJS** | ✅ Présent, compilable | Modules partiels : `auth`, `users`, `branches`, `cycles`, `clients`, `remittances`. |
| **Prisma + PostgreSQL** | ✅ Modèle préparé | Migration unique `20261023183707_init_coopeca_schema`. Pas de migration appliquée. |
| **React/Vite (admin)** | ✅ Présent, TypeScript compile | Pages partiellement liées aux services. |
| **Expo / React Native (mobile)** | ✅ Présent, TypeScript compile | Tests Jest non exécutables, synchronisation non implémentée. |
| **Docker Compose** | ✅ Présent pour dev | PostgreSQL 16 + Redis. |
| **Jest** | ⚠️ Partiel | Domaine testé, tout le reste non testé. |
| **Express** | ✅ Utilisé par NestJS | Non exposé directement. |


## 6. Plan de finalisation priorisé

### P0 — Indispensable au MVP agence pilote

1. **Dossiers** : contrôleur, service, maquette client/dossier, ouverture/clôture/réouverture serveur.
2. **Synchronisation** : file durable, envoi, réponse idempotente, gestion des conflits.
3. **Corriger l'API mobile** : aligner les endpoints avec le backend.
4. **Contrôleurs clients/cycles/versements/retraits** : produire la preuve de parcours complet.
5. **Tests d'intégration** : versements, retraits, commission, clôture, concurrence.
6. **Protection des montants** : garantir que les controllers et services ne retournent que des entiers XAF.

### P1 — Recréation du cycle en production

1. **Caissier, remises, clôtures** : contrôleurs et écrans `admin` et `mobile`.
2. **Audit** : API de traçabilité, filtres, export.
3. **Paramètres généraux** : devise, numérotation, fuseau, période.
4. **Tableaux de bord** : essentiels agent et superviseur.
5. **Sauvegarde/restauration** et processus de maintenance.
6. **Sécurité renforcée** : session, renouvellement, chiffrement mobile, secret gestionné.

### P2 — Fonctionnalités complémentaires

1. Rapports complets (cash-flow, retraits, commissions, règlement).
2. Gestion des exceptions (doublons audités, alias clients, corrections).
3. Impression des reçus et conformité légale.
4. Déploiement cloud, reverse proxy, monitoring, alertes.


## 7. Estimation de charge par module (jours de développement)

| Module | Estimation | Justification |
|---|---|---|
| Dossiers et cycles | 10–15 j | Contrôleurs, services, écrans, tests. |
| Synchronisation | 8–12 j | File, idempotent, conflits, expo-sqlite. |
| Clients et affectation | 4–6 j | API, tests, mobile, admin. |
| Retraits et commissions | 5–7 j | Domaine complété, écrans, cas de figure. |
| Caisse/remises/clôture | 5–8 j | Contrôleurs, écrans, rapprochement. |
| Audit et traçabilité | 3–5 j | Tableaux, API, export. |
| Paramètres généraux | 2–3 j | Configuration des montants et périodes. |
| Tableaux de bord | 4–6 j | Visualisation, filtres, export. |
| Sauvegardes et sécurité | 4–6 j | Restauration, sessions, chiffrement. |
| Administration web (misc) | 5–8 j | Compléter les écrans existants. |
| Mobile | 4–6 j | Alignment API, timeout, session. |
| **Total estimation** | **54–86 j** | Hors tests de recette, hors documentation. |

> C'est une estimation brute. La charge peut augmenter si les `.docx` non lus doivent être déposés et si la hiérarchie zone/marché/agence doit être complétée.


## 8. Scénarios de recette pour le pilote

Avant de publier l'application, les scénarios suivants doivent être satisfaits dans une agence de démonstration :

1. **Connexion** : un agent avec un mot de passe valide s'authentifie et voit uniquement ses agences.
2. **Création de client hors ligne** : le client est créé en `PROVISOIRE` et visible dans l'admin.
3. **Création du marché** : un administrateur active un marché et l'associe à une agence.
4. **Affectation du client** : un agent est assigné au client et au marché.
5. **Ouverture du cycle** : un agent ouvre un cycle avec un montant fixe.
6. **Versement** : 31 versements peuvent être enregistrés le même jour, le 31e termine le cycle.
7. **Suspension / reprise** : les fonds et le compteur sont conservés.
8. **Retrait partiel** : lance la commission, reste un solde, puis reprise.
9. **Retrait total** : épuise le solde, clôt le cycle.
10. **Nouveau cycle** : le client revient avec un nouveau dossier selon les règles.
11. **Retrait de commission simple** : la commission ne se répète pas après reprise.
12. **Lecture de la caisse** : un superviseur voit les retraits en attente et les approuve.


## 9. Bloc note : incertitudes à valider avant correction

1. **Le module Client** : `clients` côté backend n'est pas exposé ; la création de client est gérée localement sur mobile. Il faut trancher si le backend crée directement `PROVISOIRE` ou si la liaison se fait par le dossier.
2. **La définition de "cotisation"** : la règle métier utilise des versements fixes, pas de cotisation séparée. Il faut valider la nomenclature avant de créer la table de paramétrage.
3. **La clôture journalière** : elle n'est plus le mécanisme financier central, mais le mobile conserve les anciens reçus/clôtures pour historique. Il faut le limiter explicitement.
4. **Réouverture de cycle** : la réglementation de la réouverture (motif, supervision) n'est pas encore codée.
5. **Numérotation officielle** : le serveur doit allouer les numéros d'identifiants officiels ; le mobile ne doit pas les générer.

---

## Conclusion

Le projet COOPECA possède une bonne base architecturale (modèle Prisma cible, domaine des cycles avec règles métier testées, contrôle d'accès par rôle et agence, infrastructure Docker dev), mais le MVP n'est pas exploitable en agence pilote en l'état. Les modules critiques (dossiers, synchronisation, caisse, clôture, audit, paramétrage) sont absents ou non fonctionnels côté serveur, et l'interface mobile/backend présente des incohérences d'endpoints.

**Recommandation :** ne pas lancer le pilote avant d'avoir complété au moins les fonctionnalités P0 (dossiers, synchronisation, contrôleurs clients/cycles/versements/retraits, tests d'intégration, protection des montants) et corrigé les incohérences mobile/backend.

---

*Crédit : audit généré par l'analyse du dépôt `coopeca` le 01/11/2026. Documentation source consultée : `AGENTS.md`, `docs/DECISIONS_METIER.md`, `docs/INVENTAIRE_INTERFACES.md`, `docs/MOBILE_QA_REPORT.md`, `docs/APP_FLOW.md`, `docs/UX_UI_DESIGN.md`, `docs/CONCEPTION_MODELE_DONNEES.md`, `backend/prisma/schema.prisma`, `backend/prisma/migrations/20261023183707_init_coopeca_schema/migration.sql`.*

