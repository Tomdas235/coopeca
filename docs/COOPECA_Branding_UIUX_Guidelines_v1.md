# COOPECA --- Branding & UI/UX Guidelines

**Version :** 1.0\
**Source :** `COOPECA_UX_UI_Design_Concept_v1.0.pptx`\
**Statut :** Proposition visuelle à valider par les équipes COOPECA

------------------------------------------------------------------------

## 1. Objectif de l'identité

Construire une expérience cohérente entre les opérations sur le terrain
(application Android pour les agents) et la gestion (tableau de bord
Web), adaptée aux opérations financières.

L'identité doit être : - Sobre et rassurante ; - Lisible sur téléphone
comme sur ordinateur ; - Cohérente entre l'application mobile et
l'interface Web ; - Orientée vers la réduction des erreurs et la
traçabilité.

> Cette direction artistique est un concept V1.0 proposé à validation.
> Elle ne doit pas être considérée comme une charte définitivement
> approuvée tant que COOPECA ne l'a pas validée.

## 2. Palette de couleurs

  -----------------------------------------------------------------------
  Rôle              Nom dans le       Code hexadécimal  Utilisation
                    concept                             recommandée
  ----------------- ----------------- ----------------- -----------------
  Primaire          Vert profond      `#123F35`         Identité
                                                        principale,
                                                        en-têtes,
                                                        navigation et
                                                        éléments
                                                        structurants

  Action            Vert action       `#1F5B4B`         Boutons
                                                        principaux,
                                                        actions positives
                                                        et éléments
                                                        interactifs

  Accent            Or                `#E7B84B`         Mise en évidence
                                                        ponctuelle,
                                                        repères visuels
                                                        et éléments à
                                                        attirer
                                                        l'attention

  Arrière-plan      Fond clair        `#F4F6F3`         Fond général des
                                                        écrans et
                                                        surfaces de
                                                        travail

  Texte             Texte foncé       `#23302B`         Texte principal,
                                                        libellés et
                                                        informations
                                                        financières
  -----------------------------------------------------------------------

### Règles d'utilisation

-   Utiliser le vert profond comme couleur d'identité et de structure.
-   Réserver le vert action aux actions principales et éléments
    interactifs.
-   Employer l'or avec parcimonie ; il ne doit pas remplacer les
    couleurs de statut.
-   Maintenir un contraste élevé entre le texte et son arrière-plan.
-   Ne pas ajouter d'autres couleurs de marque sans validation. Les
    couleurs techniques nécessaires aux états d'interface devront être
    documentées séparément.

## 3. États opérationnels

Le concept identifie quatre états : - **Confirmé** - **En attente** -
**Anomalie** - **Provisoire**

### Règles d'affichage

-   Afficher le statut directement dans la liste ou la fiche, sans
    obliger l'utilisateur à ouvrir le détail.
-   Associer un libellé textuel à chaque statut ; ne jamais communiquer
    le statut uniquement par la couleur.
-   Distinguer clairement une opération enregistrée localement d'une
    opération confirmée par le serveur.
-   Ne jamais afficher « confirmé » si le serveur n'a pas confirmé
    l'opération.
-   Rendre les anomalies visibles et accessibles à un traitement
    explicite.

Les codes couleurs précis de ces quatre statuts ne sont pas définis dans
le concept source. Ils devront être spécifiés et validés avant
l'implémentation.

## 4. Typographie et hiérarchie visuelle

Le concept impose les principes suivants : - Titres courts ; - Chiffres
financiers mis en évidence ; - Libellés explicites ; - Contrastes
élevés.

### Application pratique

-   Donner la priorité visuelle aux montants, totaux et statuts
    importants.
-   Employer des libellés compréhensibles par les agents, caissiers et
    responsables.
-   Éviter les longs textes dans les écrans de saisie.
-   Utiliser une hiérarchie typographique constante entre titres de
    page, titres de section, libellés, valeurs et textes d'aide.

**Police, tailles exactes, graisses et échelle typographique :** non
spécifiées dans le concept ; à choisir et documenter lors de la mise en
œuvre.

## 5. Principes UX transversaux

1.  **Lisibilité** --- informations importantes immédiatement
    repérables.
2.  **Cohérence** --- mêmes couleurs, libellés, statuts et comportements
    sur Android et Web.
3.  **Réduction des erreurs** --- validations, récapitulatifs et
    confirmations avant les actions sensibles.
4.  **Actions principales visibles** --- mettre l'action la plus
    fréquente au premier plan.
5.  **Formulaires courts** --- regrouper les champs par étape et
    préremplir les informations disponibles.
6.  **Statut visible** --- afficher l'état opérationnel sans ouvrir
    chaque élément.
7.  **Confirmation explicite** --- confirmer les opérations sensibles et
    distinguer déclaration, réception et validation.
8.  **Traçabilité** --- chaque action sensible doit disposer d'une
    référence unique, d'un horodatage et de l'auteur.

## 6. Application Android --- Agent de collecte

### Accueil

Le concept propose les éléments suivants : - Identité COOPECA et
salutation de l'agent ; - Total enregistré pour la journée ; - Action
principale **« Enregistrer une collecte »** ; - Recherche client par
nom, téléphone ou code ; - Accès à la remise de fonds ; - Accès à la
clôture du jour ; - Indication explicite de l'état hors ligne.

### Priorités

-   L'enregistrement d'une collecte doit être accessible en un seul
    geste depuis l'accueil.
-   La recherche client doit accepter le nom, le téléphone ou
    l'identifiant.
-   L'état de connexion et de synchronisation doit être immédiatement
    visible.
-   La clôture quotidienne doit rester accessible même sans réseau.

### Enregistrement d'une collecte

Le parcours proposé comprend : 1. Sélection du client ; 2. Saisie ou
vérification du montant en FCFA ; 3. Vérification de la date de collecte
; 4. Récapitulatif ; 5. Confirmation et enregistrement ; 6. Affichage du
reçu et de son état de synchronisation.

Les autres champs doivent être préremplis lorsque cela est possible. Le
montant doit être validé et présenté en FCFA avec des séparateurs
lisibles.

### Reçu et synchronisation

-   Le reçu doit afficher une référence.
-   Le statut réel de synchronisation doit être explicite.
-   « Enregistré localement » ne signifie pas « confirmé par le serveur
    ».
-   En cas de connectivité faible ou absente, l'opération et son statut
    doivent rester visibles.

## 7. Tableau de bord Web --- Gestion

### Navigation proposée

Le concept présente les sections suivantes : - Vue d'ensemble ; -
Clients ; - Collectes ; - Remises de fonds ; - Clôtures ; - Anomalies
; - Rapports.

### Vue d'ensemble

Les indicateurs présentés dans le concept sont : - Collectes du jour ; -
Remises à valider ; - Clients provisoires à vérifier ; - Anomalies à
traiter.

Ces chiffres sont des exemples visuels du concept et ne constituent pas
des données réelles de COOPECA.

### Liste des éléments à traiter

La liste doit permettre d'identifier : - L'élément concerné ; - Le
responsable ; - Le statut ; - L'action à effectuer.

Exemples présents dans le concept : une remise à réceptionner, un client
provisoire à vérifier et une clôture en attente.

### Fonctionnalités de gestion

Pour les volumes importants, prévoir : - Filtres ; - Recherche ; -
Pagination ; - Export des données.

## 8. Réception et rapprochement des remises

Le principe central est de **séparer la déclaration de l'agent de la
confirmation effective par la caisse**.

L'écran de remise doit présenter : - La référence de la remise ; -
L'agent et la date ; - Le détail des collectes incluses ; - Le montant
total déclaré ; - Le montant effectivement reçu par la caisse ; - Une
observation en cas d'écart ; - L'action de confirmation de réception ; -
L'action permettant de signaler un écart.

Toute différence entre le montant déclaré et le montant reçu doit créer
une anomalie traçable. Les deux confirmations doivent rester distinctes.

Les références, noms et montants illustrés dans le PowerPoint sont des
exemples de maquette, et non des données de production.

## 9. Accessibilité, erreurs et états d'interface

### Accessibilité

-   Contraste élevé ;
-   Zones tactiles généreuses sur mobile ;
-   Libellés explicites ;
-   Informations importantes non dépendantes de la couleur seule.

### Messages d'erreur

Chaque message doit expliquer : 1. Ce qui s'est passé ; 2. L'élément
concerné, si connu ; 3. La prochaine action recommandée.

### États à prévoir pour chaque écran concerné

-   Chargement ;
-   Données disponibles ;
-   Liste vide ;
-   Erreur ;
-   Hors ligne ;
-   Synchronisation en attente ;
-   Confirmation serveur ;
-   Conflit ou anomalie à traiter.

Aucun état de succès ne doit être affiché avant que l'action
correspondante soit réellement confirmée.

## 10. Cohérence mobile / Web

Les deux interfaces doivent partager : - La même palette de marque ; -
Les mêmes libellés métier ; - Les mêmes définitions des statuts ; - Les
mêmes formats de montants en FCFA ; - Les mêmes principes de
confirmation ; - Une logique cohérente de références et de traçabilité.

L'interface mobile privilégie la rapidité des opérations terrain.
L'interface Web privilégie le pilotage, le rapprochement, la revue des
éléments en attente et le traitement des anomalies.

## 11. Exemples et données de maquette

Les montants, dates, noms, références de collecte, références de remise
et indicateurs affichés dans le concept sont des exemples de
présentation. Ils ne doivent pas être repris comme données réelles dans
la base, les démonstrations opérationnelles ou les rapports sans
remplacement par des données de test clairement identifiées.

## 12. Points à valider avant implémentation

-   [ ] Validation de la palette de couleurs ;
-   [ ] Choix de la police et définition de l'échelle typographique ;
-   [ ] Définition des couleurs et libellés définitifs des quatre états
    ;
-   [ ] Validation des écrans prioritaires Android ;
-   [ ] Validation des écrans prioritaires Web ;
-   [ ] Validation du parcours de collecte et du reçu hors ligne ;
-   [ ] Validation du parcours de remise et de rapprochement ;
-   [ ] Définition des états de chargement, d'erreur, de synchronisation
    et de conflit ;
-   [ ] Tests avec des agents, caissiers et superviseurs ;
-   [ ] Vérification du contraste et de la lisibilité sur les appareils
    réellement utilisés.

## 13. Consigne de mise en œuvre

Cette documentation constitue le socle de branding et d'UX/UI extrait du
concept COOPECA V1.0. Elle doit guider la conception et
l'implémentation, sans inventer de règles métier absentes du document
source. Toute décision nouvelle --- notamment les couleurs de statut, la
typographie exacte ou les comportements non décrits --- doit être
documentée et validée avant d'être considérée comme une règle
officielle.
