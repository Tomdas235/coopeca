# COOPECA Mobile — Rapport QA

## 1. Environnement détecté

| Composant | Version |
|---|---|
| Expo SDK | ~58.0.12 |
| React | 19.3.0 |
| React Native | 0.88.0 |
| TypeScript | ~6.0.3 |
| Jest | ~29.7.0 |
| jest-expo | ~58.0.11 |
| Node.js | v24.21.0 |
| npm | 11.19.0 |

## 2. Commandes exécutées

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ Aucune erreur TypeScript |
| `npx jest --passWithNoTests` | ⚠️ Aucune sortie (jest-expo nécessite un environnement spécifique) |
| `npx jest --verbose` | ⚠️ Aucune sortie (même blocage) |
| `npx jest src/utils/montants.test.ts` | ⚠️ Aucune sortie |

## 3. TypeScript — Résultat

**PASS** — `npx tsc --noEmit` s'est terminé sans erreur. Le code TypeScript du mobile compile correctement.

## 4. Tests Jest — Résultat

**BLOCKED** — Jest-expo ne produit aucune sortie dans cet environnement. Les tests unitaires existent mais n'ont pas pu être exécutés.

### Tests existants

| Fichier | Tests |
|---|---|
| `src/utils/montants.test.ts` | 6 tests (formatage XAF, somme, rejet non-entiers) |
| `src/components/InputTexte.test.tsx` | Tests de saisie |
| `src/components/InputNumerique.test.tsx` | Tests numériques |
| `src/components/InputMontantXAF.test.tsx` | Tests montant XAF |
| `src/components/SelecteurSimple.test.tsx` | Tests sélecteur |
| `src/components/SelecteurClient.test.tsx` | Tests sélecteur client |
| `src/components/SelecteurDossier.test.tsx` | Tests sélecteur dossier |
| `src/components/DialogConfirmation.test.tsx` | Tests dialogue confirmation |
| `src/features/auth/auth.test.ts` | Tests authentification |

**Total** : ~9 fichiers de tests, ~50+ cas de test.

## 5. Parcours agent — État

| Parcours | Statut | Détail |
|---|---|---|
| Connexion (démo) | NOT RUN | Nécessite un émulateur ou un appareil |
| Connexion (réel) | NOT RUN | Nécessite un backend accessible + émulateur |
| Tableau de bord agent | NOT RUN | Nécessite un émulateur |
| Liste des clients | NOT RUN | Nécessite un émulateur |
| Consultation des dossiers | NOT RUN | Nécessite un émulateur |
| Consultation des cycles | NOT RUN | Nécessite un émulateur |
| Enregistrement d'un versement | NOT RUN | Nécessite un émulateur |
| Gestion des erreurs réseau | NOT RUN | Nécessite un émulateur |
| Déconnexion | NOT RUN | Nécessite un émulateur |

## 6. Configuration API

- **Base URL** : `process.env.EXPO_PUBLIC_API_BASE_URL` ou défaut `http://10.0.2.2:3000`
- **Préfixe** : `/api/v1`
- **Auth** : Bearer token (stocké en mémoire ou localStorage)
- **Délai d'attente** : Non configuré (pas de timeout explicite dans fetch)

### Adresse requise selon l'environnement

| Environnement | URL à configurer |
|---|---|
| Émulateur Android | `http://10.0.2.2:3000` (défaut) |
| Émulateur iOS | `http://localhost:3000` |
| Téléphone physique | `http://<IP-locale>:3000` (ex: `http://192.168.1.100:3000`) |
| Production | `https://api.coopeca.example.com` |

Configuration : créer un fichier `.env` dans `mobile/` avec :
```
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000
EXPO_PUBLIC_DEMO_MODE=true
```

## 7. Problèmes identifiés

### P1 — Typo dans collectes.tsx (corrigé)
- `styles.te   xteNote` → `styles.texteNote`
- Causait une erreur de parsing JSX

### P2 — API mobile ne correspond pas au backend
Les endpoints appelés par le mobile ne correspondent pas aux routes backend :
- Mobile : `/cycles/tontine-cycles/deposits` → Backend : `/tontine-cycles/:cycleId/deposits`
- Mobile : `/cycles/tontine-cycles/withdrawals` → Backend : `/tontine-cycles/:cycleId/withdrawals`
- Mobile : `/cycles/withdrawals/pending?cycleId=...` → Backend : `/withdrawals/pending`
- Mobile : `/admin/cycles/withdrawals/.../review` → Backend : `/withdrawals/:id/review`

### P3 — Pas de timeout réseau
Le `fetch` dans `apiRequest` n'a pas de timeout. Sur réseau instable, la requête peut hang indéfiniment.

### P4 — Pas de gestion du token expiré
Le token expire après 15 minutes (backend). Le mobile ne gère pas le renouvellement automatique.

### P5 — Mode démo utilise des identifiants qui n'existent pas dans le backend
Les identifiants démo (`admin.coopeca`, `superv.paris1`, etc.) ne correspondent pas aux comptes créés par le seed (`admin`, `supervisor1`, etc.).

## 8. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `mobile/app/(tabs)/collectes.tsx` | Typo `styles.te   xteNote` → `styles.texteNote` |

## 9. Tests nécessitant un émulateur ou appareil physique

- Lancement de l'application Expo (`npx expo start`)
- Navigation entre les écrans
- Saisie et enregistrement d'un versement
- Test de la connexion réseau réelle
- Test de la déconnexion
- Test des permissions et des erreurs 401/403

## 10. Étapes manuelles restantes

1. **Installer les dépendances** : `cd mobile && npm install`
2. **Configurer l'API** : créer `mobile/.env` avec `EXPO_PUBLIC_API_BASE_URL`
3. **Démarrer le backend** : `cd backend && npm run start:dev`
4. **Démarrer Expo** : `cd mobile && npx expo start`
5. **Tester sur émulateur** : `npx expo start --android`
6. **Corriger les endpoints API** pour correspondre au backend
7. **Ajouter un timeout** au fetch
8. **Implémenter le renouvellement de token** ou la gestion de l'expiration

## 11. Limites de cet audit

- Aucun lancement Android réel n'a été effectué
- Les tests Jest n'ont pas pu être exécutés (jest-expo nécessite un environnement spécifique)
- Le backend n'a pas pu être démarré pour des tests d'intégration réels
- Les endpoints mobile/backend ne correspondent pas (voir P2)