# COOPECA — Backend (NestJS)

Backend NestJS de COOPECA. L'API comprend l'authentification, les profils, les clients, les marchés, les cycles, les retraits, les synthèses, une lecture historique des remises et les opérations admin limitées sur agents/agences. La couverture métier reste partielle; se référer à la matrice ci-dessous et aux décisions métier avant d'étendre un flux financier.

## Stack

- NestJS + TypeScript (mode strict)
- API REST versionnée sous `/api/v1`
- Prisma (ORM) + PostgreSQL
- Docker / Docker Compose pour le développement local

## Démarrage rapide

```bash
npm --prefix backend install
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:validate
npm --prefix backend run build
npm --prefix backend test -- --runInBand
npm --prefix backend run test:e2e
npm --prefix backend run start:dev
```

Lancer les commandes depuis la racine du dépôt: la configuration locale est chargée depuis `backend/.env`. L'API écoute par défaut sur `http://localhost:3000/api/v1`.

Avec Docker, ce compose démarre PostgreSQL et Redis uniquement; lancer l'API séparément avec la commande ci-dessus:

```bash
docker compose -f infra/docker/compose.dev.yml up -d --wait
```

Dans un second terminal, depuis la racine du dépôt :

```bash
npm --prefix backend run start:dev
curl http://localhost:3000/api/v1/health
```

`docker compose config` permet de vérifier la configuration résolue avant le build. L’image API est compilée depuis le lockfile avec Prisma Client généré dans l’image ; un `npm ci` en échec arrête le build au lieu de basculer silencieusement vers une installation non verrouillée.

## Endpoints disponibles

| Méthode | Chemin | Description |
| --- | --- | --- |
| GET | `/api/v1/health` | Santé de l'API et de la base (200 ou 503) |
| POST | `/api/v1/auth/sessions` | Échange identifiant/mot de passe contre un jeton Bearer de 15 minutes |
| GET | `/api/v1/me` | Profil authentifié et agences actives autorisées |
| GET | `/api/v1/me/branches` | Agences actives accordées à l'utilisateur |
| GET | `/api/v1/markets` | Marchés actifs (lecture pour les clients métier) |
| GET | `/api/v1/markets/admin` | Tous les marchés et compteurs d'agences (ADMIN/SUPERVISOR) |
| POST | `/api/v1/markets` | Créer un marché (ADMIN/SUPERVISOR) |
| POST | `/api/v1/markets/{id}/active` | Activer/désactiver un marché (ADMIN/SUPERVISOR) |
| GET | `/api/v1/branches` | Liste globale des agences (ADMIN) |
| POST | `/api/v1/branches` | Créer une agence sur un marché actif (ADMIN) |
| PATCH | `/api/v1/branches/{id}` | Modifier nom/coordonnées ou activer/désactiver (ADMIN) |
| GET | `/api/v1/users?role=AGENT` | Liste paginée des comptes (ADMIN) |
| GET | `/api/v1/users/{id}` | Détail d'un compte (ADMIN) |
| POST | `/api/v1/users/agents` | Créer un compte agent avec agence principale (ADMIN) |
| PATCH | `/api/v1/users/{id}` | Modifier nom/téléphone ou activer/désactiver un agent (ADMIN) |
| GET | `/api/v1/clients` | Liste paginée des clients autorisés |
| GET | `/api/v1/clients/profiles` | Liste les profils clients du périmètre |
| POST | `/api/v1/clients/profiles` | Créer un client (statut PROVISSIOIR jusqu'à acceptation serveur) |
| GET | `/api/v1/clients/profiles/{id}` | Détail d'un client |
| PATCH | `/api/v1/clients/profiles/{id}` | Mettre à jour un client |
| GET | `/api/v1/clients/profiles/doublons` | Vérifier les doublons potentiels (téléphone/nom dans la même agence) |
| GET | `/api/v1/dossiers` | Liste paginée des dossiers du périmètre |
| POST | `/api/v1/dossiers` | Créer un dossier (affectation client → marché, agent collecteur) |
| GET | `/api/v1/dossiers/{id}` | Détail d'un dossier avec cycles et événements |
| PATCH | `/api/v1/dossiers/{id}/close` | Clôturer un dossier (motif requis) |
| PATCH | `/api/v1/dossiers/{id}/reopen` | Réouvrir un dossier (superviseur/admin, motif requis) |
| GET | `/api/v1/tontine-cycles/{id}` | Détail du cycle, solde disponible et commission payée |
| POST | `/api/v1/tontine-cycles/{id}/deposits` | Enregistrer un versement fixe (AGENT affecté) |
| POST | `/tontine-cycles/{id}/deposits` | Compatibilité mobile (version simplifiée) |
| POST | `/api/v1/tontine-cycles/{id}/withdrawals` | Demander un retrait (AGENT affecté) |
| POST | `/tontine-cycles/{id}/withdrawals` | Compatibilité mobile (version simplifiée) |
| GET | `/api/v1/withdrawals/pending` | File des demandes à examiner (SUPERVISOR) |
| GET | `/withdrawals/pending` | Compatibilité mobile (version simplifiée) |
| POST | `/api/v1/withdrawals/{id}/review` | Approuver/rejeter le retrait (SUPERVISOR) |
| POST | `/admin/cycles/withdrawals/{id}/review` | Compatibilité mobile (version simplifiée) |
| POST | `/api/v1/tontine-cycles/{id}/suspend` | Suspendre le cycle (AGENT affecté, avec audit) |
| POST | `/api/v1/tontine-cycles/{id}/resume` | Reprendre le cycle (AGENT affecté, avec audit) |
| POST | `/tontine-cycles/{id}/suspend` | Compatibilité mobile (version simplifiée) |
| POST | `/tontine-cycles/{id}/resume` | Compatibilité mobile (version simplifiée) |
| GET | `/api/v1/financial-summary` | Synthèse financière par agence et période |
| GET | `/api/v1/reconciliation-report` | Rapport de rapprochement paginé par cycle |
| POST | `/api/v1/remittances` | Créer une remise historique (lecture/ancienne) |
| GET | `/api/v1/remittances` | Consultation historique des remises |
| PATCH | `/api/v1/remittances/{id}/receive` | Caissier confirme la réception |
| PATCH | `/api/v1/remittances/{id}/discrepancy` | Caissier/déclare un écart |
| POST | `/api/v1/closures` | Déclarer une clôture journalière (AGENT) |
| GET | `/api/v1/closures` | Liste des clôtures (par agence et période) |
| PATCH | `/api/v1/closures/{id}/review` | Réviser (SUPERVISOR) |
| PATCH | `/api/v1/closures/{id}/reopen` | Réouvrir (SUPERVISOR) |
| GET | `/api/v1/audit/logs` | Piste d'audit (ADMIN/AUDITOR uniquement) |
| GET | `/api/v1/config/system-settings` | Lire les paramètres de configuration |
| PUT | `/api/v1/config/system-settings/{key}` | Mettre à jour un paramètre (ADMIN/SUPERVISOR) |

Les routes protégées exigent `Authorization: Bearer <accessToken>`. Les agences sont relues en base à chaque requête; le jeton ne porte pas les droits d'agence. Les écritures admin d'agents et d'agences sont auditées. Les suppressions physiques sont exclues. Le code et le marché d'une agence ne sont pas modifiables après création.

**CORS :** le bootstrap Nest actuel n'active pas CORS. L'admin Vite fonctionne via son proxy `/api`; Expo Web appelle directement `localhost:3000` et sera bloqué par le navigateur tant qu'une origine de développement précise n'est pas autorisée. Avant l'essai mobile Web, configurer uniquement l'origine locale Expo nécessaire; ne pas activer un wildcard en production.

La route `POST /api/v1/remittances` doit rester limitée à la conservation historique; elle ne doit pas servir de substitut aux retraits du produit cycle actif.
| Méthode | Chemin | Description |
| --- | --- | --- |
| GET | `/api/v1/health` | Santé de l'API et de la base (200 ou 503) |
| POST | `/api/v1/auth/sessions` | Échange identifiant/mot de passe contre un jeton Bearer de 15 minutes |
| GET | `/api/v1/me` | Profil authentifié et agences actives autorisées |
| GET | `/api/v1/me/branches` | Agences actives accordées à l'utilisateur |
| GET | `/api/v1/markets` | Marchés actifs (lecture pour les clients métier) |
| GET | `/api/v1/markets/admin` | Tous les marchés et compteurs d'agences (ADMIN/SUPERVISOR) |
| POST | `/api/v1/markets` | Créer un marché (ADMIN/SUPERVISOR) |
| POST | `/api/v1/markets/{id}/active` | Activer/désactiver un marché (ADMIN/SUPERVISOR) |
| GET | `/api/v1/branches` | Liste globale des agences (ADMIN) |
| POST | `/api/v1/branches` | Créer une agence sur un marché actif (ADMIN) |
| PATCH | `/api/v1/branches/{id}` | Modifier nom/coordonnées ou activer/désactiver (ADMIN) |
| GET | `/api/v1/users?role=AGENT` | Liste paginée des comptes (ADMIN) |
| GET | `/api/v1/users/{id}` | Détail d'un compte (ADMIN) |
| POST | `/api/v1/users/agents` | Créer un compte agent avec agence principale (ADMIN) |
| PATCH | `/api/v1/users/{id}` | Modifier nom/téléphone ou activer/désactiver un agent (ADMIN) |
| GET | `/api/v1/clients` | Liste paginée des clients autorisés |
| GET | `/api/v1/clients/profiles` | Liste les profils clients du périmètre |
| POST | `/api/v1/clients/profiles` | Créer un client (statut PROVISSIOIR jusqu'à acceptation serveur) |
| GET | `/api/v1/clients/profiles/{id}` | Détail d'un client |
| PATCH | `/api/v1/clients/profiles/{id}` | Mettre à jour un client |
| GET | `/api/v1/clients/profiles/doublons` | Vérifier les doublons potentiels (téléphone/nom dans la même agence) |
| GET | `/api/v1/dossiers` | Liste paginée des dossiers du périmètre |
| POST | `/api/v1/dossiers` | Créer un dossier (affectation client → marché, agent collecteur) |
| GET | `/api/v1/dossiers/{id}` | Détail d'un dossier avec cycles et événements |
| PATCH | `/api/v1/dossiers/{id}/close` | Clôturer un dossier (motif requis) |
| PATCH | `/api/v1/dossiers/{id}/reopen` | Réouvrir un dossier (superviseur/admin, motif requis) |

Les routes protégées exigent `Authorization: Bearer <accessToken>`. Les agences sont relues en base à chaque requête; le jeton ne porte pas les droits d'agence. Les écritures admin d'agents et d'agences sont auditées. Les suppressions physiques sont exclues. Le code et le marché d'une agence ne sont pas modifiables après création.

**CORS :** le bootstrap Nest actuel n'active pas CORS. L'admin Vite fonctionne via son proxy `/api`; Expo Web appelle directement `localhost:3000` et sera bloqué par le navigateur tant qu'une origine de développement précise n'est pas autorisée. Avant l'essai mobile Web, configurer uniquement l'origine locale Expo nécessaire; ne pas activer un wildcard en production.

La route `POST /api/v1/remittances` doit rester limitée à la conservation historique; elle ne doit pas servir de substitut aux retraits du produit cycle actif.

## Configuration

Toutes les variables sont listées dans [.env.example](./.env.example).
La configuration est validée au démarrage (`src/config/env.validation.ts`) :
un démarrage avec une variable manquante ou mal formée échoue explicitement.
`.env` est exclu du dépôt Git. Aucun secret réel n'est versionné ni journalisé.

## Structure

```text
src/
  common/           # composants transverses (filtres, pipes, guards)
  config/           # configuration et validation d'environnement
  database/         # module Prisma (PrismaService)
  health/           # GET /api/v1/health
  auth/              # sessions, profil et JWT guard
  users/             # administration restreinte des comptes agent
  branches/          # gestion admin des agences
  clients/           # liste et opérations client
  cycles/            # marchés, cycles, versements, retraits et rapports
  dossiers/          # ouverture, clôture et réouverture de dossiers
  remises/           # consultation historique et réception caisse
  clotures/          # clôtures journalières
  synchronisation/   # file d'attente et confirmation de sync
  audit/             # traçabilité des opérations sensibles
  config/            # paramètres généraux
  app.module.ts
  main.ts
prisma/
  schema.prisma     # modèle cible complet préparé pour revue
  migrations/       # migration additive sur une base déjà au DDL v1.1
test/               # tests end-to-end
```

Les répertoires `collectes/`, `recus/` et `synchronisation/` n'ont pas encore une couverture complète de leurs parcours attendus. La présence d'un dossier ou d'un type Prisma ne signifie pas que son workflow est prêt pour démonstration.

## Règles COOPECA applicables à ce projet

- Montants financiers en entiers XAF, jamais en flottant.
- Contrôle d'accès par agence côté serveur.
- Synchronisation idempotent.
- Séparation date de collecte déclarée / date de réception serveur.
- Séparation déclaration de remise / réception caisse.
- Traçabilité des corrections et opérations sensibles.

## Base de données et migrations
## Endpoints disponibles

| Méthode | Chemin | Description |
| --- | --- | --- |
| GET | `/api/v1/health` | Santé de l'API et de la base (200 ou 503) |
| POST | `/api/v1/auth/sessions` | Échange identifiant/mot de passe contre un jeton Bearer de 15 minutes |
| GET | `/api/v1/me` | Profil authentifié et agences actives autorisées |
| GET | `/api/v1/me/branches` | Agences actives accordées à l'utilisateur |
| GET | `/api/v1/markets` | Marchés actifs (lecture pour les clients métier) |
| GET | `/api/v1/markets/admin` | Tous les marchés et compteurs d'agences (ADMIN/SUPERVISOR) |
| POST | `/api/v1/markets` | Créer un marché (ADMIN/SUPERVISOR) |
| POST | `/api/v1/markets/{id}/active` | Activer/désactiver un marché (ADMIN/SUPERVISOR) |
| GET | `/api/v1/branches` | Liste globale des agences (ADMIN) |
| POST | `/api/v1/branches` | Créer une agence sur un marché actif (ADMIN) |
| PATCH | `/api/v1/branches/{id}` | Modifier nom/coordonnées ou activer/désactiver (ADMIN) |
| GET | `/api/v1/users?role=AGENT` | Liste paginée des comptes (ADMIN) |
| GET | `/api/v1/users/{id}` | Détail d'un compte (ADMIN) |
| POST | `/api/v1/users/agents` | Créer un compte agent avec agence principale (ADMIN) |
| PATCH | `/api/v1/users/{id}` | Modifier nom/téléphone ou activer/désactiver un agent (ADMIN) |
| GET | `/api/v1/clients` | Liste paginée des clients autorisés |
| GET | `/api/v1/clients/profiles` | Liste les profils clients du périmètre |
| POST | `/api/v1/clients/profiles` | Créer un client (statut PROVISSIOIR jusqu'à acceptation serveur) |
| GET | `/api/v1/clients/profiles/{id}` | Détail d'un client |
| PATCH | `/api/v1/clients/profiles/{id}` | Mettre à jour un client |
| GET | `/api/v1/clients/profiles/doublons` | Vérifier les doublons potentiels (téléphone/nom dans la même agence) |
| GET | `/api/v1/dossiers` | Liste paginée des dossiers du périmètre |
| POST | `/api/v1/dossiers` | Créer un dossier (affectation client → marché, agent collecteur) |
| GET | `/api/v1/dossiers/{id}` | Détail d'un dossier avec cycles et événements |
| PATCH | `/api/v1/dossiers/{id}/close` | Clôturer un dossier (motif requis) |
| PATCH | `/api/v1/dossiers/{id}/reopen` | Réouvrir un dossier (superviseur/admin, motif requis) |
| GET | `/api/v1/tontine-cycles/{id}` | Détail du cycle, solde disponible et commission payée |
| POST | `/api/v1/tontine-cycles/{id}/deposits` | Enregistrer un versement fixe (AGENT affecté) |
| POST | `/tontine-cycles/{id}/deposits` | Compatibilité mobile (version simplifiée) |
| POST | `/api/v1/tontine-cycles/{id}/withdrawals` | Demander un retrait (AGENT affecté) |
| POST | `/tontine-cycles/{id}/withdrawals` | Compatibilité mobile (version simplifiée) |
| GET | `/api/v1/withdrawals/pending` | File des demandes à examiner (SUPERVISOR) |
| GET | `/withdrawals/pending` | Compatibilité mobile (version simplifiée) |
| POST | `/api/v1/withdrawals/{id}/review` | Approuver/rejeter le retrait (SUPERVISOR) |
| POST | `/admin/cycles/withdrawals/{id}/review` | Compatibilité mobile (version simplifiée) |
| POST | `/api/v1/tontine-cycles/{id}/suspend` | Suspendre le cycle (AGENT affecté, avec audit) |
| POST | `/api/v1/tontine-cycles/{id}/resume` | Reprendre le cycle (AGENT affecté, avec audit) |
| POST | `/tontine-cycles/{id}/suspend` | Compatibilité mobile (version simplifiée) |
| POST | `/tontine-cycles/{id}/resume` | Compatibilité mobile (version simplifiée) |
| GET | `/api/v1/financial-summary` | Synthèse financière par agence et période |
| GET | `/api/v1/reconciliation-report` | Rapport de rapprochement paginé par cycle |
| POST | `/api/v1/remittances` | Créer une remise historique (lecture/ancienne) |
| GET | `/api/v1/remittances` | Consultation historique des remises |
| PATCH | `/api/v1/remittances/{id}/receive` | Caissier confirme la réception |
| PATCH | `/api/v1/remittances/{id}/discrepancy` | Caissier/déclare un écart |
| POST | `/api/v1/closures` | Déclarer une clôture journalière (AGENT) |
| GET | `/api/v1/closures` | Liste des clôtures (par agence et période) |
| PATCH | `/api/v1/closures/{id}/review` | Réviser (SUPERVISOR) |
| PATCH | `/api/v1/closures/{id}/reopen` | Réouvrir (SUPERVISOR) |
| GET | `/api/v1/audit/logs` | Piste d'audit (ADMIN/AUDITOR uniquement) |
| GET | `/api/v1/config/system-settings` | Lire les paramètres de configuration |
| PUT | `/api/v1/config/system-settings/{key}` | Mettre à jour un paramètre (ADMIN/SUPERVISOR) |

| Méthode | Chemin | Description |
| --- | --- | --- |
| GET | `/api/v1/health` | Santé de l'API et de la base (200 ou 503) |
| POST | `/api/v1/auth/sessions` | Échange identifiant/mot de passe contre un jeton Bearer de 15 minutes |
| GET | `/api/v1/me` | Profil authentifié et agences actives autorisées |
| GET | `/api/v1/me/branches` | Agences actives accordées à l'utilisateur |
| GET | `/api/v1/markets` | Marchés actifs (lecture pour les clients métier) |
| GET | `/api/v1/markets/admin` | Tous les marchés et compteurs d'agences (ADMIN/SUPERVISOR) |
| POST | `/api/v1/markets` | Créer un marché (ADMIN/SUPERVISOR) |
| POST | `/api/v1/markets/{id}/active` | Activer/désactiver un marché (ADMIN/SUPERVISOR) |
| GET | `/api/v1/branches` | Liste globale des agences (ADMIN) |
| POST | `/api/v1/branches` | Créer une agence sur un marché actif (ADMIN) |
| PATCH | `/api/v1/branches/{id}` | Modifier nom/coordonnées ou activer/désactiver (ADMIN) |
| GET | `/api/v1/users?role=AGENT` | Liste paginée des comptes (ADMIN) |
| GET | `/api/v1/users/{id}` | Détail d'un compte (ADMIN) |
| POST | `/api/v1/users/agents` | Créer un compte agent avec agence principale (ADMIN) |
| PATCH | `/api/v1/users/{id}` | Modifier nom/téléphone ou activer/désactiver un agent (ADMIN) |
| GET | `/api/v1/clients` | Liste paginée des clients autorisés |
| GET | `/api/v1/clients/profiles` | Liste les profils clients du périmètre |
| POST | `/api/v1/clients/profiles` | Créer un client (statut PROVISSIOIR jusqu'à acceptation serveur) |
| GET | `/api/v1/clients/profiles/{id}` | Détail d'un client |
| PATCH | `/api/v1/clients/profiles/{id}` | Mettre à jour un client |
| GET | `/api/v1/clients/profiles/doublons` | Vérifier les doublons potentiels (téléphone/nom dans la même agence) |
| GET | `/api/v1/dossiers` | Liste paginée des dossiers du périmètre |
| POST | `/api/v1/dossiers` | Créer un dossier (affectation client → marché, agent collecteur) |
| GET | `/api/v1/dossiers/{id}` | Détail d'un dossier avec cycles et événements |
| PATCH | `/api/v1/dossiers/{id}/close` | Clôturer un dossier (motif requis) |
| PATCH | `/api/v1/dossiers/{id}/reopen` | Réouvrir un dossier (superviseur/admin, motif requis) |

Les routes protégées exigent `Authorization: Bearer <accessToken>`. Les agences sont relues en base à chaque requête; le jeton ne porte pas les droits d'agence. Les écritures admin d'agents et d'agences sont auditées. Les suppressions physiques sont exclues. Le code et le marché d'une agence ne sont pas modifiables après création.

**CORS :** le bootstrap Nest actuel n'active pas CORS. L'admin Vite fonctionne via son proxy `/api`; Expo Web appelle directement `localhost:3000` et sera bloqué par le navigateur tant qu'une origine de développement précise n'est pas autorisée. Avant l'essai mobile Web, configurer uniquement l'origine locale Expo nécessaire; ne pas activer un wildcard en production.

La route `POST /api/v1/remittances` n'est pas exposée: la création legacy doit être réconciliée avec les contraintes d'idempotence et ne doit pas servir de substitut aux retraits du produit cycle.

## Configuration

Toutes les variables sont listées dans [.env.example](./.env.example).
La configuration est validée au démarrage (`src/config/env.validation.ts`) :
un démarrage avec une variable manquante ou mal formée échoue explicitement.
`.env` est exclu du dépôt Git. Aucun secret réel n'est versionné ni journalisé.

## Structure

```
src/
  common/           # composants transverses (filtres, pipes, guards)
  config/           # configuration et validation d'environnement
  database/         # module Prisma (PrismaService)
  health/           # GET /api/v1/health
  auth/              # sessions, profil et JWT guard
  users/             # administration restreinte des comptes agent
  branches/          # gestion admin des agences
  clients/           # liste et opérations client disponibles
  cycles/            # marchés, cycles, versements, retraits et rapports
  remises/           # consultation historique en lecture seule
  app.module.ts
  main.ts
prisma/
  schema.prisma     # modèle cible complet préparé pour revue
  migrations/       # migration additive sur une base déjà au DDL v1.1
test/               # tests end-to-end
```

Les répertoires `dossiers/`, `collectes/`, `recus/`, `clotures/`, `synchronisation/` et `audit/` n'ont pas encore une couverture complète de leurs parcours attendus. La présence d'un dossier ou d'un type Prisma ne signifie pas que son workflow est prêt pour démonstration.

## Règles COOPECA applicables à ce projet

- Montants financiers en entiers XAF, jamais en flottant.
- Contrôle d'accès par agence côté serveur.
- Synchronisation idempotente.
- Séparation date de collecte déclarée / date de réception serveur.
- Séparation déclaration de remise / réception caisse.
- Traçabilité des corrections et opérations sensibles.

## Base de données et migrations

Le modèle de données est décrit dans [DECISIONS_METIER.md](../docs/DECISIONS_METIER.md) §3.15. Les migrations `20261019150000_add_dossiers_and_client_review` et `20261022103000_add_market_tontine_cycles` sont additives et supposent une base créée à partir du DDL `docs/COOPECA_Backend_Schema_v1.1.sql`.

Le dépôt ne contient pas encore de migration baseline pour créer une base vide. Ne pas lancer ces migrations sur une base vide. Elles n'ont pas été appliquées à une base ; elles doivent être testées sur une base jetable v1.1 avant tout environnement partagé. Aucun backfill automatique n'est inclus : les clients historiques restent sans marché/agent cycle jusqu'à affectation supervisée ; les collections et remises historiques restent inchangées.

Sur un volume PostgreSQL neuf, le healthcheck PostgreSQL valide seulement que le serveur accepte les connexions. L’endpoint `/health` valide seulement la connectivité. Ni l’un ni l’autre ne crée les tables : la migration de référence v1.1 puis les migrations Prisma doivent être exécutées suivant une procédure baseline validée avant d’utiliser les routes métier. Ne pas supprimer le volume Docker pour « repartir propre » si des données doivent être conservées.

Pour une base v1.1 existante, après tests et approbation, la commande est `npx prisma migrate deploy` depuis `backend/`. Pour une nouvelle base, il faut établir le schéma de référence v1.1 selon une procédure baseline dédiée.

## Cycles de tontine

Le nouveau parcours conserve `clients`, `dossiers` et toutes les tables financières historiques. Les nouvelles opérations de versement/retrait utilisent `tontine_cycles`, `cycle_transactions`, `withdrawal_requests` et `cycle_commissions`; elles ne sont pas traduites en `collections` ou `remittances` legacy.

Le solde est la somme des écritures : versements moins commissions moins retraits. La commission vaut un versement fixe et est créée une seule fois, dans la même transaction que le premier retrait approuvé par un superviseur. Le corps d’API transmet les montants en chaînes d’entiers XAF pour préserver la précision JSON.

Les clients doivent recevoir un `market_id` et un `collection_agent_id` explicites par provisionnement superviseur/admin avant l’ouverture d’un cycle. Aucun rattachement historique n’est deviné. Le montant de retrait total doit épuiser exactement le solde net après commission.

## Authentification

Les nouveaux mots de passe doivent être stockés sous le format `scrypt$16384$8$1$<salt-hex>$<hash-hex>`. Le service fournit `AuthService.hashPassword()` pour le provisionnement applicatif contrôlé. Le DDL et le dépôt ne spécifient pas le format des hash historiques : ces comptes ne peuvent pas se connecter tant qu'ils n'ont pas été migrés ou réinitialisés selon une procédure approuvée. Aucun endpoint public de création de compte ou de changement de mot de passe n'est exposé.

`JWT_SECRET` est obligatoire et doit être différent par environnement, généré aléatoirement et injecté par le gestionnaire de secrets en production. Les access tokens expirent après 15 minutes. La déconnexion/révocation individuelle et le renouvellement ne sont pas implémentés ; les jetons déjà émis restent valides jusqu'à expiration, sauf désactivation du compte.

La limitation des tentatives de connexion et la journalisation/audit des échecs de login ne sont pas encore implémentés ; ils sont requis avant exposition publique de l’endpoint de session. Ne pas exposer cette première version à Internet sans protection de débit au niveau de la passerelle.

## Limites de cette étape

## Sécurité, sauvegardes et configuration réseau

### Règles de sécurité

- **JWT_SECRET** : générer un secret différent par environnement (au moins 32 caractères), injecté via le gestionnaire de secrets en production. Jamais en dur dans le code ni versionné.
- **PostgreSQL** : ne jamais exposer le port PostgreSQL (5432) en production. Restreindre l'accès à l'adresse IP de l'API uniquement.
- **HTTPS** : obligatoire en production. Le mode HTTP en développement n'est pas sécurisé pour les jetons d'authentification.
- **Chiffrement local mobile** : la base SQLite du mobile n'est pas chiffrée. Pour un déploiement production, activer le chiffrement SQLite ou stocker les données sensibles via une solution adaptée.
- **Révocation de session** : les jetons JWT expirent après 15 minutes. Pour un retrait complet de session, il faut désactiver le compte utilisateur côtéAdministrateur.

### Sauvegardes PostgreSQL

- **Plan de sauvegarde** : exécuter un dump automatique quotidien (`pg_dump`) et un restore mensuel testé manuellement.
- **Commande de sauvegarde** :
  ```bash
  pg_dump -h localhost -U coopeca -d coopeca --clean --no-owner > backup_$(date +%F).sql
  ```
- **Restauration** (sur une base jetable) :
  ```bash
  psql -h localhost -U coopeca -d coopeca_restore < backup_$(date +%F).sql
  ```
- **Volume persistant** : le Docker Compose de dev utilise un volume `coopeca_pgdata_dev`. Pour la production, configurer une sauvegarde régulière du volume ou de l'instance managed.

### Configuration réseau

- `CORS_ORIGINS` : ne jamais utiliser `*` en production. Lister uniquement les origines navigateur valides (ex. `http://localhost:3000`).
- `DATABASE_URL` : utiliser `sslmode=require` en production.
- **Reverse proxy** : en production, placer un proxy inverse (Nginx/Traefik) devant l'API NestJS pour terminer les connexions TLS et appliquer les headers de sécurité.

### Procédure de déploiement

1. Vérifier `npx prisma validate` et `npx prisma generate`.
2. Construire l'image : `docker build -t coopeca-api:latest backend/`.
3. Déployer sur le VPS : `docker compose up -d --build`.
4. Vérifier `GET /api/v1/health`.
5. Tester un parcours métier critique (connexion, ouverture client, ouverture cycle, versement, retrait, clôture).
6. Vérifier les logs d'erreur et la configuration de monitoring.

### Audit et traçabilité

- Toutes les opérations sensibles (création, modification, suppression, clôture, réouverture) créent un enregistrement dans `audit_logs`.
- Consulter la piste via `GET /api/v1/audit/logs` (rôle ADMIN ou AUDITOR uniquement).
- Chaque enregistrement contient : acteur, agence, action, type d'entité, données avant/après, et identifiant de requête unique.

- Une migration additive a été préparée pour revue ; aucune migration n'a été appliquée.
- `prisma db push` et toute migration destructive sont proscrits.
- Les guards d'authentification, rôles et agence sont implémentés sur plusieurs routes; leur couverture est spécifique à chaque contrôleur. Toute nouvelle route doit ajouter et tester explicitement ses règles de rôle et de périmètre agence.
- Les parcours legacy de collecte, de clôture et de réception/remise caisse ne doivent pas être présentés comme la voie financière active des cycles §3.15.
