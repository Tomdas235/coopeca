# COOPECA — Mobile (React Native / Expo)

**Étape : interface et intégration initiale au backend.** Navigation Expo
Router, authentification réelle ou démo, stockage local SQLite et écran de
cycles partiellement connecté. Ce n'est pas encore un parcours métier complet :
la synchronisation générale et le cycle hors ligne vers acceptation serveur
restent à terminer et à tester sur appareil.

## Stack (versions réellement installées, vérifiées par `expo-doctor` 20/20)

| Paquet | Version |
| --- | --- |
| expo | 58.0.12 (SDK 58) |
| expo-router | 58.0.21 |
| react / react-dom | 19.3.0 |
| react-native | 0.88.0 |
| react-native-screens | 4.30.0 |
| react-native-safe-area-context | 5.10.1 |
| expo-sqlite | 58.0.13 |
| react-native-web | 0.21.4 |
| expo-constants | 58.0.12 · expo-linking 58.0.13 · expo-status-bar 58.0.3 |
| typescript | 6.0.3 (strict) — jamais TS 7.x |
| jest / @types/jest | 29.7.0 / 29.5.14 (attendus par le SDK 58) |
| jest-expo | 58.0.11 |

## Démarrage rapide

```bash
cd mobile
npm install
npm run typecheck    # TypeScript strict — 0 erreur
npm test -- --runInBand
npm start            # Expo Dev Server (emulateur/device)
```

### Essai dans le navigateur

Depuis PowerShell, dans `mobile/`, définir l'URL de l'API sur l'hôte local avant
de démarrer Expo Web :

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "http://localhost:3000"
$env:EXPO_PUBLIC_DEMO_MODE = "false"
npm.cmd run start -- --web
```

L'API et PostgreSQL doivent déjà fonctionner. Le défaut `http://10.0.2.2:3000`
du client est destiné à l'émulateur Android, pas au navigateur ni à un téléphone
physique. Sur un appareil réel, utiliser une adresse LAN joignable par le
téléphone. Le mode démo local `EXPO_PUBLIC_DEMO_MODE=true` contourne l'API et ne
doit pas être présenté comme une connexion backend. **Blocage actuel :** le
bootstrap Nest n'active pas CORS; Expo Web ne pourra pas appeler directement
l'API depuis son origine tant qu'une origine de développement précise n'est pas
autorisée. Voir `backend/README.md` avant d'interpréter un échec réseau comme un
échec d'authentification.

## Structure de référence (ne pas remplacer par une organisation générique)

```
mobile/
  app/                       # navigation Expo Router
    _layout.tsx              # racine : (auth) | (tabs) | recus/[id]
    (auth)/login.tsx          # connexion backend ou mode démo explicite
    (auth)/session.tsx
    (tabs)/_layout.tsx
    (tabs)/index.tsx         # Accueil
    (tabs)/clients.tsx
    (tabs)/collectes.tsx
    (tabs)/remises.tsx
    (tabs)/cloture.tsx
    (tabs)/cycles.tsx         # marchés, lecture cycle et versement API partiel
    (tabs)/composants.tsx
    (tabs)/dossiers.tsx       # route accessible depuis l'accueil
    recus/[id].tsx
  src/
    features/                # auth réel/démo et contrôleurs de parcours
    database/                # schema.ts, migrations/ versionnées, repositories SQLite
    services/                # client API, tokenStore, printer/sync (couverture partielle)
    components/              # layout, cartes, statuts et écrans de parcours
    utils/                   # montants.ts (entiers XAF)
    types/                   # types partagés (MontantXAF)
  assets/                    # PNG provisoires (voir assets/README.md)
  tests/                     # test structurel de navigation
```

Règle stricte : **aucune requête SQL dans les écrans** — uniquement via
`src/database/repositories`.

## Interface et limites de cette étape

- L'authentification réelle appelle `POST /api/v1/auth/sessions` puis
  `GET /api/v1/me`; le token Bearer est conservé par le service de session.
- Sur la cible native, le token courant est actuellement conservé en mémoire;
  le stockage durable/sécurisé, la reprise après fermeture de l'application et
  le renouvellement/révocation restent à concevoir. `localStorage` ne rend pas
  cette persistance disponible sur Android.
- L'écran Cycles consulte les marchés actifs, lit un cycle par UUID et peut
  envoyer un versement fixe. L'ouverture complète client → dossier → cycle
  n'est pas encore intégrée dans l'écran.
- Les clients et plusieurs écrans legacy utilisent le stockage SQLite local;
  leur présence locale ne signifie pas que les données ont été synchronisées
  ou acceptées par le serveur.
- Collectes, remises et clôtures restent des parcours legacy/local incomplets;
  ils ne remplacent pas le journal financier des cycles à 31 versements.
- La synchronisation générale, le traitement durable des conflits, le reçu
  officiel et l'impression ne sont pas validés de bout en bout.
- L'écran Cycles expose encore un formulaire de création de marché alors que
  le backend réserve cette action à ADMIN/SUPERVISOR; le compte agent reçoit un
  refus 403. À masquer/retirer dans le prochain lot mobile, ou à placer dans
  une interface réservée aux rôles autorisés.
- La palette d'interface est provisoire et utilise notamment le bleu déjà
  présent dans la configuration Android ; elle ne constitue pas une charte
  officielle. Les couleurs et le logo restent à confirmer avec les maquettes.
- L'affichage des montants passe par `src/utils/montants.ts` et n'utilise que
  des nombres entiers XAF.

## Vérifications de cette étape

| Commande | Résultat |
| --- | --- |
| `npm run typecheck` | Passé lors du contrôle d'intégration précédent; à relancer avant le prochain lot mobile |
| `npm test -- --runInBand` | Lancé précédemment, résumé Jest non confirmé dans le terminal |
| Expo Web / Android | Pas encore de recette E2E mobile complète consignée |

## Ce qui n'est PAS implémenté (volontairement)

- Session hors ligne complète, renouvellement/révocation et verrouillage d'appareil ;
- Synchronisation durable de toutes les opérations et résolution des conflits ;
- Impression Bluetooth et reçu officiel ;
- Aucune migration PostgreSQL nouvelle dans ce lot. **`prisma db push` et toute
  modification du schéma SQL v1.1 sont proscrits sans validation explicite.**

## Règles COOPECA et état de validation

- Montants financiers en **entiers XAF** : formatage local sans flottant,
  sérialisation en chaînes d'entiers à la frontière API ;
- Le mode démo doit rester explicitement séparé de l'authentification réelle ;
- `src/services/sync.ts` documente l'idempotence et la gestion explicite
  des conflits à implémenter ;
- La date de collecte déclarée, la clôture hors ligne et la séparation
  déclaration/réception de remise sont documentées aux écrans concernés ;
- `.env`/secrets jamais versionnés (`.gitignore`).

## Préparation du prochain lot mobile

1. Refaire `npm run typecheck` et les tests mobile, puis lancer Expo avec
  `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000` pour l'essai Web.
2. Corriger l'écran Cycles pour retirer le formulaire de création de marché
  aux agents; vérifier aussi le cycle complet dossier → ouverture → versement.
3. Implémenter et tester une clé d'idempotence conservée durablement avant
  toute reprise de versement après erreur réseau.
4. Concevoir la synchronisation et la résolution de conflits selon
  `DECISIONS_METIER.md` §3.15 et `DECISIONS_VALIDÉES_FRONTEND.md`.
5. Préparer une recette Android réelle avant de présenter l'offline ou
  l'impression comme fonctionnels.
