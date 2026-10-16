# Impacts métier et techniques — dossier de tontine

**Statut :** analyse de cadrage fondée sur la base d’arbitrage métier retenue pour validation finale. Ce document ne modifie pas le schéma SQL v1.1, ne définit pas le schéma Prisma final et ne prescrit aucune migration exécutable.

## 1. Décision et objectif

**Principe retenu pour validation finale :** un dossier de tontine est une entité distincte du client ; un client peut en posséder plusieurs ; chaque collecte doit être rattachée explicitement à un dossier précis. Ce principe est consigné dans [DECISIONS_METIER.md](./DECISIONS_METIER.md).

La conception détaillée décrit déjà des dossiers `tontine_accounts` avec notamment une référence, un client, un agent affecté, un montant journalier, des dates, un statut et une version de règles. En revanche, le [schéma SQL v1.1](./COOPECA_Backend_Schema_v1.1.sql) ne définit aucune table de dossier : `collections` contient aujourd’hui un `client_id` direct.

## 2. Relations métier visées

Le modèle conceptuel à représenter est :

```text
Client 1 ─── 0..n Dossiers de tontine
Dossier 1 ─── 0..n Collectes
Chaque collecte appartient à un seul dossier
```

Le dossier porte les informations contractuelles/périodiques qui ne sont pas des attributs de l’identité du client. La collecte reste l’événement financier réel (montant, agent, horodatages, reçu et statut) et référence le dossier concerné. Le client propriétaire d’une collecte se déduit du dossier.

Cette cardinalité ne décide pas si un client doit obligatoirement posséder un dossier, si un dossier peut changer d’agent ou si un agent peut collecter sur un dossier affecté à un autre agent : ces règles restent **À VALIDER**. La décision est retenue pour validation finale ; elle n’approuve pas chaque champ ou chaque contrainte du modèle. La suppression physique des clients, dossiers ou collectes liés à des opérations financières n’est pas envisagée.

## 3. Éléments SQL à analyser avant de concevoir une évolution

### 3.1 Tables et clés étrangères

- **`clients`** : table propriétaire actuelle des attributs d’identité et de l’agence (`branch_id`). Le nouveau dossier devrait avoir une référence à son client.
- **Nouvelle entité de dossier** : ses champs définitifs ne sont pas décidés. L’exemple documentaire `tontine_accounts` propose une clé UUID, un code, une référence client, un agent affecté, un montant journalier XAF, des dates, un statut et une version des règles. Cet inventaire est un point de départ, pas une approbation de chaque colonne.
- **`collections`** : contient actuellement `client_id NOT NULL REFERENCES clients(id)`. Une référence au dossier doit devenir le moyen non ambigu de rattacher chaque nouvelle collecte à son dossier.
- **`remittance_items`** : référence une collecte par `collection_id`. La relation à la collecte et la contrainte d’une seule affectation par collecte doivent rester intactes, indépendamment du changement de rattachement de la collecte au dossier.
- **`daily_closures`** : ses agrégats et rapports doivent continuer à pouvoir être rapprochés des collectes et des remises par agent, agence et date métier.
- **`audit_logs`, `sync_events` et `closure_reopen_events`** : vérifier les références et les données d’audit/synchronisation qui identifient l’entité concernée ; ne pas réinterpréter ni effacer l’historique lors d’un changement de modèle.

### 3.2 Unicités, contraintes, triggers et index existants

Le schéma v1.1 contient notamment :

- `clients.client_code` unique globalement ; aucune règle équivalente de référence de dossier n’est définie parce que la table n’existe pas.
- Des contrôles d’agence via `branch_id`, clés étrangères et trigger `trg_collection_client_branch`, qui exige actuellement que la collecte et le client référencé appartiennent à la même agence.
- Des index de recherche/rapport sur clients par agence, nom et statut, et sur collectes par agence/date, client/date, agent/date et état de réception de synchronisation.
- Une unicité de `remittance_items.collection_id`, garantissant qu’une collecte ne se rattache qu’à une ligne de remise, ainsi qu’un trigger vérifiant l’agence et l’égalité de montant entre la ligne et la collecte.
- Des contraintes de montants entiers positifs, des identifiants de synchronisation et des contraintes d’unicité liées aux opérations côté agent.

L’évolution devra préserver ces invariants. En particulier, un dossier ne doit pas permettre de contourner l’isolation par agence : la cohérence entre agence du client, du dossier et de la collecte doit être garantie par des contrôles adaptés côté serveur et, si retenu après conception, par les contraintes SQL correspondantes.

Les clés étrangères composites, les contraintes `CHECK`, les index partiels, les triggers PL/pgSQL et les autres expressions PostgreSQL non représentables directement en Prisma devront être évalués pour une éventuelle migration SQL personnalisée. Aucun choix de mécanisme n’est arrêté ici.

## 4. Données existantes et compatibilité

Le dépôt contient le DDL de référence, mais aucun inventaire de base de données ni export de données n’a été fourni ou consulté. Le nombre et la nature des lignes existantes sont donc inconnus.

Avant toute évolution, il faudra inventorier, dans un environnement autorisé et non destructif :

1. les collectes existantes et leurs clients, agences, agents et dates ;
2. l’existence éventuelle de sources de référence fiables permettant d’identifier le dossier réel de chaque collecte ;
3. les collectes qui ne peuvent pas être rattachées sans ambiguïté à un dossier ;
4. l’usage éventuel du champ `collections.client_receipt_no`, de `local_receipt_no` et des identifiants d’opération ;
5. les consommations actuelles de `client_id` dans les API, rapports, exports ou outils externes.

Ne pas fabriquer une affectation de dossier à partir du seul client si un client peut avoir plusieurs dossiers. Les lignes ambiguës doivent être signalées et résolues selon une procédure métier approuvée, sans suppression ni perte de leur référence financière. Toute étape ultérieure devra être additive et préserver les données et clés historiques ; aucune stratégie destructive ou commande de base n’est proposée dans ce document.

## 5. Conséquences attendues à concevoir

### 5.1 Modèle et intégrité

**Principe métier retenu :** entité dossier distincte ; client éventuellement associé à plusieurs dossiers ; collecte rattachée à un dossier précis.

**Conséquences nécessaires à examiner dans le modèle cible :**

- représenter une entité dossier distincte avec une relation vers son client ;
- permettre à chaque collecte nouvelle de référencer le dossier concerné ;
- garantir que le client propriétaire du dossier et la collecte appartiennent à la même agence ;
- préserver l’unicité d’affectation d’une collecte à une remise ;
- déterminer comment les rapports par client sont obtenus via le dossier.

**Options à valider avant de figer les tables et contraintes :**

- conserver `collections.client_id` comme donnée redondante, ou le remplacer dans le modèle cible par un rattachement au dossier ; si la relation directe est conservée, définir une contrainte empêchant tout désaccord entre le client et celui du dossier ;
- rendre la référence de dossier unique globalement ou dans le périmètre d’une agence ;
- inclure `branch_id` directement dans la table de dossiers pour faciliter l’isolement et les index, ou la déduire du client ; si elle est dupliquée, imposer la cohérence ;
- les champs, statuts, dates de validité, attribution à un agent et versionnement des règles du dossier ;
- la politique de rattachement des données déjà présentes et les critères autorisant une collecte sur un dossier inactif.

Ces choix doivent tenir compte de l’existence de la contrainte SQL actuelle qui rend `collections.client_id` obligatoire, du trigger d’agence correspondant et des index de recherche/rapport. Ce document n’ordonne pas de supprimer ces éléments.

### 5.2 États, horodatages, reçus et remises

**Principes métier retenus pour validation finale :**

- distinguer l’état de synchronisation local, l’état métier de la collecte et l’état de remise ; la synchronisation d’une collecte ne signifie pas réception caisse ;
- conserver l’heure/date déclarée de la collecte et l’instant de réception serveur séparément ; ne pas remplacer automatiquement la date de collecte par celle de synchronisation ;
- appliquer la journée civile de 00 h 00 à 23 h 59 dans `Africa/Ndjamena`, avec calcul cohérent côté serveur ;
- une collecte hors ligne porte une référence locale provisoire stable ; après acceptation, le serveur attribue un numéro officiel et conserve la correspondance ; les reprises réutilisent identifiant et clé idempotente ;
- session hors ligne limitée, verrouillage après inactivité et révocation appliquée au prochain contact serveur ; l’expiration ne supprime pas les opérations locales en attente, qui doivent être conservées de manière sécurisée ;
- une remise sélectionne des collectes entières ; une collecte n’est pas fractionnée entre plusieurs remises. Les écarts de remise doivent être traçables, motivés et validés selon les habilitations.

**À VALIDER :** transitions, permissions et règles d’annulation ; format des reçus et mentions légales ; frontière calendaire de calcul côté serveur et seuil/procédure de correction d’horloge ; durées de session et mécanisme précis de révocation ; rôles, seuils et pouvoirs d’approbation d’un écart ; réaffectation éventuelle d’une collecte après annulation d’une remise. Aucun nouvel enum définitif n’est proposé.

**Impact documentaire :** utiliser une terminologie cohérente dans les états, API, reçus, flux de caisse, clôtures et audits. Ces principes sont détaillés dans [DECISIONS_METIER.md](./DECISIONS_METIER.md) et [REÇUS_ET_DATE_METIER.md](./REÇUS_ET_DATE_METIER.md).

**Impact technique futur :** analyser la séparation logique entre état client de synchronisation et statuts métier serveur ; la persistance des temps déclarés et reçus ; le calcul serveur de `business_date` ; les références de reçu provisoire/officiel ; la conservation sécurisée de la file locale ; les transitions et audits de déclaration, réception et écart. Toute représentation SQL/API reste à concevoir après validation des détails.

### 5.3 Prisma et migrations

- Traduire les relations et types décidés dans le schéma Prisma après arbitrage, sans supposer que le modèle documentaire ancien constitue à lui seul un schéma final.
- Comparer le modèle Prisma au DDL SQL v1.1 et vérifier explicitement chaque clé étrangère, unicité, index, `CHECK`, enum et comportement de suppression.
- Préserver au besoin dans les migrations SQL Prisma personnalisées les contraintes ou triggers PostgreSQL qui ne sont pas exprimables dans Prisma.
- Concevoir une évolution progressive compatible avec les données et consommateurs existants : création de structure, stratégie de rattachement contrôlée, validation, puis seulement évolution des lectures/écritures après vérification. L’ordre et les opérations précises restent à concevoir ; aucune migration n’est générée ici.
- Faire examiner le SQL généré et les impacts de restauration avant toute application à une base partagée. Pas de `db push`, `migrate dev`, `migrate deploy` ni autre commande de base dans le cadre de ce cadrage.

### 5.4 API et synchronisation

- Les contrats de collecte devront identifier le dossier, ou permettre à l’API de le résoudre sans ambiguïté ; un identifiant de client seul ne suffit plus si plusieurs dossiers sont possibles.
- Les données de démarrage/synchronisation mobile devront inclure seulement les dossiers accessibles à l’agent selon les règles d’agence et d’affectation approuvées.
- L’API doit vérifier côté serveur le lien dossier-client-agence et l’état/éligibilité du dossier avant d’accepter une collecte.
- L’identifiant stable de l’opération et la clé d’idempotence doivent rester constants lors des tentatives. Une répétition avec une charge identique retourne le résultat existant ; une même clé avec des données incompatibles est rejetée ou placée en conflit selon un contrat à définir.
- Les réponses de synchronisation et les erreurs métier doivent permettre au mobile de conserver et afficher les collectes en conflit sans les perdre.
- Les changements d’API ne doivent pas casser silencieusement des consommateurs existants ; définir une stratégie de compatibilité et de versionnement avant de retirer ou rendre facultatif l’ancien `client_id`.

### 5.5 Tests à prévoir avant acceptation

- Un client peut posséder plusieurs dossiers ; une collecte référence exactement le dossier sélectionné.
- Une collecte ne peut pas être rattachée à un dossier d’un autre client ou d’une autre agence.
- Les contrôles d’autorisation empêchent la lecture et l’écriture inter-agences, même si l’identifiant de dossier est forgé.
- Un dossier inactif ou non autorisé est traité selon la règle métier approuvée.
- Un même événement de collecte conserve séparément l’heure déclarée et l’instant de réception serveur ; les reprises tardives ne remplacent pas automatiquement la date métier.
- Les limites de journée sont cohérentes côté serveur dans `Africa/Ndjamena` ; les horloges incohérentes suivent le processus supervisé validé.
- Répéter la synchronisation ne crée ni seconde collecte ni seconde correspondance ; réutiliser une clé avec une charge différente ne produit pas de succès trompeur.
- Une collecte ne peut pas être fractionnée ni affectée à deux remises ; les montants des lignes et collectes restent égaux.
- Expirer une session ou verrouiller l’application ne supprime pas les opérations locales en attente ; la révocation prend effet lors du contact serveur selon la politique validée.
- Les déclarations, réceptions caisse et écarts restent distincts et auditables ; aucun statut n’est déduit du seul état de synchronisation.
- Les rapports par client, dossier, agent, agence et date concordent avec le détail des collectes.
- Les données historiques non ambiguës sont conservées et les lignes ambiguës sont détectées sans attribution automatique injustifiée.
- Les contraintes et triggers personnalisés sont présents après application reproductible des migrations dans une base de test isolée ; une restauration de test reste possible.

## 6. Divergences documentaires

- La conception détaillée et le cahier des charges présentent un dossier `tontine_accounts`, et le principe d’un client possédant plusieurs dossiers est retenu pour validation finale ; le SQL v1.1 ne contient pas cette entité et référence directement `clients` depuis `collections`.
- Le SQL v1.1 utilise des noms et états différents de la conception (`collections` plutôt que `payments`, et aucun statut SQL `CONFIRMED`). Cette divergence doit être résolue dans le modèle et les contrats, pas par une substitution implicite de vocabulaire.
- Le SQL impose actuellement un `client_receipt_no` obligatoire et unique dès l’insertion, tandis que le principe retenu attribue le numéro officiel serveur lors de la synchronisation. Ce n’est pas nécessairement incompatible si le serveur attribue ce numéro avant l’insertion de la collecte dans la transaction de synchronisation ; le moment d’allocation, son atomicité et la correspondance avec la référence locale ne sont toutefois pas définis par le schéma ou les documents. À clarifier avant migration, sans casser l’unicité ni l’historique.
- Le SQL définit `collection_status` avec `RECORDED`/`REVERSED`, `remittance_status` avec `DRAFT`/`SUBMITTED`/`RECEIVED`/`PARTIAL`/`DISPUTED`/`CANCELLED`, `closure_status` avec `DRAFT`/`SUBMITTED`/`REVIEWED`/`REOPENED`, et `sync_status` avec `RECEIVED`/`APPLIED`/`REJECTED` pour les événements de synchronisation. Les états documentaires `PENDING_SYNC`, `SYNCED`, `REQUIRES_REVIEW`, `CONFIRMED`, `VALIDATED` et `CLOSED` ne sont pas tous équivalents ni des enums SQL approuvés. La séparation et les transitions restent à concevoir ; ne pas inventer de nouveaux enums définitifs.
- Le SQL enregistre déclaration et réception de remise sur `remittances` (colonnes de montant reçu, acteur et date) et n’impose pas à lui seul un objet distinct pour chaque confirmation. Il faut vérifier comment exprimer les confirmations agent/caissier et les écarts audités sans confondre réception et synchronisation.
- Le SQL définit `collected_at TIMESTAMPTZ`, `sync_received_at TIMESTAMPTZ` et `business_date DATE`, mais pas de valeur explicite distincte pour date/heure déclarée sur l’appareil ni de règle de calcul explicitement liée au fuseau `Africa/Ndjamena`. Les instants doivent rester des instants ; la journée civile et le contrôle d’horloge doivent être appliqués de façon cohérente côté serveur.
- Le SQL a une unicité globale sur `remittance_items.collection_id`. Elle empêche de rattacher la même collecte à plusieurs lignes de remise, mais son interaction avec annulation, état de remise et éventuelle réaffectation doit être validée.

Ces constats identifient le travail de conception requis ; ils ne modifient pas le schéma ni les documents d’origine.

## 7. Cohérence avec les références

- **[AGENT.md](../AGENT.md) :** cohérent avec la stack et les règles de montants entiers, idempotence, hors-ligne, confirmations de remise et accès multi-agences. Il ne précise pas le modèle dossier ni les détails reçus/date/session.
- **[Implementation Plan v1.0](./COOPECA_Implementation_Plan_v1.0.docx) :** prévoit la revue du SQL en phase 2 ; l’entité dossier et les principes temporels retenus devront être intégrés aux livrables de cette phase.
- **[TRD v1.0](./COOPECA_TRD_Technique_Reference_Document_v1.0.docx) :** cohérent sur la stack, l’offline-first, l’idempotence et la séparation collecte/remise ; les nouvelles distinctions d’état et la journée civile ne sont pas définies au même niveau.
- **[App Flow v1.1](./COOPECA_App_Flow_Flux_Applicatif_v1.1.docx) :** son annexe décrit les collectes hors ligne, les remises par collectes sélectionnées et les clôtures hors ligne ; les contrats restent à harmoniser avec l’identifiant de dossier et les confirmations distinctes.

## 8. Prochaines étapes documentaires

1. Faire valider les principes et détails ouverts consignés dans [DECISIONS_METIER.md](./DECISIONS_METIER.md).
2. Élaborer une matrice relationnelle et une stratégie de compatibilité des données et API.
3. Examiner ensemble les contraintes SQL v1.1, le modèle Prisma envisagé et le contrat d’API avant toute migration.
4. Faire approuver des scénarios de tests de données historiques et d’isolement multi-agences.
5. Attendre l’accord explicite de COOPECA avant l’initialisation technique ou la génération d’une migration.
