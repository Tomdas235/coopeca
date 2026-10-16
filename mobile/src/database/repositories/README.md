# Repositories (accès aux données locales)

Les repositories sont la **seule** couche autorisée à exécuter des requêtes
SQL : les écrans (`mobile/app`) et les fonctionnalités (`mobile/src/features`)
ne doivent jamais contenir de requêtes SQL directes.

État : **non implémenté** (squelette d'étape). Aucun repository n'existe car :

- les tables du schéma local ne sont pas validées
  (docs/DECISIONS_METIER.md §4, docs/IMPACTS_SCHEMA_SQL.md §8) ;
- la bibliothèque SQLite (`expo-sqlite`, cf. AGENT.md §2) ne sera installée
  qu'à ce moment-là, avec une version réellement vérifiée ;
- aucune migration locale ni serveur n'est autorisée à cette étape.
