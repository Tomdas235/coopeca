# ADR-002 : Base de données PostgreSQL + Prisma

## Statut
Accepté

## Contexte
Le projet nécessite une base de données relationnelle pour stocker les données financières, les utilisateurs, les agences et les cycles de tontine.

## Décision
Utiliser PostgreSQL 16 avec Prisma ORM. Les montants sont stockés en `BigInt` (entiers XAF). Les migrations sont additives et réversibles.

## Conséquences
- Intégrité référentielle via les contraintes SQL
- Migrations versionnées avec Prisma
- Types générés automatiquement
- Connexion via `DATABASE_URL`

## Alternatives considérées
- MySQL (moins de fonctionnalités JSON)
- MongoDB (pas de transactions ACID natives)