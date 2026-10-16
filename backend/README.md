# COOPECA — Backend (NestJS)

Squelette technique du backend COOPECA. **Étape infrastructure uniquement** :
aucune logique métier (collectes, reçus, remises, clôtures, synchronisation)
n'est implémentée à ce stade.

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

## Endpoints

| Méthode | Chemin              | Description                                  |
| ------- | ------------------- | -------------------------------------------- |
| GET     | `/api/v1/health`    | Santé de l'API et de la base (200 ou 503)    |

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
  schema.prisma     # squelette technique — aucun modèle métier défini
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

## Limites de cette étape

- Aucune migration Prisma métier n'a été créée ni appliquée.
- `prisma db push` et toute migration destructive sont proscrits.
- L'authentification et les autorisations ne sont pas encore implémentées :
  elles ne doivent pas être présentées comme fonctionnelles.
