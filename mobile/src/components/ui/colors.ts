// ============================================================================
// Design System COOPECA — Palette unifiée (mobile / web)
// Source : docs/uiux/Design_System.md
// ============================================================================

export const colors = {
  // ── Marque ────────────────────────────────────────────────────────────────
  primary: '#123F35',      // Vert profond — identité, en-têtes, structure
  primaryHover: '#0E322A',
  primarySoft: '#E7EEE9',
  action: '#1F5B4B',       // Vert action — boutons principaux, interactions
  actionHover: '#17493C',
  actionSoft: '#E8F0EC',
  gold: '#E7B84B',         // Or — mise en évidence ponctuelle seulement
  goldSoft: '#FBF3DF',

  // ── Surfaces et texte ─────────────────────────────────────────────────────
  background: '#F4F6F3',   // Fond clair général
  surface: '#FFFFFF',      // Surface blanche (cartes, formulaires)
  surfaceSoft: '#E9EFE9',  // Surface secondaire légère
  text: '#23302B',         // Texte sombre — excellente lisibilité
  muted: '#5C6F67',        // Texte secondaire
  border: '#DCE3E8',       // Bordure légère

  // ── États opérationnels ───────────────────────────────────────────────────
  success: '#15803D',      // Opération acceptée / confirmé
  successSoft: '#EFF6F1',
  warning: '#B45309',      // En attente / provisoire
  warningSoft: '#FFF7ED',
  danger: '#B91C1C',       // Erreur / conflit
  dangerSoft: '#FEF2F2',
  neutral: '#4A5A53',      // Non mesuré / indéfini
  neutralSoft: '#EDF1EE',

  // ── Alias historiques (à conserver pour compatibilité) ────────────────────
  accent: '#1F5B4B',
  accentHover: '#17493C',
  accentSoft: '#E8F0EC',
} as const;

// ============================================================================
// Échelle d'espacement (px)
// ============================================================================
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// ============================================================================
// Rayons de bordure (px)
// ============================================================================
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 16,
  pill: 999,
};

// ============================================================================
// Ombres discrètes (React Native)
// ============================================================================
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
};

// ============================================================================
// Tailles de zone tactile (min 48 px)
// ============================================================================
export const touch = {
  min: 48,
};