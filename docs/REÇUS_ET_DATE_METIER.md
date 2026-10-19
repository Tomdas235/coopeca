# Références de reçu et date métier

**Statut :** règles validées, avec formats et modalités opérationnelles encore **À VALIDER**. Ce document décrit les exigences métier sans modifier le schéma SQL ni définir un contrat d’API final.

## 1. Références, synchronisation et impression

### Règles validées

- Une collecte créée hors ligne reçoit une référence provisoire **lisible**, liée à l’agence, stable et unique. Cette référence affichable est distincte de l’identifiant technique complet de l’opération. Son format exact reste **À VALIDER**.
- À l’acceptation de l’opération, le serveur attribue le numéro officiel dans le périmètre de numérotation de l’agence. L’unicité et l’allocation atomique sont obligatoires ; le format et la séquence restent **À VALIDER**.
- Le reçu hors ligne porte la mention **« EN ATTENTE DE SYNCHRONISATION »**. À l’acceptation serveur, les exemplaires futurs affichent la référence provisoire et le numéro officiel.
- Le mobile persiste l’opération, l’identifiant technique, la référence provisoire et la clé d’idempotence avant envoi. Toute répétition reprend les mêmes identifiants.
- Pour une même clé d’idempotence et un contenu identique, le serveur retourne le résultat existant, y compris le numéro officiel déjà attribué. Une même clé avec un contenu différent constitue un **conflit** et ne doit pas être traitée comme un succès équivalent.
- Une réimpression utilise les mêmes références et ne crée jamais une nouvelle collecte.
- L’état d’impression est distinct de l’état de synchronisation et de l’état métier de la collecte. L’impression ou son échec ne vaut ni acceptation serveur ni confirmation métier.
- Après rejet définitif, conserver l’opération et le reçu, afficher le motif et empêcher toute répétition automatique. Un parcours explicite de résolution est requis.
- Conserver l’audit des tentatives, de la décision serveur, de l’attribution du numéro officiel, des rejets et de leur résolution.

### Scénario de synchronisation et d’attribution

Le serveur doit garantir qu’une seule attribution officielle effective est associée à l’opération acceptée, y compris en cas de requêtes concurrentes ou répétées. Une répétition idempotente ne réserve pas un second numéro et restitue le numéro déjà attribué. Une clé réutilisée avec un contenu différent doit produire un conflit traçable ; le code API et l’action utilisateur exacte restent à concevoir.

Le statut `REJECTED` du SQL concerne les événements de synchronisation et le rejet définitif demandé ici porte sur l’opération/reçu : leur correspondance et leur éventuelle persistance durable restent à définir, sans inventer de nouvel enum.

### Détails à valider

- **À VALIDER :** format, alphabet, longueur, composition et règle de stabilité de la référence lisible par agence ; lien ou non avec l’identifiant technique complet et règles de confidentialité de ce dernier.
- **À VALIDER :** format et séquence du numéro officiel, inclusion éventuelle d’un identifiant d’agence, renouvellement de séquence, gestion de concurrence, des pannes et des numéros non utilisés.
- **À VALIDER :** mentions légales, champs imprimés, identité/agence, QR code éventuel et valeur probante du reçu avant synchronisation.
- **À VALIDER :** rendu après acceptation, état visuel d’un reçu rejeté, comportement d’une réimpression après changement de statut et nombre/durée de conservation des exemplaires/audits.
- **À VALIDER :** parcours de résolution d’un rejet définitif : rôles, correction autorisée, nouvelle soumission éventuelle sous nouvelle opération, prévention d’un doublon financier et audit.
- **À VALIDER :** contrat de conflit pour clé idempotente avec contenu différent (code, affichage, résolution) et portée exacte de l’unicité de la clé.

## 2. Incompatibilité de numérotation avec le SQL v1.1

Le schéma [COOPECA_Backend_Schema_v1.1.sql](./COOPECA_Backend_Schema_v1.1.sql) définit `collections.client_receipt_no VARCHAR(80) NOT NULL UNIQUE` et `collections.local_receipt_no VARCHAR(100)` nullable. Il exige donc une valeur pour `client_receipt_no` lors de l’insertion et son unicité est globale, tandis que la règle métier attribue le numéro officiel à l’acceptation par le serveur et garantit son unicité dans le périmètre agence. Le schéma ne précise pas si `client_receipt_no` est bien le numéro officiel, comment son attribution est liée à l’acceptation, ni comment est conservée la référence provisoire.

Le principe métier validé le 19/10/2026 est l’allocation officielle atomique à l’acceptation, avant insertion/persistance de la collecte. Les variantes suivantes restent à examiner pour la compatibilité avec le SQL et les consommateurs ; elles ne rouvrent pas ce choix métier :

| Option à étudier | Compatibilité possible | Conséquences et points de vigilance |
|---|---|---|
| **Référence métier :** attribuer le numéro officiel côté serveur à l’étape d’acceptation, puis insérer la collecte avec ce numéro dans la même unité transactionnelle. | Peut satisfaire `NOT NULL` et `UNIQUE` sans rendre le numéro disponible avant l’acceptation. | Garantir l’atomicité entre acceptation, allocation et insertion ; une contrainte d’unicité globale reste plus stricte qu’une unicité par agence, sauf si le format lui-même évite les collisions entre agences. Préciser le traitement des reprises, des pannes et des numéros réservés/non utilisés. |
| Faire évoluer le stockage afin que le numéro officiel puisse être absent avant acceptation, puis l’enregistrer à l’acceptation. | Représente directement le cycle de vie si la collecte existe en base avant son acceptation. | Change l’obligation et/ou la contrainte d’unicité du champ existant ; nécessite une stratégie de compatibilité des lignes existantes, des consommateurs et des index. Déterminer où appliquer alors l’unicité d’agence. |
| Représenter l’attribution officielle séparément (par exemple par une relation ou un registre de numérotation) et maintenir `client_receipt_no` pendant une période de compatibilité selon une sémantique clarifiée. | Peut séparer les identifiants historiques et l’attribution officielle. | Ajoute une relation à maintenir idempotemment et atomiquement ; il faut définir la valeur toujours requise dans le champ historique, son unicité et la transition des API/rapports sans ambiguïté. |

Le moment d’allocation et de persistance est décidé : allocation atomique à l’acceptation. Restent à préciser la sémantique du champ SQL historique, le périmètre des collisions à prévenir, le format/séquence et la compatibilité avec les données/consommateurs. Ne pas modifier le SQL ni générer de migration dans le cadre de ce document.

## 3. Temps de collecte et date métier

### Fuseau, frontière et instants

Le fuseau métier est **`Africa/Ndjamena`**. Une journée civile est l’intervalle **[début du jour à 00 h 00, début du jour suivant à 00 h 00)** dans ce fuseau : la borne de début est incluse et celle du jour suivant exclue. Aucun calendrier spécial n’est introduit.

Les instants techniques sont conservés comme des instants, indépendamment de leur affichage local. Les règles de calcul correspondantes doivent être appliquées de façon cohérente côté serveur.

### Temps distincts

- **Heure/date déclarée d’origine :** valeur fournie par l’appareil pour le moment de collecte. Pour une collecte hors ligne tardive, elle est conservée sans remplacement automatique par la date/heure de synchronisation. Les informations utiles à l’examen d’une horloge incohérente doivent être conservées.
- **Instant de réception serveur :** instant attribué par le serveur à la réception de l’opération ; il trace l’arrivée et ne remplace pas l’heure déclarée.
- **Date métier :** date civile utilisée pour totaux, clôtures et rapports dans `Africa/Ndjamena`. Elle ne doit pas être automatiquement remplacée par la date de synchronisation.

Le schéma SQL v1.1 prévoit `collections.collected_at TIMESTAMPTZ`, `collections.sync_received_at TIMESTAMPTZ` et `collections.business_date DATE`. Il ne définit pas explicitement les champs/conventions permettant de distinguer la valeur déclarée d’origine de l’instant reçu ou de calculer la date métier en présence d’une horloge incohérente. Les noms de colonnes ne suffisent pas à définir le contrat.

### Horloges incohérentes et corrections

Une collecte dont l’horloge est jugée incohérente n’est pas acceptée automatiquement ; elle est conservée pour revue humaine. Préserver les éléments utiles à son examen et l’heure déclarée d’origine. Toute correction éventuelle doit être supervisée, motivée et auditée, sans écraser silencieusement cette valeur. Les seuils, éléments à conserver, habilitations, effets sur la date métier et déroulement précis de la correction restent **À VALIDER**.

### Points temporels à valider

- **À VALIDER :** règle complète de dérivation de la date métier à partir de la valeur déclarée et traitement d’une correction autorisée.
- **À VALIDER :** seuils d’horloge incohérente, données utiles à l’examen et destinataires des alertes.
- **À VALIDER :** précision et représentation des heures sur le reçu, sans modifier la frontière civile validée.

## 4. Tests d’acceptation à prévoir

Ces cas sont des exigences documentaires pour la conception/tests futurs ; ils n’ont pas été exécutés comme tests applicatifs dans le cadre de cette mise à jour.

1. Répéter une requête acceptée avec la même clé et le même contenu retourne la même opération et le même numéro officiel, sans créer de collecte ni numéro supplémentaire.
2. Envoyer simultanément plusieurs tentatives identiques ne produit qu’une acceptation et une attribution officielle effective.
3. Réutiliser la même clé avec un contenu différent produit un conflit explicite, traçable, sans écrasement ni succès trompeur.
4. Deux opérations concurrentes ne reçoivent pas le même numéro officiel dans le périmètre d’une agence ; l’isolement entre agences respecte le format/séquence décidés.
5. Une référence provisoire demeure stable et liée à l’agence pendant la durée de vie de l’opération ; elle reste distinguable de l’identifiant technique complet.
6. Une collecte tardive conserve l’heure déclarée d’origine et l’instant de réception serveur ; sa date métier n’est pas remplacée automatiquement par la date de synchronisation.
7. Les instants autour de minuit sont classés avec la frontière semi-ouverte de la journée civile dans `Africa/Ndjamena`.
8. Une horloge incohérente déclenche le signalement attendu et préserve les données d’examen ; une correction éventuelle laisse un audit et la valeur initiale consultable.
9. Un rejet définitif conserve le reçu et l’opération, présente son motif et bloque la répétition automatique ; la résolution suit un parcours explicite.
10. Réimprimer avant ou après synchronisation ne crée pas de collecte ; après acceptation, un nouvel exemplaire montre les références provisoire et officielle.
11. Un échec d’impression n’altère ni l’état de synchronisation ni l’état métier ; un envoi accepté ne vaut pas à lui seul confirmation de remise caisse.
12. L’autorisation d’accès à une opération ou à un numéro est vérifiée côté serveur pour l’agence ; la valeur d’agence fournie par le client ne permet pas un accès inter-agences.

## 5. Références et cohérence

- [DECISIONS_METIER.md](./DECISIONS_METIER.md) consigne les décisions validées et leurs détails ouverts.
- [IMPACTS_SCHEMA_SQL.md](./IMPACTS_SCHEMA_SQL.md) décrit les impacts à examiner sur SQL, Prisma, API et les tests futurs.
- L’[Implementation Plan v1.0](./COOPECA_Implementation_Plan_v1.0.docx), le [TRD v1.0](./COOPECA_TRD_Technique_Reference_Document_v1.0.docx) et l’[App Flow v1.1](./COOPECA_App_Flow_Flux_Applicatif_v1.1.docx) demandent des références stables, une synchronisation sans doublon et des reçus reflétant l’état réel de confirmation ; les précisions d’allocation par agence, conflit de clé, rejet définitif et frontière semi-ouverte sont consolidées ici.

Aucune modification du SQL, migration, accès à une base, implémentation ou initialisation technique n’est autorisée par ce cadrage.
