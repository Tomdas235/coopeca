# COOPECA — Points ouverts à trancher

**Date** : 10/11/2026

Ces points doivent être tranchés avant de figer les écrans et les états provisoires.

---

## 1. Identité visuelle

1. Validation de la palette `#123F35`, `#1F5B4B`, `#E7B84B`, `#F4F6F3`, `#23302B`.
2. Police officielle mobile et Web (système, embarquée, ou licence).
3. Icônes officielles et mixin entre `lucide-react` et `lucide-react-native`.
4. Logo et marque officielle.

## 2. Couleurs de statut

1. Définition des périmetres exacts et des codes finaux pour :
   - `PROVISOIRE`
   - `CONFIRME`
   - `EN ATTENTE`
   - `CONFLIT`
   - `ERREUR`
   - `NON MESURÉ`
   - `EN ATTENTE DE VALIDATION`
2. Validation du contraste avec les textes utilisés.

## 3. Typographie

1. Police et graisses pour mobile et Web.
2. Échelle de titres, corps, tendances.
3. Poids des données chiffrées et des montants.

## 4. Navigation mobile

1. Répartition exacte des onglets : Accueil, Clients, Dossiers, Collectes, Menu.
2. Fichier des éléments transparents, ajudide, aiders de session, paramètres, aide.
3. Décision si `Recus` reste dans la navigation ou devient un module dédié.

## 5. Navigation Web

1. Sidebar structurée et filtrage par agence.
2. Menu de roles.
3. Contrôles côté client pour le filtrage, la pagination et le tri.

## 6. Parcours métier

1. Parcours exact de collecte (étapes, champs, acceptation serveur).
2. Parcours exact de dossier (ouverture, suspension, reprise, clôture).
3. Parcours exact de retrait (partiel, total, commission, résolution).
4. Parcours exact de rapports et d'export.

## 7. Champs et données

1. Champs obligatoires et optionnels pour `Client`, `Dossier`, `Cycle`, `Collecte`, `Retrait`.
2. Règles de validation (longueur, format, plage).
3. Définition des références provisoires vs officielles.
4. Règles de doublon : revue ou fusion ? Qui décide ?

## 8. Synchronisation et états

1. Mesure fiable du réseau mobile.
2. Statut `NON MESURÉ` vs `OFFLINE` vs `PENDING`.
3. Modalité de résolution des conflits.
4. Conservation des données hors ligne après une erreur serveur.

## 9. Formulaires

1. Messages d'erreur francisés.
2. Champs obligatoires affichés.
3. Validation des montants FCFA.
4. Confirmation des actions sensibles.
5. Comportement de sauvegarde locale.

## 10. Audit et traçabilité

1. Vocabulaire des actions auditées.
2. Contenu de `beforeData`/`afterData`.
3. Expérience de lecture du journal.
4. Exigences d'impression.

## 11. Impressions et PDF

1. Modèle de reçu, de reçu de collecte, de facture de cycle.
2. Dimension d'impression, encodage, langue.
3. Dépôt d'impression sur mobile vs Web.

## 12. Accessibilité

1. Tokens de contraste.
2. Ordre de navigation.
3. Labels et `aria` pour Web.
4. Examen sur les appareils cibles.

## 13. Tests

1. Données de test identifiées (pas de données de production).
2. État de l'application pour les scénarios à 100% (agent, superviseur, caissier).
3. Liste des cas ouverts et des résolutions.

---

## 14. Priorité de validation

| Priorité | Points à valider |
|---|---|
| P0 | Palette, statuts, typographie, navigation principale mobile, parcours de collecte |
| P1 | Parcours de dossier, formulaires, états sync, conflit, retour d'erreur |
| P2 | Accessibilité, export, print, docs officielles |
