import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { colors } from './theme';

/**
 * État d'erreur COOPECA (Lot 1, fondation visuelle).
 *
 * Affiche un message d'erreur explicite sans détruire les saisies
 * (principe UX §2 : préserver les saisies en cas d'erreur).
 * Le bouton « Réessayer » est optionnel et fourni par l'appelant.
 */
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
    <View
      accessibilityRole="alert"
      style={styles.container}
    >
      <Text style={styles.symbol}>!</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <View style={styles.action}>
          <AppButton label={retryLabel} onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
  },
  symbol: {
    width: 36,
    height: 36,
    borderRadius: 18,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: colors.danger,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 36,
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
