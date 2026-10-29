# Tutoriel — Démarrage rapide COOPECA

## 1. Cloner le dépôt

```bash
git clone https://github.com/Tomdas235/coopeca.git
cd coopeca
```

## 2. Démarrer PostgreSQL et Redis (Docker)

```bash
docker compose -f infra/docker/compose.dev.yml up -d postgres redis
```

Vérifier :
```bash
docker compose -f infra/docker/compose.dev.yml ps
```

## 3. Configurer et démarrer le backend

```bash
cd backend
cp .env.example .env
# Éditer .env avec les valeurs locales
npm install
npm run prisma:generate
npm run build
npm run start:dev
```

Le backend écoute sur `http://localhost:3000/api/v1`.

## 4. Exécuter le seed (données de test)

```bash
cd backend
npx prisma db seed
```

Comptes créés :
- `admin` / `admin123` (ADMIN)
- `supervisor1` / `supervisor123` (SUPERVISOR)
- `accountant1` / `accountant123` (ACCOUNTANT)
- `auditor1` / `auditor123` (AUDITOR)
- `cashier1` / `cashier123` (CASHIER)
- `agent1` / `agent123` (AGENT)

## 5. Démarrer l'Admin Web

```bash
cd admin
npm install
npm run dev
```

Accessible sur `http://localhost:5173`. Le proxy Vite transmet `/api` vers `http://localhost:3000`.

## 6. Démarrer l'application mobile

```bash
cd mobile
npm install
npx expo start
```

- Chrome : `http://localhost:8081`
- Android emulator : `http://10.0.2.2:3000`
- Téléphone physique : `http://<IP-locale>:3000`

## 7. Vérifier la santé de l'API

```bash
curl http://localhost:3000/api/v1/health
# {"status":"ok","database":"up"}
```