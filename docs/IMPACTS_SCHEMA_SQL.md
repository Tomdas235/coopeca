# Impacts métier et techniques — dossier, synchronisation et reçus

**Statut :** analyse de cadrage fondée sur les règles métier validées et les détails encore ouverts. Ce document ne modifie pas le schéma SQL v1.1, ne définit pas le schéma Prisma final et ne prescrit aucune migration exécutable.

Le brouillon de modèle cible à examiner est [CONCEPTION_MODELE_DONNEES.md](./CONCEPTION_MODELE_DONNEES.md). Le présent fichier décrit les écarts et impacts ; le brouillon ne lève pas à lui seul les validations métier/techniques restantes.

## 1. Décision et objectif

**Principe validé :** un dossier de tontine est une entité distincte du client ; un client peut en posséder plusieurs ; toute nouvelle collecte est rattachée à un dossier précis, dont le client est dérivé. Les règles complémentaires de création hors ligne, d’unicité du dossier ouvert, de fermeture, de conflits explicites et d’historique sont consignées sous les identifiants **D-LOT-001 à D-LOT-005** dans [DECISIONS_METIER.md](./DECISIONS_METIER.md) §3.12-3.13. Les arbitrages transversaux du 19/10 sont consignés en §3.14. Le présent document et le SQL v1.1 restent inchangés en structure.

La conception détaillée décrit déjà des dossiers `tontine_accounts` avec notamment une référence, un client, un agent affecté, un montant journalier, des dates, un statut et une version de règles. En revanche, le [schéma SQL v1.1](./COOPECA_Backend_Schema_v1.1.sql) ne définit aucune table de dossier : `collections` contient aujourd’hui un `client_id` direct.

## 2. Relations métier visées

Le modèle conceptuel à représenter est :

```text
Client 1 ─── 0..n Dossiers de tontine
Dossier 1 ─── 0..n Collectes
Chaque collecte appartient à un seul dossier
```

Le dossier porte les informations contractuelles/périodiques qui ne sont pas des attributs de l’identité du client. La collecte reste l’événement financier réel (montant, agent, horodatages, reçu et statut) et référence obligatoirement le dossier concerné pour toute nouvelle opération. Le client propriétaire se déduit du dossier ; un éventuel champ `client_id` conservé pour compatibilité ne constitue pas une source indépendante et doit rester cohérent. Les collectes historiques suivent la procédure distincte de §3.13 point 6 du registre.

Cette cardinalité ne décide pas si un client doit obligatoirement posséder un dossier, si un dossier peut changer d’agent ou si un agent peut collecter sur un dossier affecté à un autre agent : ces règles restent **À VALIDER**. Le principe relationnel est validé, sans approbation implicite des champs ou contraintes du modèle. La suppression physique des clients, dossiers ou collectes liés à des opérations financières n’est pas envisagée.

## 3. Éléments SQL à analyser avant de concevoir une évolution

### 3.1 Tables et clés étrangères

- **`clients`** : table propriétaire actuelle des attributs d’identité et de l’agence (`branch_id`). Le nouveau dossier devrait avoir une référence à son client.
- **Nouvelle entité de dossier** : ses champs définitifs ne sont pas décidés. L’exemple documentaire `tontine_accounts` propose une clé UUID, un code, une référence client, un agent affecté, un montant journalier XAF, des dates, un statut et une version des règles. Cet inventaire est un point de départ, pas une approbation de chaque colonne.
- **`collections`** : contient actuellement `client_id NOT NULL REFERENCES clients(id)`. Le modèle cible rattache chaque nouvelle collecte au dossier ; si `client_id` est conservé pour compatibilité, il doit correspondre au client propriétaire du dossier.
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

**Principe métier retenu :** entité dossier distincte ; client éventuellement associé à plusieurs dossiers ; toute nouvelle collecte rattachée à un dossier précis, dont le client est dérivé. L’historique non rattaché n’est permis que selon le statut explicite et le processus audité du registre.

**Conséquences nécessaires à examiner dans le modèle cible :**

- représenter une entité dossier distincte avec une relation vers son client ;
- permettre à chaque collecte nouvelle de référencer le dossier concerné ;
- garantir que le client propriétaire du dossier et la collecte appartiennent à la même agence ;
- préserver l’unicité d’affectation d’une collecte à une remise ;
- déterminer comment les rapports par client sont obtenus via le dossier.

**Options à valider avant de figer les tables et contraintes :**

- conserver temporairement `collections.client_id` pour compatibilité ou le remplacer dans le modèle cible par un rattachement au dossier ; ce choix technique ne change pas la source métier du client. Si les deux liens coexistent, leur cohérence doit être garantie ;
- rendre la référence de dossier unique globalement ou dans le périmètre d’une agence ;
- inclure `branch_id` directement dans la table de dossiers pour faciliter l’isolement et les index, ou la déduire du client ; si elle est dupliquée, imposer la cohérence ;
- les champs, statuts, dates de validité, attribution à un agent et versionnement des règles du dossier ;
- la politique de rattachement des données déjà présentes et les critères autorisant une collecte sur un dossier inactif.

Ces choix doivent tenir compte de l’existence de la contrainte SQL actuelle qui rend `collections.client_id` obligatoire, du trigger d’agence correspondant et des index de recherche/rapport. Ce document n’ordonne pas de supprimer ces éléments.

### 5.2 États, horodatages, reçus et remises

**Principes métier validés :**

- distinguer les états de synchronisation, métier et impression ; la synchronisation d’une collecte ne signifie pas réception caisse ;
- conserver l’heure/date déclarée de la collecte et l’instant de réception serveur séparément ; ne pas remplacer automatiquement la date métier par la date de synchronisation ;
- appliquer la journée civile semi-ouverte [début du jour, début du jour suivant) dans `Africa/Ndjamena`, avec calcul cohérent côté serveur ;
- une collecte hors ligne porte une référence provisoire lisible, stable, unique et liée à l’agence, distincte de l’identifiant technique ; après acceptation, le serveur attribue atomiquement un numéro officiel unique dans le périmètre agence et conserve la correspondance ;
- les reprises idempotentes réutilisent les mêmes identifiants et clés ; même clé avec contenu différent = conflit ;
- un rejet définitif conserve l’opération et le reçu, affiche le motif et bloque les reprises automatiques ; la résolution doit être explicite ;
- après acceptation, les futurs reçus affichent les deux références ; une réimpression ne crée pas une collecte ;
- les horloges incohérentes sont signalées et leurs éléments utiles conservés ; corrections supervisées, motivées et auditées ;
- session hors ligne limitée, verrouillage après inactivité et révocation appliquée au prochain contact serveur ; l’expiration ne supprime pas les opérations locales en attente, qui doivent être conservées de manière sécurisée ;
- une remise sélectionne des collectes entières ; une collecte n’est pas fractionnée entre plusieurs remises. Les écarts de remise doivent être traçables, motivés et validés selon les habilitations.

**Déjà arbitré dans `DECISIONS_METIER.md` §3.8 et §3.14 :** matrice de base des rôles, fusion supervisée de doublons par alias sans réécriture financière, collecte nouvelle obligatoirement liée au dossier, allocation atomique du numéro officiel à l’acceptation, clôture locale hors ligne avec rapprochement différé, résolution des écarts par superviseur et revue humaine des horloges incohérentes.

**À VALIDER :** transitions et règles détaillées d’annulation ; états exacts et correspondance SQL des trois axes (sans nouvel enum définitif implicite) ; formats/séquence des références, mentions légales et parcours de rejet/résolution ; seuils d’horloge et données d’examen ; durées de session et mécanisme précis de révocation ; permissions fines, délégations, champs et seuils d’écart ; réaffectation après annulation ; règles détaillées de normalisation des doublons et correction d’une fusion erronée.

**Impact documentaire :** utiliser une terminologie cohérente dans les états, API, reçus, flux de caisse, clôtures et audits. Ces principes sont détaillés dans [DECISIONS_METIER.md](./DECISIONS_METIER.md) et [REÇUS_ET_DATE_METIER.md](./REÇUS_ET_DATE_METIER.md).

**Impact technique futur :** analyser la séparation logique entre état client de synchronisation et statuts métier serveur ; la persistance des temps déclarés et reçus ; le calcul serveur de `business_date` ; les références de reçu provisoire/officiel ; la conservation sécurisée de la file locale ; les transitions et audits de déclaration, réception et écart. Toute représentation SQL/API reste à concevoir après validation des détails.

#### Références de reçu : options SQL à comparer

Le SQL impose actuellement `collections.client_receipt_no VARCHAR(80) NOT NULL UNIQUE` à l’insertion, avec unicité globale. La décision du 19/10/2026 exige une allocation officielle atomique à l’acceptation, unique dans le périmètre d’une agence. Il définit aussi `local_receipt_no` nullable, sans définir la relation entre ces colonnes et l’identifiant technique complet. Le principe métier est décidé ; les variantes ci-dessous restent à étudier pour la compatibilité, sans rouvrir ce principe :

1. **Attribution à l’acceptation avant insertion — option de référence métier :** le serveur alloue le numéro puis insère la collecte avec la valeur requise dans la même unité transactionnelle. Cela peut garder `NOT NULL`, mais l’unicité globale peut être plus stricte que l’unicité agence, sauf si le format empêche toute collision entre agences. Il faut concevoir l’atomicité, les reprises, les pannes et les numéros réservés/non utilisés.
2. **Attribution après persistance préalable :** rendre possible l’absence du numéro officiel avant acceptation et l’enregistrer ensuite. Cela correspond au cycle si une collecte est stockée avant acceptation, mais change le contrat de nullabilité/unicité et exige compatibilité historique et consommateurs.
3. **Registre ou relation séparée d’attribution :** conserver un lien explicite entre opération, référence provisoire et numéro officiel, éventuellement avec coexistence temporaire du champ historique. Cela sépare les rôles mais ajoute une relation transactionnelle à maintenir idempotemment ; la valeur et le sens de `client_receipt_no` doivent quand même être définis.

**Décision :** le principe de l’option 1 est retenu : allocation atomique à l’acceptation avant insertion/persistance. La sémantique historique de `client_receipt_no`, la portée de l’unicité SQL globale, le format/séquence et la compatibilité restent à concevoir. Le SQL v1.1 n’est pas modifié par cette décision.

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
- L’autorisation de l’agence doit être vérifiée côté serveur à chaque requête ; une agence déclarée par le client ne donne aucun droit.
- L’identifiant technique complet, la référence provisoire lisible et la clé d’idempotence sont des valeurs distinctes à relier explicitement. Elles restent constantes lors des tentatives. Une répétition identique retourne le résultat existant ; une même clé avec un contenu différent retourne un conflit explicite, selon un contrat à définir.
- L’API doit allouer le numéro officiel de façon atomique dans l’espace de numérotation de l’agence à l’acceptation, conserver le lien de référence et inclure les deux numéros dans les réponses idempotentes ultérieures.
- Le contrat de rejet définitif doit préserver l’opération et son reçu, retourner un motif affichable et empêcher les nouvelles tentatives automatiques ; la voie de résolution et ses autorisations sont à définir.
- Les contrats de reçu et d’impression doivent séparer les états de synchronisation, métier et impression. La réimpression lit le même reçu et ne crée pas une nouvelle collecte.
- Les données d’horloge incohérente et les corrections supervisées doivent préserver la déclaration d’origine, l’instant serveur, le motif et l’audit selon les règles de conservation à valider.
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
- Une seule allocation officielle est effective sous concurrence et reprise ; l’unicité suit le périmètre agence retenu et est contrôlée côté serveur.
- Une réponse idempotente restitue toujours le même numéro officiel ; le lien entre identifiant technique, référence provisoire, agence et numéro officiel est vérifiable.
- Un rejet définitif conserve l’opération et le reçu, affiche le motif, désactive la reprise automatique et n’autorise la résolution que par le parcours/habilitation approuvé.
- Une impression réussie ou échouée ne modifie ni l’état de synchronisation ni l’état métier ; réimprimer avant/après acceptation n’ajoute aucune collecte et, après acceptation, montre les deux références.
- Les horodatages autour des bornes du jour respectent [début, début du jour suivant) dans `Africa/Ndjamena`, sans changement de date métier induit par une synchronisation tardive.
- Une heure d’appareil incohérente est signalée, les éléments d’examen sont conservés et une correction autorisée conserve valeur d’origine, motif, auteur et audit.
- Les identifiants d’opération et reçus d’une autre agence ne peuvent pas être consultés ou modifiés en forgeant un identifiant ou une agence côté client.
- Une collecte ne peut pas être fractionnée ni affectée à deux remises ; les montants des lignes et collectes restent égaux.
- Expirer une session ou verrouiller l’application ne supprime pas les opérations locales en attente ; la révocation prend effet lors du contact serveur selon la politique validée.
- Les déclarations, réceptions caisse et écarts restent distincts et auditables ; aucun statut n’est déduit du seul état de synchronisation.
- Les rapports par client, dossier, agent, agence et date concordent avec le détail des collectes.
- Les données historiques non ambiguës sont conservées et les lignes ambiguës sont détectées sans attribution automatique injustifiée.
- Les contraintes et triggers personnalisés sont présents après application reproductible des migrations dans une base de test isolée ; une restauration de test reste possible.

## 6. Divergences documentaires

- La conception détaillée et le cahier des charges présentent un dossier `tontine_accounts`, et le principe validé d’un client possédant plusieurs dossiers ne figure pas dans le SQL v1.1, qui référence directement `clients` depuis `collections`.
- Le SQL v1.1 utilise des noms et états différents de la conception (`collections` plutôt que `payments`, et aucun statut SQL `CONFIRMED`). Cette divergence doit être résolue dans le modèle et les contrats, pas par une substitution implicite de vocabulaire.
- Le SQL impose `client_receipt_no` obligatoire et unique globalement dès l’insertion ; la règle validée exige un numéro officiel serveur attribué à l’acceptation et unique dans le périmètre agence. Plusieurs options restent à comparer (attribution avant insertion, numéro différé, registre séparé) : aucune n’est tranchée. Voir la comparaison ci-dessus et [REÇUS_ET_DATE_METIER.md](./REÇUS_ET_DATE_METIER.md).
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

1. Faire valider les détails ouverts de [DECISIONS_METIER.md](./DECISIONS_METIER.md) et les règles de numérotation/rejet.
2. Choisir, après comparaison, une stratégie compatible avec le champ historique `client_receipt_no`, l’allocation par agence et les consommateurs existants.
3. Élaborer une matrice relationnelle dossier/collecte et une stratégie de compatibilité des données et API.
4. Définir les tests d’acceptation recensés ici et dans [REÇUS_ET_DATE_METIER.md](./REÇUS_ET_DATE_METIER.md), notamment idempotence concurrente, heures limites et isolement inter-agences.
5. Examiner ensemble les contraintes SQL v1.1, le modèle Prisma envisagé et les contrats d’API ; attendre un accord explicite avant toute initialisation technique ou migration.
