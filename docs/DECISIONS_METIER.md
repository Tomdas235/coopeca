# Décisions métier et techniques de référence

**Projet :** COOPECA

**Statut :** base d’arbitrage métier retenue pour validation finale. Les principes ci-dessous ne valent pas validation finale ; les détails marqués **À VALIDER** restent ouverts.

**Périmètre :** cadrage uniquement. Ce document ne modifie pas le schéma SQL et ne crée aucun module applicatif.

## 1. Références examinées

- [AGENT.md](../AGENT.md) — architecture et règles non négociables du dépôt.
- [COOPECA Implementation Plan v1.0](./COOPECA_Implementation_Plan_v1.0.docx).
- [COOPECA TRD Technique v1.0](./COOPECA_TRD_Technique_Reference_Document_v1.0.docx).
- [Cahier des charges technique](./Cahier_des_charges_Technique_COOPECA%20(1).docx).
- [Cahier de conception technique détaillée](./Cahier_de_Conception_Technique_Detaillee_COOPECA.docx).
- [App Flow v1.1](./COOPECA_App_Flow_Flux_Applicatif_v1.1.docx), y compris son annexe de décisions mises à jour.
- [Schéma backend v1.1](./COOPECA_Backend_Schema_v1.1.sql), référence technique existante qui n’est pas modifiée par ce document.

Les documents n’ont pas tous le même statut. Les huit principes détaillés dans la section 3 sont la base d’arbitrage retenue pour validation finale et ne sont pas présentés comme des décisions métier définitivement approuvées. Les règles déjà non négociables dans `AGENT.md` demeurent la référence de cadrage. Une recommandation sur un point ouvert ne vaut pas approbation. Les divergences avec le schéma SQL devront être résolues avant de définir une évolution technique.

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

## 3. Base d’arbitrage retenue pour validation finale

Les huit arbitrages demandés ci-dessous sont retenus comme base d’arbitrage pour validation finale. **À VALIDER** désigne un détail métier ou technique qui n’est pas tranché. Les impacts techniques décrivent le travail futur à examiner ; ils n’autorisent ni modification SQL, ni choix de bibliothèque, ni implémentation.

### 3.1 Dossier de tontine distinct du client

- **Principe retenu :** un client peut posséder plusieurs dossiers ; le dossier est distinct du client et chaque collecte référence explicitement le dossier concerné.
- **À VALIDER :** champs définitifs, cycle de vie, règles d’affectation à un agent, unicité de référence et traitement des collectes historiques ambiguës.
- **Impact documentaire :** intégrer ce modèle dans les références de données et d’API, en signalant l’écart au SQL v1.1.
- **Impact technique futur :** concevoir les relations, contraintes d’agence, stratégie de compatibilité et migration additive après inventaire. Aucun schéma ou migration n’est créé ici.

### 3.2 États exacts des collectes, remises et clôtures

- **Principe retenu :** distinguer l’état de synchronisation, l’état métier de la collecte et l’état de remise. Une collecte synchronisée n’est pas automatiquement une remise reçue par la caisse.
- **États connus dans les documents :** les états locaux comprennent `PENDING_SYNC`, `SYNCED` et un état de revue/conflit nommé `REJECTED_REVIEW` ou `REQUIRES_REVIEW` selon le document. Le SQL définit `collection_status` (`RECORDED`, `REVERSED`), `remittance_status` (`DRAFT`, `SUBMITTED`, `RECEIVED`, `PARTIAL`, `DISPUTED`, `CANCELLED`), `closure_status` (`DRAFT`, `SUBMITTED`, `REVIEWED`, `REOPENED`) et `sync_status` (`RECEIVED`, `APPLIED`, `REJECTED`). La conception emploie aussi `CONFIRMED`, `VALIDATED` et `CLOSED`.
- **À VALIDER :** correspondance des vocabulaires, transitions permises, autorisations, confirmation métier après synchronisation, traitement des rejets et règles d’annulation/révocation. Les noms cités sont des états déjà documentés, pas une proposition de nouvel enum définitif.
- **Impact documentaire :** maintenir les états de transport distincts des états métier et harmoniser glossaire, flux, API et critères d’acceptation après arbitrage.
- **Impact technique futur :** examiner les enums SQL existants, le stockage de l’état local et les transitions transactionnelles/audit. Ne créer aucun enum ni transition avant validation.

### 3.3 Référence locale du reçu et numéro officiel

- **Principe retenu :** une collecte hors ligne reçoit une référence provisoire locale stable et unique, et porte la mention **« EN ATTENTE DE SYNCHRONISATION »**. Après acceptation par le serveur, celui-ci attribue le numéro officiel et conserve la correspondance. Une tentative répétée reprend le même identifiant et la même clé d’idempotence ; une réimpression ne crée pas d’opération.
- **À VALIDER :** formats lisibles, mentions légales, contenu du reçu, statut du reçu papier avant synchronisation et traitement d’un rejet définitif.
- **Impact documentaire :** distinguer systématiquement référence locale provisoire et numéro officiel dans les reçus, flux et exemples API.
- **Impact technique futur :** vérifier les champs et contraintes d’unicité, l’attribution serveur atomique avant insertion et la réponse idempotente. Le SQL actuel exige `client_receipt_no` dès l’insertion ; le mécanisme d’allocation au moment de la synchronisation n’y est pas spécifié. Voir [REÇUS_ET_DATE_METIER.md](./REÇUS_ET_DATE_METIER.md).
- Les règles détaillées et les questions de date associées figurent dans [REÇUS_ET_DATE_METIER.md](./REÇUS_ET_DATE_METIER.md).

### 3.4 Chiffrement de la base locale mobile

- **Principe retenu :** le chiffrement des données locales est une exigence cible.
- **À VALIDER :** bibliothèque, compatibilité React Native/Expo/Android, protection et cycle de vie des clés, sauvegardes et récupération des opérations. Aucune bibliothèque n’est sélectionnée.
- **Impact documentaire :** expliciter cette exigence dans le TRD et la définition du prototype de cadrage.
- **Impact technique futur :** évaluer les solutions et réaliser une preuve de concept sur appareils cibles avant choix de dépendance ou d’architecture locale.

### 3.5 Date métier et fuseau horaire

- **Principe retenu :** journée civile de 00 h 00 à 23 h 59 dans `Africa/Ndjamena`. Les instants techniques sont conservés comme des instants ; le calcul de date métier doit être cohérent côté serveur.
- **À VALIDER :** précision et implémentation de la frontière ; aucun calendrier spécial n’est établi.
- **Impact documentaire :** employer le fuseau et le principe de journée civile de manière cohérente dans les règles de reçus, clôtures, rapports et API.
- **Impact technique futur :** calculer la date métier de façon déterministe côté serveur à partir de l’instant déclaré selon la règle validée ; préserver l’instant de réception serveur séparément.

### 3.5.1 Collectes hors ligne tardives et horloges

- **Principe retenu :** conserver date/heure déclarée de la collecte et instant de réception serveur séparément ; ne pas remplacer automatiquement la date déclarée par la date de synchronisation. Prévoir contrôle d’horloges incohérentes et correction supervisée avec motif et audit.
- **À VALIDER :** écart d’horloge admissible, règles de détection/alerte, habilitations et séquence de correction.
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

- **Ce que disent les documents :** l’App Flow v1.1 autorise la création hors ligne d’un client provisoire et demande le contrôle des doublons connus localement ; les doublons ou conflits à la synchronisation doivent être examinés. Le SQL rend `client_code` unique globalement, sans définir la méthode d’attribution hors ligne ni la règle d’identité d’un doublon.
- **Risque :** deux appareils hors ligne peuvent créer deux fiches pour la même personne, ou se voir attribuer des codes en collision ; fusionner automatiquement des identités peut également rattacher des collectes au mauvais client.
- **Option recommandée — À VALIDER :** définir les champs obligatoires, la génération unique du code, les critères de rapprochement et une file de revue des doublons côté serveur. Ne jamais fusionner ou supprimer silencieusement un client déjà associé à des opérations financières.

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

## 4. Autres décisions encore ouvertes

- **À VALIDER :** champs obligatoires et unicité de référence des dossiers, règles de création/doublons client, événements de collecte sur dossier inactif et données historiques ambiguës.
- **À VALIDER :** transitions et permissions exactes des collectes, remises, clôtures, annulations et réouvertures ; les noms d’états connus ne fixent pas de nouveaux enums.
- **À VALIDER :** format des références de reçu, mentions légales et traitement d’un rejet définitif.
- **À VALIDER :** seuil d’écart d’horloge et procédure exacte de correction supervisée ; le calendrier spécial n’est pas défini.
- **À VALIDER :** bibliothèque/stratégie de chiffrement, gestion des clés, durée de session, verrouillage et procédure de récupération d’un appareil perdu.
- **À VALIDER :** rôles de réception et validation de caisse, seuils d’approbation, états des écarts et possibilité de réaffecter une collecte après annulation d’une remise.
- **À VALIDER :** framework Web, appareils Android, imprimante, RPO/RTO, disponibilité, conservation et conformité réglementaire.

## 5. Cohérence avec les références existantes

- **[AGENT.md](../AGENT.md) :** cohérent avec la stack et les règles de montants, d’idempotence, de statut provisoire, de confirmation de remise, de clôture et de droits multi-agences. Il ne détaille pas les décisions nouvelles sur dossier, reçus, date métier, chiffrement ou session.
- **[Implementation Plan v1.0](./COOPECA_Implementation_Plan_v1.0.docx) :** confirme la stack et prévoit la revue du schéma en phase 2. Il n’énonce pas les choix détaillés de dossier et de date civile retenus ici ; ils devront être pris en compte dans les livrables de cette phase.
- **[TRD v1.0](./COOPECA_TRD_Technique_Reference_Document_v1.0.docx) :** cohérent sur la stack, l’idempotence, l’offline-first et les reçus provisoires. Il cite `Africa/Ndjamena` dans un exemple, mais la règle de journée civile et l’organisation distincte des états ne sont pas spécifiées au même niveau.
- **[App Flow v1.1](./COOPECA_App_Flow_Flux_Applicatif_v1.1.docx) :** son annexe met à jour les parcours client provisoire, remise par collectes sélectionnées et clôture hors ligne. Elle reste à harmoniser avec le modèle de dossier, les trois couches d’état et la politique de session/chiffrement.
- **[Schéma SQL v1.1](./COOPECA_Backend_Schema_v1.1.sql) :** n’inclut pas de table dossier ; exige `client_receipt_no` dès l’insertion sans spécifier son allocation serveur dans le flux de synchronisation ; n’a pas de champ explicite de date/heure déclarée sur l’appareil distinct de l’instant `TIMESTAMPTZ` ; et ses enums ne représentent pas l’état local de synchronisation. `remittances` porte déclaration et réception sur une même ligne avec des champs/états, alors que le principe retenu distingue les confirmations agent et caisse. Ces écarts de représentation et de contrat sont détaillés dans [IMPACTS_SCHEMA_SQL.md](./IMPACTS_SCHEMA_SQL.md) et [REÇUS_ET_DATE_METIER.md](./REÇUS_ET_DATE_METIER.md).

Aucun des constats ci-dessus ne modifie les documents d’origine. Les huit principes sont une base pour validation finale, non une autorisation de modifier le SQL, de créer `schema.prisma`, de migrer ou de commencer l’implémentation.
