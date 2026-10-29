# Guide de contribution — COOPECA

## Prérequis

- Node.js 22+
- npm
- Docker Desktop
- PostgreSQL 16 (via Docker)
- Git

## Workflow

1. Forker le dépôt
2. Créer une branche : `git checkout -b feature/ma-fonctionnalite`
3. Faire les modifications
4. Exécuter les tests : `npm test`
5. Vérifier la compilation : `npm run build`
6. Commiter : `git commit -m "feat: description"`
7. Pousser : `git push origin feature/ma-fonctionnalite`
8. Créer une Pull Request

## Conventions de code

### Backend (NestJS)
- TypeScript strict
- Montants en entiers XAF (BigInt), jamais de flottants
- Guards d'authentification et d'autorisation côté serveur
- Validation avec Zod
- Tests unitaires pour les règles métier
- Pas de secrets en dur

### Admin Web (React/Vite)
- TypeScript strict
- Composants fonctionnels avec hooks
- Styles via CSS classes (theme.css)
- Montants formatés en FCFA

### Mobile (Expo/React Native)
- TypeScript strict
- Composants fonctionnels
- Montants en entiers XAF
- Idempotence pour les opérations offline

## Règles métier non négociables

- Un cycle compte exactement 31 versements
- La commission vaut un versement fixe, pas un pourcentage
- Les montants sont des entiers XAF
- Les opérations sont idempotentes
- Les permissions sont vérifiées côté serveur
- Les données d'une agence ne sont pas accessibles à une autre sans autorisation

## Tests

### Backend
```bash
cd backend
npm test                    # Tests unitaires
npm run test:e2e            # Tests end-to-end
npm run build               # Compilation
```

### Admin Web
```bash
cd admin
npm run typecheck           # Vérification TypeScript
npm run build               # Build de production
```

### Mobile
```bash
cd mobile
npm run typecheck           # Vérification TypeScript
npm test                    # Tests Jest
```

## Sécurité

- Ne jamais commiter de secrets, mots de passe ou clés API
- Utiliser `.env` pour les variables d'environnement
- Fournir un `.env.example` sans secrets réels
- Ne jamais exposer le port PostgreSQL en production
- Vérifier l'authentification et les permissions côté serveur

## Documentation

- Mettre à jour le CHANGELOG pour toute modification significative
- Documenter les nouvelles décisions dans les ADR
- Mettre à jour le README si nécessaire