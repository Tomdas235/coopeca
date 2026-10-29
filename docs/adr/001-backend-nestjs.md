# ADR-001 : Backend NestJS

## Statut
Accepté

## Contexte
COOPECA nécessite un backend API REST pour gérer les opérations de tontine, l'authentification et la synchronisation.

## Décision
Utiliser NestJS avec TypeScript en mode strict, API versionnée sous `/api/v1`, Prisma ORM avec PostgreSQL.

## Conséquences
- Architecture modulaire (modules par domaine)
- Guards d'authentification et d'autorisation côté serveur
- Validation avec Zod
- Tests unitaires avec Jest

## Alternatives considérées
- Express.js (trop bas niveau)
- Fastify (moins d'écosystème NestJS)