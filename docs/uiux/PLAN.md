# COOPECA — Plan d'audit et de refonte UI/UX

> **Périmètre** : revue de l'interface mobile (`mobile/`, React Native/Expo), de l'interface Web admin (`admin/`, React/Vite) et de la couche de composants front communs. Contexte métier et techniques : `docs/DECISIONS_METIER.md`, `docs/UX_UI_DESIGN.md`, `docs/APP_FLOW.md`, `docs/INVENTAIRE_INTERFACES.md`, `docs/COOPECA_Branding_UIUX_Guidelines_v1.md`.
>
> **Règle d'audit** : aucun écran, composant ou route ne peut être qualifié « fonctionnel » tant que le parcours complet jusqu'à la persistance serveur n'est pas démontré. Cet audit est un instantané du code et des documents lus le 10/11/2026.

---

## 1. Synthèse exécutive

Cet audit propose une refonte UI/UX de COOPECA en plusieurs lots mesurables. L'état actuel est un squelette cohérent visuellement mais sans hiérarchie, sans système de composants, sans états de chargement unifiés, sans tableaux finis et sans maquettes officielles exploitables en mode éditeur.

### 1.1 Ce qui est démontré

- **Mobile** : navigation Expo Router, composants de base (`InputTexte`, `InputMontantXAF`, `Selecteur*`, `AppButton`, statuts, états vides/chargement/erreur), thème partiel, tests unitaires des composants de saisie.
- **Admin** : layout avec sidebar et navbar, pages de dashboard par rôle, listes clients et cycles, administration marchés/agences/agents, espaces comptable/caissier/auditeur, gestion des retraits en attente.
- **Backend** : contrôle d'accès par rôle et par branche, transactions sérialisables, règles de cycle à 31 versements, écriture audit, gestion des dossiers (création, liste, fermeture, réouverture), modules support `health`, `auth`, `cycles`, `clients`, `branches`, `dossiers`, `clotures`, `remittances`, `synchronisation`.
- **Infrastructure** : `.env.example`, Docker Compose de dev, validation Prisma, scripts de seed.

### 1.2 Ce qui manque ou est non démontré

- **Système de composants réutilisables** : pas de librairie UI partagée, pas de tokens de design system auxquels les écrans adhèrent.
- **Tableaux et listes complexes** : fichiers pages actuellement limités aux listes simples; manque tri, filtres, pagination, états vides eterreurs, pagination par défaut, compréhension du périmètre d'agence.
- **Parcours de collecte édité** : présent en appareil ou en interface, mais sans écran de navigation de collecte par dossier/client, état d'enregistrement local vs acceptation serveur, reçu, ou état de synchronisation.
- **Navigation mobile** : accueil, clients, dossiers, collectes, menu, profil, synchronisation, aide, paramètres/non officiels.
- **Gestion des états hors ligne** : règles de confirmation, réessai, conflit et préservation de saisie non formalisées dans une couche UI.
- **Rapports et tableaux de bord opérationnels** : présents par rôles mais sans contraintes de périmètre d'agence, de hiérarchie des indicateurs et de filtrage temps réel.
- **Accessibilité et responsive** : axes définis dans le concept mais non validés sur appareil.
- **Maquettes officielles** : `COOPECA_UX_UI_Design_Concept_v1.0.pptx`, `COOPECA_Wireframes_Ecrans_v1.0.pptx`, `COOPECA_Wireframes_Web_v1.0.pptx` et `COOPECA_Parcours_Web_Fonctionnels_v1.0.docx` sont binaires et non dépouillés dans ce dépôt.
- **Champs obligatoires, doublons, références provisoires/officielles, mention légale, imprimante cible** : à trancher avant de figer les écrans Web.

---

## 2. Séparation des responsabilités

| Livrable | Contenu | Croisements recommandés |
|---|---|---|
| `UX_AUDIT.md` | Audit complet, problèmes, priorités | ce document |
| `Navigation_Architecture.md` | Routes, tabs, dessus/derrière, permissions | `Design_System.md` |
| `Design_System.md` | Palette, typographie, espace, composants | `Navigation_Architecture.md` |
| `Composants.md` | Composants créés/réutilisés, états | `Navigation_Architecture.md` |
| `Screens_Mobile.md` | Parcours mobile | `Design_System.md` |
| `Screens_Admin.md` | Parcours Web | `Design_System.md` |
| `Tests.md` | Couverture et cas de non-régression | `Screens_Mobile.md`, `Screens_Admin.md` |
| `Open_Questions.md` | Incertitudes métier et technique | `UX_AUDIT.md` |

---

## 3. Méthode de travail

- Procéder par étapes vérifiables.
- Ne pas créer toutes les fonctionnalités en une seule fois.
- Avant chaque étape, expliquer brièvement le plan.
- Écrire des tests pour les règles UI/UX importantes.
- Exécuter les tests et corriger les erreurs avant de conclure une étape.
- Mettre à jour le README et les instructions de lancement.
- Fournir un résumé des fichiers créés ou modifiés à chaque étape.
- Ne pas supprimer de données ni lancer de migration destructive sans accord explicite.

---

## 4. Jugement de faisabilité par rapport aux contraintes techniques

| Contrainte | Impact visuel | Résolution |
|---|---|---|
| Mobile Expo/RN | Pas de webview native proche | Composants RN, pas de CSS tiers hypothétique |
| Admin Vite/React | Web moderne, responsive | CSS Modules ou fichier de thème CSS doté de variables |
| Backend NestJS/Prisma/Postgres | Pas de changement visible UI | Lier les écrans aux contrôles d'accès réels |
| Historique legacy | Ne pas modifier les anciens flux | Séparer clairement état métier et état historique |
| Montants FCFA entiers | Format libre et auteur | Un seul composant `InputMontantXAF` et traiteur de formatage partagé |
| Offline mobile | États locaux, en attente, serveur à distinguer | Bannière de synchronisation, colonne d'état, bouton retry |
