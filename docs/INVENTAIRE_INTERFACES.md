# COOPECA — Inventaire de référence des interfaces

**Statut :** document de travail. Aucune interface déclarée validée au-delà des sources. Ne modifie ni code, ni SQL v1.1, ni `schema.prisma` ; aucune migration.

**Conventions :** `MOB-xxx` = mobile Android (Expo Router), `WEB-xxx` = interface Web admin (`admin/`, React/Vite). **Origine :** `Documentée` (source explicite), `Déduite` (nécessaire au parcours, non nommée), `Squelette` (route posée, fonction non implémentée). Un écran compté une fois. Dialogues et états alternatifs rattachés au parent, **non comptés**. Statuts : `À concevoir`, `À développer`, `En cours`, `À tester`, `Terminé` (§0.4). **Mise à jour de l'état d'implémentation : 01/11/2026.**

## 0. Constats préalables

### 0.1 Documents consultés
- `AGENTS.md` ; `docs/APP_FLOW.md` v1.0 ; `docs/UX_UI_DESIGN.md` v1.0 ; `docs/DECISIONS_METIER.md` ; `docs/REÇUS_ET_DATE_METIER.md` ; `docs/IMPACTS_SCHEMA_SQL.md`.
- Binaires non dépouillés : 5 `.docx` dans `docs/` (non lisibles en texte brut ici).
- Absents du dépôt (UX §15) : `COOPECA_UX_UI_Design_Concept_v1.0.pptx`, `COOPECA_Wireframes_Ecrans_v1.0.pptx`, `COOPECA_Wireframes_Web_v1.0.pptx`, `COOPECA_Parcours_Web_Fonctionnels_v1.0.docx` — écrans issus de ces maquettes **non vérifiables**.

### 0.2 Routes mobile réelles (contenu lu)
Routes Expo Router présentes : `(auth)/login`, `(auth)/session`, `(tabs)/index`, `clients`, `dossiers`, `collectes`, `remises`, `cloture`, `cycles`, `composants` et `recus/[id]`. L'authentification peut appeler `POST /auth/sessions` et `GET /me`; un mode local de démonstration distinct existe. `cycles.tsx` consulte les marchés, un cycle et envoie des versements au backend. `clients.tsx` et certains écrans legacy utilisent les repositories locaux SQLite. La synchronisation générale et plusieurs workflows terrain restent incomplets; ne pas assimiler écran présent à parcours validé de bout en bout. Voir le [README mobile](../mobile/README.md).

### 0.3 Projet Web
L'application Web est dans `admin/` (React, TypeScript, Vite), servie en développement sur le port Vite et en production sous `/admin`. Elle couvre actuellement connexion, tableau de bord par rôle, clients en liste, marchés, cycles (vue limitée), remises historiques en lecture, gestion limitée des agents/agences, retraits en attente pour superviseur, et espaces comptable/caissier/auditeur. Les parcours détaillés restants dans cet inventaire ne sont pas réputés implémentés. Les maquettes Web officielles citées au §0.1 demeurent absentes.

### 0.4 Statuts
- `À concevoir` : spécification/maquettage restant.
- `En cours` : écran présent, mais sous-ensemble des actions ou états attendus seulement.
- `À tester` : code présent, mais parcours non vérifié dans l'environnement visé.
- `Terminé` : exigences et tests d'acceptation satisfaits; aucun écran Web n'est déclaré terminé par ce snapshot.
- État Web vérifié : WEB-001, WEB-002, WEB-003, WEB-009, WEB-014, WEB-015 et WEB-016 sont **En cours**. WEB-010 (confirmation caisse), WEB-004 à WEB-008 (dossiers, détails, collectes/reçus), WEB-011/012 (clôtures), WEB-013 (conflits), WEB-017/018 (audit/paramètres) restent **À concevoir** ou **À développer**, selon la fiche. Cette liste décrit le Web actuel, pas l'état des routes mobiles.

### 0.4.1 Couverture Web connue (01/11/2026)
| Surface | Routes/écrans constatés | Limite actuelle |
|---|---|---|
| Connexion et accueil | `/login`, `/` | Session réelle par API; accueil affiche profil/agences et raccourcis, pas de tableau de bord opérationnel multi-indicateurs. |
| Clients | `/clients` | Liste seulement; pas de recherche, détail ou revue des doublons dans l'admin. |
| Agents | `/agents`, API `/users` | CRUD limité aux comptes AGENT; modification nom/téléphone, activation/désactivation; pas de déplacement d'agence ni suppression physique. |
| Agences et marchés | `/branches`, `/markets` | CRUD agence limité et création marché; pas de suppression, réaffectation d'agents ou modification code/marché d'une agence. |
| Cycles et retraits | `/cycles`, `/withdrawals` | Le tableau cycles reste informatif/limité; la file retrait superviseur est consultable et permet décisions selon l'écran. |
| Remises historiques | `/remittances`, `/cashier` | Lecture seulement; aucune confirmation de caisse Web publiée dans ce lot. |
| Comptabilité/audit | `/accountant`, `/auditor` | Synthèse et rapprochement de cycles disponibles; audit général/export non présents. |

### 0.5 Terminologie
`APP_FLOW.md` §9 et `UX_UI_DESIGN.md` §10 : **remises** ; `remises.tsx` : **« Reversements »** ; registre : **remise**. Retenu : **« Remises (reversements) »** en attente d'arbitrage (§5.2).

## 1. Authentification et session

### MOB-001 — Connexion (mobile)
- **Rôle :** tous. **Objectif :** saisir identifiants, ouvrir fonctions autorisées (rôle + agence).
- **Actions :** saisir identifiant/mot de passe ; soumettre ; (à trancher) mémorisation, récupération.
- **États :** chargement ; erreur ; hors ligne (première connexion impossible, session existante selon politique à valider) ; accès refusé.
- **Dépendances :** session, agences, backend `auth`. **Source :** Documentée (APP_FLOW §4, UX §6) + implémentation (`(auth)/login.tsx`). **Statut :** En cours — login backend réel ou mode démo explicite; persistance sécurisée native et politique offline restent à faire. **Origine :** Documentée + Squelette.

### MOB-002 — Session / profil et déconnexion (mobile)
- **Rôle :** utilisateur connecté. **Objectif :** voir identité, agence, rôles ; gérer session (verrouillage, déconnexion, changement de compte).
- **Actions :** consulter profil ; se déconnecter ; (à trancher) changer d'agence, appareil perdu.
- **États :** hors ligne (derniers droits) ; accès refusé après révocation ; file non vide au changement de compte.
- **Dépendances :** MOB-001, politique de session, file de synchronisation. **Source :** Déduite (APP_FLOW §4 « À valider », §11 « changements de compte »). **Statut :** En cours — profil et déconnexion présents; persistance sécurisée Android, verrouillage, révocation et changements de compte restent à concevoir. **Origine :** Déduite.

### WEB-001 — Connexion (Web)
- **Rôle :** superviseur, caissier, comptable/contrôleur, administrateur, direction/auditeur. **Objectif :** authentifier les rôles de bureau.
- **Actions :** saisir identifiants ; soumettre ; récupération (à trancher).
- **États :** chargement ; erreur ; accès refusé. **Dépendances :** backend `auth`, rôles serveur. **Source :** Déduite (pré-requis APP_FLOW §12). **Statut :** En cours — login JWT réel pour les comptes actifs; récupération de mot de passe non disponible. **Origine :** Déduite.

## 2. Accueil et navigation

### MOB-003 — Accueil agent
- **Rôle :** agent. **Objectif :** activité du jour, état réseau/synchronisation, accès rapides.
- **Actions :** naviguer vers Clients, Dossiers, Collectes, Reversements, Clôture ; lire l'état de connexion.
- **États :** hors ligne (bannière) ; synchronisation en attente (compteur) ; vide ; erreur locale.
- **Dépendances :** modules mobile ; état réseau + file. **Source :** Documentée (APP_FLOW §3, UX §5) + implémentation (`(tabs)/index.tsx`). **Statut :** En cours — navigation et raccourcis présents; statistiques et état réseau sont informatifs/non mesurés. **Origine :** Documentée + Squelette.

### WEB-002 — Tableau de bord (accueil Web)
- **Rôle :** selon permissions. **Objectif :** synthèse multi-agence : volumes, clôtures, remises en attente, conflits.
- **Actions :** filtrer par agence/période ; naviguer vers modules ; exporter (à trancher).
- **États :** chargement ; vide ; erreur ; accès refusé par périmètre. **Dépendances :** tous modules Web ; accès serveur par agence. **Source :** Documentée (APP_FLOW §12, UX §11). **Statut :** En cours — profil, rôle, agences et accès rapides; les filtres/indicateurs de synthèse envisagés ne sont pas présents. **Origine :** Documentée.

## 3. Clients

### MOB-004 — Liste et recherche des clients
- **Rôle :** agent (périmètre autorisé). **Objectif :** retrouver un client, voir statut (dont `PROVISOIRE`), initier création/consultation.
- **Actions :** rechercher ; filtrer (à trancher) ; ouvrir le détail ; initier création.
- **États :** chargement ; vide ; hors ligne (locaux seuls) ; en attente (badge provisoire) ; erreur.
- **Dépendances :** MOB-005, MOB-006 ; base locale ; backend `clients`. **Source :** Documentée (APP_FLOW §5, UX §7) + implémentation locale (`(tabs)/clients.tsx`). **Statut :** En cours — consultation/création SQLite locale; synchronisation et acceptation serveur non terminées. **Origine :** Documentée + Squelette.

### MOB-005 — Détail d'un client
- **Rôle :** agent. **Objectif :** identité, statut de synchronisation, dossiers ; agir (nouveau dossier, nouvelle collecte).
- **Actions :** voir dossiers/statut ; naviguer vers dossier/collecte ; (à trancher) corriger selon droits.
- **États :** en attente ; conflit/rejet avec motif conservé ; accès refusé.
- **Dépendances :** MOB-004, MOB-007, MOB-010. **Source :** Déduite (APP_FLOW §5, UX §7 — aucun écran « détail » nommé). **Statut :** À concevoir. **Origine :** Déduite. **Note :** aucune route existante.

### MOB-006 — Création d'un client hors ligne
- **Rôle :** agent autorisé. **Objectif :** enregistrer sans connexion (statut `PROVISOIRE`, identifiant stable).
- **Actions :** saisir champs requis ; validation locale ; enregistrement durable.
- **États :** hors ligne (local explicite) ; validation champ par champ ; conflit/rejet ultérieur (MOB-005/MOB-019).
- **Dépendances :** MOB-004 ; revue des doublons §3.8 (téléphone normalisé + nom/prénom, sans fusion automatique) ; backend `clients`. **Source :** Documentée (AGENTS.md §3, APP_FLOW §5, UX §7) + implémentation SQLite locale. **Statut :** En cours — création locale provisoire; soumission/synchronisation backend et résolution de revue à compléter. **Origine :** Documentée.

### WEB-003 — Clients (liste et recherche)
- **Rôle :** superviseur, comptable/contrôleur, admin (lecture selon périmètre). **Objectif :** consulter clients et statut de validation/duplication.
- **Actions :** rechercher, filtrer par agence/statut ; ouvrir le détail ; examiner les doublons potentiels et, pour un superviseur habilité, décider une fusion auditée en conservant la fiche source comme alias.
- **États :** chargement ; vide ; erreur ; accès refusé. **Dépendances :** WEB-004, backend `clients`. **Source :** Documentée (APP_FLOW §12). **Statut :** En cours — liste affichée; filtres, recherche et détail/revue des doublons non présents. **Origine :** Documentée.

### WEB-004 — Détail d'un client (Web)
- **Rôle :** superviseur, comptable/contrôleur. **Objectif :** historique client : dossiers successifs, collectes, statut.
- **Actions :** parcourir dossiers et opérations ; consulter les alias et l’historique de fusion selon les droits.
- **États :** chargement ; vide partiel ; accès refusé. **Dépendances :** WEB-003, WEB-006. **Source :** Déduite (complément de WEB-003, non nommée). **Statut :** À concevoir. **Origine :** Déduite.

## 4. Dossiers de tontine

### MOB-007 — Liste des dossiers de tontine
- **Rôle :** agent. **Objectif :** voir dossiers autorisés et leur état (ouvert/fermé, en attente d'acceptation).
- **Actions :** rechercher/filtrer ; ouvrir le détail ; initier une création.
- **États :** hors ligne ; en attente ; conflit (`DOSSIER_DEJA_OUVERT`, conservé, revue) ; vide ; erreur.
- **Dépendances :** MOB-004/MOB-005, MOB-008, backend `dossiers`. **Source :** Documentée (APP_FLOW §6, UX §5/§8) + Squelette (`(tabs)/dossiers.tsx`, hors barre). **Statut :** À concevoir. **Origine :** Documentée + Squelette.

### MOB-008 — Détail d'un dossier
- **Rôle :** agent. **Objectif :** client, agence, état, collectes rattachées ; demander fermeture ; initier collecte.
- **Actions :** voir collectes et totaux ; initier collecte ; demander fermeture (dialogue confirmation + motif, non compté) ; suivre conflit.
- **États :** en attente d'acceptation ; conflit ; fermé (lecture seule) ; hors ligne ; accès refusé.
- **Dépendances :** MOB-007, MOB-010, backend `dossiers`. **Source :** Déduite (exigée par D-LOT-002/003/004, UX §8 ; non nommée). **Statut :** À concevoir. **Origine :** Déduite. **Note :** aucune route existante.

### MOB-009 — Création d'un dossier hors ligne
- **Rôle :** agent autorisé. **Objectif :** créer sans connexion (identifiant stable, attente serveur, idempotence).
- **Actions :** sélectionner client + agence ; saisir champs (montant journalier — champs définitifs à valider) ; enregistrement local.
- **États :** hors ligne ; validation ; unicité violée localement (avertissement, serveur arbitre) ; conflit ultérieur.
- **Dépendances :** MOB-005/MOB-007, D-LOT, backend `dossiers`. **Source :** Documentée (registre §3.12 D-LOT-001/002, §3.13 points 1 et 5 ; APP_FLOW §6). **Statut :** À concevoir. **Origine :** Documentée. **Note :** écran ou modal — compté une fois.

### WEB-005 — Dossiers (liste et recherche)
- **Rôle :** superviseur, comptable/contrôleur. **Objectif :** suivre dossiers par agence et état, successions et conflits.
- **Actions :** filtrer (agence, état, période) ; ouvrir le détail.
- **États :** chargement ; vide ; accès refusé. **Dépendances :** WEB-006, backend `dossiers`. **Source :** Documentée (APP_FLOW §12). **Statut :** À concevoir. **Origine :** Documentée.

### WEB-006 — Détail d'un dossier (Web)
- **Rôle :** superviseur, comptable/contrôleur. **Objectif :** cycle de vie (ouvertures, fermetures, réouvertures), collectes, audit.
- **Actions :** parcourir historique ; (à trancher) valider un rattachement, autoriser une réouverture.
- **États :** conflit affiché ; historique partiel ; accès refusé. **Dépendances :** WEB-005, WEB-013, WEB-017. **Source :** Déduite. **Statut :** À concevoir. **Origine :** Déduite.

## 4 bis. Cycles d'épargne à 31 versements

### MOB-021 — Consultation et versement sur un cycle
- **Rôle :** AGENT affecté au client; lecture selon les rôles du backend.
- **Objectif :** consulter compteur/solde et enregistrer un versement fixe sur un cycle existant.
- **Actions présentes :** liste de marchés actifs; saisie manuelle d'un UUID de cycle; lecture de progression; envoi d'un versement entier XAF.
- **États :** chargement/erreur API; cycle trouvé/non trouvé; montant invalide; versement accepté/rejoué; relecture de progression.
- **Dépendances :** session API, dossier/cycle déjà créé et agent affecté; backend `cycles`.
- **Source :** décision validée `DECISIONS_METIER.md` §3.15 et écran `mobile/app/(tabs)/cycles.tsx`.
- **Statut :** En cours — l'écran appelle des routes backend, mais ne couvre pas client → dossier → ouverture du cycle; la clé d'idempotence n'est pas conservée durablement par l'écran.
- **Écart de permission à corriger :** l'écran affiche encore un formulaire « Nouveau marché » dans le parcours agent, alors que le backend limite cette création à ADMIN/SUPERVISOR.

## 5. Collectes et reçus

### MOB-010 — Liste des collectes
- **Rôle :** agent. **Objectif :** suivre collectes du jour (client + dossier).
- **Actions :** filtrer (jour, client, dossier) ; ouvrir le détail ; initier saisie.
- **États :** hors ligne ; en attente ; conflit/rejet ; vide ; erreur.
- **Dépendances :** MOB-008, MOB-011, backend `collectes`. **Source :** Documentée (APP_FLOW §7, UX §9) + Squelette (`(tabs)/collectes.tsx`). **Statut :** À concevoir. **Origine :** Documentée + Squelette.

### MOB-011 — Saisie d'une collecte
- **Rôle :** agent. **Objectif :** enregistrer hors ligne : client + dossier affichés avant confirmation, montant entier XAF, date déclarée conservée.
- **Actions :** sélectionner client/dossier ; saisir montant et date déclarée ; confirmer ; générer reçu provisoire.
- **États :** hors ligne ; validation locale (montant entier, dossier fermé interdit) ; double soumission prévenue ; échec d'impression.
- **Dépendances :** MOB-008/MOB-010, MOB-012, backend `collectes`. **Source :** Documentée (APP_FLOW §7, UX §9, AGENTS.md §3–4). **Statut :** À concevoir. **Origine :** Documentée. **Note :** aucune route existante.

### MOB-012 — Détail d'un reçu
- **Rôle :** agent (présentation au client). **Objectif :** référence provisoire vs numéro officiel, trois axes d'état, aperçu avant impression.
- **Actions :** voir états métier/sync/impression ; copier/réimprimer (traçabilité) ; partager (à trancher).
- **États :** en attente (identification explicite) ; rejeté après impression (non masqué) ; impression réussie/échouée ; hors ligne.
- **Dépendances :** MOB-010/MOB-011, imprimante Bluetooth, backend `recus`. **Source :** Documentée (APP_FLOW §8, UX §9, REÇUS_ET_DATE_METIER) + Squelette (`recus/[id].tsx`, id de route seul). **Statut :** À concevoir. **Origine :** Documentée + Squelette.

### WEB-007 — Suivi des collectes et reçus
- **Rôle :** superviseur, caissier, comptable/contrôleur. **Objectif :** suivre collectes et reçus par agence, jour, état (provisoire/officiel).
- **Actions :** filtrer ; ouvrir le détail ; (à trancher) exporter.
- **États :** chargement ; vide ; accès refusé. **Dépendances :** WEB-008, backend `collectes`/`recus`. **Source :** Documentée (APP_FLOW §12). **Statut :** À concevoir. **Origine :** Documentée.

### WEB-008 — Détail d'une collecte / d'un reçu (Web)
- **Rôle :** superviseur, comptable/contrôleur. **Objectif :** dossier, montants, numéros (provisoire/officiel), états, audit.
- **Actions :** parcourir historique ; voir corrections/annulations (selon droits).
- **États :** rejet avec motif ; accès refusé. **Dépendances :** WEB-007, WEB-017. **Source :** Déduite. **Statut :** À concevoir. **Origine :** Déduite.

## 6. Reversements (remises)

### MOB-013 — Liste des remises (reversements)
- **Rôle :** agent. **Objectif :** suivre déclarations et réception par la caisse (deux confirmations distinctes).
- **Actions :** voir état (déclarée / reçue / écart) ; ouvrir le détail ; initier une déclaration.
- **États :** hors ligne ; en attente ; écart signalé ; vide ; erreur.
- **Dépendances :** MOB-014, MOB-015, backend `remises`. **Source :** Documentée (APP_FLOW §9, UX §10) + Squelette (`(tabs)/remises.tsx`, intitulé « Reversements »). **Statut :** À concevoir. **Origine :** Documentée + Squelette.

### MOB-014 — Déclaration d'une remise
- **Rôle :** agent. **Objectif :** sélectionner des collectes entières non remises, afficher total, enregistrer déclaration (éventuellement hors ligne).
- **Actions :** sélectionner collectes ; vérifier total ; confirmer.
- **États :** hors ligne ; sélection invalide (déjà remise) ; double soumission prévenue.
- **Dépendances :** MOB-010, MOB-013, backend `remises`. **Source :** Documentée (APP_FLOW §9 étapes 1–5, UX §10). **Statut :** À concevoir. **Origine :** Documentée. **Note :** aucune route existante.

### MOB-015 — Détail d'une remise (côté agent)
- **Rôle :** agent. **Objectif :** collectes incluses, total, déclaration — et, sans la confondre, réception caissier et écarts.
- **Actions :** consulter ; après synchronisation, demander une annulation motivée et auditée ou une opération compensatrice autorisée (pas de modification directe).
- **États :** en attente de réception ; écart documenté ; rejet ; hors ligne.
- **Dépendances :** MOB-013/MOB-014. **Source :** Déduite (UX §10 « détail et total, distinguer déclaration/confirmation »). **Statut :** À concevoir. **Origine :** Déduite. **Note :** aucune route existante.

### WEB-009 — Déclarations de remise (suivi)
- **Rôle :** caissier, superviseur, comptable. **Objectif :** suivre déclarations en attente de réception, par agent et agence.
- **Actions :** filtrer ; ouvrir le détail ; préparer la réception.
- **États :** chargement ; vide ; accès refusé. **Dépendances :** WEB-010, backend `remises`. **Source :** Documentée (APP_FLOW §12). **Statut :** En cours — consultation historique en lecture seule; réception caisse/écarts non implémentés dans le Web. **Origine :** Documentée.

### WEB-010 — Réception de caisse (confirmation)
- **Rôle réservé :** caissier (et habilités explicites). **Objectif :** vérifier fonds reçus, confirmer réception ou signaler écart — acte distinct de la déclaration.
- **Actions :** confirmer réception ; déclarer un écart (constatés vs attendus) ; pièce jointe (à trancher).
- **États :** écart constaté par le caissier, résolution en attente de validation superviseur ; accès refusé (non-caissier) ; erreur.
- **Dépendances :** WEB-009, backend `remises`, audit. **Source :** Documentée (APP_FLOW §9 étapes 6–8, AGENTS.md §3–4, registre r4). **Statut :** À concevoir. **Origine :** Documentée. **Note :** écran réservé, non dupliqué avec WEB-009.

## 7. Clôtures journalières

### MOB-016 — Clôture journalière (saisie et suivi)
- **Rôle :** agent. **Objectif :** enregistrer sa clôture hors ligne (récapitulatif, en attente signalées) et suivre son acceptation.
- **Actions :** voir le récapitulatif ; déclarer même hors ligne ; consulter le statut de rapprochement et les opérations manquantes.
- **États :** déclaration locale en attente ; rapprochement serveur différé si des opérations ne sont pas synchronisées ; rejet avec motif ; réouverture (lecture seule côté agent).
- **Dépendances :** MOB-010, MOB-013, MOB-019, backend `clotures`. **Source :** Documentée (APP_FLOW §10, UX §10, AGENTS.md §3) + Squelette (`(tabs)/cloture.tsx`). **Statut :** À concevoir. **Origine :** Documentée + Squelette.

### MOB-017 — Historique des clôtures (mobile)
- **Rôle :** agent. **Objectif :** consulter ses clôtures passées et réouvertures éventuelles.
- **Actions :** parcourir par date ; ouvrir le récapitulatif archivé.
- **États :** vide ; hors ligne (locales) ; réouverte (mention traçable).
- **Dépendances :** MOB-016. **Source :** Déduite (traçabilité UX §10 ; non nommée). **Statut :** À concevoir. **Origine :** Déduite. **Note :** à trancher : onglet de MOB-016 ou écran distinct — compté une fois.

### WEB-011 — Suivi des clôtures
- **Rôle :** superviseur, comptable/contrôleur. **Objectif :** suivre clôtures par agent, agence et jour ; repérer manquantes et réouvertures.
- **Actions :** filtrer ; ouvrir le détail ; demander une réouverture (WEB-012).
- **États :** manquante ; en attente ; réouverte ; accès refusé. **Dépendances :** WEB-012, backend `clotures`. **Source :** Documentée (APP_FLOW §12). **Statut :** À concevoir. **Origine :** Documentée.

### WEB-012 — Réouverture de clôture (superviseur)
- **Rôle réservé :** superviseur autorisé. **Objectif :** réouvrir avec motif obligatoire et audit.
- **Actions :** saisir motif (longueur minimale) ; confirmer (dialogue sensible, non compté) ; consulter le journal.
- **États :** accès refusé (non-superviseur) ; validation du motif. **Dépendances :** WEB-011, backend `clotures`, audit. **Source :** Documentée (AGENTS.md §3, APP_FLOW §10, registre r6). **Statut :** À concevoir. **Origine :** Documentée. **Note :** écran ou dialogue restreint — compté une fois ici.

## 8. Synchronisation et conflits

### MOB-018 — État de synchronisation (mobile)
- **Rôle :** agent. **Objectif :** voir ce qui est local, en attente, accepté, en conflit ou rejeté ; déclencher une synchronisation.
- **Actions :** voir la file ; relancer la synchronisation ; accéder à la résolution.
- **États :** hors ligne (file conservée) ; en cours ; vide (tout synchronisé) ; erreur réseau/reprise.
- **Dépendances :** tous modules métier ; `src/services/sync.ts` (squelette) ; backend `synchronisation`. **Source :** Documentée (APP_FLOW §11, UX §4 « bannière + composants »). **Statut :** À concevoir. **Origine :** Documentée. **Note :** aucune route existante — à trancher : écran dédié vs bannière + centre.

### MOB-019 — Résolution des conflits et rejets (mobile)
- **Rôle :** agent pour consulter et initier la résolution autorisée ; superviseur habilité pour décider une fusion client ou un arbitrage nécessitant une autorisation. **Objectif :** expliquer chaque conflit/rejet (motif conservé), annulation motivée ou succession, sans purge automatique.
- **Actions :** lire le motif ; annuler avec motif / proposer succession ; marquer résolu après acceptation serveur.
- **États :** conflit (`DOSSIER_DEJA_OUVERT`, doublon client) ; rejet définitif (parcours à valider) ; hors ligne (conservé jusqu'à résolution explicite).
- **Dépendances :** MOB-018, MOB-005/MOB-008, D-LOT-004, backend `synchronisation`. **Source :** Documentée (APP_FLOW §5/§11, UX §4, D-LOT-004). **Statut :** À concevoir. **Origine :** Documentée. **Note :** aucune route existante.

### WEB-013 — Conflits et rejets de synchronisation (suivi)
- **Rôle :** superviseur pour les décisions ; comptable/contrôleur en consultation et rapprochement selon ses droits. **Objectif :** suivre la file : doublons clients, secondes ouvertures, rejets définitifs.
- **Actions :** filtrer par type/agence ; faire traiter les conflits selon la matrice de base de [DECISIONS_METIER.md](./DECISIONS_METIER.md) §3.14 ; tracer les décisions en audit.
- **États :** vide ; accès refusé ; erreur. **Dépendances :** WEB-003/005/007, WEB-017, backend `synchronisation`. **Source :** Documentée (APP_FLOW §12). **Statut :** À concevoir. **Origine :** Documentée.

## 9. Agences et utilisateurs

### WEB-014 — Agences
- **Rôle réservé :** administrateur (lecture superviseur selon droits). **Objectif :** administrer agences, rattachements, autorisations d'accès (base de l'isolation).
- **Actions :** lister ; créer/modifier (selon droits) ; gérer rattachements et autorisations.
- **États :** accès refusé ; erreur ; vide. **Dépendances :** backend `branches`, accès serveur (AGENTS.md §4). **Source :** Déduite (multi-agences AGENTS.md §3–4). **Statut :** En cours — liste, création sur marché actif, coordonnées et activation/désactivation; code/marché immuables, pas de suppression ni d'affectation d'accès utilisateur depuis cet écran. **Origine :** Déduite.

### WEB-015 — Utilisateurs et rôles
- **Rôle réservé :** administrateur. **Objectif :** comptes, rôles (agent, superviseur, caissier, comptable, admin, direction), révocations.
- **Actions :** créer/désactiver ; attribuer rôles et agences ; révoquer une session.
- **États :** accès refusé ; erreur ; confirmation sensible. **Dépendances :** WEB-014, backend `users`/`auth`. **Source :** Déduite (APP_FLOW §2 « permissions exactes à valider », AGENTS.md §7). **Statut :** En cours — création/liste/modification limitée aux comptes AGENT; pas de CRUD de tous les rôles, révocation de jeton ou transfert d'agence. **Origine :** Déduite.

## 10. Rapports et audit

### WEB-016 — Rapports
- **Role :** direction/auditeur, comptable/controleur, superviseur (selon perimetre). **Objectif :** rapports d'activite : collectes, remises, clotures, ecarts, par agence et periode.
- **Actions :** choisir periode/agence ; comparer synthese et detail ; exporter (format a trancher).
- **Etats :** vide ; chargement ; totaux XAF et periodes visibles ; acces refuse. **Dependances :** WEB-007/009/011, backend (rapports a definir). **Source :** Documentee (APP_FLOW §12, UX §11). **Statut :** En cours — synthèse cycles et rapprochement pour ACCOUNTANT/AUDITOR; pas d'export ni de rapports legacy complets. **Origine :** Documentee.

### WEB-017 — Piste d'audit
- **Role :** auditeur/direction, administrateur (lecture restreinte). **Objectif :** tracer operations sensibles : corrections, annulations, reouvertures, arbitrages, confirmations de caisse.
- **Actions :** filtrer par acteur/operation/periode ; ouvrir le detail d'un evenement.
- **Etats :** vide ; acces refuse ; immuabilite rappelee. **Dependances :** tous modules ; backend `audit` (repertoire present, sans controleur). **Source :** Documentee (APP_FLOW §12, AGENTS.md §4, registre r6/D-LOT-003). **Statut :** A concevoir. **Origine :** Documentee.

## 11. Parametres et administration

### MOB-020 — Parametres de l'appareil (mobile)
- **Role :** agent. **Objectif :** imprimante Bluetooth, langue, rappels, stockage, securite locale (verrouillage).
- **Actions :** appairer/tester l'imprimante ; gerer le verrouillage ; voir espace et version.
- **Etats :** imprimante introuvable/echec d'impression ; hors ligne ; erreur.
- **Dependances :** MOB-012, `src/services/printer.ts` (squelette), chiffrement (a valider). **Source :** Deduite (UX §9-10 impression, APP_FLOW §11 chiffrement ; aucun ecran nomme). **Statut :** A concevoir. **Origine :** Deduite. **Note :** aucune route existante.

### WEB-018 — Parametres et administration (Web)
- **Role reserve :** administrateur. **Objectif :** parametres autorises : sequences de numerotation, motifs, seuils, mentions legales des recus.
- **Actions :** configurer ; tracer toute modification en audit.
- **Etats :** acces refuse ; confirmation sensible ; erreur de validation. **Dependances :** WEB-014/015/017. **Source :** Deduite (APP_FLOW §2 « parametres autorises » ; details a valider). **Statut :** A concevoir. **Origine :** Deduite.



## 12. Synthese et livrables

### 4.1 Comptes issus de l'inventaire de besoins
- **Références de besoins Android (MOB) : 21** — MOB-001 à MOB-021 (MOB-021 ajouté pour la décision cycle §3.15).
- **Références de besoins Web (WEB) : 18** — WEB-001 à WEB-018. Ce décompte décrit le périmètre fonctionnel prévu, pas le nombre de routes React.
- **Total de référence : 39 interfaces** (21 + 18). Dialogues et états alternatifs rattachés aux parents, **non comptés**.
- **Ecrans communs ou transversaux : 7 paires** — connexion (MOB-001/WEB-001) ; accueil (MOB-003/WEB-002) ; clients liste (MOB-004/WEB-003) ; client detail (MOB-005/WEB-004) ; dossiers liste (MOB-007/WEB-005) ; dossier detail (MOB-008/WEB-006) ; collectes/recus (MOB-010 + MOB-012 / WEB-007 + WEB-008). Sync (MOB-018/019 vers WEB-013) et clotures (MOB-016/017 vers WEB-011) : **transversales partielles**, non fusionnees.
- **État Web au 01/11/2026 :** 7 fiches WEB en cours (§0.4.1); elles ne sont pas déclarées terminées. Les autres besoins Web restent à concevoir/développer.
- **État mobile :** 11 routes utilisateur sont présentes, avec authentification réelle, une vue cycles partiellement connectée et plusieurs parcours locaux/legacy. Synchronisation générale, flux offline-vers-serveur complet et acceptation métier restent à développer/tester.

### 4.2 Fichiers consultes et verifications effectuees (reelles)
- Lus : `AGENTS.md` ; `docs/APP_FLOW.md` ; `docs/UX_UI_DESIGN.md` ; routes `mobile/app/**` ; sources des pages `admin/src/**` ; contrôleurs et services `backend/src/**` ; guides de permissions et rapport de tests.
- Non depouilles (binaires) : 5 `.docx` de `docs/` ; 4 sources UX §15 absentes du depot — signalees, non inventees.
- Parcours navigateur vérifiés le 01/11/2026 : comptes seed ADMIN, SUPERVISOR, ACCOUNTANT, CASHIER et AUDITOR; synthèse comptable/audit, caisse et file de retraits.
- Cette révision met à jour le statut documentaire seulement; aucun schéma SQL, migration ou seed modifié.

## 13. Ambiguites a arbitrer

### 5.1 Informations manquantes
1. Maquettes/parcours officiels absents (UX §15) : colonnes, filtres, exports, parcours web exacts inconnus.
2. Contenu des 5 `.docx` non exploite : a depouiller avant de figer WEB-001 a WEB-018.
3. Champs obligatoires, doublons (registre §3.8), references provisoire/officiel, mentions legales des recus, imprimante cible.
4. Permissions exactes par role (APP_FLOW §2), ecarts de remise, annulation/modification, pieces justificatives.
5. Session (duree, hors ligne, revocation, appareil perdu), chiffrement, calculs de cloture, reouverture.

### 5.2 Contradictions et points a trancher
1. **Lexique remise/reversement** (§0.5) : uniformiser avant maquettage.
2. **Dossiers hors barre d'onglets** (`href: null`) contre parcours central (APP_FLOW §6) : confirmer.
3. **Granularite** : creation = ecran contre modal ; MOB-017 onglet contre ecran ; MOB-018 dedie contre banniere ; WEB-012 ecran contre dialogue.
4. **Perimetre Web** conditionnel au parcours officiel absent (APP_FLOW §12).
5. **Couverture backend/Web partielle** : vérifier les contrôles d'agence et les permissions route par route avant d'étendre les écrans non listés comme opérationnels en §0.4.1.

## 14. Prochaine action recommandee
1. Depouiller les 5 `.docx` et recuperer les 4 sources §15, puis reviser l'inventaire (tout le Web).
2. Arbitrer lexique, navigation Dossiers et granularite.
3. Figer champs/permissions/session avant maquette detaillee.
