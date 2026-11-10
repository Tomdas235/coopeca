// ============================================================================
// Design System COOPECA — État d'erreur (mobile)
// Source : docs/uiux/Design_System.md §12
// Règles : message explicite, bouton retry optionnel, préservation de saisie.
// ============================================================================

import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, radius, space } from './colors';

interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Une erreur est survenue',
  message,
  retryLabel = 'Réessayer',
  onRetry,
}: ErrorStateProps) {
  return (
    <View accessibilityRole="alert" style={[styles.container, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <View style={styles.action}>
          <Button label={retryLabel} onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.xxl,
  },
  title: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  action: {
    marginTop: 6,
    alignSelf: 'stretch',
  },
});