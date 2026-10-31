# COOPECA — Audit UI/UX et fondations (Lot 1)

**Date :** 23 octobre 2026  
**Périmètre inspecté :** application mobile Expo existante, architecture, routes, composants, styles et documentation produit.  
**Limite :** audit fondé sur le code et les documents, sans capture ni rendu exécuté. Il ne remplace pas une revue visuelle sur appareil.

> **Note de mise à jour (01/11/2026) :** ce rapport est un instantané antérieur au développement du dashboard Web. L'application admin est maintenant présente sous `admin/`; ses capacités partielles et ses limites sont suivies dans [INVENTAIRE_INTERFACES.md](./INVENTAIRE_INTERFACES.md). Les constats ci-dessous sur l'absence de Web décrivent uniquement l'état observé le 23/10/2026.

## 1. Synthèse

Le dépôt contient une application mobile React Native/Expo avec Expo Router, une petite bibliothèque interne de composants et un thème de couleurs provisoire. Il ne contient pas le tableau de bord Web annoncé dans les documents de produit. Les sources UX officielles (concept et wireframes PPTX, parcours Web) sont absentes ; le référentiel UX précise que l’identité officielle reste à confirmer.

Le socle visuel est déjà sobre et cohérent dans son intention : fonds clairs, accent bleu, formulaires étiquetés, montants XAF entiers, statuts textuels, cibles tactiles généralement proches ou supérieures à 48 px. Les défauts les plus importants ne sont pas des détails cosmétiques : les styles sont recopiés dans les écrans, les états de démonstration coexistent avec des parcours métier legacy, la direction de cycle à 31 versements n’est pas reflétée dans les écrans, et plusieurs défauts statiques rendent le fonctionnement et l’aperçu incertains.

## 2. Architecture frontend observée

- **Framework :** React Native 0.88 / React 19.3 / Expo SDK 58, TypeScript strict, Expo Router. `mobile/package.json` utilise `expo-router/entry`.
- **Application présente :** mobile Android/iOS, principalement conçue en portrait. Aucun dossier `web/`, `frontend/` ou `dashboard/`, aucune configuration `react-native-web` ni interface Web compilable observée. La documentation `docs/INVENTAIRE_INTERFACES.md` confirme que les vues WEB-001 à WEB-018 sont à concevoir.
- **Navigation :** Stack racine dans [app/_layout.tsx](../mobile/app/_layout.tsx), groupes `(auth)` et `(tabs)`, ainsi que `recus/[id]`. Vues actuelles : connexion, session/profil, accueil, clients, dossiers, collectes, remises, clôture, vitrine de composants et reçu. Les dossiers sont masqués de la barre d’onglets (`href: null`). La barre expose Accueil, Clients, Collectes, Remises et Clôture.
- **Styles :** `StyleSheet.create` React Native et objet central `colors` dans [theme.ts](../mobile/src/components/theme.ts). Pas de Tailwind, CSS Modules, SCSS ni bibliothèque UI externe.
- **Typographie et icônes :** police système native, sans police embarquée. Pas de bibliothèque d’icônes déclarée ; navigation et actions emploient des emoji, lettres et glyphes Unicode.
- **Dépendances UI :** composants natifs React Native et `react-native-safe-area-context`; aucun kit de composants installé. Le dépôt n’a pas de composants indexés par Context Graph; l’inventaire ci-dessous provient de la lecture des sources.
- **Conventions :** routes en minuscules dans `mobile/app`, composants PascalCase dans `mobile/src/components`, fonctionnalités dans `src/features/<domaine>`, styles locaux `StyleSheet.create`. Libellés et noms de domaines majoritairement en français.
- **Thème réellement déclaré :** fond `#F4F6F8`, surface `#FFFFFF`, texte `#17212B`, secondaire `#5E6B76`, bordure `#DCE3E8`, accent `#0E3B5E`, succès `#246B4B`, avertissement `#8A5A00`, danger `#A43B35` et nuances associées. La palette est explicitement provisoire dans le README et les décisions frontend.

## 3. Écrans et composants constatés

### Écrans et routes

- Authentification : [login.tsx](../mobile/app/(auth)/login.tsx), profil/session : [session.tsx](../mobile/app/(auth)/session.tsx).
- Accueil de démonstration : [index.tsx](../mobile/app/(tabs)/index.tsx).
- Clients, dossiers, collectes, remises et clôture : routes du groupe `mobile/app/(tabs)/`.
- Vitrine de composants : `mobile/app/(tabs)/composants.tsx` (absente de la structure documentée du README).
- Reçu : `mobile/app/recus/[id].tsx`, actuellement placeholder.
- Les vues « Clients », « Dossiers », « Collectes » et « Remises » contiennent des formulaires/listes réels côté code local ; leur exécution et leur apparence n’ont pas été vérifiées. D’autres routes, dont Clôture, affichent explicitement un module en préparation.

### Composants partagés présents

`AppScreen`, `AppCard`, `AppButton`, `AppNotice`, `ActionCard`, `StatusPill`, `MetricCard`, `DialogConfirmation`, `EmptyState`, `ErrorState`, `LoadingState`, `SyncStatusBanner`, `FeatureScreen`/`ScreenPlaceholder`, `InputTexte`, `InputNumerique`, `InputMontantXAF`, `InputRecherche`, `SelecteurSimple`, `SelecteurClient` et `SelecteurDossier`.

Des composants utiles existent déjà, mais les écrans métier reconstruisent plusieurs fois leurs en-têtes, cartes, boutons, lignes de liste et états vides. Les trois sélecteurs répètent également une bonne part de la structure et des styles de menu.

## 4. Forces à conserver

| Force | Valeur utilisateur |
|---|---|
| Palette actuelle restreinte, surfaces claires et accent bleu | Point de départ crédible pour une interface de confiance, sans surcharge visuelle. |
| Champs avec libellés explicites, validation et messages d’erreur | Facilite la saisie sur le terrain et la correction. |
| `InputMontantXAF` dédié et formatage de montants entiers | Cohérent avec l’exigence métier de montants en XAF entiers. |
| Badges d’état accompagnés de libellés, et non d’une couleur seule | Aide à différencier les états hors ligne, en attente, erreur et réussite. |
| Boutons et champs généralement à 48 px ou plus | Base adaptée aux interactions tactiles. |
| Confirmations d’action, états vides, erreurs et chargement déjà représentés | Les futurs parcours pourront s’appuyer sur les composants existants, sans inventer un kit parallèle. |
| L’écran de connexion annonce clairement que le service n’est pas configuré | Évite de présenter une authentification de démonstration comme réelle. |

## 5. Principaux problèmes UI/UX priorisés

| Priorité | Problème et preuve dans le code | Impact utilisateur | Correction recommandée |
|---|---|---|---|
| **P0 — blocage d’évaluation** | Aucun aperçu navigateur/Web ni capture de l’application n’est disponible ; les scripts `tsc` et `jest` ne sont pas installés/résolus localement. Les erreurs statiques relevées ci-dessous peuvent aussi empêcher un rendu fiable. | Impossible de confirmer contraste, débordements, hiérarchie réelle, comportement au clavier ou présentation selon appareil. | Rétablir un environnement mobile reproductible, corriger les défauts de compilation, puis capturer les écrans remplis, vides, en erreur et en chargement sur appareils représentatifs. Ne pas considérer cet audit comme une validation visuelle finale. |
| **P0 — écart produit / parcours financier** | L’accueil, les collectes, les remises et la clôture parlent d’opérations journalières/legacy. Le parcours canonique §3.15 de `docs/DECISIONS_METIER.md` est le cycle à 31 versements ; aucune UI cycle complète n’est présente. | Risque de faire comprendre aux agents que les anciennes opérations sont la voie active, ou de confondre les historiques avec les nouveaux versements/retraits. | Pour le Lot 2, commencer par un dashboard reflétant les concepts validés (cycle, versements comptabilisés, solde, état de synchronisation) ; maintenir les flux legacy clairement historiques. Faire valider les libellés avant d’étendre les écrans métier. |
| **P1 — absence de produit Web** | Aucun front Web ni tableau de bord existant ; les 18 vues Web sont à concevoir d’après l’inventaire. | Les rôles de bureau et les tâches de lecture/rapprochement n’ont aucun écran accessible ; les demandes de tableaux restent invérifiables. | Traiter le choix d’architecture Web et le périmètre des rôles comme une décision distincte. Le Lot 2 proposé ci-dessous vise le mobile existant ; ne pas laisser croire qu’il implémente un dashboard Web. |
| **P1 — styles divergents et duplication** | `theme.ts` ne centralise que des couleurs. En-têtes et cartes sont redéfinis dans plusieurs routes ; valeurs variables de padding (14/16/18/20), rayons (10–16) et hauteurs de boutons (48/50/52). | L’interface peut varier d’un parcours à l’autre ; chaque correction visuelle risque d’être répétée et de dériver. | Ajouter les tokens de fondation puis rapprocher les écrans des composants partagés existants. Unifier en premier les en-têtes de page/section, cartes, lignes de liste et actions primaires. |
| **P1 — action principale non standardisée** | `AppButton` propose primary/secondary/danger, mais plusieurs écrans emploient des `Pressable` et styles de bouton locaux. Le disabled n’est pas présenté de façon uniforme. | Les actions importantes changent d’apparence et de taille ; le bouton principal est moins facile à reconnaître. | Réutiliser `AppButton`, enrichir ses états et harmoniser toutes les actions critiques, tout en gardant une confirmation adaptée pour les actions sensibles. |
| **P1 — états superposés et démonstrations** | L’accueil montre des états En ligne/Hors ligne/En attente/Erreur et des chiffres de démonstration ; `SyncStatusBanner` indique que le réseau n’est pas mesuré. Les libellés explicitent généralement la démo, mais l’apparence d’un statut positif peut être comprise comme réelle. | Confusion potentielle sur l’envoi, l’acceptation serveur et la fiabilité des chiffres. | Tant qu’il n’y a pas de source réelle, afficher un unique état « non mesuré / démonstration ». À terme, distinguer systématiquement état métier, synchronisation et impression conformément à `DECISIONS_VALIDÉES_FRONTEND.md`. |
| **P1 — terminologie des opérations** | Le parcours combine « Remises », « Reversements », « Collectes », « Clôture journalière » et des appels à clôturer la journée. Le référentiel documente déjà l’ambiguïté de lexique, tandis que le produit change de modèle financier. | L’agent peut ne pas savoir si une action est historique, une déclaration ou une opération financière active. | Harmoniser les libellés sur le vocabulaire validé du cycle ; marquer explicitement les écrans legacy en lecture historique et conserver les termes d’audit nécessaires. |
| **P2 — formulaire dense, feedback incohérent** | Les formulaires sont empilés dans des cartes, certains champs de date/heure sont des chaînes ISO brutes et les messages d’erreur et de succès sont gérés différemment. `AppScreen` possède déjà un `ScrollView`, alors que plusieurs routes en imbriquent un second. | Saisie plus lente et risque de scroll/clavier confus, notamment sur petits écrans. Les utilisateurs peuvent manquer l’erreur ou perdre le contexte de l’action. | Un seul propriétaire du scroll par écran ; fournir un sélecteur de date adapté et afficher les erreurs au champ concerné. Unifier le retour de soumission, de chargement et de confirmation sans effacer les saisies en cas d’erreur. |
| **P2 — focus et clavier non spécifiés comme système** | Les composants fournissent des labels/accessibilityRole utiles, mais aucun état de focus visuel partagé n’est défini dans les styles ; les styles de Pressable gèrent surtout l’état pressé. | La navigation clavier/lecteur d’écran et le suivi du focus sont moins prévisibles ; la conformité ne peut pas être attestée depuis le code. | Définir un focus visible commun, vérifier les cibles et contrastes, annoncer les erreurs/états, puis auditer sur appareil avec TalkBack et clavier externe. Ne pas supposer que le comportement natif suffit sans test. |
| **P2 — listes avec nombreux badges** | Les lignes de clients/collectes utilisent une rangée horizontale de badges (`flexDirection: 'row'`) à côté d’un texte flexible ; aucun repli explicite n’est défini. | Avec des noms longs ou plusieurs statuts, les contenus peuvent se compresser ou déborder sur les petits écrans. | Tester les cas longs en largeur minimale ; privilégier une deuxième ligne ou un regroupement de statuts avec libellés explicites plutôt que réduire la police. |
| **P2 — navigation reposant sur emoji/glyphes** | Les onglets utilisent maison, groupe, carnet, billets et cadenas en emoji ; autres symboles textuels dans les cartes. | Rendu et alignement variables selon les polices/systèmes ; sens parfois ambigu, notamment pour des opérations financières. | Choisir un style d’icônes fonctionnelles cohérent lors de la refonte navigation, avec libellés texte toujours visibles. Aucun nouveau paquet d’icônes n’est nécessaire au Lot 1. |
| **P2 — composants de données Web absents** | Aucun tableau, pagination ou filtre de tableau n’existe dans le produit courant, car aucune surface Web n’est implémentée. | Impossible de contrôler la lisibilité des colonnes, unités, totaux, filtres et densité de données annoncés. | Concevoir ces composants uniquement après décision sur le stack Web, les permissions et les colonnes métier ; sur mobile, préférer des lignes/cartes adaptées au tactile. |

### Écarts statiques à traiter avant la validation visuelle (non modifiés)

- [mobile/src/features/auth/index.ts](../mobile/src/features/auth/index.ts) n’exporte rien, alors que les écrans et contrôleurs importent `authenticationService` et des types d’authentification.
- [mobile/src/database/schema.ts](../mobile/src/database/schema.ts) ferme `SCHEMA_SQL` après `clients` (ligne 101), puis contient des déclarations SQL hors chaîne template (à partir de la ligne 103), ce qui constitue un risque de syntaxe TypeScript bloquant.
- [mobile/app/(tabs)/index.tsx](../mobile/app/(tabs)/index.tsx) importe `useState` depuis `expo-router` et utilise `AppNotice` sans import visible.
- Le README affirme typecheck/tests/export réussis, mais les contrôles n’ont pas pu être reproduits dans l’environnement de cet audit. Ces écarts doivent être confirmés/corrigés avant de s’appuyer sur l’affirmation documentaire.

## 6. Direction artistique proposée

**Direction : fintech minimaliste, fiable et opérationnelle.** Le bleu marine porte les actions principales et la navigation ; le blanc et le gris très clair créent des surfaces calmes ; le gris anthracite porte la lecture ; vert, ambre et rouge sont réservés aux statuts sémantiques. Typographie sans-serif système lisible, hiérarchie courte, espacements réguliers, bordures discrètes et ombres rares. Les écrans de saisie restent sobres, les montants sont faciles à vérifier et les actions sensibles sont explicites. Pas de dégradés décoratifs, d’animations gratuites ni de cartes décoratives sans utilité.

La proposition de palette initiale de la demande est retenue pour la fondation : primary `#17324D`, hover `#244766`, background `#F7F9FC`, surface `#FFFFFF`, texte principal `#17212F`, secondaire `#64748B`, bordure `#E2E8F0`, succès `#15803D`, avertissement `#B45309`, danger `#B91C1C`. L’accent existant `#0E3B5E` est documenté comme provisoire et n’est donc pas traité comme une charte de marque approuvée. L’icône d’application actuelle ne contient pas de logo exploitable ; logo et identité restent à valider contre les maquettes officielles absentes.

## 7. Fondations de tokens proposées

Le document `C:/Users/DATOM/.kombai/design-systems/artifacts/coopeca-fintech-proposal-20261023.ds` consigne la direction et les tokens candidats. Ces valeurs sont **proposées, non appliquées** : aucun fichier source n’a été modifié.

- **Typographie :** police système sans-serif ; titres 28/22/18 px, texte 16/14 px, légendes 12 px ; échelle de poids modérée (400–700) plutôt que multiplier les graisses 800/900.
- **Espacement :** échelle de 4 px (4, 8, 12, 16, 24, 32, 40).
- **Rayons :** 8 / 10 / 12 / 16 px et capsule pour les badges.
- **Ombres :** niveau 0 par défaut ; ombre très légère uniquement pour overlays utiles.
- **Contrôles :** champ et bouton d’au moins 48 px, alignés sur les cibles tactiles déjà présentes.
- **États :** pressé, focus visible, désactivé, chargement non soumissible, succès, avertissement et erreur ; texte et indicateur accompagnent toujours la couleur.
- **Responsive :** app mobile prioritaire ; largeur de contenu mobile existante de 560 px maximum. Pour le futur Web, seuils indicatifs à valider avec les vrais parcours : 768 px (layout compact/tablette) et 1024 px (navigation latérale et vues de données larges).

## 8. Inventaire et ordre de standardisation des composants

1. **Bouton** : réutiliser `AppButton` ; définir primary, secondary, destructive, pressed, focus, disabled et loading.
2. **Champs** : faire converger `InputTexte`, `InputNumerique`, `InputMontantXAF` et `InputRecherche` ; label, aide, erreur, focus et disabled partagés.
3. **Sélecteurs** : réduire la duplication entre `SelecteurSimple`, `SelecteurClient` et `SelecteurDossier` ; conserver leur contenu spécifique client/dossier.
4. **État/badge et alerte** : réutiliser `StatusPill`, `AppNotice`, `SyncStatusBanner`, en séparant les trois axes métier/synchronisation/impression.
5. **Lignes de liste et tables** : standardiser les lignes mobiles existantes ; créer plus tard un vrai tableau Web avec colonnes, alignement des montants, tri, filtres et pagination après spécification du Web.
6. **Carte KPI** : réutiliser `MetricCard` uniquement pour une synthèse utile ; ses valeurs actuelles d’exemple ne doivent jamais apparaître comme des chiffres réels.
7. **Dialogue/modal** : conserver `DialogConfirmation` pour confirmation sensible ; valider focus, fermeture, libellés et chargement lors d’un test appareil.
8. **États vides/chargement/erreur** : réutiliser `EmptyState`, `LoadingState`, `ErrorState`, ajouter un modèle de reprise cohérent sans vider la saisie.
9. **Menu/navigation** : harmoniser `Tabs` et les overlays des sélecteurs ; clarifier la place des dossiers et utiliser des icônes cohérentes avec libellés.
10. **Pagination et notifications/toasts** : absentes du socle relevé ; ne pas les créer avant de confirmer le parcours qui en a besoin. Les erreurs et réussites de formulaire requièrent néanmoins un modèle de feedback unifié.

## 9. Contrôles réellement exécutés

| Contrôle | Résultat réel |
|---|---|
| `npm --prefix mobile run typecheck` | Échec avant compilation : `tsc` introuvable (code de sortie 1). |
| `npm --prefix mobile test -- --runInBand` | Échec avant exécution : `jest` introuvable (code de sortie 1). |
| Lancement Expo / navigateur / appareil | Non exécuté ; aucun rendu Web configuré et aucun aperçu/capture disponible dans cette session. |
| Dépendances installées | Aucun `mobile/node_modules/.bin` trouvé ; aucune installation ni modification de dépendance effectuée. |

Aucun test ne peut être qualifié de réussi. Aucun paquet n’a été ajouté.

## 10. À valider avant le Lot 2

- Identité officielle, logo et éventuel besoin de conserver `#0E3B5E` comme couleur de marque malgré son statut provisoire.
- Périmètre exact du Lot 2 : l’écran d’accueil mobile agent versus le futur tableau de bord Web, qui n’a pas encore de stack ni de routes.
- Navigation des dossiers, libellés « remises/reversements » et traitement visible du flux legacy par rapport au cycle §3.15.
- Vérification visuelle des écrans sur appareils et des contrastes/focus avec technologies d’assistance.
- Réparation préalable des erreurs statiques et réinstallation reproductible des dépendances, puis exécution des contrôles de qualité.

## 11. Proposition concrète — Lot 2 (non commencé)

Après validation explicite, le Lot 2 peut refondre **uniquement le layout principal mobile et l’accueil agent** : harmoniser en-tête et navigation, hiérarchiser une synthèse de cycle (si données disponibles), afficher un état de synchronisation réellement mesuré ou « non mesuré », présenter une action principale contextualisée et des accès secondaires aux fonctions permises. Les vues métier, règles financières, API, routes et permissions restent hors périmètre. Si le besoin prioritaire est le dashboard Web, il faudra d’abord valider son architecture, ses rôles et ses parcours au lieu de le supposer existant.
