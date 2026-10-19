
# COOPECA — Référentiel UX/UI

**Version :** 1.0  
**Statut :** Document de travail à confronter aux maquettes officielles  
**Produits :** Application mobile Android et tableau de bord web

> Les couleurs, polices, tailles et autres valeurs visuelles doivent être reprises des maquettes officielles. Les éléments non documentés sont indiqués comme « À confirmer ».

## 1. Objectifs UX

- Permettre aux agents de travailler sur le terrain, y compris hors ligne.
- Réduire les erreurs de saisie, notamment sur les montants et l'identification des clients.
- Rendre visibles les états provisoires et les opérations à synchroniser.
- Préserver la traçabilité des reçus, remises et corrections.
- Adapter les parcours aux rôles.
- Assurer une expérience cohérente entre mobile et web.

## 2. Principes de conception

1. **Clarté :** chaque écran possède un objectif principal identifiable.
2. **Prévention des erreurs :** valider la saisie au plus près du champ concerné.
3. **Transparence hors ligne :** indiquer clairement si l'opération est seulement locale ou acceptée par le serveur.
4. **Confirmation :** rendre les actions financières et sensibles explicites.
5. **Traçabilité :** ne pas effacer silencieusement les opérations en conflit ou rejetées.
6. **Accessibilité :** utiliser des textes lisibles, des contrastes suffisants et des zones tactiles adaptées.
7. **Sobriété :** limiter les informations secondaires dans les écrans de saisie.

## 3. Identité visuelle

Les valeurs officielles doivent être extraites du concept UX/UI et des wireframes existants.

| Élément | Règle | Statut |
|---|---|---|
| Logo | Utiliser les fichiers officiels COOPECA | Source à identifier |
| Couleurs | Reprendre les valeurs exactes de la charte validée | À confirmer |
| Typographie | Reprendre les polices et graisses des maquettes | À confirmer |
| Icônes | Maintenir un style cohérent et compréhensible | À confirmer |
| Rayons et bordures | Utiliser un système partagé | À confirmer |
| Espacements | Définir une grille commune à partir des maquettes | À confirmer |
| Illustrations | Ne pas introduire d'éléments incompatibles avec l'identité officielle | À confirmer |

Ne pas inventer une palette ou une police en les présentant comme la charte officielle.

## 4. Composants à documenter

Pour chaque composant, documenter l'usage, les variantes, les états et les règles d'accessibilité.

- Boutons principal, secondaire et destructif.
- Champs texte, numérique, montant XAF, recherche et sélection.
- Sélecteur de client et de dossier.
- Cartes de résumé et lignes de liste.
- Tableaux et filtres web.
- Indicateurs d'état.
- Bannière de connexion et synchronisation.
- Dialogues de confirmation.
- Messages d'erreur, d'avertissement et de succès.
- États vides et indicateurs de chargement.
- Aperçu de reçu et état d'impression.
- Composants de résolution des conflits de synchronisation.

**À confirmer :** dimensions, tokens visuels, palette et implémentation partagée.

## 5. Navigation mobile

Écrans présents dans le squelette :
- Connexion ;
- Accueil ;
- Clients ;
- Collectes ;
- Remises ;
- Clôture ;
- Consultation d'un reçu.

Principes :
- Rendre les actions fréquentes facilement accessibles.
- Afficher le client et le dossier avant une collecte.
- Préserver les saisies lorsqu'une erreur survient, lorsque cela est sûr.
- Prévenir les doubles soumissions.
- Confirmer l'enregistrement local avant de quitter un formulaire.

La structure technique actuelle ne constitue pas à elle seule une validation définitive de la navigation.

## 6. Formulaires et montants

- Afficher explicitement la devise XAF.
- Utiliser un clavier numérique adapté pour les montants.
- Valider les champs obligatoires.
- Afficher les erreurs à proximité du champ concerné.
- Conserver les données saisies lors d'une erreur réseau.
- Utiliser des entiers pour les calculs financiers.
- Avant confirmation d'une collecte, rendre visibles le client, le dossier, le montant et l'action demandée.

**À confirmer :** formats, limites de montant, champs obligatoires et règles de formatage officielles.

## 7. États hors ligne et synchronisation

Les états doivent comporter un libellé compréhensible, et ne pas dépendre uniquement d'une couleur.

| État | Message UX proposé | Comportement |
|---|---|---|
| Enregistré localement | « Enregistré sur cet appareil » | L'opération est conservée localement |
| En attente | « En attente de synchronisation » | Le serveur n'a pas encore confirmé |
| Accepté | « Synchronisé » ou statut métier approprié | Afficher la référence officielle si disponible |
| Conflit | « Action requise : conflit à résoudre » | Conserver les données et proposer une résolution |
| Rejeté | « Opération non acceptée » avec motif | Conserver l'historique |
| Réseau indisponible | « Hors ligne — vos opérations restent sur cet appareil » | Autoriser les fonctions hors ligne prévues |

Les libellés définitifs doivent être cohérents entre les listes, détails, reçus et écrans de synchronisation.

## 8. Clients et dossiers

- Distinguer les données provisoires des données acceptées par le serveur.
- Montrer le client et le dossier actif avant toute collecte.
- Éviter les choix ambigus lorsque plusieurs dossiers historiques existent.
- Expliquer les créations concurrentes et les rejets.
- Ne pas proposer de suppression silencieuse.
- Rendre visible l'état fermé d'un dossier et empêcher les actions interdites.

Pour les doublons, une correspondance téléphone normalisé + nom/prénom dans la même agence déclenche une revue ; seul un superviseur habilité peut décider une fusion, conservée comme alias sans réécriture des liens financiers. Les conflits de dossiers restent conservés et sont résolus explicitement. Voir [DECISIONS_METIER.md](./DECISIONS_METIER.md) §3.8, §3.13 et §3.14. Les libellés définitifs et les détails d’interface restent à concevoir.

## 9. Collectes et reçus

- Présenter le montant de manière lisible.
- Rendre le contexte de la collecte facile à vérifier avant confirmation.
- Distinguer référence provisoire et numéro officiel.
- Ne pas masquer un reçu provisoire déjà imprimé après un rejet.
- Expliquer la procédure de copie ou de réimpression.
- Fournir un retour clair après une impression réussie ou échouée.

**À confirmer :** mentions légales, format du reçu, champs imprimés, imprimante cible et règles de réimpression.

## 10. Remises et clôtures

- Présenter le détail et le total des collectes incluses dans une remise.
- Distinguer la déclaration de remise de l'agent de la confirmation de réception du caissier.
- Présenter les écarts avec les montants attendus et constatés.
- Résumer les données incluses dans une clôture journalière.
- Signaler les opérations encore en attente.
- Pour toute action sensible, expliquer les conséquences et demander une confirmation adaptée.
- Rendre les corrections et réouvertures traçables.

La déclaration de remise synchronisée n’est pas modifiable directement. Le caissier constate les écarts et le superviseur habilité en valide la résolution avec motif et audit. La clôture peut être déclarée hors ligne, mais n’est pas rapprochée côté serveur tant que des opérations attendent la synchronisation. Voir [DECISIONS_METIER.md](./DECISIONS_METIER.md) §3.14.

**À confirmer :** détails des calculs, seuils, statuts d’affichage, pièces justificatives et exceptions de permissions.

## 11. Tableau de bord web

- Prioriser la lecture, la comparaison et le suivi.
- Fournir des filtres explicites selon les besoins et permissions.
- Garder les totaux, unités et périodes visibles.
- Présenter les conflits comme des éléments à traiter.
- Limiter l'accès aux actions sensibles.
- Assurer la cohérence entre synthèse et détail d'une opération.
- Contrôler les autorisations côté serveur.

Les écrans, colonnes, filtres et exports doivent être conformes aux parcours web et wireframes officiels.

## 12. Accessibilité et ergonomie

- Contraste suffisant entre texte et arrière-plan.
- Texte lisible sur les appareils ciblés.
- Zones tactiles confortables.
- Libellés explicites pour les champs et boutons.
- Ordre de navigation cohérent.
- États non communiqués uniquement par la couleur.
- Prise en compte des noms longs, des erreurs et des petits écrans.
- Éviter les animations inutiles sur les appareils modestes.

**À confirmer :** appareils Android minimum et exigences formelles d'accessibilité.

## 13. Cohérence mobile / web

À partager entre les interfaces :
- terminologie métier ;
- libellés des états ;
- format des montants XAF ;
- références provisoires et officielles ;
- distinction entre état métier et état de synchronisation ;
- règles de permissions ;
- présentation des conflits, rejets et corrections.

Les composants peuvent différer pour s'adapter au tactile mobile et aux tableaux web, tout en conservant le même vocabulaire métier.

## 14. Checklist de validation d'un écran

- [ ] Le but de l'écran est immédiatement compréhensible.
- [ ] Le rôle et le contexte agence sont respectés.
- [ ] Les champs obligatoires et erreurs sont identifiables.
- [ ] Le comportement hors ligne est explicite.
- [ ] Les états local, en attente et serveur sont distingués.
- [ ] Les montants et la devise sont clairs.
- [ ] Les actions sensibles ont une confirmation adaptée.
- [ ] Une erreur ne détruit pas les saisies.
- [ ] Les libellés respectent le vocabulaire métier validé.
- [ ] L'écran est cohérent avec les maquettes officielles.

## 15. Sources à confronter

- `COOPECA_UX_UI_Design_Concept_v1.0.pptx`
- `COOPECA_Wireframes_Ecrans_v1.0.pptx`
- `COOPECA_Wireframes_Web_v1.0.pptx`
- `COOPECA_Parcours_Web_Fonctionnels_v1.0.docx`
- `COOPECA_App_Flow_Flux_Applicatif_v1.1.docx`
- `docs/DECISIONS_METIER.md`
- `AGENTS.md`

Vérifier les noms et chemins réels dans le dépôt. Ce document est un référentiel de travail ; il ne remplace pas les maquettes officielles.
