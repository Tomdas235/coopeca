# Changelog

Toutes les modifications notables du projet COOPECA sont documentées ici.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

## [Non publié]

### Ajouté
- Module ACCOUNTANT dans l'Admin Web : dashboard comptable, synthèse financière, rapport de rapprochement
- Endpoints backend `GET /financial-summary` et `GET /reconciliation-report`
- Rôles CASHIER et AUDITOR : dashboards dédiés, routes et navigation
- Documentation structurée : changelog, ADR, tutoriels, guides, contributing
- Docker Compose : ajout Redis, correction port PostgreSQL (5433), env_file
- Vite proxy : base URL relative `/api/v1` pour l'Admin Web

### Corrigé
- `ROLE_HIERARCHY` : ajout des rôles manquants (AUDITOR, CASHIER)
- `ClientsModule` : import de `AuthModule` pour résoudre `AuthGuard`
- `cycles.controller.ts` : import de `Query` manquant
- `MainLayout` : accepte `children` au lieu de `<Outlet />`
- `Dashboard.tsx` : import `api` et `apiErrorToMessage` manquants
- `WithdrawalsPending.tsx` : guillemets échappés `\"` → `"`
- `Clients.tsx`, `Cycles.tsx`, `Markets.tsx`, `Remittances.tsx` : `colSpan` string → number
- `AccountantDashboard.tsx` : réécriture complète (JSX valide)
- `seed.ts` : mots de passe scrypt, comptes de test pour tous les rôles
- `seed-demonstration.ts` : corrections lint et imports
- Mot de passe PostgreSQL aligné avec le conteneur existant
- `backend/.env` : port 5433, mot de passe corrigé

### Sécurité
- `.gitignore` créé pour ignorer `.env` et `node_modules`
- `infra/docker/.env` retiré du suivi Git
- Aucun secret en dur dans le code

## [0.1.0] - 2026-10-23

### Ajouté
- Squelette backend NestJS + Prisma + PostgreSQL
- Module d'authentification (JWT Bearer, 15 min)
- Module cycles de tontine (31 versements)
- Module clients et marchés
- Interface Admin Web (React/Vite)
- Application mobile (Expo/React Native)
- Documentation technique (DECISIONS_METIER, CONCEPTION_MODELE_DONNEES, etc.)