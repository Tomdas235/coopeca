# COOPECA — Rapport de mise en place Docker et Proxy Vite

## 1. Architecture et ports effectifs

| Service | Conteneur | Port hôte | Port interne | Image |
|---|---|---|---|---|
| PostgreSQL | coopeca-postgres-dev | 5433 | 5432 | postgres:16-alpine |
| Redis | coopeca-redis-dev | 6379 | 6379 | redis:alpine |
| Backend NestJS | coopeca-api-dev | 3000 | 3000 | (build depuis backend/Dockerfile) |
| Admin Web Vite | (Windows) | 5173 | — | — |
| Expo Web | (Windows) | 8081 | — | — |

## 2. Fichiers créés ou modifiés

| Fichier | Action |
|---|---|
| `infra/docker/compose.dev.yml` | Modifié — ajout Redis, env_file, depends_on, REDIS_URL, port PostgreSQL 5433 |
| `backend/.env` | Modifié — DATABASE_URL port 5433, mot de passe corrigé |
| `backend/.env.example` | Modifié — port 5433, mot de passe corrigé |
| `admin/src/services/api.ts` | Modifié — base URL relative `/api/v1` pour le proxy Vite |
| `admin/vite.config.ts` | Déjà configuré — proxy `/api` → `http://localhost:3000` |

## 3. Configuration Docker

### Services
- **PostgreSQL** : port hôte 5433 (évite le conflit avec le PostgreSQL local sur 5432), volume persistant `coopeca_pgdata_dev`
- **Redis** : port hôte 6379, volume persistant `coopeca_redis_dev`
- **Backend** : port hôte 3000, build depuis `backend/Dockerfile`, dépend de PostgreSQL et Redis (healthcheck)

### Réseau
- Tous les services partagent le réseau Docker par défaut (`docker_default`)
- Le backend utilise `postgres:5432` et `redis:6379` (noms de service internes)
- Les ports de base de données ne sont exposés qu'en localhost

### Healthchecks
- PostgreSQL : `pg_isready`
- Redis : `redis-cli ping`
- Backend : `fetch('/api/v1/health')`

## 4. Proxy Vite

```typescript
// admin/vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
},
```

Le client HTTP (`admin/src/services/api.ts`) utilise maintenant `/api/v1` comme base URL relative, ce qui permet au proxy Vite de transmettre les requêtes au backend.

## 5. Configuration Expo

### URL API selon l'environnement

| Environnement | URL |
|---|---|
| Chrome sur Windows | `http://localhost:3000` |
| Émulateur Android | `http://10.0.2.2:3000` (défaut) |
| Téléphone physique | `http://<IP-locale>:3000` |

Configuration : créer `mobile/.env` avec `EXPO_PUBLIC_API_BASE_URL`.

Le proxy Vite ne s'applique pas au mobile — l'application mobile appelle directement le backend.

## 6. Tests exécutés

| Test | Résultat |
|---|---|
| `docker compose config` | ✅ Configuration valide, interpolation correcte |
| `docker build -t coopeca-backend .` | ⚠️ Bloqué — image `node:22-alpine` non disponible localement (réseau) |
| `docker pull node:22-alpine` | ⚠️ Bloqué — réseau Docker Hub inaccessible |
| `npm run build` (backend) | ✅ Compilation TypeScript réussie |
| `npm run typecheck` (admin) | ✅ Aucune erreur (avec node_modules) |
| Proxy Vite | ✅ Configuré, pas testé en runtime (backend non démarré en Docker) |

## 7. Problèmes rencontrés

1. **Image `node:22-alpine` non disponible** : Docker Hub est inaccessible depuis cet environnement. Le build du backend ne peut pas se faire en Docker sans cette image.
2. **Port 5432 occupé** : Un PostgreSQL local (PID 512) occupe le port 5432. Le port Docker a été déplacé vers 5433.
3. **Compilation lente** : `nest build` prend plusieurs minutes sur cet environnement.

## 8. Commandes de démarrage

### Docker (PostgreSQL + Redis + Backend)
```bash
cd "c:\Users\DATOM\OneDrive\Desktop\Tontine Project\coopeca"
docker compose -f infra/docker/compose.dev.yml up -d
```

### Admin Web (Vite)
```bash
cd "c:\Users\DATOM\OneDrive\Desktop\Tontine Project\coopeca\admin"
npm run dev
# Accessible sur http://localhost:5173
```

### Expo Mobile
```bash
cd "c:\Users\DATOM\OneDrive\Desktop\Tontine Project\coopeca\mobile"
npx expo start
# Chrome: http://localhost:8081
# Android emulator: http://10.0.2.2:3000
```

### Backend seul (sans Docker)
```bash
cd "c:\Users\DATOM\OneDrive\Desktop\Tontine Project\coopeca\backend"
npm run start:dev
# Accessible sur http://localhost:3000/api/v1
```

## 9. Vérifications manuelles restantes

1. Télécharger l'image `node:22-alpine` depuis Docker Hub (nécessite une connexion réseau)
2. Démarrer les conteneurs Docker et vérifier la santé de PostgreSQL, Redis et du backend
3. Tester le proxy Vite en accédant à l'Admin Web et en effectuant des appels API
4. Tester l'application mobile sur un émulateur Android
5. Vérifier que la connexion backend → PostgreSQL fonctionne avec le mot de passe configuré