/**
 * Jetons visuels COOPECA.
 *
 * Source : docs/COOPECA_Branding_UIUX_Guidelines_v1.md §2 — concept V1.0,
 * « proposition visuelle à valider par les équipes COOPECA » (§1, §13).
 *
 * Rôles de marque :
 * - `primary` : identité, en-têtes, navigation, éléments structurants ;
 * - `action`  : boutons principaux, actions positives, éléments interactifs ;
 * - `gold`    : mise en évidence ponctuelle seulement — ne remplace jamais
 *               une couleur de statut (§2, règles d'utilisation).
 */
export const colors = {
  // ── Marque ────────────────────────────────────────────────────────
  primary: '#123F35',
  primaryHover: '#0E322A',
  primarySoft: '#E7EEE9',
  action: '#1F5B4B',
  actionHover: '#17493C',
  actionSoft: '#E8F0EC',
  gold: '#E7B84B',
  goldSoft: '#FBF3DF',

  // ── Surfaces et texte ─────────────────────────────────────────────
  background: '#F4F6F3',
  surface: '#FFFFFF',
  text: '#23302B',
  muted: '#5C6F67',
  border: '#DBE3DD',

  /**
   * Alias historiques conservés pour les écrans existants : `accent` porte la
   * couleur interactive de marque (vert action). Dans le code neuf, préférer
   * `primary` (structure) ou `action` (interaction).
   */
  accent: '#1F5B4B',
  accentHover: '#17493C',
  accentSoft: '#E8F0EC',

  /**
   * Couleurs TECHNIQUES des états d'interface, hors palette de marque.
   *
   * Les guidelines ne fixent pas les codes des quatre états opérationnels
   * (Confirmé / En attente / Anomalie / Provisoire) : §3 et §12 les déclarent
   * « à spécifier et valider avant l'implémentation ». Ces valeurs restent
   * donc provisoires. Un statut n'est jamais communiqué par la couleur seule :
   * `StatusPill` porte toujours un libellé textuel.
   */
  success: '#15803D',
  successSoft: '#EFF6F1',
  warning: '#B45309',
  warningSoft: '#FFF7ED',
  danger: '#B91C1C',
  dangerSoft: '#FEF2F2',
  neutral: '#4A5A53',
  neutralSoft: '#EDF1EE',
} as const;

/**
 * Remplit le conteneur parent (superposition plein écran).
 *
 * Équivalent explicite de `StyleSheet.absoluteFillObject`, qui n'existe plus
 * dans les typings de React Native 0.88. Ne pas le remplacer par
 * `StyleSheet.absoluteFill` : celui-ci est une référence de style enregistrée
 * (un identifiant) et ne peut pas être étalé dans un objet de style.
 */
export const absoluteFill = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;
