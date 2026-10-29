import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from './AppScreen';
import { StatusPill } from './StatusPill';
import { colors } from './theme';

interface ScreenPlaceholderProps {
  titre: string;
  description: string;
}

/**
 * Cartouche standard des écrans squelette COOPECA.
 *
 * Elle garantit qu'aucun écran ne présente une fonctionnalité comme
 * disponible tant qu'elle n'est pas implémentée et testée : chaque écran
 * indique explicitement son état « squelette ».
 */
export function ScreenPlaceholder({ titre, description }: ScreenPlaceholderProps) {
  return (
    <AppScreen>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>COOPECA</Text>
        <Text accessibilityRole="header" style={styles.titre}>
          {titre}
        </Text>
      </View>
      <View style={styles.card}>
        <StatusPill kind="unknown" label="Fonctionnalité non implémentée" />
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.etat}>
          Cette version ne réalise aucune authentification, impression ou opération métier.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 8,
    paddingTop: 4,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  titre: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  card: {
    gap: 14,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  etat: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
