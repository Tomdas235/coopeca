# Décisions métier et techniques de référence

**Projet :** COOPECA

**Statut :** registre des décisions métier et techniques de cadrage. Les règles explicitement marquées **Validé** ci-dessous sont approuvées ; les propositions plus anciennes encore présentées comme base d’arbitrage et les détails **À VALIDER** ne le sont pas.

**Périmètre :** cadrage uniquement. Ce document ne modifie pas le schéma SQL et ne crée aucun module applicatif.

**Conception de la base :** [CONCEPTION_MODELE_DONNEES.md](./CONCEPTION_MODELE_DONNEES.md) est le brouillon de revue du modèle backend. Il ne vaut pas approbation de `schema.prisma`, du DDL ou d’une migration.

## 1. Références examinées

- [AGENT.md](../AGENT.md) — architecture et règles non négociables du dépôt.
- [COOPECA Implementation Plan v1.0](./COOPECA_Implementation_Plan_v1.0.docx).
- [COOPECA TRD Technique v1.0](./COOPECA_TRD_Technique_Reference_Document_v1.0.docx).
- [Cahier des charges technique](./Cahier_des_charges_Technique_COOPECA%20(1).docx).
- [Cahier de conception technique détaillée](./Cahier_de_Conception_Technique_Detaillee_COOPECA.docx).
- [App Flow v1.1](./COOPECA_App_Flow_Flux_Applicatif_v1.1.docx), y compris son annexe de décisions mises à jour.
- [Schéma backend v1.1](./COOPECA_Backend_Schema_v1.1.sql), référence technique existante qui n’est pas modifiée par ce document.

Les documents n’ont pas tous le même statut. Les règles de référence déjà établies dans `AGENT.md` restent applicables. Les décisions explicitement marquées **Validé** intègrent les arbitrages confirmés ; les autres propositions de cadrage antérieures restent une base d’arbitrage, sauf mention contraire. Une recommandation sur un point ouvert ne vaut pas approbation. Les divergences avec le schéma SQL devront être résolues avant de définir une évolution technique.

## 2. Règles de référence déjà établies

Les règles de cette section sont les références de cadrage du MVP.

1. **Architecture.** L’application Android utilise React Native, Expo et TypeScript. L’API utilise NestJS. La base centrale est PostgreSQL, accédée avec Prisma.
2. **Client créé hors ligne.** Un client créé sans connexion porte le statut `PROVISOIRE` jusqu’à son traitement côté serveur.
3. **Synchronisation.** La synchronisation doit être idempotente : répéter une requête pour la même opération ne crée aucun doublon financier. Une opération locale n’est pas automatiquement confirmée par son envoi.
4. **Remise et réception de caisse.** La déclaration de remise de l’agent n’est pas une remise confirmée par le caissier ; les deux confirmations doivent rester distinctes.
5. **Clôture journalière.** Chaque agent doit soumettre sa clôture chaque jour, même hors ligne.
6. **Réouverture de clôture.** La réouverture est réservée à un superviseur autorisé, avec motif et journal d’audit.
7. **Montants.** Les montants financiers sont des nombres entiers en XAF ; aucun montant ni calcul financier n’utilise de nombre flottant.
8. **Multi-agences.** Les autorisations d’accès aux agences sont contrôlées côté serveur pour chaque requête. L’agence fournie par un client ne constitue jamais une preuve d’autorisation.

## 3. Principes arbitrés et décisions validées

Cette section rassemble les principes précédemment soumis à arbitrage et les précisions désormais approuvées. Les lignes **Validé** sont des décisions ; les autres principes restent une base de cadrage et **À VALIDER** désigne un détail métier ou technique qui n’est pas tranché. Les impacts techniques décrivent le travail futur à examiner ; ils n’autorisent ni modification SQL, ni choix de bibliothèque, ni implémentation.

### 3.1 Dossier de tontine distinct du client

- **Validé :** un client peut posséder plusieurs dossiers ; le dossier est distinct du client et chaque collecte référence explicitement un seul dossier concerné.
- **À VALIDER :** champs définitifs, cycle de vie, règles d’affectation à un agent, unicité de référence et traitement des collectes historiques ambiguës.
- **Complément (voir §3.12) :** les décisions **D-LOT-001 à D-LOT-005** précisent désormais la création hors ligne, l’unicité du dossier ouvert par client et par agence, la fermeture, les conflits explicites et le rattachement des collectes ; les points qu’ils ne tranchent pas restent ouverts ci-dessus. **Les six arbitrages correspondants ont été validés le 16/10/2026 : voir §3.13.**
- **Impact documentaire :** intégrer ce modèle dans les références de données et d’API, en signalant l’écart au SQL v1.1.
- **Impact technique futur :** concevoir les relations, contraintes d’agence, stratégie de compatibilité et migration additive après inventaire. Aucun schéma ou migration n’est créé ici.

### 3.2 États exacts des collectes, remises et clôtures

- **Validé :** distinguer l’état de synchronisation, l’état métier de la collecte et l’état de remise. Une collecte synchronisée n’est pas automatiquement une remise reçue par la caisse.
- **Validé :** l’état d’impression est également distinct des états de synchronisation et métier. Une réimpression porte sur le même reçu et la même collecte ; elle ne crée pas d’opération.
- **États connus dans les documents :** les états locaux comprennent `PENDING_SYNC`, `SYNCED` et un état de revue/conflit nommé `REJECTED_REVIEW` ou `REQUIRES_REVIEW` selon le document. Le SQL définit `collection_status` (`RECORDED`, `REVERSED`), `remittance_status` (`DRAFT`, `SUBMITTED`, `RECEIVED`, `PARTIAL`, `DISPUTED`, `CANCELLED`), `closure_status` (`DRAFT`, `SUBMITTED`, `REVIEWED`, `REOPENED`) et `sync_status` (`RECEIVED`, `APPLIED`, `REJECTED`). La conception emploie aussi `CONFIRMED`, `VALIDATED` et `CLOSED`.
- **À VALIDER :** correspondance des vocabulaires, transitions permises, autorisations, confirmation métier après synchronisation, traitement des rejets et règles d’annulation/révocation, ainsi que les états d’impression à exposer. Les noms cités sont des états déjà documentés, pas une proposition de nouvel enum définitif.
- **Impact documentaire :** maintenir les états de transport distincts des états métier et harmoniser glossaire, flux, API et critères d’acceptation après arbitrage.
- **Impact technique futur :** examiner les enums SQL existants, le stockage de l’état local et les transitions transactionnelles/audit. Ne créer aucun enum ni transition avant validation.

### 3.3 Référence locale du reçu et numéro officiel

- **Validé — référence provisoire :** une référence lisible liée à l’agence, stable et unique. Elle est distincte de l’identifiant technique complet de l’opération. Le format exact reste **À VALIDER**.
- **Validé — numéro officiel :** attribué par le serveur à l’acceptation, dans le périmètre de numérotation de l’agence. L’unicité et l’allocation atomique doivent être garanties. Le format et la séquence restent **À VALIDER**.
- **Validé — reçu hors ligne :** la collecte porte la mention **« EN ATTENTE DE SYNCHRONISATION »**. Après synchronisation acceptée, les futurs exemplaires affichent la référence provisoire et le numéro officiel.
- **Validé — idempotence et impression :** une nouvelle tentative reprend le même identifiant technique et la même clé d’idempotence ; la même clé avec un contenu différent constitue un conflit, pas un succès équivalent. Une réimpression ne crée jamais une nouvelle collecte.
- **Validé — rejet définitif :** conserver le reçu et l’opération, afficher le motif du rejet et empêcher les répétitions automatiques. Le parcours de résolution doit être explicite.
- **À VALIDER :** formats exacts, composants et périmètre d’unicité de l’identifiant technique, mentions légales, contenu et valeur probante du reçu, distinction visuelle après rejet, ainsi que le parcours précis de résolution (rôles, correction, éventuelle nouvelle opération et audit).
- **Impact documentaire :** distinguer systématiquement référence locale provisoire et numéro officiel dans les reçus, flux et exemples API.
- **Impact technique futur :** comparer sans présélectionner les options d’allocation qui respectent `collections.client_receipt_no NOT NULL UNIQUE`, le périmètre agence, l’idempotence et l’historique. Le schéma SQL ne définit pas le moment d’allocation ni la correspondance avec la référence provisoire. Voir [REÇUS_ET_DATE_METIER.md](./REÇUS_ET_DATE_METIER.md) et [IMPACTS_SCHEMA_SQL.md](./IMPACTS_SCHEMA_SQL.md).
- Les règles détaillées et les questions de date associées figurent dans [REÇUS_ET_DATE_METIER.md](./REÇUS_ET_DATE_METIER.md).

### 3.4 Chiffrement de la base locale mobile

- **Principe retenu :** le chiffrement des données locales est une exigence cible.
- **À VALIDER :** bibliothèque, compatibilité React Native/Expo/Android, protection et cycle de vie des clés, sauvegardes et récupération des opérations. Aucune bibliothèque n’est sélectionnée.
- **Impact documentaire :** expliciter cette exigence dans le TRD et la définition du prototype de cadrage.
- **Impact technique futur :** évaluer les solutions et réaliser une preuve de concept sur appareils cibles avant choix de dépendance ou d’architecture locale.

### 3.5 Date métier et fuseau horaire

- **Validé :** fuseau `Africa/Ndjamena` et journée civile représentée par l’intervalle **[début du jour, début du jour suivant)**. Les instants techniques restent conservés comme des instants ; aucun calendrier spécial n’est introduit.
- **À VALIDER :** source temporelle exacte et règle complète de dérivation de la date métier en cas d’horloge incohérente, ainsi que son application aux corrections supervisées.
- **Impact documentaire :** employer le fuseau et le principe de journée civile de manière cohérente dans les règles de reçus, clôtures, rapports et API.
- **Impact technique futur :** calculer la date métier de façon déterministe côté serveur selon la source temporelle qui sera validée, sans utiliser automatiquement la date de synchronisation ; préserver l’heure déclarée et l’instant de réception séparément.

### 3.5.1 Collectes hors ligne tardives et horloges

- **Validé :** conserver l’heure déclarée d’origine et l’instant de réception serveur séparément ; ne pas remplacer automatiquement la date métier par la date de synchronisation. Signaler une horloge incohérente et conserver les éléments utiles à son examen.
- **À VALIDER :** seuils d’incohérence, éléments précis à conserver, destinataires du signalement et processus/habilitations de correction supervisée avec motif et audit.
- **Impact documentaire :** décrire séparément collecte déclarée, réception serveur, date métier et correction dans les flux et rapports.
- **Impact technique futur :** préserver les valeurs originales, dériver la date métier côté serveur et tracer toute correction sans écraser la déclaration d’origine.

### 3.6 Session hors ligne et appareils

- **Principe retenu :** session hors ligne limitée, verrouillage après inactivité et révocation appliquée au prochain contact avec le serveur. L’expiration ne supprime pas les opérations en attente ; leur conservation est sécurisée.
- **À VALIDER :** durées, mécanisme local de verrouillage/réauthentification, portée de la révocation, gestion d’un appareil perdu et récupération des opérations.
- **Impact documentaire :** décrire distinctement verrouillage local, expiration de session et rejet serveur après révocation.
- **Impact technique futur :** concevoir la persistance protégée de la file et la révocation effective à la prochaine requête, sans supprimer une opération locale à la fermeture de session.

### 3.7 Remises, caisse et écarts

- **Principe retenu :** la déclaration agent et la réception caisse restent distinctes. Une remise peut sélectionner plusieurs collectes entières ; aucune collecte n’est fractionnée entre remises. Les écarts sont documentés avec montant, motif, auteur et validation selon habilitations ; aucune correction silencieuse.
- **À VALIDER :** rôles, seuils et pouvoirs d’approbation, transitions de résolution et réaffectation après annulation d’une remise.
- **Impact documentaire :** préciser que « remise partielle » signifie sélection d’un sous-ensemble de collectes entières, et harmoniser le parcours agent/caissier et le traitement d’écart.
- **Impact technique futur :** préserver et évaluer la contrainte d’unicité de `remittance_items.collection_id` ; concevoir la traçabilité de la déclaration, réception et résolution d’écart. Le modèle exact (entités, événements ou transitions) reste à valider.

### 3.8 Règles de création client et de traitement des doublons

- **Validé le 19/10/2026 — détection :** une correspondance du téléphone normalisé et du nom/prénom dans une même agence déclenche un signal de revue seulement ; elle ne bloque pas automatiquement la création et ne fusionne jamais automatiquement les fiches.
- **Validé le 19/10/2026 — résolution :** un superviseur habilité peut décider une fusion après revue. Les identifiants et les liens financiers historiques restent ceux d’origine ; la fiche source est conservée comme alias du client survivant. La décision et la relation d’alias sont auditées. Aucune collecte, aucun montant, statut ou horodatage n’est réécrit par la fusion.
- **À VALIDER :** champs obligatoires, règles de normalisation du téléphone et du nom, attribution hors ligne et unicité de `client_code`, agence compétente pour arbitrer les fiches multi-agences, dé-fusion/correction d’une fusion erronée et visibilité de l’alias dans les rapports.
- **Impact technique futur :** concevoir un signal de revue et une relation d’alias avec garde-fous d’agence et audit. Le SQL v1.1 ne définit pas ces éléments ; aucune colonne ou migration n’est autorisée par cette décision seule.

### 3.9 Interface Web

- **Ce que disent les documents :** le TRD met le choix Web dans un lot séparé ; le cahier des charges suggère React/Vue ou équivalent. Les fonctions prévues comprennent supervision, caissiers, administration, rapports et audit.
- **Risque :** choisir le framework ou découper les parcours trop tôt peut multiplier les outils, alors que les rôles, validations et priorités Web ne sont pas encore figés.
- **Option recommandée — À VALIDER :** garder le Web comme application séparée consommant les contrats REST de l’API ; choisir son framework après cadrage des parcours et compétences de maintenance. React avec TypeScript est une option cohérente avec la pile retenue, mais n’est pas une décision déjà approuvée.

### 3.10 Matériel, reçu et exigences opérationnelles

- **Ce que disent les documents :** le TRD et l’Implementation Plan proposent l’imprimante HPRT HM-E200, Bluetooth ESC/POS, papier 58 mm ; le cahier des charges demande un essai réel et une solution de repli. La version Android minimale, le format légal du reçu, le QR code et la bibliothèque d’impression restent à confirmer. Le cahier des charges propose aussi des objectifs de disponibilité, RPO/RTO et performance à approuver.
- **Risque :** une incompatibilité réelle du matériel ou des objectifs opérationnels non financés peut bloquer le pilote ou rendre les promesses de disponibilité et de restauration irréalistes.
- **Option recommandée — À VALIDER :** réaliser une preuve de concept sur les téléphones et l’imprimante exacte avant achat en volume ; prévoir un reçu numérique et une solution d’impression de repli ; faire approuver les mentions officielles, la version Android minimale, les objectifs de performance, le RPO/RTO et la politique de sauvegarde avant la recette.

### 3.11 Conservation, protection des données et conformité

- **Ce que disent les documents :** ils préconisent minimisation des données, sauvegardes chiffrées, accès restreint et revue de conformité applicable au Tchad et à la zone CEMAC/COBAC. La durée de conservation, les accès aux exports et les obligations applicables ne sont pas fixés.
- **Risque :** conserver trop longtemps des données personnelles ou des journaux, ou exporter des données sans contrôle, peut créer un risque juridique et opérationnel.
- **Option recommandée — À VALIDER :** faire valider par COOPECA et ses conseils compétents les durées de conservation, droits d’accès, modalités d’export, suppression/archivage et exigences réglementaires avant la production. Ne pas traiter les propositions techniques des documents comme une validation juridique.

### 3.12 Dossiers de tontine — décisions D-LOT-001 à D-LOT-005

**Statut : choix de principe retenus ; détails techniques à valider.** Ces décisions complètent §3.1 sans la remplacer.

- **Validé — D-LOT-001 Création :** un agent autorisé peut créer un dossier de tontine hors connexion. Le dossier reçoit un identifiant technique stable sur le mobile. Sa création reste en attente jusqu’à son traitement par le serveur. La synchronisation doit être idempotente. Le serveur demeure l’autorité pour l’unicité et l’acceptation du dossier.
- **Validé — D-LOT-002 Unicité :** un client ne peut avoir qu’un seul dossier ouvert par agence. Un client peut avoir plusieurs dossiers successifs dans une même agence, à condition qu’un seul soit ouvert à un instant donné. La règle est indépendante entre agences, sous réserve des autorisations d’accès et des règles de rattachement du client. La base serveur doit garantir cette unicité de façon atomique.
- **Validé — D-LOT-003 Fermeture :** la fermeture d’un dossier interdit toute nouvelle collecte sur ce dossier. Les données historiques restent consultables selon les droits d’accès. Les corrections sont soumises à autorisation et doivent être auditées. Aucune opération historique ne doit être effacée ou modifiée silencieusement.
- **Validé — D-LOT-004 Synchronisation et conflits :** les états métier et les états de synchronisation sont distincts. Une création concurrente incompatible avec l’unicité est traitée comme un conflit explicite ; aucune seconde ouverture ne doit être acceptée. Les opérations locales en attente ne doivent pas être supprimées automatiquement à la suite d’un conflit ou d’un rejet.
- **Validé — D-LOT-005 Historique :** chaque nouvelle collecte doit être associée à un dossier précis. Les collectes historiques ne sont pas rattachées arbitrairement à un dossier lorsque leur rattachement ne peut être établi.
- **À VALIDER (points ouverts associés) :** traitement des créations concurrentes et résolution des conflits ; possibilité et autorité de fermeture hors connexion ; motif obligatoire, réouverture et transitions d’état ; traitement des collectes créées avant la fermeture et synchronisées après ; champs obligatoires et numérotation des dossiers ; stratégie de rapprochement des collectes historiques. → **Arbitrés le 16/10/2026 (Validé) : voir §3.13** ; la liste est conservée ici pour l’historique et les détails ouverts par la source restent recensés en §3.13.
- **Impact technique futur :** la garantie atomique d’unicité du dossier ouvert (D-LOT-002), les conflits explicites de création et la fermeture sans effacement d’historique devront être exprimés par des contraintes et transitions lors de la conception du modèle. Aucune table, contrainte, `schema.prisma`, migration ni implémentation n’est autorisé à ce stade ; le SQL v1.1 n’est pas modifié.

### 3.13 Dossiers de tontine — arbitrages des six points ouverts (suite de §3.12)

**Statut : Validé le 16/10/2026.** Arbitrage explicite portant sur les six propositions de [PROPOSITIONS_DLOT.md](./PROPOSITIONS_DLOT.md) (document de cadrage établi à partir de D-LOT-001 à D-LOT-005, initialement marqué non validé). La validation explicite a été donnée au cours de l’étape d’intégration. Aucun nouvel identifiant D-LOT n’est créé : les lignes ci-dessous répondent, dans leur ordre, aux six points ouverts listés en §3.12 et §4. Les détails que la source marquait elle-même « À VALIDER » restent ouverts et sont rappelés ici.

- **Validé — point 1, créations concurrentes et conflits :** conflit explicite en cas de seconde ouverture incompatible (aucune acceptation silencieuse, aucune purge automatique — D-LOT-004) ; identifiant appareil + clé d’idempotence avec `device_id` ; dossier en conflit conservé et routé vers une revue humaine (annulation motivée et auditée, ou succession après fermeture du dossier gagnant) ; garantie d’unicité atomique côté serveur. *Reste à préciser : contrat exact du conflit (codes et format de réponse), parcours de la file de revue, vocabulaire d’état (§3.2).*
- **Validé — point 2, fermeture hors connexion et autorité :** modèle en deux temps — déclaration locale avec garde-fou sur l’appareil déclarant (état de fermeture en attente, distinct des états de synchronisation) ; effet autorisé seulement à l’acceptation serveur (rôle, agence, motif, idempotence, audit) ; rejet serveur = retour à l’état OUVERT sans suppression ; un agent habilité de l’agence peut proposer la fermeture, la réouverture reste réservée au superviseur ; la propagation aux autres appareils est différée à la synchronisation suivante (limitation affichée). *Reste à préciser : forme du rejet motivé et contrat associé.*
- **Validé — point 3, motif, réouverture et transitions d’état :** états **OUVERT** et **FERMÉ** uniquement, aucun état destructif ; motif obligatoire à la fermeture et à la réouverture (longueur minimale à confirmer, patron `closure_reopen_events`) ; réouverture SUPERVISOR produisant un événement immuable et un audit dans une transaction (patron de la règle D du SQL v1.1) ; toute autre transition est rejetée et journalisée. *Restent ouverts : autorisation éventuelle de réouverture hors ligne (débattue dans la source), vocabulaire final des états (§3.2, collision nominale avec `closure_status.REOPENED`).*
- **Validé — point 4, collectes créées avant fermeture mais synchronisées après :** acceptation si l’instant déclaré sur l’appareil est antérieur à l’instant d’effet serveur de la fermeture, même si la collecte arrive en synchronisation après ; sinon rejet explicite (motif structuré) avec conservation locale et revue — jamais de suppression ; une horloge jugée incohérente déclenche signalement et revue, sans décision silencieuse ; sur un dossier réouvert, la fenêtre fermeture → réouverture exclut toute création. *Restent ouverts : seuils d’horloge (§3.5.1), codes de rejet exacts.*
- **Validé — point 5, champs obligatoires et numérotation :** champs minimaux — UUID appareil, clé d’idempotence et appareil, agence, client, agent affecté, montant journalier **entier XAF**, instant et date d’ouverture déclarés, état, version ; triptyque d’identifiants miroir des reçus : identifiant technique (UUID) + référence provisoire locale liée à l’agence + numéro officiel attribué par le **serveur à l’acceptation** avec séquence atomique par agence ; jamais de numérotation hors ligne. *Restent ouverts : format et séquence exacts du numéro, éventuels champs contractuels additionnels (cahier de conception), correspondance définitive du périmètre d’unicité avec le format retenu.*
- **Validé — point 6, rapprochement des collectes historiques :** rattachement explicite mais temporairement facultatif — `dossier_id` NULL uniquement accompagné d’un état de rattachement explicite (jamais de NULL muet) ; résolution proposée puis validée, tracée en audit ; aucun appariement heuristique automatique (D-LOT-005) ; collectes non rattachées visibles dans les rapports d’agence mais exclues des totaux par dossier ; seule écriture admissible sur l’historique = renseigner le lien (aucun montant, statut ni instant modifié) ; rattachement interdit vers un dossier d’un autre client ou d’une autre agence ; stabilisation préalable de l’identité client (§3.8). *Restent à préciser : rôles proposant et validant le rattachement.*
- **Impact technique futur :** ces arbitrages n’autorisent toujours ni table, ni contrainte, ni `schema.prisma`, ni migration, ni `prisma db push` ; la conception reste subordonnée à la revue de phase 2. Le SQL v1.1 n’est pas modifié.
- **Cohérence :** complète §3.1 et §3.12 sans les remplacer ; les listes historiques « À VALIDER » de §3.12 et §4 sont conservées et renseignées par renvoi vers la présente section.

### 3.14 Arbitrages transversaux pour la conception du backend

**Statut : Validé le 19/10/2026.** Cette section consigne les arbitrages exprimés pour préparer un modèle backend cohérent. Elle complète les principes existants sans modifier le SQL v1.1 et sans autoriser une migration.

- **Validé — collecte et dossier :** toute nouvelle collecte doit référencer un dossier précis ; l’identité du client est déterminée par le dossier, et non par un `client_id` indépendant fourni dans la collecte. L’historique déjà présent reste traité séparément selon §3.13 point 6. Si une représentation SQL conserve également `client_id` pour compatibilité, sa cohérence avec le dossier doit être garantie et ne devient pas une deuxième source de vérité.
- **Validé — numéro officiel du reçu :** l’acceptation de la collecte, l’allocation du numéro officiel et sa persistance sont atomiques côté serveur. Les reprises idempotentes retournent le résultat et le numéro déjà attribués. La référence provisoire locale reste distincte. Le mécanisme doit respecter l’unicité par agence et être compatible avec les données et consommateurs historiques ; le traitement de l’actuel `client_receipt_no UNIQUE` global reste à concevoir dans la revue de schéma.
- **Validé — permissions de base :** AGENT réalise les opérations courantes autorisées sur ses clients/dossiers, collecte, déclaration de remise et clôture ; CASHIER confirme la réception des remises et constate les écarts ; SUPERVISOR traite les conflits/fusions habilités, valide la résolution des écarts et rouvre les clôtures ; ACCOUNTANT consulte et rapproche sans modifier directement les opérations ; ADMIN administre comptes, rôles et paramètres ; AUDITOR est en lecture seule. Tous les accès restent limités aux agences explicitement attribuées, sauf autorisation multi-agence explicite. Cette matrice est une base normative ; les exceptions fines restent à spécifier.
- **Validé — remise déclarée :** une déclaration synchronisée ne peut plus être modifiée directement. Une erreur après synchronisation passe par une annulation motivée et auditée ou une opération compensatrice explicitement autorisée ; elle ne modifie pas l’historique financier. Les règles de réaffectation des collectes après annulation restent ouvertes. Avant synchronisation, une correction locale est possible si elle conserve l’identité idempotente appropriée et n’a pas encore été soumise.
- **Validé — écarts de caisse :** le caissier constate et documente l’écart ; un superviseur autorisé en valide la résolution avec motif et audit. Les champs, transitions détaillées et seuils restent à préciser.
- **Validé — clôture hors ligne :** l’agent doit pouvoir enregistrer/déclarer sa clôture localement même sans réseau. Cette déclaration locale ne vaut pas rapprochement serveur. Le serveur ne confirme pas un total incomplet : si des opérations sont encore en attente, la clôture reste à rapprocher après synchronisation, avec les éléments manquants visibles. Les règles exactes de calcul et de statut serveur restent à concevoir sans inventer d’enum.
- **Validé — réouverture d’un dossier :** requiert une décision serveur ; aucun effet métier local hors ligne n’est accordé avant acceptation. Cela ne modifie pas la fermeture à deux temps validée en §3.13.
- **Validé — horloge incohérente :** une collecte dont l’horloge est jugée incohérente n’est pas acceptée automatiquement ; elle est conservée pour revue humaine, avec l’heure déclarée et l’instant de réception serveur distincts. Les seuils et la procédure de revue/correction restent à valider.
- **À VALIDER :** méthode de calcul du total de clôture, traitement détaillé des opérations pendantes, seuils d’horloge, permissions fines et délégations, motif minimal des actions de dossiers/remises, codes de conflit/rejet, résolution et réaffectation après annulation.
- **Impact technique futur :** matrice des guards et permissions, transactions idempotentes, audit et contraintes doivent être conçus à partir de ces règles ; aucune implémentation, modification SQL ou migration n’est autorisée implicitement.

## 4. Autres décisions encore ouvertes

- **À VALIDER :** champs obligatoires et unicité de référence des dossiers, règles de création/doublons client, événements de collecte sur dossier inactif et données historiques ambiguës. *(Champs obligatoires et numérotation des dossiers arbitrés le 16/10/2026 — §3.13 ; format/séquence et unicité de référence exactes restent ouverts. Le reste de la ligne demeure ouvert.)*
- **À VALIDER (suite D-LOT — §3.12) :** traitement des créations concurrentes et résolution des conflits ; possibilité et autorité de fermeture hors connexion ; motif obligatoire, réouverture et transitions d’état ; traitement des collectes créées avant la fermeture et synchronisées après ; champs obligatoires et numérotation des dossiers ; stratégie de rapprochement des collectes historiques. → **Arbitrés le 16/10/2026 (Validé, §3.13)** — ligne conservée pour l’historique.
- **À VALIDER :** transitions et permissions exactes des collectes, remises, clôtures, annulations et réouvertures ; les noms d’états connus ne fixent pas de nouveaux enums. Définir aussi les états d’impression sans les confondre avec les états métier ou de synchronisation.
- **À VALIDER :** formats exacts de la référence provisoire lisible, de l’identifiant technique et du numéro officiel ; séquence d’allocation, mentions légales et parcours de résolution d’un rejet définitif.
- **À VALIDER :** seuils et éléments de détection d’horloge incohérente, date métier à appliquer après correction et procédure exacte de correction supervisée.
- **À VALIDER :** bibliothèque/stratégie de chiffrement, gestion des clés, durée de session, verrouillage et procédure de récupération d’un appareil perdu.
- **À VALIDER :** rôles de réception et validation de caisse, seuils d’approbation, états des écarts et possibilité de réaffecter une collecte après annulation d’une remise.
- **À VALIDER :** framework Web, appareils Android, imprimante, RPO/RTO, disponibilité, conservation et conformité réglementaire.
- **Décisions du 19/10/2026 consignées en §3.8 et §3.14 :** détection et fusion contrôlée des doublons, collecte liée obligatoirement au dossier, allocation atomique du numéro officiel, matrice de base des rôles, clôture locale hors ligne avec rapprochement différé, traitement des remises/écarts et revue des horloges incohérentes. Les détails explicitement listés dans ces sections restent ouverts ; ne pas les réintroduire comme décisions entièrement non arbitrées.

## 5. Cohérence avec les références existantes

- **[AGENT.md](../AGENT.md) :** cohérent avec la stack et les règles de montants, d’idempotence, de statut provisoire, de confirmation de remise, de clôture et de droits multi-agences. Il ne détaille pas les décisions nouvelles sur dossier, reçus, date métier, chiffrement ou session.
- **[Implementation Plan v1.0](./COOPECA_Implementation_Plan_v1.0.docx) :** confirme la stack et prévoit la revue du schéma en phase 2. Il n’énonce pas les choix détaillés de dossier et de date civile retenus ici ; ils devront être pris en compte dans les livrables de cette phase.
- **[TRD v1.0](./COOPECA_TRD_Technique_Reference_Document_v1.0.docx) :** cohérent sur la stack, l’idempotence, l’offline-first et les reçus provisoires. Il cite `Africa/Ndjamena` dans un exemple, mais la règle de journée civile et l’organisation distincte des états ne sont pas spécifiées au même niveau.
- **[App Flow v1.1](./COOPECA_App_Flow_Flux_Applicatif_v1.1.docx) :** son annexe met à jour les parcours client provisoire, remise par collectes sélectionnées et clôture hors ligne. Elle reste à harmoniser avec le modèle de dossier, les trois couches d’état et la politique de session/chiffrement.
- **[Schéma SQL v1.1](./COOPECA_Backend_Schema_v1.1.sql) :** n’inclut pas de table dossier ; impose `client_receipt_no` dès l’insertion avec unicité globale, sans spécifier son allocation serveur à l’acceptation dans le périmètre agence ; n’a pas de champ explicite de date/heure déclarée sur l’appareil distinct de l’instant `TIMESTAMPTZ` ; et ses enums ne représentent pas les trois axes d’état (synchronisation, métier, impression). `remittances` porte déclaration et réception sur une même ligne avec des champs/états, alors que le principe retenu distingue les confirmations agent et caisse. Ces écarts sont détaillés dans [IMPACTS_SCHEMA_SQL.md](./IMPACTS_SCHEMA_SQL.md) et [REÇUS_ET_DATE_METIER.md](./REÇUS_ET_DATE_METIER.md).

Aucun des constats ci-dessus ne modifie les documents d’origine. Les décisions explicitement validées sont consignées comme telles ; les autres points restent ouverts. Ce document n’autorise pas à modifier le SQL, créer `schema.prisma`, lancer une migration ou commencer l’implémentation.
