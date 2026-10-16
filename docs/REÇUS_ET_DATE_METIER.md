# Références de reçu et date métier

**Statut :** principes retenus comme base d’arbitrage pour validation finale ; les détails marqués **À VALIDER** restent ouverts. Ce document ne modifie ni le schéma SQL ni les contrats d’API existants.

## 1. Références de reçu

### Principes retenus pour validation finale

- Une collecte créée hors ligne reçoit une **référence provisoire locale**, stable et unique.
- Les tentatives répétées de synchronisation réutilisent le même identifiant d’opération et la même clé d’idempotence. La répétition ne crée pas une seconde collecte.
- À l’acceptation de la synchronisation, le serveur attribue un **numéro officiel** et conserve le lien entre ce numéro et la référence provisoire locale.
- Le reçu hors ligne porte la mention **« EN ATTENTE DE SYNCHRONISATION »**. Cette mention ne signifie pas que le serveur a reçu ou confirmé l’opération.
- Une réimpression correspond au même reçu et à la même collecte ; elle ne crée pas une opération financière.

### Invariants de synchronisation

1. Le mobile persiste l’opération et sa référence avant l’envoi.
2. Chaque nouvelle tentative reprend les identifiants existants ; elle ne génère pas un nouveau numéro de reçu ni une nouvelle clé d’opération.
3. Pour une opération déjà appliquée, le serveur retourne le résultat et le numéro officiel existants.
4. Si une même clé d’idempotence est présentée avec un contenu différent, la requête ne doit pas être considérée comme un succès équivalent. Le code d’erreur et le parcours de résolution restent **À VALIDER**.
5. Le mobile ne marque la collecte comme synchronisée qu’après une réponse explicite et vérifiable du serveur.
6. Une erreur temporaire conserve la collecte et sa référence dans la file locale ; un conflit reste visible et ne supprime pas l’opération.

### Détails à valider

- **À VALIDER :** format lisible, longueur et alphabet de la référence provisoire ; composants possibles (identifiant d’appareil, UUID ou autre) et exigences de confidentialité.
- **À VALIDER :** format, règles d’unicité et mode d’attribution du numéro officiel serveur.
- **À VALIDER :** affichage conjoint des deux références après synchronisation et gestion d’un reçu déjà imprimé avant l’attribution officielle.
- **À VALIDER :** mentions légales, identité et agence imprimées, champs obligatoires, valeur probante du reçu papier hors ligne et éventuel QR code.
- **À VALIDER :** comportement exact lorsqu’une opération est refusée définitivement par le serveur après émission du reçu local.

Le schéma SQL v1.1 contient `collections.local_receipt_no` nullable et `collections.client_receipt_no` obligatoire et unique. Cette contrainte reste compatible avec le principe retenu si le serveur attribue le numéro officiel avant l’insertion de la collecte pendant le traitement de synchronisation. Le schéma ne précise ni cette séquence, ni l’allocation atomique, ni la correspondance conservée ; ces détails sont à valider avant toute évolution. Aucune modification de colonne ou stratégie de migration n’est décidée ici.

## 2. Temps de collecte et date métier

### Fuseau et frontière de journée retenus pour validation finale

Le fuseau IANA de référence de la date métier est **`Africa/Ndjamena`**. Le principe retenu est la journée civile de **00 h 00 à 23 h 59** dans ce fuseau. Pour un calcul technique sans ambiguïté, le serveur doit appliquer une frontière déterministe allant du début civil du jour au début civil du jour suivant ; la précision et la convention exacte de représentation restent à formaliser. Aucun calendrier spécial (jours non ouvrés, jours fériés ou période particulière) n’est introduit ici.

Les instants techniques sont conservés comme des instants, indépendamment du fuseau d’affichage. La date métier est déterminée de façon cohérente côté serveur selon le fuseau et la règle approuvés.

### Valeurs temporelles à distinguer

- **Heure déclarée sur l’appareil** : heure à laquelle l’agent indique avoir réalisé la collecte. Elle peut être disponible hors ligne et dépend de l’horloge du téléphone ; elle ne prouve pas à elle seule l’heure réelle.
- **Heure de réception serveur** : instant attribué côté serveur lorsque la requête ou la collecte est reçue. Il sert à tracer l’arrivée et ne remplace pas l’heure déclarée de l’opération.
- **Date métier** : date civile utilisée pour les totaux, clôtures et rapports, déterminée côté serveur dans le fuseau `Africa/Ndjamena`. Selon le principe retenu, elle ne doit pas être remplacée automatiquement par la date de synchronisation.

Le schéma SQL v1.1 prévoit `collections.collected_at TIMESTAMPTZ`, `collections.sync_received_at TIMESTAMPTZ` et `collections.business_date DATE`. Ces colonnes correspondent partiellement aux notions ci-dessus, mais les documents ne fixent pas entièrement leur sémantique ni la façon de conserver séparément une heure déclarée par l’appareil et un instant normalisé. Les noms SQL ne valent pas à eux seuls définition de contrat.

### Collectes hors ligne tardives

- Conserver l’heure/date déclarée de la collecte et l’instant de réception serveur de manière distincte.
- Ne pas remplacer automatiquement la date de collecte déclarée par la date à laquelle l’opération est synchronisée.
- Prévoir le contrôle des horloges incohérentes et une correction supervisée avec motif et audit.

**À VALIDER :** écart d’horloge admissible, signalement, personne habilitée, séquence et effets exacts de la correction ; règles de modification a posteriori de la date métier. Le principe ne fixe pas de calendrier spécial.

### Autres détails à valider

- **À VALIDER :** précision et convention technique de la frontière du jour civil côté serveur, sans changer le principe 00 h 00–23 h 59.
- **À VALIDER :** format lisible, longueur et alphabet de la référence provisoire ainsi que format, unicité et allocation du numéro officiel.
- **À VALIDER :** affichage des deux références après acceptation serveur et mise à jour d’un reçu déjà imprimé hors ligne.
- **À VALIDER :** mentions légales, identité/agence, contenu et valeur probante du reçu papier avant synchronisation, QR code éventuel.
- **À VALIDER :** traitement d’un rejet définitif après émission d’un reçu local.

Les calculs de date métier doivent être reproductibles et cohérents côté serveur dans `Africa/Ndjamena`. Le serveur doit conserver les valeurs déclarées d’origine et l’instant de réception pour permettre l’audit ; toute correction est supervisée, motivée et auditée.

## 3. Références et écarts connus

- [DECISIONS_METIER.md](./DECISIONS_METIER.md) consigne la base d’arbitrage retenue pour validation finale ; elle ne présente pas les détails ouverts comme approuvés.
- [IMPACTS_SCHEMA_SQL.md](./IMPACTS_SCHEMA_SQL.md) recense les impacts à analyser avant l’évolution du modèle Prisma/SQL.
- Le [schéma backend v1.1](./COOPECA_Backend_Schema_v1.1.sql) prévoit actuellement le numéro `client_receipt_no` obligatoire et unique à l’insertion, une référence `local_receipt_no` optionnelle et les instants `collected_at`/`sync_received_at` ainsi que `business_date`. Il ne décrit pas l’allocation du numéro officiel dans le flux de synchronisation, une valeur distincte pour l’heure déclarée sur l’appareil ou la règle côté serveur calculant `business_date` dans `Africa/Ndjamena`. L’allocation avant insertion peut respecter la contrainte existante, mais son ordre et son atomicité restent à cadrer ; le SQL n’est pas modifié ici.
- L’[Implementation Plan v1.0](./COOPECA_Implementation_Plan_v1.0.docx), le [TRD v1.0](./COOPECA_TRD_Technique_Reference_Document_v1.0.docx) et l’[App Flow v1.1](./COOPECA_App_Flow_Flux_Applicatif_v1.1.docx) demandent des références stables, une synchronisation sans doublon et des reçus dont le statut reflète réellement la confirmation serveur. Ils ne règlent pas tous le format de la référence ni les détails calendaires ci-dessus.

Les divergences doivent être résolues dans la conception et documentées avant toute modification du schéma ou contrat API. Aucune modification du SQL, migration ou initialisation technique n’est autorisée par le présent cadrage.
