// ============================================================================
// Design System COOPECA — État de chargement (mobile)
// Source : docs/uiux/Design_System.md §12
// Règles : indicateur centré, libellé explicite, role="progressbar".
// ============================================================================

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, space } from './colors';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Chargement en cours…' }: LoadingStateProps) {
  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator size="large" color={colors.action} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: space.xxl,
  },
  message: {
    color: colors.muted,
    fontSize: 14,
  },
});