# COOPECA — Backend (NestJS)

Socle technique du backend COOPECA. L'API métier n'est pas encore implémentée ; le modèle Prisma cible et une migration additive sont préparés pour revue dans le cadre de la conception de la base.

## Stack

- NestJS + TypeScript (mode strict)
- API REST versionnée sous `/api/v1`
- Prisma (ORM) + PostgreSQL
- Docker / Docker Compose pour le développement local

## Démarrage rapide

```bash
cd backend
cp .env.example .env        # puis renseigner les valeurs locales si besoin
npm install
npm run prisma:generate     # génère le client Prisma (requis avant les tests e2e)
npm run prisma:validate     # valide schema.prisma
npm run build
npm test                    # tests unitaires
npm run test:e2e            # tests end-to-end (health check)
npm run start:dev           # API sur http://localhost:3000/api/v1
```

Avec Docker (PostgreSQL + API) :

```bash
docker compose -f ../infra/docker/compose.dev.yml up --build
curl http://localhost:3000/api/v1/health
```

## Endpoints disponibles

| Méthode | Chemin | Description |
| --- | --- | --- |
| GET | `/api/v1/health` | Santé de l'API et de la base (200 ou 503) |
| POST | `/api/v1/auth/sessions` | Échange identifiant/mot de passe contre un jeton Bearer de 15 minutes |
| GET | `/api/v1/me` | Profil authentifié et agences actives autorisées |
| GET | `/api/v1/me/branches` | Agences actives accordées à l'utilisateur |

Les routes `/me` exigent `Authorization: Bearer <accessToken>`. Les agences sont relues en base à chaque requête ; le jeton ne porte pas les droits d'agence.

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
  app.module.ts
  main.ts
prisma/
  schema.prisma     # modèle cible complet préparé pour revue
  migrations/       # migration additive sur une base déjà au DDL v1.1
test/               # tests end-to-end
```

Les emplacements `auth/`, `users/`, `agencies/`, `clients/`, `dossiers/`,
`collectes/`, `recus/`, `remises/`, `clotures/`, `synchronisation/`,
`audit/` seront peuplés après validation du modèle de données
(cf. `docs/DECISIONS_METIER.md`, `docs/IMPACTS_SCHEMA_SQL.md`).

## Règles COOPECA applicables à ce projet

- Montants financiers en entiers XAF, jamais en flottant.
- Contrôle d'accès par agence côté serveur.
- Synchronisation idempotente.
- Séparation date de collecte déclarée / date de réception serveur.
- Séparation déclaration de remise / réception caisse.
- Traçabilité des corrections et opérations sensibles.

## Base de données et migrations

Le modèle de données est détaillé dans [CONCEPTION_MODELE_DONNEES.md](../docs/CONCEPTION_MODELE_DONNEES.md). La migration `20261019150000_add_dossiers_and_client_review` est additive et suppose que la base possède déjà les tables du DDL `docs/COOPECA_Backend_Schema_v1.1.sql`.

Le dépôt ne contient pas encore de migration baseline pour créer une base vide. Ne pas lancer cette migration sur une base vide. Elle n'a pas été appliquée à une base dans cette étape et ne doit être déployée qu'après revue du SQL, validation de l'environnement cible et accord explicite. Aucun backfill automatique n'est inclus ; les collectes historiques restent avec le statut explicite `NOT_ESTABLISHED` jusqu'à un traitement métier audité.

Pour une base v1.1 existante, après approbation séparée, la commande de déploiement est `npx prisma migrate deploy` depuis `backend/`. Pour une nouvelle base, il faut d'abord établir le schéma de référence v1.1 selon une procédure baseline dédiée avant cette migration.

## Authentification

Les nouveaux mots de passe doivent être stockés sous le format `scrypt$16384$8$1$<salt-hex>$<hash-hex>`. Le service fournit `AuthService.hashPassword()` pour le provisionnement applicatif contrôlé. Le DDL et le dépôt ne spécifient pas le format des hash historiques : ces comptes ne peuvent pas se connecter tant qu'ils n'ont pas été migrés ou réinitialisés selon une procédure approuvée. Aucun endpoint public de création de compte ou de changement de mot de passe n'est exposé.

`JWT_SECRET` est obligatoire et doit être différent par environnement, généré aléatoirement et injecté par le gestionnaire de secrets en production. Les access tokens expirent après 15 minutes. La déconnexion/révocation individuelle et le renouvellement ne sont pas implémentés ; les jetons déjà émis restent valides jusqu'à expiration, sauf désactivation du compte.

La limitation des tentatives de connexion et la journalisation/audit des échecs de login ne sont pas encore implémentés ; ils sont requis avant exposition publique de l’endpoint de session. Ne pas exposer cette première version à Internet sans protection de débit au niveau de la passerelle.

## Limites de cette étape

- Une migration additive a été préparée pour revue ; aucune migration n'a été appliquée.
- `prisma db push` et toute migration destructive sont proscrits.
- Les guards d'authentification pour le profil sont implémentés ; les guards de rôles/agence sur les futurs endpoints métier restent à ajouter et à tester avant chaque fonctionnalité.
