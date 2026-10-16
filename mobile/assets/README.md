# Assets COOPECA

PNG **générés à titre provisoire** (aplat de couleur) pour que `app.json`
soit exécutable de bout en bout :

- `icon.png` (1024×1024) — icône générique, référencée par `app.json` ;
- `adaptive-icon.png` (1024×1024) — icône adaptative Android, référencée ;
- `splash.png` — conservé pour usage futur ; **n'est plus référencé** :
  le champ `splash` n'est pas autorisé dans la config SDK 58
  (contrôle `expo-doctor`), il devra être re-configuré via le plugin
  approprié si un écran de démarrage personnalisé est décidé.

À valider avant toute publication : identité visuelle officielle COOPECA,
tailles d'icônes Android/iOS, éventuelles polices/graphiques embarqués.

