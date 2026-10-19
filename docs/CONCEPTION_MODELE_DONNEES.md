# COOPECA — Conception du modèle de données backend

**Version :** 0.2 — modèle Prisma et migration additive préparés pour revue  
**Date :** 19/10/2026  
**Statut :** feu vert reçu pour préparer les artefacts ; modèle détaillé et SQL de migration à valider avant application.  
**Sources canoniques :** [DECISIONS_METIER.md](./DECISIONS_METIER.md), [IMPACTS_SCHEMA_SQL.md](./IMPACTS_SCHEMA_SQL.md), [REÇUS_ET_DATE_METIER.md](./REÇUS_ET_DATE_METIER.md).  
**DDL existant :** [COOPECA_Backend_Schema_v1.1.sql](./COOPECA_Backend_Schema_v1.1.sql).

Le modèle Prisma cible est préparé dans `backend/prisma/schema.prisma` et la migration additive dans `backend/prisma/migrations/20261019150000_add_dossiers_and_client_review/migration.sql`. Le DDL v1.1 n’est pas modifié ; la migration n’a pas été appliquée et n’autorise pas `prisma db push`. Les libellés **Décidé** reprennent les règles canoniques. Les libellés **Proposition technique** doivent encore être examinés.

## 1. Objectifs de modélisation

- Garder PostgreSQL comme autorité des opérations acceptées et Prisma comme accès applicatif, sans supposer que Prisma exprime à lui seul tous les invariants PostgreSQL.
- Préserver les invariants financiers et d’agence du DDL v1.1, notamment les montants entiers XAF, l’absence de suppression physique, l’unicité d’affectation d’une collecte à une remise, les contrôles de branche et les écritures transactionnelles.
- Représenter les décisions métier plus récentes : dossier distinct du client, collectes nouvelles obligatoirement rattachées à un dossier, acceptation idempotente, numéro officiel alloué atomiquement, audit des actions sensibles.
- Maintenir la distinction entre état métier, état de synchronisation et état d’impression. Aucun enum ni transition non arbitré n’est fixé dans cette proposition.
- Rendre explicites les écarts historiques du DDL plutôt que les traiter comme des règles métier encore valides par défaut.

## 2. Modèle conceptuel proposé

```text
Agence 1 ─── n Utilisateurs autorisés
Agence 1 ─── n Clients
Client 1 ─── n Dossiers
Dossier 1 ─── n Collectes nouvelles
Collecte 1 ─── 0..1 Affectation de remise
Agent 1 ─── n Remises déclarées et clôtures journalières
Remise 1 ─── n Collectes entières
Action sensible ─── événement d'audit immuable
Opération mobile ─── événement d'idempotence / résultat serveur
```

Pour toute nouvelle collecte, le dossier est la relation métier obligatoire et le client est dérivé du dossier. Le `client_id` du DDL peut être maintenu pendant une période de compatibilité, mais doit être égal au client du dossier et ne doit pas devenir une source indépendante.

Pour une collecte historique sans rattachement vérifiable, le lien au dossier peut rester nul uniquement avec un état explicite « non établi » et une procédure auditée. Aucun rattachement automatique à partir du seul client, du nom ou de la date n’est permis.

## 3. Inventaire des entités

| Entité cible | DDL v1.1 | Direction proposée | Points à valider |
| --- | --- | --- | --- |
| `branches` / agences | Existe | Conserver ; agence active et identifiants stables | Règles de désactivation et transfert de données |
| `app_users` et `user_branch_access` | Existent | Conserver rôles de base et accès explicites par agence ; ADMIN/AUDITOR sans accès global implicite | Exceptions, délégations, changement de rôle, authentification et révocation |
| `clients` | Existe | Conserver le statut provisoire ; signaler les doublons potentiels ; ajouter le mécanisme d’alias/audit après étude | Champs requis, normalisation, génération du code, portée agence et correction d’une fusion |
| `dossiers` | Absent | Nouvelle entité liée à une agence et un client ; au plus un dossier ouvert par client/agence ; identifiant stable, clé d’opération, appareil, référence provisoire et référence officielle | Nom des tables/champs, référence/format officiel, attribution à un agent, champs contractuels et vocabulaire d’état |
| `collections` | Existe, lien direct au client | Ajouter le lien dossier pour les nouvelles collectes ; dériver le client depuis le dossier ; garder une voie explicite pour les lignes historiques non rattachées | Stratégie de compatibilité de `client_id`, colonnes temporelles déclarées, sémantique des reçus, statuts |
| `remittances` et `remittance_items` | Existent | Conserver les collectes entières et l’unicité d’une affectation ; séparer clairement déclaration agent, réception caisse et écart dans les transitions et événements | Structure exacte de l’historique de réception, annulation, compensation et réaffectation après annulation |
| `daily_closures` et `closure_reopen_events` | Existent | Préserver la déclaration hors ligne, l’idempotence et la réouverture superviseur auditée ; distinguer déclaration locale et rapprochement serveur | Calculs, états persistés de rapprochement, comportement si opérations pendantes, total de référence |
| `sync_events` | Existe | Conserver unicité user/appareil/operation, hash de payload, résultat rejouable et décision de conflit | Rétention, distinction erreur temporaire/rejet définitif, payload canonique et codes de réponse |
| `audit_logs` | Existe | Conserver ; toute résolution, fusion, annulation ou correction est traçable ; aucune mutation/suppression applicative | Politique d’immutabilité, accès, rétention et niveau de détail JSON |
| `discrepancies` | Existe | Conserver le constat de l’écart ; ajouter ou préciser l’historique des décisions de résolution si nécessaire | Champs obligatoires, seuils, transitions, acteur de validation et compensation |
| `system_settings` | Existe | Conserver les portées globale/agence et leurs index filtrés | Clés autorisées, validation et audit des changements |
| sessions/appareils | Partiellement représentés par `device_id` | Étudier une entité dédiée si nécessaire pour les sessions, révocations et appareils perdus | Durées, verrouillage, révocation, récupération des opérations offline |

Cette table ne valide pas automatiquement les champs proposés dans d’anciens documents de conception ; seul le registre canonique fixe les règles métier.

## 4. Contraintes à préserver ou à concevoir

### À préserver depuis le DDL v1.1

- Montants en `BIGINT` XAF ; contraintes positives ou nulles selon le rôle du montant. Pas de `FLOAT`, `DOUBLE` ou calcul financier décimal flottant.
- Clés étrangères avec suppression restrictive pour utilisateurs, agences et opérations financières.
- Cohérence de l’agence entre opération et entités associées, vérifiée côté serveur et renforcée en base lorsque cela est possible.
- `UNIQUE (agent_id, client_operation_id)` pour les opérations du DDL actuel, en cohérence avec l’identité de reprise.
- `UNIQUE (user_id, device_id, client_operation_id)` dans `sync_events` et détection d’un payload différent par `payload_hash`.
- `UNIQUE (remittance_items.collection_id)` ; montant d’une ligne de remise égal au montant de la collecte ; agence de la remise égale à celle de la collecte.
- Transactions atomiques pour acceptation/idempotence d’une collecte, attribution officielle du reçu, soumission/réception d’une remise, clôture/réouverture et résolution d’écart.
- Réouverture de clôture limitée à un superviseur de l’agence avec motif ; événement et audit dans la même transaction.

### Contraintes nouvelles à concevoir

- Unicité atomique du dossier ouvert par `(branch_id, client_id)` : probablement un index unique partiel PostgreSQL ; prévoir une migration SQL personnalisée si nécessaire, car Prisma peut ne pas exprimer exactement cette contrainte.
- Cohérence agence/client/dossier/collecte, y compris pour tout `client_id` redondant conservé.
- Référence provisoire distincte de l’UUID technique et du numéro officiel ; portée d’unicité de chaque référence.
- Alias client sans réécrire les références financières historiques ; interdiction de cycles d’alias à définir.
- Historique de rattachement pour les collectes héritées : NULL accompagné d’un état explicite ; événement de proposition/validation/audit ; aucune association heuristique.
- Clôture déclarée localement mais non rapprochée côté serveur tant que le lot de synchronisation est incomplet.
- Même clé idempotente + même charge utile = résultat original ; même clé + charge différente = conflit traçable.

## 5. Temps et reçus

- Conserver séparément l’heure/date déclarée par l’appareil, l’instant de réception serveur et la date métier calculée dans `Africa/Ndjamena`.
- Utiliser la journée civile semi-ouverte `[début du jour, début du jour suivant)` dans le fuseau métier.
- Une horloge jugée incohérente place la collecte en revue humaine ; ne pas accepter automatiquement ni écraser l’heure d’origine. Les seuils et détails de correction restent ouverts.
- L’acceptation de collecte, l’attribution du numéro officiel par agence et la persistance doivent être atomiques. Les retries retournent le numéro existant.
- Distinguer la référence provisoire locale, l’identifiant technique, le numéro officiel et l’état d’impression.

**Question de compatibilité bloquante :** le DDL impose `client_receipt_no NOT NULL UNIQUE` globalement. Le format officiel et sa séquence ne sont pas arbitrés ; déterminer si le format inclut un identifiant d’agence pour préserver l’unicité globale, ou si l’évolution du périmètre d’unicité est nécessaire. L’inventaire d’utilisation des numéros historiques doit précéder tout changement.

## 6. Arbitrages de structure reçus le 19/10/2026

Les choix suivants ont été retenus pour orienter la conception ; ils ne valent pas validation de chaque colonne ou migration :

- **Agence du dossier :** ne pas stocker `branch_id` dans `dossiers` ; le périmètre d’agence est dérivé du client. Une collecte conserve toutefois son agence comme aujourd’hui. Le service et un contrôle SQL adapté doivent vérifier que collecte, dossier et client relèvent de la même agence. La technique (trigger, clés composites ou combinaison) reste à concevoir.
- **Numéro officiel :** conserver la contrainte globale d’unicité du reçu en concevant un numéro incluant un préfixe d’agence. Le préfixe doit reposer sur un identifiant/code non ambigu et stable ; le format, sa gestion si le code d’agence change, la séquence, les numéros réservés et la rétrocompatibilité restent ouverts.
- **`collections.client_id` :** le conserver temporairement dans la transition pour compatibilité, avec contrôle obligatoire de correspondance au client du dossier pour toute nouvelle collecte. Son retrait éventuel sera conditionné à l’inventaire des consommateurs et à un backfill vérifié ; ce choix ne transforme pas le client en seconde source métier.
- **Périmètre du schéma Prisma :** viser un miroir complet des entités du DDL v1.1, complété par les évolutions nécessaires aux décisions validées sur les dossiers et collectes. Cela ne signifie pas reproduire aveuglément les divergences du DDL ; chaque contrainte et chaque écart devra apparaître dans une matrice de revue.

Le feu vert autorise la préparation du modèle Prisma et de la migration pour revue, pas leur application. Les formats d’identifiants, certains champs, les états persistés, les contraintes SQL personnalisées et la stratégie d’installation/baseline doivent être examinés avant validation finale.

## 7. Stratégie de transition proposée

Cette séquence est une proposition de conception, non une autorisation d’exécution :

1. Examiner le présent modèle Prisma et valider les champs obligatoires, notamment dossiers, alias client, collecte, reçu et clôture.
2. Inventorier les bases et consommateurs existants dans un environnement autorisé, en lecture seule ; aucune base disponible n’a été inspectée pour cette proposition.
3. Produire une matrice colonne par colonne entre le DDL v1.1, le modèle cible et les décisions métier ; identifier chaque contrainte, index et trigger à préserver, remplacer ou compléter.
4. Concevoir une évolution additive compatible : tables/colonnes, règles d’écriture et de lecture, backfill vérifiable, contraintes temporaires/permanentes, rollback et tests de migration isolés.
5. Faire approuver le plan et le SQL préparé. Le schéma Prisma et la migration additive sont déjà rédigés pour revue ; leur application attend une approbation distincte. Ne pas utiliser `prisma db push` pour contourner la migration contrôlée.
6. Tester dans une base jetable locale : contraintes, concurrence, idempotence, isolement agence, données ambiguës, restauration et migration depuis le DDL v1.1.

## 8. Décisions nécessaires avant le schéma Prisma cible

1. Confirmer les champs obligatoires du dossier et les champs non contractuels ; confirmer si `assigned_agent_id` est fixe ou modifiable.
2. Définir le format de la référence provisoire et du préfixe d’agence du numéro officiel, la stabilité du préfixe et la séquence ; confirmer la compatibilité de l’unicité globale actuelle.
3. Définir le vocabulaire et les transitions persistés des dossiers, collectes, remises et clôtures, sans confondre état métier et état de synchronisation.
4. Définir la représentation exacte des collectes historiques non rattachées et les habilitations de proposition/validation du lien.
5. Définir comment représenter l’alias client et les états de revue sans écraser les historiques.
6. Définir l’historique des remises, corrections/annulations, compensation et réaffectation de collecte.
7. Définir les données d’audit, la rétention et les sessions/appareils nécessaires au MVP.

## 9. Décision de passage à l’implémentation

Le schéma Prisma et la migration additive sont préparés mais ne sont pas encore validés définitivement ni appliqués. Le feu vert de préparation ne valide pas implicitement chaque colonne, enum, contrainte SQL ou le plan d’exécution ; toute application à une base nécessite un accord explicite distinct.