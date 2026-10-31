# Guide des rôles et permissions — COOPECA

## Rôles disponibles

| Rôle | Niveau | Description |
|---|---|---|
| ADMIN | 6 | Administration complète (comptes, rôles, paramètres) |
| SUPERVISOR | 5 | Validation des retraits, gestion des conflits, réouverture de clôtures |
| ACCOUNTANT | 4 | Consultation et rapprochement financier |
| AUDITOR | 3 | Audit en lecture seule |
| CASHIER | 2 | Confirmation de réception des remises, constat d'écarts |
| AGENT | 1 | Opérations courantes sur ses clients/dossiers |

## Hiérarchie

```
ADMIN (6) > SUPERVISOR (5) > ACCOUNTANT (4) > AUDITOR (3) > CASHIER (2) > AGENT (1)
```

La hiérarchie numérique est indicative. Les permissions réelles sont vérifiées côté serveur par rôle exact, pas par niveau.

## Permissions par rôle

### AGENT
- Créer des clients (statut PROVISOIRE)
- Ouvrir des cycles pour ses clients affectés
- Enregistrer des versements
- Demander des retraits
- Déclarer des remises

### CASHIER
- Consulter les remises de caisse
- Confirmer la réception des remises
- Constater et documenter les écarts
- Consulter l'historique des mouvements

### SUPERVISOR
- Valider/rejeter les retraits
- Traiter les conflits et fusions de doublons
- Valider la résolution des écarts
- Rouvrir les clôtures
- Affecter les clients à un marché et agent

### ACCOUNTANT
- Consulter la synthèse financière
- Consulter le rapport de rapprochement
- Filtrer par agence et période

### ADMIN
- Toutes les permissions ci-dessus
- Administrer les comptes et rôles
- Gérer les marchés et agences
- Configurer les paramètres système

### AUDITOR
- Consulter les opérations financières (lecture seule)
- Examiner les journaux d'audit
- Consulter les retraits, commissions et remises
- Repérer les écarts de rapprochement
- Filtrer et exporter les résultats

## Cloisonnement des agences

- Chaque utilisateur a accès à un ou plusieurs agences via `user_branch_access`
- Les identifiants d'agence fournis par le frontend ne constituent jamais une preuve d'autorisation
- Les guards vérifient l'accès côté serveur pour chaque requête
- Un utilisateur ne peut pas accéder aux données d'une agence étrangère à son périmètre

## Endpoints par rôle

| Endpoint | Rôles autorisés |
|---|---|
| `GET /api/v1/health` | Public |
| `POST /api/v1/auth/sessions` | Public |
| `GET /api/v1/me` | Authentifié |
| `GET /api/v1/markets` | Authentifié |
| `GET /api/v1/markets/admin` | ADMIN, SUPERVISOR |
| `GET /api/v1/users?role=AGENT` | ADMIN |
| `GET /api/v1/users/:id` | ADMIN |
| `POST /api/v1/users/agents` | ADMIN |
| `PATCH /api/v1/users/:id` | ADMIN (agent uniquement) |
| `GET /api/v1/branches` | ADMIN |
| `POST /api/v1/branches` | ADMIN |
| `PATCH /api/v1/branches/:id` | ADMIN |
| `POST /api/v1/markets` | ADMIN, SUPERVISOR |
| `POST /api/v1/clients/:id/cycle-assignment` | ADMIN, SUPERVISOR |
| `GET /api/v1/tontine-cycles/:id` | AGENT (affecté), ADMIN, SUPERVISOR, ACCOUNTANT, AUDITOR |
| `POST /api/v1/tontine-cycles/:id/deposits` | AGENT (affecté) |
| `POST /api/v1/tontine-cycles/:id/withdrawals` | AGENT (affecté) |
| `GET /api/v1/withdrawals/pending` | SUPERVISOR |
| `POST /api/v1/withdrawals/:id/review` | SUPERVISOR |
| `GET /api/v1/financial-summary` | ADMIN, SUPERVISOR, ACCOUNTANT, AUDITOR |
| `GET /api/v1/reconciliation-report` | ADMIN, SUPERVISOR, ACCOUNTANT, AUDITOR |
| `GET /api/v1/remittances` | Authentifié |

La gestion des agents permet la création, la consultation, la modification du nom/téléphone et la désactivation/réactivation. La suppression physique d'un compte est volontairement absente: les références historiques et financières doivent rester valides. Une mutation d'agent est auditée. L'agence principale est attribuée à la création et n'est pas modifiable depuis ce CRUD, afin d'éviter de déplacer implicitement les dossiers et opérations historiques.

Les remises sont exposées en lecture historique seulement dans ce parcours. La création HTTP de remise n'est pas publiée tant que son contrat n'apporte pas de clé idempotente et ne respecte pas les décisions canoniques du nouveau parcours de cycles.

La gestion des agences permet la consultation globale, la création liée à un marché actif, la modification du nom et des coordonnées, et l'activation/désactivation. Le code et le marché ne sont pas modifiables après création; la suppression physique est exclue pour conserver les références historiques. Chaque mutation est inscrite dans le journal d'audit.