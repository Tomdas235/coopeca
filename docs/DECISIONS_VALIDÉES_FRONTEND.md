# Décisions validées — Frontend COOPECA

**Statut :** Validé par le produit le 19/10/2026.  
**Objet :** Consigner les 7 décisions ouvertes du frontend (mobile/README.md §105-112) pour ne pas les représenter.

---

## 1. Cycle de vie des dossiers — Validé

- Un dossier appartient à **un client** et **une agence**.
- **Un seul dossier ouvert par client et par agence** (APP_FLOW §6).
- Cycle de vie : `OUVERT` → `FERMÉ` → (réouverture uniquement par superviseur autorisé, avec motif + journal d'audit).
- Création hors ligne possible avec `référenceProvisoire` générée localement (format `DOSS-YYYYMMDD-seq`).
- Tant que le dossier n'est pas accepté par le serveur, il reste en attente (statut local `OUVERT`, pas encore sélectionnable pour une collecte confirmée serveur).

---

## 2. Numéro officiel de reçu vs `client_receipt_no` — Validé

- `client_receipt_no` (numéro officiel) est **alloué uniquement par le serveur** au moment de l'acceptation de la collecte (atomicité côté serveur, DECISIONS_METIER §4).
- Hors ligne, la collecte reçoit une **référence provisoire** lisible générée localement (format `REC-YYYYMMDD-seq`).
- L'interface affiche **toujours les deux** : référence provisoire (visible immédiatement) et numéro officiel (affiché uniquement après acceptation serveur, sinon badge « En attente »).
- La réimpression conserve les deux références.

---

## 3. Trois axes d'état — Validé

Trois enums indépendants, affichés par des badges séparés.

| Axis | Valeurs |
|------|---------|
| **Synchronisation** (`syncStatus`) | `DRAFT`, `PENDING`, `SYNCED`, `CONFLICT`, `ERROR` |
| **Métier** (`businessStatus`) | Dépend de l'entité :<br>• Collecte : `BROUILLON`, `ENREGISTRÉE_LOCAL`, `EN_ATTENTE`, `ACCEPTÉE`, `REJETÉE`, `CONFLIT`<br>• Remise : `DÉCLARÉE`, `EN_ATTENTE_CAISSIER`, `CONFIRMÉE`, `ÉCART`, `ANNULÉE`<br>• Clôture : `DÉCLARÉE_LOCAL`, `EN_ATTENTE`, `CONFIRMÉE`, `ROUVERTE` |
| **Impression** (`printStatus`) | `NON_IMPRIMÉ`, `IMPRIMÉ`, `RÉIMPRIMÉ`, `ERREUR_IMPRESSION` |

Règle d'affichage : une opération peut être `SYNCED` côté sync, `REJETÉE` côté métier, et `IMPRIMÉE` côté impression — les trois sont affichés indépendamment.

---

## 4. Matériel d'impression Bluetooth — Validé

- Aucun matériel spécifique n'est encore choisi ; aucune bibliothèque d'impression n'est installée (conforme à DECISIONS_METIER §4).
- Un composant `AperçuRecu` rend visuellement le reçu (pour test sur émulateur).
- La logique d'impression est isolée dans `src/services/printer.ts` (déjà squelette).

---

## 5. Contrat d'API — Validé

1. Chaque opération envoyée porte une **clé d'idempotence** (UUID v4 généré localement, stocké durablement).
2. Le serveur répond avec le même résultat et le même numéro officiel si la même clé est renvoyée (idempotence stricte).
3. En cas de conflit, le serveur renvoie `409` avec un motif ; le frontend conserve l'opération et affiche un écran de résolution (jamais de résolution silencieuse).
4. Les montants sont transmis en **entiers XAF** dans le corps JSON (jamais de flottant).
5. `dateHeureDeclairee` (horloge appareil) et `receivedAt` (instant serveur) sont deux champs distincts.

---

## 6. Identifiants de build et identité visuelle — Validé

- Bundle ID provisoire : `co.coopeca.mobile`.
- L'identité visuelle actuelle (`theme.ts`, couleurs `#0E3B5E` etc.) est explicitement **provisoire** (mobile/README.md §73, UX_UI_DESIGN §3). Elle ne doit pas être présentée comme officielle.
- Aucun secret en dur ; `.env` non versionné.

---

## 7. expo-sqlite et schéma local — Validé

- Installation d'`expo-sqlite` autorisée.
- Création du schéma local SQLite autorisée, après validation du modèle (ce document).
- Aucune modification du schéma SQL serveur v1.1 (`docs/COOPECA_Backend_Schema_v1.1.sql`) n'est effectuée par ce document.

---

> Règle : toute nouvelle décision frontend doit être ajoutée à ce document avant implémentation.
