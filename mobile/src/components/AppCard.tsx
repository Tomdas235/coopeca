import { colors } from './theme';

/**
 * Carte de contenu générique COOPECA (Lot 1, fondation visuelle).
 *
 * Conteneur réutilisable pour regrouper un bloc d'information ou
 * d'action. Aucune logique métier : uniquement de la présentation.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

interface AppCardProps {
  children: ReactNode;
}

export function AppCard({ children }: AppCardProps) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
});
