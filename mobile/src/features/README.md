# Fonctionnalités métier (`src/features`)

Un dossier par fonctionnalité COOPECA : `auth`, `clients`, `dossiers`,
`collectes`, `recus`, `remises`, `synchronisation`, `clotures`.

**Aucune n'est implémentée à ce stade** : chaque `index.ts` ne contient
qu'un commentaire d'intention. La logique métier ne sera écrite qu'après
validation des décisions ouvertes (docs/DECISIONS_METIER.md §4,
docs/IMPACTS_SCHEMA_SQL.md §8), en petits increments testés.

Règles d'organisation :

- aucune requête SQL dans les écrans (`mobile/app`) ni ici — uniquement via
  `src/database/repositories` ;
- toute la synchronisation réseau passe par `src/services/sync.ts` ;
- montants toujours en entiers XAF (`src/utils/montants.ts`).
