# Guide de démarrage Docker

## Prérequis
- Docker Desktop installé et démarré
- Node.js 22+ installé
- npm installé

## Démarrage

### 1. PostgreSQL + Redis (Docker)
```bash
cd "c:\Users\DATOM\OneDrive\Desktop\Tontine Project\coopeca"
docker compose -f infra/docker/compose.dev.yml up -d postgres redis
```

### 2. Backend (Windows, sans Docker)
```bash
cd backend
npm install
npm run prisma:generate
npm run build
npm run start:dev
```

### 3. Admin Web (Vite)
```bash
cd admin
npm install
npm run dev
```

### 4. Mobile (Expo)
```bash
cd mobile
npm install
npx expo start
```

## Ports

| Service | Port |
|---|---|
| PostgreSQL (Docker) | 5433 |
| Redis (Docker) | 6379 |
| Backend NestJS | 3000 |
| Admin Web Vite | 5173 |
| Expo Web | 8081 |

## Variables d'environnement

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://coopeca:coopeca_dev_password@localhost:5433/coopeca?schema=public&sslmode=disable
JWT_SECRET=<secret-aléatoire-32-caractères>
PORT=3000
```

### Docker (`infra/docker/.env`)
```
POSTGRES_USER=coopeca
POSTGRES_PASSWORD=coopeca_dev_password
POSTGRES_DB=coopeca
```

## Dépannage

### Port 5432 occupé
Un PostgreSQL local peut occuper le port 5432. Le Docker utilise 5433 pour éviter le conflit.

### Image node:22-alpine non disponible
Le build Docker du backend nécessite cette image. Si Docker Hub est inaccessible, lancez le backend directement sur Windows.

### PostgreSQL indisponible
Vérifiez que le conteneur `coopeca-db` est en cours d'exécution :
```bash
docker ps | findstr coopeca-db
```