# COOPECA — Parcours mobiles refondus

**Date** : 10/11/2026
**Périmètre** : navigation mobile, navigation d'agent, parcours clients, dossiers, collectes, menu.

---

## 1. Principes du parcours mobile

1. **Une action principale visible** : l'écran doit montrer ce que l'agent peut faire immédiatement.
2. **Un état explicite** : local, en attente, serveur, succès, conflit, erreur.

## 2. Écran `AccueilAgent`

### 2.1 Contenu

| Zone | Contenu |
|---|---|
| En-tête | Nom de l'agent, agence(s), statut de session |

## 3. Écran `Clients`

### 3.1 Contenu

- Liste de clients filtrée par agence.
- Recherche locale, tri, filtres par statut.

## 4. Écran `ClientDetail`

### 4.1 Contenu


## 5. Écran `ClientForm`

### 5.1 Contenu


## 6. Écran `Dossiers`

### 6.1 Contenu


## 7. Écran `DossierDetail`

### 7.1 Contenu

## 8. Écran `DossierFlow`

### 8.1 Contenu

## 9. Écran `Collectes`

### 9.1 Contenu

## 10. Écran `CollecteForm`


## 11. Écran `CollecteResult`


## 12. Écran `CollecteReceipt`


## 13. Écran `Menu`


## 14. Écran `Session`


## 15. Écran `Paramètres` ou `Settings`


## 16. Écran `Help`

### 16.1 Contenu

## 17. Écran `Suppression` / `Restore` (si nécessaire)


## 18. États globaux

| État | Comportement |
|---|---|
| `loading` | Cacher le contenu, afficher `LoadingState` |
| `error` | Afficher `ErrorState` + retry |
| `offline` | Afficher le panneau de sync, les données locales conservées |
| `sync_pending` | Bannière de sync, compteurs d'attente |
| `conflict` | Bannière de conflit, clic pour la résolution |
| `success` | Message court, retour à l'action |

### 17.1 Règles

- La suppression d'un client est différée.
- La restauration est possible uniquement si la suppression n'est pas encore validée.


- Guide rapide
- Documentation de l'application
- Contact
- Logs d'erreur (si nécessaire)

### 16.2 Règles

- Ne pas exposer des données internes sensibles dans les logs.
- Liberar un lien vers une documentation officielle après validation.

### 15.1 Contenu

- Langue
- Unité
- Notification
- Régler le réseau

### 15.2 Règles

- Aucun paramétrage sensible avant validation des rôles.
- La sauvegarde est locale, mais les paramètres métier doivent être validés par le serveur.

### 14.1 Contenu

- Identifiant, rôle, agences, dernier accès.
- Bouton de déconnexion.

### 14.2 Règles

- Afficher uniquement les informations autorisées.
- Lien vers `Paramètres` et `Menu`.

### 13.1 Contenu

- Profil agent
- Paramètres
- Synchronisation
- Aide
- Déconnexion

### 13.2 Règles

- Les actions sensibles (déconnexion) doivent être confirmation.
- Afficher le nombre d'opérations en attente.
- Montrer le statut du réseau.

### 12.1 Contenu

- Référence, client, date, montant, agent.
- Historique de l'opération.
- Bouton `Télécharger` ou `Imprimer`.

### 12.2 Règles

- Le reçu est formé par le backend, pas construit localement.
- L'impression est limitée aux agents habilités.

### 11.1 Contenu

- Message de succès ou d'erreur.
- Montant, client, dossier, référence.
- Status `ACCEPTED` si le serveur l'a confirmé.
- Bouton `Terminer` pour revenir à l'accueil.

### 11.2 Règles

- Afficher le statut côté client.
- Ne pas afficher de succès si la réponse du serveur est rejetée.
- Pour un conflit, présenter la résolution.

### 10.1 Contenu

- Sélecteur de client ou dossier.
- Montant.
- Date, hour, référence.
- Recommandation d'action.
- Bouton `Confirmer`.

### 10.2 Règles

- Le montant doit être un entier FCFA.
- La somme des versements doit respecter l'évolution du cycle.
- L'action est envoyée au backend avec une clé idempotente.


- Bouton `Enregistrer une collecte`.
- Sélecteur de client ou dossier.
- Affichage du client, du dossier, de l'opération.
- Saisie du montant.
- Bouton `Confirmer` (action définitive).

### 9.2 Parcours

1. `Collectes` → sélectionner un client/dossier.
2. Saisie du montant.
3. Vérifier la somme des versements et la disponibilité.
4. Confirmation.
5. Résultat.

### 9.3 États

- Chargement
- Résultat de l'opération
- Erreur de serveur
- Conflit
- Hors ligne
- Opération en attente
- Succès


- Navigation étape par étape :
  1. Sélection du client.
  2. Création du cycle.
  3. Ajout de versements.
  4. Sérialisation de la clôture.
  5. Suspendre/représenter.
  6. Historique des opérations.

### 8.2 Règles

- Un cycle ne peut être ouvert que si le dossier est ouvert.
- Les versements sont fixes et égaux au montant du cycle.
- Plusieurs versements peuvent avoir la même date.
- La commission est enregistrée une seule fois au premier retrait approuvé.


- Résumé du dossier : ID, client, statut, agence, marché, montant fixe.
- Bloc de progression : `i/31` versements, solde, commission, date.
- État du cycle (active, suspendu, clôturé).
- Actions rapides : `Nouveau cycle`, `Suspendre`, `Reprendre`, `Historique`.

### 7.2 Règles

- La progression visuelle doit être chiffrée et respecter les 31 versements.
- La colonne `Montant fixe` est affichée en FCFA, et non en XAF.
- Le solde doit être reflété par le journal des transactions.

- Liste des dossiers par agence/agent.
- Filtres : statut `OUVERT`, `FERME`, `REJETE`, `PROVISOIRE`, rechercher.
- Tri par date, identifiant, état.
- Nombre de dossiers réglable.
- Emplacement d'action : `Nouveau dossier`, `Ouvrir`, `Historique`.

### 6.2 Règles

- Un client ne peut avoir qu'un seul dossier ouvert.
- Un dossier ne doit pas pouvoir être créé si le client n'est pas `CONFIRME`.
- Un agent n'a accès qu'aux dossiers de son agence et de ses clients.

- Champs obligatoires : nom, prénom, téléphone, agence.
- Champs optionnels : coordonnées, adresse, département.
- Détection de doublon potentiel.
- Boutons : sauvegarde, annuler.

### 5.2 Règles

- La validation du formulaire est locale.
- Une erreur de validation n'est affichée que lorsque l'agent quitte le champ ou soumet.
- Enregistrement basé sur un `POST` local avec `cle_idempotence`.
- Après la confirmation serveur, le client devient `CONFIRME`.

- Nom, prénom, téléphone, statut, agence, marché.
- Statut `PROVISOIRE` avec option de revue.
- Historique des dossiers associés.
- Actions : dossier, collecte, suppression, mise à jour, revue.

### 4.2 Règles

- Ne pas afficher les informations confidentielles hors périmètre.
- La suppression est bloquée si des cycles ouvert s'y rapportent.
- Le statut `PROVISOIRE` ne doit pas être supprimé sans confirmation.

- Motif de doublon potentiel.
- Badge `PROVISOIRE` / `CONFIRME`.
- Action `Nouveau client` (ajout d'agent collecteur possible).

### 3.2 Parcours

1. `Clients` → liste.
2. Appuyez sur un client → `ClientDetail`.
3. Appuyez sur `+ Nouveau` → `ClientForm` en création.
4. `ClientForm` → validation locale + envoi serveur.
5. `ClientDetail` → préciser statut, historique, dossiers.

### 3.3 États

- Chargement
- Liste vide
- Erreur
- Hors ligne (données locales conservées)
- Doublon potentiel
- Conflit de doublon

| Bannière sync | État réseau, nombre d'attente, bouton retry |
| KPIs | Nombre de clients, dossiers actifs, collectes du jour, versements |
| Parcours principal | `Clients`, `Dossiers`, `Collectes` (ou menu `Menu`) |
| Historique | Activité récente des cycles |
| Accessoires | Module d'audit, aide, paramètres, déconnexion |

### 2.2 Règles d'usage

- Les valeurs chiffrées proviennent toujours du backend.
- Si la donnée est indisponible, afficher une valeur proche ou « — » avec un message de chargement.
- La section d'accueil n'est pas une vitrine ; elle doit présenter le parcours quotidien.

3. **Un retour immédiat** : la confirmation n'est pas affichée tant que l'opération n'est pas accepte par le serveur.
4. **Une persistance de saisie** : une erreur ne doit pas détruire la saisie, sauf si le contenu est invalide.
5. **Un retour tactile** : les zones de cible doivent être au moins 48 px.
6. **Une hiérarchie limpide** : les informations métier primaires sont au-dessus, les actions accessoires en-dessous.
