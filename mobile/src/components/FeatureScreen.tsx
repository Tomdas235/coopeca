import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from './AppScreen';
import { StatusPill } from './StatusPill';
import { colors } from './theme';

interface FeatureScreenProps {
  title: string;
  description: string;
  nextStep: string;
}

export function FeatureScreen({ title, description, nextStep }: FeatureScreenProps) {
  return (
    <AppScreen>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>ESPACE AGENT</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.card}>
        <StatusPill kind="unknown" label="Module en préparation" />
        <Text style={styles.cardTitle}>Cette fonctionnalité n’est pas encore active</Text>
        <Text style={styles.body}>{nextStep}</Text>
        <View style={styles.note}>
          <Text style={styles.noteText}>
            Aucune donnée métier n’est affichée ou enregistrée dans cette version.
          </Text>
        </View>
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
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    gap: 14,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  note: {
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    padding: 12,
  },
  noteText: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
});
