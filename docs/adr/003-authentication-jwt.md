# ADR-003 : Authentification JWT Bearer

## Statut
Accepté

## Contexte
Les agents de terrain et les utilisateurs admin doivent s'authentifier pour accéder à l'API.

## Décision
Utiliser des tokens JWT Bearer avec une durée de vie de 15 minutes. Le token ne porte pas les droits d'agence — les agences sont relues en base à chaque requête.

## Conséquences
- Pas de session côté serveur
- Les tokens expirés nécessitent une reconnexion
- Les droits multi-agences sont vérifiés à chaque requête
- Scrypt pour le hashing des mots de passe

## Alternatives considérées
- Sessions côté serveur (complexité de scaling)
- OAuth2 (trop complexe pour le MVP)