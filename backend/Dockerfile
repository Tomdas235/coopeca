# =====================================================================
# COOPECA backend — image de production (build multi-étages)
# ---------------------------------------------------------------------
# Étape 1 : compilation TypeScript + génération du client Prisma.
# Étape 2 : image minimale avec seules les dépendances de production.
# Aucun secret n'est câblé dans l'image : tout passe par l'environnement.
# =====================================================================

# --- Étape 1 : build ---
FROM node:22-alpine AS build
WORKDIR /app

# D'abord les manifests pour profiter du cache Docker des couches.
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci || npm install

COPY . .
RUN npm run build \
  && npm prune --omit=dev

# --- Étape 2 : exécution ---
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Utilisateur non-root pour l'exécution.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/package.json ./package.json
COPY --from=build --chown=appuser:appgroup /app/prisma ./prisma

USER appuser
EXPOSE 3000

# PORT est fourni par l'environnement ; aucun défaut secret ici.
CMD ["sh", "-c", "node dist/main.js"]
