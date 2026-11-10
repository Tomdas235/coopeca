# COOPECA — Design System COOPECA

**Version** : 1.0 provisoire
**Statut** : à valider avant figement final
**Domaine** : identité graphique, typographie, espace, composants et états.

> Ce design system est conçu pour être compatible avec React Native (mobile) et React (Web admin) en conservant une seule palette et une seule nomenclature linguistique. Les propriétés spécifiques à chaque runtime doivent être applicables sans casser la cohérence visuelle.

---

## 1. Palette de couleurs

### 1.1 Couleurs de marque

| Rôle | Nom | Code hexadécimal | Utilisation |
|---|---|---|---|
| Primaire | Vert profond | `#123F35` | Identité, en-têtes, structure, navigation |
| Action | Vert action | `#1F5B4B` | Boutons principaux, actions positives, éléments interactifs |
| Accent | Or | `#E7B84B` | Mise en évidence ponctuelle, repères visuels |
| Fond | Fond clair | `#F4F6F3` | Fond général, surfaces, arrière-plan |
| Texte | Texte foncé | `#23302B` | Texte principal, libellés, informations financières |

### 1.2 Règles d'utilisation

- Le vert profond est la couleur de structure et de navigation.
- Le vert action est réservé aux actions principales et aux éléments interactifs.

## 3. Bordures et rayons

### 3.1 Rayons

| Élément | Rayon provisoire |
|---|---|
| Bouton | 10 px |
| Champ de saisie | 10 px |
| Carte | 14 px |
| Modale | 16 px |
| Badge | 999 px |
| Panneau de confirmation | 16 px |

## 4. Ombres discrètes

| Élément | Ombre |
|---|---|
| Cartes | 0 1 px 3 px rgba(18,63,53,0.10), 0 2 px 6 px rgba(18,63,53,0.12) |
| Modales | 0 8 px 24 px rgba(18,63,53,0.18) |
| Sélecteur ouvert | 0 4 px 12 px rgba(18,63,53,0.12) |
| Boutons pressés | opacité 0.85, pas de note d'ombre |

## 5. Boutons

### 5.1 Variantes

| Variante | Utilisation |
|---|---|
| Primary | Action principale unique |
| Secondary | Action secondaire, retour, annulation |
| Ghost | Action discrète, masquée dans une carte |
| Danger | Action destructive, suppression, clôture, confirmation de retrait total |

## 6. Champs de saisie

### 6.1 Règles communes

- Chaque champ a un libellé visible, une indication d'erreur, un espacement clair, et un retour tactile minimal.

## 7. Cartes

### 7.1 Types

- **KPI card** : label minimal, valeur chiffrée, note optionnelle.

## 8. Badges de statut

### 8.1 Règles

- Chaque badge a un libellé texte et une icône si nécessaire.
- Les couleurs sont secondaires et ne doivent pas être seules l'information.
- Police : 600, taille 12 px, poignée 999 px.

## 9. Modales

### 9.1 Règles

- Fondu d'ouverture et de fermeture.
- Bordure rectangulaire, fond opacité, boutons alignés en bas.

## 10. Notifications

### 10.1 Types


## 11. Icônes

### 11.1 Règles

- Utiliser une bibliothèque d'icônes unique et maintenue.
- Ne pas mixer emojis et icônes dans la même zone sémantique.
- Icônes must have a meaning and text must back them up.
- Icônes must be 24 px for mobile, 20 px for admin buttons.

### 11.2 Palette

## 12. États interactifs

| État | Rendu |
|---|---|
| Default | Contraste, bordure légère |
| Hover/Pressed | Différence de couleur ou d'opacité |
| Focus | Outline clair, visible |

## 13. Orientations et espacements

### 13.1 Mobile

- Portrait et paysage supportés, mais la composition prioritaire est le portrait.
- Zones tactiles au minimum 48 px.

## 14. Accessibilité

- Contrast supérieur à 4.5:1 pour le texte.
- Zéro usage de la couleur comme seul indicateur d'état.
- Labels textuels pour tous les champs et boutons.

## 15. Emplacements de composants

| Composant | Usage |
|---|---|
| `AppScreen` | Écran complet, fond clair, padding global |

## 16. Principes d'usage métier

- `PROVISOIRE` = client créé hors ligne ou non encore validé.

## 17. Points à valider

- Couleurs exactes de statut.
- Police officielle.
- Espacement exact des composants.
- Icônes officielles.
- Contraste des composants interactifs.
- Validation sur téléviseur et écran de tablette.

- `CONFIRME` = client validé.
- `EN ATTENTE` = opération en attente de validation serveur.
- `CONFLIT` = ouverture de la résolution.
- `ERREUR` = opération impossible, à corriger.
- `NON MESURÉ` = pas d'état de réseau mesuré.

| `AppHeader` | En-tête d'écran, titre, retour, actions secondaires |
| `AppFooter` | Pied d'écran, actions rares |
| `AppCard` | Bloc d'information ou d'action |
| `AppButton` | Bouton unique |
| `AppInput` | Champ de saisie unique |
| `AppSelect` | Sélecteur unique |
| `AppStatusPill` | Statut court |
| `AppSyncBanner` | Bannière de synchro |
| `AppNotice` | Message contextuel |
| `AppEmptyState` | État vide |
| `AppErrorState` | État d'erreur |
| `AppLoadingState` | État de chargement |
| `AppDialog` | Modale |
| `AppTable` | Tableau |
| `AppProgressCard` | Carte de progression |
| `AppKpiCard` | Carte de chiffre clé |
| `AppActionCard` | Carte d'action |

- `aria-label` pour les icônes et boutons masqués.
- États `role="alert"` pour les erreurs critiques.
- Navigation au clavier partagée pour l'admin.
- Les états de chargement sont `role="progressbar"` et ont un libellé.

- Padding 20 px côté contenu, page inférieure 32 px.
- Conteneur central 85 % de la largeur, pas de contenu excessif.

### 13.2 Web

- Desktop : sidebar, contenu large, tableaux détaillés.
- Tablette : sidebar côté, contenu responsif, grille de 12 colonnes.
- Mobile : menu latéral, contenu pile.

| Disabled | Opacité 0.5, pas de pointeur |
| Loading | Indicateur, bouton désactivé, libellé indique qu'attend |
| Empty | Tableau vide, texte, action possible |
| Error | Fond clair rouge, message, bouton retry |
| Success | Couleur succès, message, action possible |


| Icône | Usage |
|---|---|
| `Users` | Clients |
| `Folder` | Dossiers |
| `Receipt` | Collectes, reçus |
| `Wallet` | Cycles, finances |
| `CalendarDays` | Période, dates |
| `History` | Historique, retraits |
| `RefreshCcw` | Synchronisation, rafraîchir |
| `CheckCircle` | Succès |
| `AlertTriangle` | Attention |
| `AlertCircle` | Erreur |
| `User` | Profil |
| `Settings` | Paramètres |
| `HelpCircle` | Aide |
| `LogOut` | Déconnexion |

- **Info** : bleu profond ou vert, icône `Info`.
- **Succès** : vert, icône `CheckCircle`.
- **Avertissement** : ambre, icône `AlertTriangle`.
- **Erreur** : rouge, icône `AlertCircle`.
- **Sync** : panneau de synchro avec bouton retry, statut `UNKNOWN`, `ONLINE`, `OFFLINE`, `PENDING`, `ERROR`.

### 10.2 Placement

- Ferraille en haut de l'écran, conflits de synchronisation en zone de notifications.
- Modales pour les actions sensibles.

- Bouton Annuler affiché à gauche du bouton Confirmation.
- Bouton Conformation est la couleur de l'action principale.
- Si l'action est destructive, le bouton devient rouge et son libellé est clair.
- Le focus se positionne sur le bouton de confirmation.
- L'action est exécutée par séquence d'événements ouverte, et non par clic du système.

- Couleurs provisoires :
  - `CONFIRME` : `#15803D`
  - `PROVISOIRE` : `#B45309`
  - `EN ATTENTE` : `#B45309`
  - `CONFLIT` : `#B91C1C`
  - `ERREUR` : `#B91C1C`
  - `NON MESURÉ` : `#4A5A53`

### 8.2 Exemples

- `PROVISOIRE` : fond légèrement clair, texte orange foncé, icône point d'interrogation.
- `CONFIRME` : fond légèrement clair, texte vert foncé, icône checklist.
- `EN ATTENTE` : fond légèrement clair, texte ambre, icône exécution.

- **Action card** : icône, titre court, sous-titre, chevron de navigation.
- **Stat card** : évolution, indicateur, état du filtre.
- **Info card** : texte court, lien, bouton secondaire.
- **Result card** : succès, montant, message court, bouton final.

### 7.2 Style

- Contour léger, fond blanc, ombre discrète.
- Marges intérieures : 14 px mobile, 16 px Web.

- Champs obligatoires : astérisque rouge + libellé, pas seulement la couleur.
- La bordure est plus épaisse en cas d'erreur et devient rouge.
- Le message d'erreur est visible sous le champ, avec une icône de souci.
- Un état de chargement peut remplacer temporairement la valeur saisie tant que le contrôle n'est pas effectué.

### 6.2 Champs dédiés

| Champ | Usage | Règle |
|---|---|---|
| `InputTexte` | Texte libre | Validation locale, limites, placeholder |
| `InputNumerique` | Nombre entier | `min`, `max`, `integer`, clavier numérique |
| `InputMontantXAF` | Montant FCFA entier | Entier, formatage avec espaces, indication XAF |
| `InputRecherche` | Recherche | Icône de recherche, bouton effacer, clavier |
| `Selecteur` | Liste de sélection | Valeur affichée, icône, panneau, état vide/vide |
| `InputDate` | Date (si nécessaire) | Format ISO, validation, min/max |
| `TextArea` | Texte long | Lignes, pour les raisons et notes |

| Loading | Indicateur pendant la soumission |

### 5.2 Règles

- Hauteur minimale : 48 px mobile, 44 px Web.
- Espacement tapteur : 48 px de marge tactile.
- États : par défaut, pressé, focus, disabled, loading.
- La couleur de fond ne doit pas être la seule information : l'écriture et l'icône doivent apporter la sémantique.


| Table | 8 px (bords) |
| Pilles | 20 px |

### 3.2 Bordures

- Épaisseur de base : 1 px.
- Couleur de base : `#DCE3E8` mobile, `#D4D8D6` Web.
- Erreur : `#B91C1C`.
- Attention : `#B45309`.
- Succès : `#15803D`.

- L'or est une touche décorative et de priorisation mentionnelle ; il ne remplace jamais une couleur de statut.
- La couleur ne doit jamais être le seul vecteur d'information : chaque état critique est aussi visible par libellé, icône ou motif.
- Les couleurs de statut ne sont pas fixées dans cette version provisoire ; elles doivent être validées avec les fidèles utilisateurs et les décideurs avant figure.

### 1.3 Couleurs techniques des états

| État | Nom | Code provisoire | Usage |
|---|---|---|---|
| En ligne | Succès | `#15803D` | Opération acceptée |
| Attente | Attention | `#B45309` | En attente, non confirmé |
| Erreur | Erreur | `#B91C1C` | Échec, refus, conflit |
| Indéfini | Neutre | `#4A5A53` | À déterminer, hors palette d'action |
| Avertissement | Infobule | `#6B7A72` | Information, héritage |

> Les codes provisoires sont documentés pour la progression. Leur valeur exacte doit être validée dans la charte officielle et respecter le contraste accessible.

### 1.4 Accent contrasté et surfaces

| Surface | Code provisoire |
|---|---|
| Surface | `#FFFFFF` |
| Fonceur de surface | `#E9EFE9` |
| Fonceur tierce | `#D7E0D9` |
