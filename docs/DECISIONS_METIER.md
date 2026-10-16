# Décisions métier et techniques de référence

**Projet :** COOPECA  
**Statut :** décisions de référence pour préparer le MVP ; les points marqués **À VALIDER** ne sont pas des autorisations d’implémenter une règle métier.  
**Périmètre :** cadrage uniquement. Ce document ne modifie pas le schéma SQL et ne crée aucun module applicatif.

## 1. Références examinées

- [AGENT.md](../AGENT.md) — architecture et règles non négociables du dépôt.
- [COOPECA Implementation Plan v1.0](./COOPECA_Implementation_Plan_v1.0.docx).
- [COOPECA TRD Technique v1.0](./COOPECA_TRD_Technique_Reference_Document_v1.0.docx).
- [Cahier des charges technique](./Cahier_des_charges_Technique_COOPECA%20(1).docx).
- [Cahier de conception technique détaillée](./Cahier_de_Conception_Technique_Detaillee_COOPECA.docx).
- [App Flow v1.1](./COOPECA_App_Flow_Flux_Applicatif_v1.1.docx), y compris son annexe de décisions mises à jour.
- [Schéma backend v1.1](./COOPECA_Backend_Schema_v1.1.sql), référence technique existante qui n’est pas modifiée par ce document.

Les documents n’ont pas tous le même statut : certains choix sont présentés comme validés dans le TRD ou l’annexe de l’App Flow, tandis que d’autres restent des propositions à faire approuver par COOPECA. Les règles ci-dessous reprennent les décisions expressément établies pour le MVP. Une recommandation sur un point ouvert ne vaut pas approbation. Les écarts au schéma SQL devront être arbitrés et documentés avant toute migration.

## 2. Règles de référence retenues

Les règles de cette section sont les références de cadrage du MVP.

1. **Architecture.** L’application Android utilise React Native, Expo et TypeScript. L’API utilise NestJS. La base centrale est PostgreSQL, accédée avec Prisma.
2. **Client créé hors ligne.** Un client créé sans connexion porte le statut `PROVISOIRE` jusqu’à son traitement côté serveur.
3. **Reçu hors ligne.** Un reçu créé sans connexion affiche exactement **« EN ATTENTE DE SYNCHRONISATION »** et conserve une référence locale stable.
4. **Synchronisation.** La synchronisation est idempotente : répéter une requête pour la même opération ne crée aucun doublon financier. Une opération locale ne devient pas confirmée par le seul fait de son envoi.
5. **Remise et réception de caisse.** La déclaration de remise de l’agent et la réception physique par le caissier sont deux opérations et deux confirmations distinctes. Une déclaration n’est pas une réception confirmée.
6. **Remise partielle.** Dans le MVP, une remise peut inclure une sélection de collectes entières. Une collecte n’est pas fractionnée entre plusieurs remises. Toute évolution de cette règle requiert une décision métier ultérieure.
7. **Clôture journalière.** Chaque agent doit soumettre sa clôture chaque jour, même hors ligne. Hors réseau, elle reste enregistrée localement et en attente de synchronisation.
8. **Réouverture de clôture.** Seul un superviseur autorisé peut rouvrir une clôture. Un motif est obligatoire et l’action doit être auditée.
9. **Montants.** Les montants financiers sont des nombres entiers en XAF ; aucun montant ni calcul financier n’utilise de nombre flottant.
10. **Multi-agences.** Les autorisations d’accès aux agences sont contrôlées côté serveur pour chaque requête. L’agence fournie par un client ne constitue jamais une preuve d’autorisation.

## 3. Points ouverts et arbitrages

Pour chaque sujet ci-dessous, la recommandation sert de base à la discussion ; **À VALIDER** signifie que l’accord de COOPECA est requis avant de figer le modèle, les contrats ou le comportement.

### 3.1 Dossier de tontine distinct du client

- **Ce que disent les documents :** la conception détaillée et le cahier des charges décrivent des dossiers/contrats de tontine (`tontine_accounts`) rattachés aux clients, avec référence, montant journalier, période, statut et règles. L’App Flow fait choisir un dossier actif avant une collecte. Le schéma SQL v1.1 ne contient pas de table de dossier : `collections` référence directement `clients`.
- **Risque :** rattacher les collectes uniquement au client rend ambiguë l’affectation lorsqu’un client a plusieurs contrats, des périodes différentes ou plusieurs montants convenus ; le schéma ne permet alors pas de reconstituer proprement la collecte par contrat.
- **Option recommandée — À VALIDER :** introduire dans le modèle métier un dossier de tontine distinct du client et rattacher chaque collecte à un dossier. Définir avec COOPECA les règles de création, d’affectation à un agent, d’activation, de suspension et de clôture des dossiers. Ce choix implique de revoir le schéma de référence avant toute migration ; il ne l’altère pas ici.

### 3.2 États exacts des collectes, remises et clôtures

- **Ce que disent les documents :** l’App Flow distingue les états locaux/en attente, synchronisés et à vérifier. La conception ajoute `PENDING_SYNC`, `SYNCED`, `CONFIRMED`, `REJECTED_REVIEW` et `CANCELLED`. Le SQL définit les collectes en `RECORDED` ou `REVERSED`, les remises en `DRAFT`, `SUBMITTED`, `RECEIVED`, `PARTIAL`, `DISPUTED`, `CANCELLED`, et les clôtures en `DRAFT`, `SUBMITTED`, `REVIEWED`, `REOPENED`. Le vocabulaire des autres documents comprend aussi `VALIDATED` et `CLOSED`.
- **Risque :** mélanger l’état de transmission et l’état métier peut faire apparaître comme confirmée une collecte seulement enregistrée sur l’appareil, ou comme reçue une remise seulement déclarée. Des transitions non définies produisent des incohérences de rapprochement et d’audit.
- **Option recommandée — À VALIDER :** approuver une table d’états et de transitions par entité. Garder séparés (a) l’état de synchronisation de l’opération locale et (b) l’état métier du serveur. Pour les collectes, décider explicitement si l’acceptation par le serveur vaut confirmation métier ou si une validation ultérieure existe. Pour les remises et clôtures, définir les transitions, les rôles autorisés, les motifs et les règles de réouverture. Ne pas ajouter ou remplacer des états SQL avant cet arbitrage.

### 3.3 Référence locale du reçu et numéro officiel

- **Ce que disent les documents :** l’App Flow v1.1 exige une référence locale unique conservée ; le cahier des charges et la conception proposent soit une référence provisoire générée par l’appareil, soit une plage préallouée. Le SQL prévoit `local_receipt_no` et un `client_receipt_no` non nul et unique ; les documents envisagent également un numéro serveur attribué à la synchronisation.
- **Risque :** imprimer hors ligne un numéro présenté comme officiel sans garantie d’unicité peut produire des collisions, des duplicatas ambigus ou une discordance entre le reçu papier et le numéro serveur.
- **Option recommandée — À VALIDER :** utiliser comme référence locale stable un identifiant lisible dérivé d’un identifiant unique généré sur l’appareil et distinguer visiblement cette référence provisoire du numéro officiel. À la synchronisation, le serveur attribue le numéro officiel et conserve explicitement la correspondance entre les deux. Une préallocation de numéros ne serait à retenir que si COOPECA exige un numéro officiel utilisable hors ligne et si un prototype prouve la gestion sûre des plages, appareils perdus et numéros inutilisés. **À VALIDER :** portée officielle du reçu hors ligne, format des deux références et affichage après synchronisation.

### 3.4 Chiffrement de la base locale mobile

- **Ce que disent les documents :** le cahier des charges demande SQLite chiffré et le TRD retient `expo-sqlite` pour la persistance ainsi que `expo-secure-store` pour les petits secrets. Le choix d’une bibliothèque de chiffrement maintenue et la protection de la clé doivent être confirmés ; `expo-sqlite` seul ne précise pas la solution de chiffrement.
- **Risque :** une base non chiffrée expose les données clients et les opérations financières en cas de perte ou d’accès non autorisé au téléphone. Une solution incompatible avec Expo ou mal intégrée à SecureStore peut en outre compromettre la persistance, les mises à jour ou la récupération après incident.
- **Option recommandée — À VALIDER :** imposer le chiffrement de la base locale et protéger la clé avec le mécanisme sécurisé Android via une bibliothèque compatible avec la version Expo retenue. Faire une preuve de concept sur téléphone réel avant de figer la dépendance ; tester sauvegarde/restauration, migration locale, verrouillage et révocation d’appareil. Ne pas stocker la clé dans le dépôt, dans une configuration en clair ou dans la base qu’elle protège.

### 3.5 Date métier et fuseau horaire

- **Ce que disent les documents :** le SQL stocke `collected_at` et `business_date`, mais ne fixe pas la règle de calcul de cette date. La conception demande de conserver l’heure locale et le fuseau, note que l’horloge de l’appareil n’est pas une preuve, et cite `Africa/Ndjamena` comme exemple. Les documents laissent à définir le calendrier des collectes et la journée de clôture.
- **Risque :** un fuseau ou un changement de date incohérent déplace une collecte d’un jour à l’autre, fausse les clôtures, les rapports et le rapprochement agent/caissier.
- **Option recommandée — À VALIDER :** conserver l’instant de collecte déclaré par l’appareil, l’instant de réception attribué par le serveur et le fuseau IANA utilisé ; calculer la date métier selon une règle centrale explicite, et signaler les écarts d’horloge. `Africa/Ndjamena` est une hypothèse à confirmer, pas une décision approuvée. **À VALIDER :** fuseau officiel, frontière de la journée métier, calendrier/jours de collecte et traitement des événements saisis tardivement.

### 3.6 Règles de création client et de traitement des doublons

- **Ce que disent les documents :** l’App Flow v1.1 autorise la création hors ligne d’un client provisoire et demande le contrôle des doublons connus localement ; les doublons ou conflits à la synchronisation doivent être examinés. Le SQL rend `client_code` unique globalement, sans définir la méthode d’attribution hors ligne ni la règle d’identité d’un doublon.
- **Risque :** deux appareils hors ligne peuvent créer deux fiches pour la même personne, ou se voir attribuer des codes en collision ; fusionner automatiquement des identités peut également rattacher des collectes au mauvais client.
- **Option recommandée — À VALIDER :** définir les champs obligatoires, la génération unique du code, les critères de rapprochement et une file de revue des doublons côté serveur. Ne jamais fusionner ou supprimer silencieusement un client déjà associé à des opérations financières.

### 3.7 Écarts de remise et séparation des rôles

- **Ce que disent les documents :** l’App Flow demande une justification lorsque le montant déclaré diffère du total des collectes sélectionnées ; le caissier enregistre le montant physiquement reçu ; un rôle habilité traite les écarts. Le SQL prévoit `PARTIAL`, `DISPUTED` et une table `discrepancies`, mais les documents indiquent que les rôles, seuils et autorisations restent à définir.
- **Risque :** sans règle de rapprochement et de séparation des tâches, une remise peut être déclarée, reçue et validée par la même personne ou clôturée malgré un écart non expliqué.
- **Option recommandée — À VALIDER :** conserver le total des collectes entières sélectionnées comme base de rapprochement ; enregistrer séparément le montant déclaré et le montant effectivement reçu ; ouvrir un écart motivé lorsqu’ils diffèrent ; exiger un acteur habilité distinct pour la réception/validation selon la politique approuvée. **À VALIDER :** rôles précis, autorisation de réception partielle d’un ensemble de collectes, traitement des écarts et seuils éventuels.

### 3.8 Authentification hors ligne et appareils

- **Ce que disent les documents :** ils demandent comptes individuels, jetons à durée limitée, renouvellement/révocation, stockage sécurisé, révocation d’appareil perdu et conservation de la file locale lorsque la session expire. La durée et les limites de la session hors ligne restent à définir.
- **Risque :** une session trop permissive sur un appareil perdu permet un accès prolongé ; une expiration mal gérée peut empêcher le travail hors ligne ou conduire à effacer des opérations en attente.
- **Option recommandée — À VALIDER :** définir une politique de session locale limitée avec verrouillage, conservation chiffrée de la file et refus des nouveaux appels serveur après révocation ; prévoir une procédure de remplacement d’appareil et de traitement des opérations qui n’ont pas encore été synchronisées. **À VALIDER :** durée d’usage hors ligne, règles de déverrouillage et conduite à tenir pour un appareil perdu contenant des opérations en attente.

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

## 4. Liste courte des arbitrages requis

Les autres recommandations de la section 3 sont également marquées **À VALIDER** lorsqu’elles nécessitent une approbation. Les décisions prioritaires pour figer les modèles et les contrats sont :

1. **À VALIDER :** dossier de tontine distinct du client et modèle de rattachement des collectes.
2. **À VALIDER :** états exacts et transitions des collectes, remises, clôtures et synchronisation.
3. **À VALIDER :** référence provisoire du reçu, numéro officiel et statut légal du reçu hors ligne.
4. **À VALIDER :** mécanisme de chiffrement local et politique de session/révocation hors ligne.
5. **À VALIDER :** fuseau horaire, date métier et calendrier des collectes.
6. **À VALIDER :** rôles de réception/validation, traitement des écarts, et règles de détection des doublons client.

Les choix de stack indiqués comme retenus dans la section 2 restent la base de travail ; les options Web et matériel proposées ici ne sont pas des choix approuvés. Aucun changement du schéma SQL ou lancement de migration ne découle de ce document seul.
