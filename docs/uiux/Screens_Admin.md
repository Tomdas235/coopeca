# COOPECA — Parcours Admin Web refondus

**Date** : 10/11/2026
**Périmètre** : interface web admin, layout, tableau de bord, clients, dossiers, collectes, agents, agences, marchés, retraits, rapports, paramètres.

---

## 1. Principes Admin

1. **Un contrôle d'accès par route** : l'Admin ne voit que ce qui est autorisé par le backend.
2. **Un tableau de bord adapté au rôle** : Admin, Superviseur, Caissier, Comptable, Audit.
3. **Un tableau de bord avec compteurs et filtres** : les données doivent être fiables et détaillées.
4. **Un périmètre d'agence** : l'admin voit uniquement les agences de l'utilisateur à moins d'une permission explicite.

## 2. Layout Admin

### 2.1 Structure


## 3. Écran de connexion

### 3.1 Contenu


## 4. Tableau de bord

### 4.1 Contenu par rôle


## 5. Écran `Clients`

### 5.1 Contenu


## 6. Écran `ClientDetail`

### 6.1 Contenu

## 7. Écran `Dossiers`

### 7.1 Contenu

## 8. Écran `DossierDetail`

### 8.1 Contenu

## 9. Écran `Collectes`

### 9.1 Contenu

## 10. Écran `Retraits`


## 11. Écran `Agents`


## 12. Écran `Agences`


## 13. Écran `Marchés`


## 14. Écran `Rapports`


## 15. Écran `Paramètres`


## 16. Écran `Audit`


## 17. Écran `Conflits`


## 18. États globaux

| État | Comportement |
|---|---|
| `loading` | Indicateur global |
| `error` | Message d'erreur, bouton retry |
| `empty` | Tableau vide, suggestion d'action |
| `success` | Confirmation, retour |
| `conflict` | Bannière de conflit |
| `offline` | Notification du rôle, données locales |

### 17.1 Contenu

- Liste des conflits de synchronisation.
- Filtres par agence, statut, agent.
- Actions : `Ignorer`, `Résoudre`, `Voir`.

### 17.2 Règles

- Un conflit ne disparaît jamais sans résolution explicite.
- La résolution est auditée.

### 16.1 Contenu

- Liste des actions : date, action, agent, agence, objet, résultat.
- Filtres : période, acteur, entité, statut.
- Pagination.
- Téléchargement du journal.

### 16.2 Règles

- La piste d'audit est en lecture seule.
- Seul un audit peut consulter les entités de dessus.

### 15.1 Contenu

- Langue
- Unité
- Preférence de notification
- Gestion des sessions
- Contact support

### 15.2 Règles

- Aucun changement sensibles sans confirmation.
- Les paramètres d'agence doivent être vérifiés côté backend.

### 14.1 Contenu

- Filtres : période, agence, marché, domaine.
- Tableau des indicateurs : versements, retraits, commissions, marge.
- Export : CSV, PDF, JSON.

### 14.2 Règles

- Les rapports respectent le périmètre d'agence et de rôle.
- Les dates doivent être explicites.
- Les montants sont en FCFA.

### 13.1 Contenu

- Tableau des marchés : code, nom, statut, nombre d'agents, agences.
- Actions : `Activer/Désactiver`, `Modifier`, `Voir`.

### 13.2 Règles

- Un marché peut être activé pour une agence spécifique.
- L'activation est pour les rôles ADMIN/SUPERVISOR.

### 12.1 Contenu

- Tableau des agences : code, nom, marché, statut, agents.
- Actions : `Ajouter`, `Modifier`, `Désactiver`, `Voir agents`.

### 12.2 Règles

- L'activation d'une agence ne donne accès qu'aux utilisateurs dans les agences autorisées.
- Les marchés doivent être activés uniquement par les rôles ADMIN/SUPERVISOR.

### 11.1 Contenu

- Tableau des agents : nom, rôle, agence, activé, derniers accès.
- Filtres : agence, rôle, actif.
- Actions : `Activer/Désactiver`, `Modifier`, `Voir`, `Ajouter`.

### 11.2 Règles

- Le rôle ne peut pas être modifié par un agent.
- La désactivation est verrouillée pour les agents actifs.
- Un agent ne voit que ses agences.

### 10.1 Contenu

- Tableau des retraits en attente.
- Filtres par agence, agent, statut.
- Actions : `Approuver`, `Refuser`, `Voir`, `Reporter`.

### 10.2 Règles

- Seul un superviseur peut approuver.
- La commission est ajoutée lors de la première approbation.
- Les retraits partiels réutilisent la commission si le cycle n'a pas été clôturé.


- Tableau des collectes : date, client, dossier, montant, statut, agent, agence.
- Filtres : agence, statut, client, date, montant.
- Tri par colonne.
- Pagination.
- Actions : `Voir`, `Réimprimer`, `Exporter`.

### 9.2 Règles

- La collecte est visible, mais le montant est celui du cycle.
- L'opération est figée une fois confirmée.
- Les anciennes collectes sont visibles, mais sont séparées des nouvelles collectes.


- Informations du dossier
- Cycle actif
- Progression 31 versements
- Solde, commission, retraits
- Historique des opérations
- Actions : `Nouveau cycle`, `Suspendre`, `Reprendre`, `Fermer`, `Réouvrir`

### 8.2 Règles

- L'état du cycle est vérifié côté serveur.
- La progression est calculée à partir du journal, pas seulement du compteur.
- La commission est visible une seule fois.


- Tableau des dossiers : ID, client, statut, cycle, montant, nombre de versements, agence.
- Filtres : agence, statut, client, date, tranche de montant.
- Tri par colonne.
- Pagination.
- Actions : `Ouvrir`, `Voir`, `Fermer`, `Réouvrir`, `Voir historique`.

### 7.2 Règles

- Le dossier ne peut être modifié ou fermé que par les rôles autorisés.
- Chaque dossier a un statut métier et un statut de synchronisation. Ces deux états sont visibles.
- Un dossier fermé ne peut plus recevoir de nouvelle opération.


- Informations du client : nom, prénom, téléphone, statut, agence, marché.
- Statut `PROVISOIRE` avec attente de validation.
- Dossiers associés.
- Historique de la relation.
- Actions : `Nouveau dossier`, `Supprimer`, `Modifier`.

### 6.2 Règles

- La suppression est display seulement pour les rôles autorisés.
- Un client `PROVISOIRE` ne peut pas être utilisé pour ouvrir un cycle.
- L'agence reste visible, mais pas accessible sans permission.

- Tableau des clients : référence, nom, statut, agence, marché, créé le.
- Filtres : agence, statut, recherche par nom ou téléphone.
- Tri par colonne.
- Pagination.
- Actions : `Nouveau client`, `Voir détail`, `Modifier`, `Activer/Désactiver`.

### 5.2 Règles

- Les clients `PROVISOIRE` sont visibles avec un badge.
- Les clients doivent être filtrés par agence.
- Un double client ne doit pas être fusionné automatiquement ; il déclenche une revue.

#### Admin

- Synthèse générale : clients, dossiers actifs, versements par jour, retraits.
- Gestion rapide : clients, agents, agences, marchés.
- Statistiques par agence.

#### Superviseur

- Aperçu des dossiers à surveiller.
- Listes des retraits en attente.
- Dossiers en conflit.
- Détails opérationnels par agence.

#### Caissier

- Retraits en attente de confirmation.
- Derniers reçus et montants répartis.
- Écarts constatés par rapport aux plafonds.

#### Comptable

- Rapprochement, récapitulatifs, commissaires, dossiers.
- Historique des opérations.

#### Audit

- Piste d'audit.
- Conflits de synchronisation.
- Signalement d'agents ou d'agences.

- Logo, titre, sous-titre.
- Identifiant, mot de passe.
- Validation, état de chargement, erreur.
- Lien `Mot de passe oublié`.
- Champs obligatoires.

### 3.2 Règles

- Le mot de passe est masqué.
- Les erreurs sont gérées au niveau session, et non par un retour d'erreur local.
- Le bouton est désactivé pendant l'authentification.

- **Sidebar** : navigation principale, avec sections.
- **Navbar** : recherche, profil, heure, statut de synchronisation, déconnexion.
- **Contenu** : tableaux, formulaires, détails, vues par rôle.

### 2.2 Règles

- Le sidebar est masqué sur mobile et remplacé par un menu over.
- La navbar est visible sur desktop et tablette.
- L'espace de travail est en grille responsive.
- Aucun formulaire n'est permanent à l'écran sans validation.

5. **Une transactionabilité** : les actions sensibles affichent une confirmation et un motif d'audit.
