// ============================================================================
// Design System COOPECA — Badge de statut (mobile)
// Source : docs/uiux/Design_System.md §8
// Règles : libellé texte obligatoire, couleur secondaire non exclusive,
// taille 12 px, graisse 600, rayon pill.
// ============================================================================

import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from './colors';

export type StatusKind =
  | 'confirme'
  | 'provisoire'
  | 'en_attente'
  | 'conflit'
  | 'erreur'
  | 'non_mesure'
  | 'success'
  | 'warning'
  | 'danger';

interface BadgeProps {
  label: string;
  kind?: StatusKind;
}

const statusPalette: Record<StatusKind, { background: string; color: string }> = {
  confirme: { background: colors.successSoft, color: colors.success },
  provisoire: { background: colors.warningSoft, color: colors.warning },
  en_attente: { background: colors.warningSoft, color: colors.warning },
  conflit: { background: colors.dangerSoft, color: colors.danger },
  erreur: { background: colors.dangerSoft, color: colors.danger },
  non_mesure: { background: colors.neutralSoft, color: colors.neutral },
  success: { background: colors.successSoft, color: colors.success },
  warning: { background: colors.warningSoft, color: colors.warning },
  danger: { background: colors.dangerSoft, color: colors.danger },
};

export function Badge({ label, kind = 'non_mesure' }: BadgeProps) {
  const tone = statusPalette[kind];

  return (
    <View style={[styles.container, { backgroundColor: tone.background }]}>
      <Text style={[styles.label, { color: tone.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: 28,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});