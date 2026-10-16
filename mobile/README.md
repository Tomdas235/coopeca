# COOPECA — Mobile (React Native / Expo)

**Étape : première interface visuelle.** Navigation Expo Router, tableau de
bord agent, accès aux principaux parcours et composants visuels réutilisables.
Les parcours métier, l'authentification et la synchronisation ne sont pas
implémentés.

## Stack (versions réellement installées, vérifiées par `expo-doctor` 20/20)

| Paquet | Version |
| --- | --- |
| expo | 58.0.12 (SDK 58) |
| expo-router | 58.0.21 |
| react / react-dom | 19.3.0 |
| react-native | 0.88.0 |
| react-native-screens | 4.30.0 |
| react-native-safe-area-context | 5.10.1 |
| expo-constants | 58.0.12 · expo-linking 58.0.13 · expo-status-bar 58.0.3 |
| typescript | 6.0.3 (strict) — jamais TS 7.x |
| jest / @types/jest | 29.7.0 / 29.5.14 (attendus par le SDK 58) |
| jest-expo | 58.0.11 |

## Démarrage rapide

```bash
cd mobile
npm install
npm run typecheck    # TypeScript strict — 0 erreur
npm test             # tests de base (structure + règles de montants)
npm start            # Expo Dev Server (emulateur/device)
```

## Structure de référence (ne pas remplacer par une organisation générique)

```
mobile/
  app/                       # navigation Expo Router
    _layout.tsx              # racine : (auth) | (tabs) | recus/[id]
    (auth)/login.tsx
    (tabs)/_layout.tsx
    (tabs)/index.tsx         # Accueil
    (tabs)/clients.tsx
    (tabs)/collectes.tsx
    (tabs)/remises.tsx
    (tabs)/cloture.tsx
    (tabs)/dossiers.tsx       # route accessible depuis l'accueil
    recus/[id].tsx
  src/
    features/                # auth, clients, dossiers, collectes, recus,
                             # remises, synchronisation, clotures (non implémentés)
    database/                # schema.ts, migrations/ versionnées, repositories/
    services/                # api.ts, printer.ts, sync.ts (non implémentés)
    components/              # layout, cartes, statuts et écrans de parcours
    utils/                   # montants.ts (entiers XAF)
    types/                   # types partagés (MontantXAF)
  assets/                    # PNG provisoires (voir assets/README.md)
  tests/                     # test structurel de navigation
```

Règle stricte : **aucune requête SQL dans les écrans** — uniquement via
`src/database/repositories` (non implémentés à ce stade).

## Interface et limites de cette étape

- Les chiffres du tableau de bord et les quatre états réseau/synchronisation
  sont des exemples explicitement marqués comme démonstration.
- Aucun état réseau n'est mesuré ; aucune synchronisation, authentification,
  collecte, remise, clôture ou opération métier n'est exécutée.
- Les routes Clients, Dossiers, Collectes, Reversements et Clôture sont
  accessibles, mais affichent un état « module en préparation ».
- La palette d'interface est provisoire et utilise notamment le bleu déjà
  présent dans la configuration Android ; elle ne constitue pas une charte
  officielle. Les couleurs et le logo restent à confirmer avec les maquettes.
- L'affichage des montants passe par `src/utils/montants.ts` et n'utilise que
  des nombres entiers XAF.

## Vérifications antérieures

| Commande | Résultat |
| --- | --- |
| `npx expo-doctor` | ✅ 20/20 contrôles |
| `npm run typecheck` (strict) | ✅ 0 erreur |
| `npm test` | ✅ 23/23 tests, 2 suites |
| `npx expo export --platform android` | ✅ bundle Hermes 2,5 Mo |

## Ce qui n'est PAS implémenté (volontairement)

- Authentification, session, chiffrement, verrouillage d'appareil ;
- Tables/entités métier locales (modèle non validé) ;
- Repositories SQLite (expo-sqlite non encore installé) ;
- Synchronisation (idempotence, conflits) et impression Bluetooth ;
- Toute migration : locale ou serveur. **`prisma db push` et toute
  modification du schéma SQL v1.1 sont proscrits.**

## Règles COOPECA respectées par le squelette

- Montants en **entiers XAF** : `src/utils/montants.ts` rejette tout
  flottant (testé) ;
- Chaque écran indique honnêtement son état (pas de fausse fonctionnalité) ;
- `src/services/sync.ts` documente l'idempotence et la gestion explicite
  des conflits à implémenter ;
- La date de collecte déclarée, la clôture hors ligne et la séparation
  déclaration/réception de remise sont documentées aux écrans concernés ;
- `.env`/secrets jamais versionnés (`.gitignore`).

## Décisions encore ouvertes (bloquantes pour l'étape suivante)

1. Champs, unicité et cycle de vie des dossiers (`DECISIONS_METIER.md` §3-4) ;
2. Stratégie du numéro officiel de reçu vs `client_receipt_no` (`REÇUS_ET_DATE_METIER.md`) ;
3. Trois axes d'état (synchronisation / métier / impression) et leurs enums ;
4. Matériel d'impression Bluetooth et bibliothèque associée ;
5. Contrat d'API (idempotence, conflits) à harmoniser avec le backend ;
6. Identifiants de build (bundle ID Android/iOS) et identité visuelle officielle ;
7. Installation d'`expo-sqlite` et schéma local, après validation du modèle.
