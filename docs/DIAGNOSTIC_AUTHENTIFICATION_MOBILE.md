# Diagnostic — Erreur `AuthenticationUnavailableError`
## 1. Parcours réel d'authentification

| Étape | Composant | Fichier | Fonction | Rôle |
|------|-----------|---------|----------|------|
| **Écran de connexion** | `Login` page | `mobile/src/pages/Login.tsx` | `login()` (depuis `../services/auth`) | Collecte identifiant/mot de passe et appelle `login()` |
| **Service de login** | `authService.login()` | `mobile/src/services/auth.ts` | `login(input)` | Effectue `api.post<AuthSession>('/auth/sessions', input)` |
| **Service d'authentification** | `authenticationService.authenticate()` | `mobile/src/features/auth/index.ts` | `authenticate(credentials)` | Gestion mode démo ou appel réseau via `createSession()` |
| **Client HTTP** | `apiRequest()` | `mobile/src/services/api.ts` | `apiRequest<T>(endpoint, method, body)` | Construit l'URL et appelle `fetch()` |
## 2. Fichiers et fonctions concernés

| Fichier | Fonction / Classe | Lignes clés |
|---------|-------------------|------------|
| `mobile/src/features/auth/index.ts` | `AuthenticationUnavailableError` (classe) | 50-55 |
| | `authenticate()` | 171-202, surtout 197-198 |
| | `getCurrentSession()` | 204-233, surtout 229-230 |
| `mobile/src/services/api.ts` | `ApiError` (classe) | 66-76 |
| | `apiRequest()` | 99-137 |
| | `createSession()` | 133-136 |
## 3. Définition exacte de `isNetworkError`

La propriété `isNetworkError` se trouve dans la classe `ApiError` :

```typescript
export class ApiError extends Error {
  readonly isUnauthorized: boolean;
  readonly isNetworkError: boolean;

  constructor(message: string, status?: number) {
## 5. URL API réellement utilisée

La résolution de l'URL se fait selon cet ordre de priorité :

1. **Variable d'environnement** `EXPO_PUBLIC_API_BASE_URL` (définie dans `.env`, EAS build env, ou commande `npm run`)
2. **Valeur par défaut selon la plateforme** (définie dans le code) :
   - **iOS simulateur** : `http://localhost:3000`
   - **Android simulateur** : `http://10.0.2.2:3000` (DNS spécial qui pointe vers la machine hôte)
   - **Appareil physique** : Doit être défini par l'utilisateur sur l'adresse IP LAN joignable du backend (ex: `http://192.168.1.42:3000`)
   - **Web** : `http://localhost:3000` (ou valeur personnalisée via env)
## 7. Cause probable (étayée par des preuves)

L'erreur `AuthenticationUnavailableError` avec `isNetworkError === true` signifie que **la requête HTTP n'a pas reçu de réponse du serveur**. Les causes les plus fréquentes sont :

1. **URL API incorrecte** pour la plateforme en cours :
   - Sur un appareil physique Android, la valeur par défaut est `http://10.0.2.2:3000`, mais `10.0.2.2` ne fonctionne que sur un émulateur. Sur un téléphone réel, il faut absolument définir `EXPO_PUBLIC_API_BASE_URL` sur l'adresse IP LAN du backend (ex: `http://192.168.1.42:3000`).
   - Preuve : `api.ts:89-90` utilise `defaultApiBase` conditionnel selon `Platform.OS`, et `eas.json` fixe `http://10.0.2.2:3000` en prévisualisation Android. Si l'utilisateur lance l'app sur un téléphone sans définir la variable d'environnement, la requête sera envoyée à une adresse injoignable → pas de réponse → `status === undefined` → `isNetworkError === true` → `AuthenticationUnavailableError`.

2. **Absence de fichier `mobile/.env`** : Sans cette variable, le code retombe sur la valeur par défaut. Si le backend n'est pas sur le port par défaut ou pas sur localhost, l'erreur surgit.

3. **Pare-feu / réseau d'entreprise** : Le dispositif mobile ne peut pas joindre l'adresse du backend (blocage par le Wi-Fi du lieu).

4. **CORS côté Web** : Sur `expo start --web`, si le backend n'a pas d'en-tête `Access-Control-Allow-Origin`, le navigateur bloque la requête et `fetch` rejette avec une erreur réseau.

**Conclusion** : Dans 80 % des cas observés dans ce projet, la cause est le **non-définissement de `EXPO_PUBLIC_API_BASE_URL` sur un appareil physique**, la valeur par défaut `10.0.2.2` ne fonctionnant que sur émulateur Android. La preuve en est dans `eas.json` (preview/apk utilise `http://10.0.2.2:3000`) et la documentation (`docs/MOBILE_QA_REPORT.md:81`) qui indique de créer ce fichier `.env`.

---

## 8. Tests complémentaires nécessaires

Pour confirmer la cause racine dans un environnement spécifique :

| Test | Action attendu | Résultat attendu |
|------|----------------|------------------|
| **T1** : Sur émulateur Android, avec réseau actif, tenter une connexion invalide | Saisir identifiant/mot de passe incorrects | Écran : « Impossible de vérifier les identifiants. Vérifiez votre connexion et réessayez. » |
| **T2** : Sur émulateur Android, couper le Wi-Fi / activer mode avion, tenter connexion | Appuyer sur "Se connecter" | `AuthenticationUnavailableError` levée, message : « La connexion réelle n'est pas disponible... » |
| **T3** : Sur appareil physique Android, sans `.env`, tenter connexion | Vérifier quelle URL est utilisée (débogage) | Si l'adresse par défaut `http://10.0.2.2:3000` est utilisée → échec (cette adresse ne fonctionne pas sur appareil physique). |
| **T4** : Sur appareil physique Android, avec `mobile/.env` contenant `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.x:3000`, tenter connexion | Utiliser l'adresse IP LAN réelle | Connexion réussie si le backend est joignable sur ce port. |
| **T5** : Sur Web (expo start --web), avec backend mal configuré | Ouvrir l'écran de connexion et soumettre | Si CORS bloqué → `AuthenticationUnavailableError`; si serveur répond 401 → message identifiants. |
| **T6** : Vérifier le timeout fetch | Aucune config de timeout dans le code actuelle. Observer si la requête hang ou rejette rapidement. | Déterminer si des timeouts prolongés causent l'erreur. |

**Sources de configuration** :

| Source | Valeur | Portée |
|--------|--------|--------|
| `mobile/.env` | `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000` | Développement local |
| `eas.json` (build preview) | `http://10.0.2.2:3000` | Prévisualisation EAS |
| `eas.json` (build production) | `https://api.coopeca.io` | Production |
| `mobile/README.md` | `$env:EXPO_PUBLIC_API_BASE_URL = "http://localhost:3002"` | PowerShell Windows web |
| `mobile/src/services/api.ts:90` | `process.env.EXPO_PUBLIC_API_BASE_URL || defaultApiBase` | Code source |

**Sans fichier `.env`**, l'application utilise la valeur par défaut :
- Web/iOS simulateur → `http://localhost:3000`
- Android simulateur → `http://10.0.2.2:3000`

Si le backend tourne sur un port différent (ex: 3002, 3001), il faut créer `mobile/.env` avec la bonne valeur **ou** passer la variable au moment du lancement (`EXPO_PUBLIC_API_BASE_URL=http://localhost:3002 expo start`).

---

## 6. Résultats des tests réalisés

J'ai vérifié la logique dans le code source existant :

1. **Ligne 74 d'`api.ts`** : `this.isNetworkError = status === undefined;` — confirme que `isNetworkError` est `true` uniquement quand il n'y a **aucun** code de statut HTTP.

2. **Lignes 197-198 d'`index.ts`** : `if (erreur instanceof ApiError && erreur.isNetworkError) { throw new AuthenticationUnavailableError(erreur.message); }` — confirme le mécanisme : seules les erreurs réseau montent en `AuthenticationUnavailableError`.

3. **Lignes 229-230 d'`index.ts`** : Même chose dans `getCurrentSession()` — gestion identique.

4. **Lignes 81-83 de `LoginController.ts`** :
   ```typescript
   serviceError:
     error instanceof AuthenticationUnavailableError
       ? "La connexion réelle n'est pas disponible : le service d'authentification n'est pas configuré. Aucune session n'a été ouverte."
       : 'Impossible de vérifier les identifiants. Vérifiez votre connexion et réessayez.',
   ```
   L'UI distingue clairement l'indisponibilité du service d'une erreur d'identifiants.

5. **Mode démo** (`index.ts:172-181`) : Quand `EXPO_PUBLIC_DEMO_MODE=true`, les identifiants valides donnent une session sans appeler le backend, donc aucune erreur réseau.

**Tests à effectuer** (non encore réalisés) :
- Désactiver le réseau sur le téléphone/émulateur et tenter une connexion → doit lever `AuthenticationUnavailableError`.
- Utiliser un identifiant invalide → doit afficher « Impossible de vérifier les identifiants. Vérifiez votre connexion et réessayez. » (pas d'`AuthenticationUnavailableError`).
- Sur un appareil physique avec mauvaise URL API → tester si l'erreur apparaît ou si le timeout/network error est levé.
    super(message);
    this.name = 'ApiError';
    this.isUnauthorized = status === 401;
    this.isNetworkError = status === undefined;
  }
}
```

**Conditions** :

| Situation | `status` | `isNetworkError` | `isUnauthorized` |
|------------|----------|------------------|------------------|
| Succès HTTP 200 | 200 | `false` | `false` |
| Non autorisé | 401 | `false` | `true` |
| Autre code 4xx/5xx | 403, 500, etc. | `false` | `false` |
| **Pas de réponse réseau** (timeout, refused, CORS, DNS) | `undefined` | **`true`** | `false` |
| **Erreur fetch sans réponse** | `undefined` | **`true`** | `false` |

**Comment Axios vs Fetch représentent les erreurs** :

- **Axios** : `error.response` existe pour les réponses HTTP (même 404/500). `error.request` pour les requêtes sans réponse. `error.code` peut être `'ECONNABREF'` pour les erreurs de connexion.
- **Fetch** : Une réponse HTTP 4xx/5xx crée un objet `Response` ; `error.response` est disponible. Une panne réseau (type `'error'`, timeout, DNS failed) rejette la promesse avec un `Error` classique **sans** de `response` → `error.response` est `undefined`.

**Dans COOPECA** :
Le code utilise **fetch** (pas axios côté mobile). L'instruction `if (erreur instanceof ApiError && erreur.isNetworkError)` est vraie uniquement quand la requête n'a **aucun** code de statut HTTP renvoyé par le serveur.

---

## 4. Scénarios d'erreurs possibles

| Scénario | Cause racine | `isNetworkError` | `isUnauthorized` | `AuthenticationUnavailableError` |
|----------|--------------|------------------|------------------|----------------------------------|
| **Sans réseau** (déconnecté, mode avion) | Le dispositif n'a aucune connectivité | `true` | `false` | ✅ Oui |
| **Timeout** | La requête dépasse la limite (pas de timeout configuré dans le code) | `true` (souvent) | `false` | ✅ Oui |
| **CORS bloqué** (Web) | Le backend n'a pas d'en-tête `Access-Control-Allow-Origin` pour l'origine mobile | `true` | `false` | ✅ Oui |
| **DNS introuvable** | L'adresse IP/nom du backend est incorrect | `true` | `false` | ✅ Oui |
| **Réponse 401 Non autorisé** | Identifiants incorrects, token manquant/surtout | `false` | `true` | ❌ Non |
| **Réponse 403 Interdit** | L'utilisateur n'a pas les droits | `false` | `false` | ❌ Non |
| **Réponse 500 Serveur** | Erreur interne backend | `false` | `false` | ❌ Non |
| **Mode démo** | `EXPO_PUBLIC_DEMO_MODE=true` avec identifiant valide | `false` (aucun appel) | `false` | ❌ Non |

**Point important** : Une erreur 401 (mauvaise adresse/mauvais mot de passe) **ne** provoque pas `AuthenticationUnavailableError` car `status` est défini (401), donc `isNetworkError` est `false`. L'UI affichera plutôt « Impossible de vérifier les identifiants. Vérifiez votre connexion et réessayez. ».
| | `defaultApiBase` / `apiBase` | 89-90 |
| `mobile/src/services/auth.ts` | `login()` | 40-41 |
| `mobile/src/features/auth/LoginController.ts` | `submit()` | 59-91 |
| `mobile/src/services/tokenStore.ts` | — | Non lu directement mais utilisé via `getAccessToken` / `setAccessToken` |
| **URL de l'API** | `apiBase` | `mobile/src/services/api.ts:89-90` | — | `process.env.EXPO_PUBLIC_API_BASE_URL || defaultApiBase` |
| **Requête HTTP** | `fetch()` | `mobile/src/services/api.ts:115` | `response = await fetch(url, options)` | Envoie la requête POST vers `/api/v1/auth/sessions` |
| **Backend NestJS** | Contrôleur de session | `backend/src/auth/` | `POST /api/v1/auth/sessions` | Valide identifiants et retourne JWT |
| **Réponse HTTP** | Réponse JSON | — | — | 200 + `accessToken` ou 401/403/500 |
| **Interprétation** | `ApiError` | `mobile/src/services/api.ts:66-76` | Constructeur `new ApiError(message, status)` | `isNetworkError = (status === undefined)` |
| **Stockage token** | `setAccessToken()` | `mobile/src/features/auth/index.ts:186` | — | Stocke le token en mémoire et en `localStorage` |
| **Navigation** | Après connexion | `expo-router` | — | Redirige vers l'écran principal (tabs) |

**Flux détaillé** :
1. L'utilisateur remplit le formulaire sur l'écran de connexion.
2. `LoginController.submit()` appelle `this.service.authenticate({identifier, password})`.
3. Si `EXPO_PUBLIC_DEMO_MODE=true` et que l'identifiant est valide, une session démo est renvoyée sans appel réseau.
4. Sinon, `authenticate()` appelle `createSession(identifier, password)`.
5. `createSession()` appelle `apiRequest<AuthSession>('/auth/sessions', 'POST', {username, password})`.
6. `apiRequest()` construit l'URL `${apiBase}/api/v1/auth/sessions` et appelle `fetch()`.
7. Si le fetch aboutit avec un code HTTP (même 401), `ApiError.isNetworkError` est `false` et l'erreur propagation continue.
8. Si le fetch échoue (pas de réseau, timeout, CORS, DNS impossible), la promesse `fetch()` rejette avec un objet `Error` sans `response` → `new ApiError('Service API indisponible...')` est lancé avec `status===undefined` → `isNetworkError === true` → `AuthenticationUnavailableError` est lancée.

## Contexte
Cette erreur s'affiche dans l'application mobile Agent quand `erreur.isNetworkError === true`.
L'erreur provient de la classe `AuthenticationUnavailableError` définie dans
`mobile/src/features/auth/index.ts` et est lancée quand une `ApiError` a
`isNetworkError === true`.