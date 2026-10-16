import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

/**
 * État de chargement COOPECA (Lot 1, fondation visuelle).
 *
 * Indicateur centré avec libellé explicite. Réutilisé par tous
 * les écrans futurs lors d'un chargement local ou réseau.
 */
interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Chargement en cours…' }: LoadingStateProps) {
  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  message: {
    color: colors.muted,
    fontSize: 14,
  },
});
