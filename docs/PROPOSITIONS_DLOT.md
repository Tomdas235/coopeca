# Propositions d’arbitrage — six points ouverts D-LOT (dossiers de tontine)

**Statut : analyse historique de propositions.** Ce document analyse les six points D-LOT dans leur état de cadrage initial ; depuis le 16/10, les décisions métier retenues sont consignées en **Validé** dans [DECISIONS_METIER.md](./DECISIONS_METIER.md) §3.13, complétées par les arbitrages du 19/10 en §3.8 et §3.14. Les propositions et tableaux ci-dessous ne constituent pas l’état courant lorsqu’ils divergent du registre canonique. Ce fichier ne modifie ni le schéma SQL v1.1 ni `schema.prisma` ; il ne crée aucune migration et n’autorise aucun `prisma db push`.

**Mise à jour du 16/10/2026 :** les six propositions des sections 1 à 6 ont fait l’objet d’une **validation explicite** lors de l’étape d’intégration et sont désormais consignées comme **Validé** dans [DECISIONS_METIER.md](./DECISIONS_METIER.md) §3.13, avec rappel des détails que la source marquait « À VALIDER » (ils restent ouverts). Le présent document conserve intégralement son analyse d’origine.

**Addendum du 19/10/2026 :** les arbitrages transversaux (doublons/fusion client, client dérivé du dossier pour les nouvelles collectes, numérotation officielle des reçus, rôles, remises/écarts, clôture hors ligne et horloges incohérentes) sont consignés dans [DECISIONS_METIER.md](./DECISIONS_METIER.md) §3.8 et §3.14. Les tableaux et ambiguïtés ci-dessous reflètent l’état au 16/10/2026 et sont historiques ; en cas de divergence, le registre canonique prévaut. Le SQL v1.1 reste inchangé.

**Références employées :** AGENTS.md (anciennement AGENT.md), DECISIONS_METIER.md, IMPACTS_SCHEMA_SQL.md, REÇUS_ET_DATE_METIER.md, COOPECA_Backend_Schema_v1.1.sql (dont les règles de service A à J).

## 0. Socle commun déjà validé ailleurs (rappel, hors arbitrage)

- Serveur = autorité pour l’unicité et l’acceptation (D-LOT-001) ; idempotence par clé d’opération + `payload_hash` (miroir `sync_events`, règle B du SQL).
- États métier ≠ états de synchronisation ≠ états d’impression (DECISIONS §3.2).
- Aucune suppression automatique d’opération locale après conflit ou rejet (D-LOT-004) ; aucune opération historique effacée ou modifiée silencieusement (D-LOT-003).
- Audit immuable (`audit_logs`, règles D/E) ; motif obligatoire avec longueur minimale (motif de pattern `closure_reopen_events.reason >= 5`).
- Autorisations vérifiées côté serveur par rôle et agence (règle J) ; montants en BIGINT XAF ; instants conservés, date métier séparée (§3.5).

## 1. Créations concurrentes et résolution des conflits

### Décision proposée (À VALIDER)

1. Chaque dossier créé hors ligne porte un UUID généré sur l’appareil (identifiant technique stable, D-LOT-001) et une clé d’idempotence (`client_operation_id`), avec `device_id` — miroir exact de `sync_events` (UNIQUE utilisateur+appareil+clé).
2. L’ouverture est une décision **atomique** côté serveur : si un dossier `OUVERT` existe déjà pour (client, agence), la seconde création reçoit une réponse de **conflit explicite** (motif structuré du type `DOSSIER_DEJA_OUVERT`, référence du dossier gagnant), jamais une acceptation silencieuse (D-LOT-004).
3. Idempotence stricte : même clé + même contenu → résultat d’origine (acceptation ou conflit) ; même clé + contenu différent → conflit traçable (règle B, REÇUS §1).
4. Le dossier déclarant le conflit reste stocké et passe en état local de revue (vocabulaire à trancher avec §3.2 : états connus `REQUIRES_REVIEW` / `REJECTED_REVIEW`) ; aucune purge automatique.
5. Résolution humaine proposée : annulation motivée et auditée du dossier local, OU — si l’intention réelle était une succession — fermeture du dossier gagnant puis nouvelle création (voir points 2 et 3). Le parcours exact de résolution reste **À VALIDER**.

### Alternatives raisonnables

- **A) File de revue serveur :** toute création passe en attente et un superviseur tranche. Plus de contrôle, mais latence et charge opérationnelle.
- **B) Pré-vérification mobile** (télécharger l’index des dossiers ouverts) : impossible hors ligne et contraire à l’autorité serveur ; recevable comme confort d’affichage, jamais comme arbitre.
- **C) Rejet silencieux du second dossier** : interdit par D-LOT-004 (conflit explicite, pas de suppression).
- **D) Verrou par agent** : ne couvre pas deux appareils ou deux agents pour le même client.

### Conséquences métier

Feedback immédiat à l’agent (« dossier déjà ouvert ») ; double ouverture impossible ; charge possible de revue ; l’agent doit comprendre que l’enregistrement local ne vaut pas acceptation.

### Conséquences mobile

`src/services/sync.ts` : machine à états EN_ATTENTE → ACCEPTÉ / CONFLIT / REJET, retries idempotents ; conservation du dossier en conflit + écran de revue ; aucun thread réseau dans les écrans ; testable unitairement hors réseau via les repositories (à venir).

### Conséquences backend

Endpoint de création de dossier avec clé d’idempotence ; transaction + contrainte d’unicité ; réponse de conflit structurée (contrat exact À VALIDER — code, format, action proposée) ; écriture `audit_logs` (règles D/E) ; guards JWT + rôle + agence (règle J).

### Conséquences SQL et Prisma (conception ultérieure uniquement)

- SQL v1.1 inchangé aujourd’hui ; à concevoir : table `dossiers` + **index unique partiel** `(branch_id, client_id) WHERE status = 'OUVERT'` (garantie atomique D-LOT-002).
- Prisma : attention, les index uniques partiels ne sont pas exprimables nativement dans le schéma Prisma (au mieux des index filtrés en preview) → la contrainte devra probablement être portée par du SQL migratoire dédié ou la couche service en transaction ; c’est un choix technique à trancher **après** l’arbitrage métier.

### Risques et cas limites

- Client en double (identité) : deux fiches `clients` = deux unicités indépendantes → dépend au point 3.8 du registre (doublons client).
- Course exacte sur l’index : le second INSERT doit être converti en conflit métier, pas exposé en erreur interne.
- Clé rejouée après expiration de la fenêtre de rétention ; contenu modifié hors ligne entre deux tentatives ; interruption réseau en cours de traitement serveur.

### Dépendances

Point 5 (moment d’attribution du numéro), point 3 (état du dossier gagnant), DECISIONS §3.8 (doublons client), §3.2 (vocabulaire d’état de revue), D-LOT-002 et D-LOT-004.

## 2. Fermeture hors connexion et autorité nécessaire

### Décision proposée (À VALIDER) — modèle en deux temps

1. Un agent autorisé peut **déclarer** la fermeture d’un dossier hors connexion : effet local immédiat **sur l’appareil déclarant** (blocage des nouvelles collectes sur cet appareil), état local `FERMETURE_EN_ATTENTE`, distinct de tout état serveur.
2. L’effet **autorisé** (au sens serveur) ne naît qu’à l’acceptation : contrôle du rôle et de l’accès à l’agence côté serveur (règles C/J), motif obligatoire, idempotence, audit.
3. Autorité proposée : un **agent habilité de l’agence peut proposer** la fermeture (pas de second niveau obligatoire — D-LOT-003 ne l’impose pas) ; l’acceptation suit les permissions serveur. La **réouverture** exige en revanche un SUPERVISOR (alignement sur la règle D du SQL v1.1 pour les clôtures quotidiennes).
4. Rejet serveur → retour local à l’état OUVERT avec notification explicite ; aucune donnée supprimée.
5. Limitation assumée : les autres appareils ne sont informés qu’à la synchronisation suivante (inhérent à l’offline) — à afficher honnêtement dans l’interface.

### Alternatives raisonnables

- **A) Fermeture pleinement locale définitive** (même vue par les autres appareils) : irréaliste hors ligne, contredit l’autorité serveur, permet une fermeture non autorisée.
- **B) Fermeture exclusivement serveur** : aucun garde-fou local ; l’agent continue à collecter sans avertissement — mauvais usage hors ligne.
- **C) Fermeture soumise à autorisation préalable du superviseur** (jeton/décision) : plus strict ; lourd pour l’opération courante.
- **D) Deux temps (proposition retenue ci-dessus)** : concilie hors ligne et autorité.

### Conséquences métier

L’agent est protégé localement contre de nouvelles collectes dès la déclaration ; une fermeture peut être refusée (motif serveur à communiquer) ; les clients multiples appareils vivent un délai de propagation.

### Conséquences mobile

État local `FERMETURE_EN_ATTENTE` (métier) distinct de l’état de synchronisation ; garde-fou de création de collecte sur l’appareil déclarant ; collecte du motif avant envoi ; repositories (jamais de SQL dans les écrans).

### Conséquences backend

Endpoint de fermeture idempotent ; vérifications rôle + agence + dossier ouvert ; motif ; transaction (règle A) ; `audit_logs` ; code de rejet motivé (contrat à définir).

### Conséquences SQL et Prisma (conception ultérieure uniquement)

Colonnes futures sur `dossiers` : `status`, `closed_at` (instant d’effet serveur), `closed_by`, `closure_reason` ; possible table `dossier_state_events` sur le modèle de `closure_reopen_events` (motif `>= 5` caractères, `request_id` unique). Aucune modification du SQL v1.1 à ce stade ; Prisma : miroir des colonnes + transaction.

### Risques et cas limites

- Collectes créées sur **autres appareils** avant réception de la fermeture → voir point 4.
- Double requête de fermeture (idempotence) ; rejet après que l’agent a cessé de collecter (rattrapage à gérer en UX) ; appareil perdu avec fermeture en attente ; fermeture concurrente d’une création de successeur (point 1).

### Dépendances

Points 3 (transitions et rôles), 4 (collectes en vol), 1 (créations concurrentes), D-LOT-003, règle D du SQL v1.1.

## 3. Motif obligatoire, réouverture et transitions d’état

### Décision proposée (À VALIDER)

1. Jeu minimal d’états métier dossier : **OUVERT**, **FERMÉ** — aucun état destructif (jamais de « supprimé »), historique conservé (D-LOT-003).
2. **Motif obligatoire à la fermeture et à la réouverture** (longueur minimale type ≥ 5 caractères, à confirmer), conservé avec l’acteur, l’instant et l’état précédent.
3. Transitions permises : `OUVERT → FERMÉ` (agent habilité, motif) et `FERMÉ → OUVERT` (SUPERVISOR de l’agence, motif, événement immuable + audit, transaction — miroir de la règle D). Toute autre transition est rejetée et journalisée.
4. La réouverture produit un **événement** ; elle ne crée pas d’état persistant distinct (le dossier réouvert est OUVERT, son histoire reste consultable).
5. Réouverture **hors ligne** : proposée comme **non autorisée** (nécessite l’autorité serveur), contrairement à la fermeture à deux temps — à arbitrer (symétrie discutable).

### Alternatives raisonnables

- **A) État persistant `REOPENED`** (comme `closure_status`) : plus visible, mais brouille le vocabulaire (§3.2 interdit d’inventer des enums et signale la collision avec les clôtures quotidiennes `REOPENED`).
- **B) Motif obligatoire à la réouverture seulement** : moins de friction, moins de traçabilité sur la fermeture.
- **C) Fermeture terminal, sans réouverture** (créer un dossier successeur à la place) : simple et définitif, mais une erreur de fermeture devient irréversible.
- **D) Granularité par rôle** (agent = les dossiers qu’il affecte, superviseur = toute l’agence) : raffinement possible.

### Conséquences métier

Traçabilité complète de toute fermeture/réouverture ; friction d’authentification du superviseur ; aucune disparition d’opération ; l’historique des réouvertures est consultable selon les droits d’accès.

### Conséquences mobile

Saisie obligatoire du motif ; garde-fou de transitions identique mobile/serveur ; réouverture sans effet local avant acceptation (proposition) ; affichage de l’historique d’états.

### Conséquences backend

Machine à états validée côté serveur (source de vérité) ; guards rôle ; écriture atomique événement + audit ; idempotence des transitions concurrentes.

### Conséquences SQL et Prisma (conception ultérieure uniquement)

- Table `dossier_state_events` (miroir `closure_reopen_events`) ; contraintes CHECK sur `dossiers` pour les états cohérents (motif exigé en FERMÉ, etc.) ; les transitions relèvent de la couche service en transaction (règle A), éventuellement d’un trigger.
- Choix technique à venir : nommer les états **sans réutiliser ni confondre** l’enum `closure_status` (clôtures quotidiennes) — le glossaire exact dépend de §3.2, à valider avant tout enum.
- Prisma : transactions + lectures d’événements ; aucune migration à ce stade.

### Risques et cas limites

Collision de vocabulaire (§3.2) ; transitions concurrentes (fermeture et réouverture simultanées) → ordonnancement serveur, éventuellement colonne `version` (motif `clients.version`) ; abus de fermetures/réouvertures répétées → audit et éventuelles règles de fréquence ; réouverture hors ligne si l’alternative est retenue (effet non autorisé).

### Dépendances

Points 2 (autorité de fermeture), 4 (fenêtres temporelles), DECISIONS §3.2 (glossaire des états), règle D du SQL, D-LOT-003.

## 4. Collectes créées avant fermeture mais synchronisées après

### Décision proposée (À VALIDER) — temporalité déclarée sous contrôle

1. Une collecte est **acceptée** si son instant déclaré (`collected_at` de l’appareil) est **strictement antérieur à l’instant d’effet de la fermeture retenu par le serveur** (acceptation de la fermeture), **même si elle n’arrive en synchronisation qu’après** cette fermeture (collecte « en vol »).
2. Contrôles : cohérence de l’horloge déclarée (seuils §3.5.1, encore ouverts) ; instant de réception serveur conservé séparément (`sync_received_at`) ; date métier dérivée côté serveur et jamais remplacée par la date de synchronisation (§3.5.1 validé).
3. Si l’instant déclaré est **postérieur** à la fermeture → **rejet explicite** (motif structuré, ex. `COLLECTE_APRES_FERMETURE`) ; l’opération reste stockée côté mobile pour revue — jamais de suppression automatique (D-LOT-004).
4. Déclaration antérieure mais horloge jugée incohérente → signalement (clock skew) et file de revue, pas d’acceptation ni de rejet silencieux.
5. Sur un dossier réouvert, la fenêtre « fermeture → réouverture » exclut toute création : la règle se compose avec les transitions du point 3.

### Alternatives raisonnables

- **A) Coupure à la réception serveur** (arrivée ≤ fermeture) : simple et robuste contre la fraude d’horloge, mais rejette des collectes honnêtes créées hors ligne — perte d’activité réelle.
- **B) Tout accepter avec simple drapeau** : aucun rejet, mais une collecte postérieure devient possible en manipulant l’horloge et la fermeture perd sa force.
- **C) File de revue systématique pour tout arrivage tardif** : ni accepté ni rejeté, charge opérationnelle élevée.
- **D) Déclaration sous contrôle (proposition ci-dessus)** : hybride 1+C — accepte l’activité réelle sous seuils d’horloge, rejette explicitement le hors-période, route les cas douteux en revue.

### Conséquences métier

L’activité hors ligne n’est pas perdue ; la fermeture protège réellement contre les collectes postérieures ; les cas limites (« juste avant / juste après ») débattus partent en revue avec leur historique.

### Conséquences mobile

Aucune modification du comportement de collecte (l’instant déclaré est conservé tel quel) ; affichage clair d’un rejet motivé ; conservation du lot refusé ; tests d’acceptation (mirroir REÇUS §4 : « une collecte tardive conserve l’heure déclarée… »).

### Conséquences backend

Règle d’ordonnancement exécutée dans la transaction de synchronisation (règle A) ; comparaison d’instant + seuils d’horloge ; code de conflit distinct de l’idempotence de clé ; audit de la décision.

### Conséquences SQL et Prisma (conception ultérieure uniquement)

- `dossiers.closed_at TIMESTAMPTZ` (instant d’effet serveur) comme référence de comparaison.
- Le SQL v1.1 ne possède que `collected_at`, `sync_received_at`, `business_date` : l’écart déjà signalé par IMPACTS_SCHEMA_SQL.md §6 (pas de colonne distincte pour l’heure déclarée sur l’appareil) se rejoue ici — toute colonne supplémentaire sera additive et soumise à validation ; ne rien créer avant la phase autorisée.
- Contrôle `collected_at < dossiers.closed_at` en couche service (les triggers v1.1 montrent le patron utilisé pour `collections` et `remittance_items`).

### Risques et cas limites

Fraude par recul d’horloge (seuils + instant de réception serveur + éventuelles heuristiques, à définir) ; fermeture hors ligne dont l’acceptation serveur est tardive (fenêtre de « collectes en vol » large) ; comparaison DATE/INSTANT interdite (la fermeture est un instant, `business_date` se dérive à part, fuseau `Africa/Ndjamena`) ; midnight et frontière semi-ouverte (§3.5).

### Dépendances

Points 2 (définition de l’instant d’effet), 3 (fenêtres de transitions), §3.5 et §3.5.1 (horloges, date métier), D-LOT-003, tests d’acceptation REÇUS §4.

## 5. Champs obligatoires et numérotation des dossiers

### Décision proposée (À VALIDER)

**Champs obligatoires proposés (minimum métier) :**

- Technique : `id UUID` généré sur l’appareil (stable, jamais réutilisé), `client_operation_id` + clé d’idempotence, `device_id` — miroir `collections.client_operation_id` / `sync_events`.
- Métier : agence (`branch_id`), client (`client_id`), agent affecté (`agent_id`), **montant journalier BIGINT XAF > 0** (jamais de flottant), instant d’ouverture déclaré + date métier déclarée, état.
- De contrôle : créé par / horodatages, `version INTEGER CHECK (version > 0)` (motif `clients.version`) pour l’optimistic locking, éventuels champs de revue (motif de rejet si rejeté, façon `clients`).
- Les champs « contractuels » supplémentaires suggérés par la conception détaillée (fin de période, version des règles de tontine) restent **documentaires** : à confirmer avec le cahier de conception avant d’être traités comme obligatoires.

**Numérotation proposée (miroir du triptyque reçu, §3.3 / REÇUS §1) :**

1. **Identifiant technique** = UUID appareil (D-LOT-001) — jamais réattribué.
2. **Référence provisoire lisible** générée **localement**, liée à l’agence, stable, distincte de l’UUID (format **À VALIDER**, comme pour les reçus).
3. **Numéro officiel** attribué par le **serveur à l’acceptation** du dossier (cohérent avec « le serveur demeure l’autorité pour l’unicité et l’acceptation », D-LOT-001, et avec la règle G du SQL pour les reçus), **séquence atomique par agence**, non réattribuable ; format, séquence et gestion des numéros non utilisés **À VALIDER** (réutiliser l’analyse et les tests d’acceptation de REÇUS §1 et §4).
4. **Jamais de numérotation hors ligne** (collision : cf. risque `client_code` du §3.8).

### Alternatives raisonnables

- **A) Numéro attribué localement à la création** : collisions hors ligne, contredit l’autorité serveur (§3.8) — écartée.
- **B) Numéro attribué à la réception de la requête** (avant acceptation) : numéro perdu ou inutilisable en cas de rejet — incohérent avec le triptyque reçu.
- **C) Pas de numéro officiel, UUID seul** : impraticable au terrain (communication, contrôle papier).
- **D) Séquence unique multi-agences** : annule l’agrément et l’isolement d’agence — écartée sauf décision contraire explicite.

### Conséquences métier

Identité dossier stable pour l’agent et le client ; référence provisoire affichable avant synchronisation (même promesse d’UX que les reçus) ; trous de séquence acceptés et non comblés ; serveur seul décide de l’acceptation.

### Conséquences mobile

Écran dossier : référence provisoire immédiatement, numéro officiel après acceptation ; stockage conjoint des trois identifiants ; garde-fou d’unicité **locale** de confort seulement (jamais arbitre).

### Conséquences backend

Allocation atomique à l’acceptation (transaction/séquence par agence), mapping référence provisoire ↔ numéro officiel préservé (règle G), audit de l’attribution, isolement par agence (règle C).

### Conséquences SQL et Prisma (conception ultérieure uniquement)

- Table `dossiers` (à créer en phase autorisée) : `dossier_no VARCHAR(80) NOT NULL UNIQUE` **ou** unique par agence selon le format décidé (si le format incorpore le code agence, unicité `(branch_id, dossier_no)`), `local_ref VARCHAR` avec unicité par agence `(branch_id, local_ref)`, `client_operation_id`, `UNIQUE (branch_id?, client_operation_id)` selon le périmètre d’idempotence retenu (le SQL v1.1 utilise `UNIQUE (agent_id, client_operation_id)` sur `collections`), `version`, `CHECK (version > 0)`.
- Point d’attention documenté : le SQL v1.1 impose `client_receipt_no` **UNIQUE global** pour les reçus alors que REÇUS/IMPACTS signalent un périmètre agence souhaité — le choix pour les dossiers doit être **explicite** et non laissé par défaut.
- Prisma : miroir des contraintes ; les index partiels/flétris peuvent exiger du SQL migratoire dédié.

### Risques et cas limites

Référence provisoire locale faible (collision si format non validé) ; dossier rejeté puis corrigé → quel identifiant, quel numéro (parcours à définir) ; UUID exposé en API (confidentialité — question déjà ouverte en REÇUS §1) ; concurrence d’allocation multi-requêtes ; trous de séquence réclamés par la comptabilité (à documenter).

### Dépendances

Point 1 (moment d’acceptation et contrat de conflit), DECISIONS §3.3 et REÇUS_ET_DATE_METIER.md (patron d’allocation), §3.8 (`client_code`), IMPACTS_SCHEMA_SQL.md §3.1 (inventaire documentaire `tontine_accounts`).

## 6. Rapprochement des collectes historiques

### Décision proposée (À VALIDER) — rattachement explicite facultatif temporairement, résolution supervisée

1. Concilier deux principes déjà validés : « chaque collecte référence explicitement un seul dossier » (§3.1/IMPACTS) **et** « pas de rattachement arbitraire » (D-LOT-005) → prévoir un rattachement **explicite mais temporairement facultatif** : `dossier_id` NULL **uniquement accompagné** d’un état de rattachement explicite (vocabulaire à définir, ex. `NON_ÉTABLI`), interdisant le NULL « muet ».
2. Résolution : un rôle habilité **propose** un rattachement avec justification ; validation (même rôle ou superviseur — à arbitrer) ; audit complet ; **jamais** d’appariement heuristique automatique (D-LOT-005).
3. Hors résolution : les collectes non rattachées restent visibles dans les rapports d’agence mais sont **exclues des totaux par dossier** et signalées (pas de double compte, pas de total faux).
4. Seule écriture admissible sur un historique : renseigner le lien manquant via le parcours audité — aucun montant, statut ni instant n’est modifié.
5. Avant tout rattachement, stabiliser l’identité du client concerné (dépendance forte au §3.8 doublons) ; interdire le rattachement à un dossier d’un autre client ou d’une autre agence.

### Alternatives raisonnables

- **A) Dossier « héritage » synthétique par agence** : rapports complets immédiatement, mais totaux artificiels et dette de sens — inacceptable sans validation explicite de COOPECA.
- **B) NULL + état explicite + file de résolution (proposition ci-dessus)** : honnête, progressif, coûteux en charge de revue.
- **C) Appariement heuristique automatique** (nom, téléphone, dates) : **interdit** par D-LOT-005.
- **D) Exclure l’historique du modèle dossier** (archives en lecture seule hors relations) : simple, mais prive les rapports comparatifs dossiers.

### Conséquences métier

Les rapports « par dossier » restent incomplets tant que non résolus — visiblement, pas silencieusement ; charge de résolution à arbitrer (qui, combien, délai) ; l’incertitude est affichée comme telle.

### Conséquences mobile

Faible emprise a priori (l’historique pré-dossier vit côté serveur) ; si anciennes collectes locales non synchronisées : même état de rattachement ; écran de revue éventuel pour proposition de lien.

### Conséquences backend

Endpoints de proposition et de validation de rattachement (rôles + agence) ; audit systématique ; garde-fous : une collecte ne porte qu’un seul dossier, jamais d’effet transversal aux agences.

### Conséquences SQL et Prisma (conception ultérieure uniquement)

- `collections.dossier_id UUID NULL REFERENCES dossiers(id) ON DELETE RESTRICT` + contrôle de cohérence (NULL ↔ état `NON_ÉTABLI`), **sans** toucher à `client_id NOT NULL` ni au trigger `trg_collection_client_branch` du v1.1.
- Trigger/patron analogue à vérifier : collecte et dossier doivent appartenir au même client et à la même agence (le v1.1 montre le patron avec `check_collection_client_branch`).
- Prisma : relation optionnelle (`dossier?`) documentée, le nullable fait partie du modèle validé et non d’un oubli.
- Attention conceptuelle (déjà soulevée par IMPACTS) : le client d’une collecte « se déduit du dossier » — si `client_id` et `dossiers.client_id` diffèrent, le rattachement doit être refusé explicitement.

### Risques et cas limites

Client ayant changé d’agence ; dossier inexistant/interdit à suppression (ON DELETE RESTRICT) ; double rattachement (interdit par conception) ; collecte dont le client lui-même est ambigu (§3.8) ; historique antérieur à toute création de dossier (cas structurel, pas un incident).

### Dépendances

DECISIONS §3.8 (doublons client — première condition), point 5 (existence et numérotation du dossier), IMPACTS §3.1 et §3.2, D-LOT-005.

## 7. Proposition d’ensemble cohérente (sans valeur de validation)

Ordre d’arbitrage recommandé, du plus structurel au plus dérivé :

1. **Point 5 — champs et numérotation** : fonde la table et le triptyque d’identifiants.
2. **Point 3 — états, motifs, rôles** : fonde les colonnes d’état et les événements.
3. **Point 1 — concurrence** : contrainte d’unicité atomique + contrat de conflit (s’appuie sur 5 et 3).
4. **Point 2 — fermeture hors ligne** : autorité et deux temps (s’appuie sur 3 ; prépare 4).
5. **Point 4 — collectes en vol** : règle d’ordonnancement (s’appuie sur 2 et 3 + horloges §3.5).
6. **Point 6 — historique** : stratégie de rattachement (après stabilisation de l’identité client §3.8).

Socle transversal commun à toutes les propositions : idempotence par clé + `payload_hash` (patron `sync_events`), audit immuable (`audit_logs`), états métier / synchronisation / impression toujours distincts, serveur autorité, motifs avec longueur minimale (patron `closure_reopen_events`), guards JWT + rôle + agence (règle J), montants BIGINT XAF, instants et date métier séparés. Aucune de ces propositions ne devient applicable avant consignation comme **Validé** dans [DECISIONS_METIER.md](./DECISIONS_METIER.md).

# Partie C — Préparation de la phase suivante

## Tableau 1 — État historique des décisions (16/10/2026, supersédé en partie)

| # | Objet | Type dominant | Bloque le modèle de données ? | Dépend de | Ordre proposé |
| --- | --- | --- | --- | --- | --- |
| 5 | Champs obligatoires et numérotation des dossiers | **Métier** (périmètre d’unicité, moment d’attribution, champs requis) + technique (format/séquence) | **Oui — bloquant majeur** (définit la table et le triptyque d’identifiants) | 1, §3.3/REÇUS, §3.8 | 1 |
| 3 | Motif obligatoire, réouverture, transitions d’état | **Métier** (rôles, motif, réouverture) + technique (CHECK/events/enum) | **Oui** (colonnes d’état + table d’événements) | 2, §3.2 | 2 |
| 1 | Créations concurrentes et conflits | Métier (politique de conflit/résolution) + technique (index partiel, contrat de réponse) | **Oui** (contrainte d’unicité atomique + état de conflit) | 5, 3, §3.8 | 3 |
| 2 | Fermeture hors connexion et autorité | **Métier** (autorité, rôles) + technique (modèle deux temps) | Oui partiellement (`closed_at`, statut, événement) | 3, 4 | 4 |
| 4 | Collectes avant fermeture synchronisées après | **Métier** (règle d’activité) | Non structurellement (colonnes couvertes par 2+3+§3.5) | 2, 3, horloges | 5 |
| 6 | Rapprochement des collectes historiques | **Métier** (stratégie, rôles) + technique (nullable + état de lien) | **Oui** (nullabilité contrôlée de `collections.dossier_id`) | 5, §3.8 | 6 |

## Tableau 2 — Décisions métier vs choix techniques (instantané du 16/10/2026)

| Domaine | Décision métier (arbitrage humain requis) | Choix technique (après arbitrage, à concevoir) |
| --- | --- | --- |
| Ouverture | Un agent autorisé ouvre hors ligne ; serveur = autorité (déjà validé D-LOT-001) | UUID appareil, clé + `payload_hash`, transaction/verrou |
| Unicité | Un seul dossier ouvert par client et par agence ; successifs possibles (déjà validé D-LOT-002) | Index unique partiel `(branch_id, client_id) WHERE statut = OUVERT` ; portée SQL/Prisma |
| Conflits | Conflit explicite, jamais de purge auto (déjà validé D-LOT-004) ; **politique de résolution : à valider** (revue, rejet, succession) | Forme exacte de la réponse de conflit, codes, file de revue |
| Fermeture | **Autorité : à valider** (proposition : agent propose, serveur autorise ; superviseur pour la réouverture) ; motif obligatoire | Instant d’effet serveur, modèle deux temps, `dossier_state_events` |
| Transitions | États OUVERT/FERMÉ, motif obligatoire, réouverture SUPERVISOR : **à valider** | Vocabulaire (sans collision avec `closure_status`), CHECK, machine à états service |
| Collectes en vol | **Règle d’acceptation : à valider** (déclaration vs réception serveur) | Seuils d’horloge (§3.5.1), codes de rejet, tests d’acceptation |
| Numérotation | **Périmètre d’unicité et moment d’attribution : à valider** | Format/séquence, allocation atomique, gestion des trous |
| Historique | **Stratégie de rattachement : à valider** (héritage synthétique vs file) | Nullable contrôlé, trigger de cohérence client/agence, endpoints de revue |

## Tableau 3 — Contrôles d’étape (partie C)

| Exigence | Constat |
| --- | --- |
| SQL de référence v1.1 inchangé | ✅ aucun octet modifié (`docs/COOPECA_Backend_Schema_v1.1.sql` uniquement lu) |
| Aucune migration SQL ou Prisma créée/appliquée | ✅ `backend/prisma/` intact |
| Aucun `prisma db push` | ✅ non exécuté |
| Aucun module métier implémenté | ✅ squelettes `src/features` inchangés |
| Aucun état métier existant modifié | ✅ `DECISIONS_METIER.md` (registre) et `IMPACTS_SCHEMA_SQL.md` intouchés à cette étape |
| Modifications locales écrasées | ✅ aucune (renommage `AGENTS.md` de l’utilisateur préservé) |

## Ambiguïtés restantes (état historique au 16/10/2026)

1. **Glossaire des états (§3.2)** non tranché : tout vocabulaire d’état dossier (`OUVERT`/`FERMÉ`, état de conflit, état de revue) doit attendre l’harmonisation ; collision nominale possible avec `closure_status.REOPENED`.
2. **§3.8 — doublons client** non résolu : condition préalable aux points 1 et 6 (unicité et rattachement reposent sur une identité client stable).
3. **Instant d’effet de la fermeture** : déclaré (appareil) ou accepté (serveur) — la proposition retient le serveur, l’arbitrage n’est pas fait.
4. **Réouverture hors ligne** : proposée interdite, symétrie avec la fermeture à deux temps discutable.
5. **Périmètre d’unicité du numéro de dossier** (global comme `client_receipt_no` vs par agence) : écart connu avec les reçus, à trancher explicitement.
6. **Propriétaire d’une collecte (question historique, résolue le 19/10/2026)** : le registre §3.14 tranche que, pour toute nouvelle collecte, le client est dérivé du dossier ; le `client_id` du SQL v1.1 ne peut rester qu’un lien de compatibilité cohérent. Voir aussi `DECISIONS_METIER.md` et `IMPACTS_SCHEMA_SQL.md`.
7. **Audition des `.docx`** (Implementation Plan, TRD, App Flow) impossible en texte brut : d’éventuelles références à AGENT.md dans ces binaires restent non vérifiées.
8. **12 références obsolètes** à `AGENT.md` restent en place (voir rapport) — correction proposée, non appliquée.

## Prochaine action recommandée (état historique au 16/10/2026)

1. **Session d’arbitrage** sur les points **5 puis 3** (bloquants du modèle de données), en s’appuyant sur ce document ; consigner chaque décision comme **Validé/À VALIDER** dans `DECISIONS_METIER.md` §3.12/§4.
2. **Sous réserve de votre autorisation** : (a) appliquer la correction des 12 références `AGENT.md` → `AGENTS.md` (liste complète dans le rapport de l’étape) et (b) commetter ce fichier `PROPOSITIONS_DLOT.md` avec elle — **aucun commit n’a été fait à cette étape**.
3. Ensuite uniquement : revue de phase 2 du schéma (inventaire `dossiers` + impacts additifs), conformément à l’Implementation Plan — toujours sans migration ni `prisma db push` sans accord explicite.







