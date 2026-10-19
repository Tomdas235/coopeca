import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { InputTexte } from '../../src/components/InputTexte';
import { InputNumerique } from '../../src/components/InputNumerique';
import { InputRecherche } from '../../src/components/InputRecherche';
import { SelecteurSimple } from '../../src/components/SelecteurSimple';
import { SelecteurDossier } from '../../src/components/SelecteurDossier';
import { colors } from '../../src/components/theme';

/**
 * Écran vitrine des composants UI COOPECA.
 *
 * Présente chaque composant de l'interface avec un exemple d'usage.
 * Aucune logique métier : vitrine visuelle uniquement.
 */
export default function ComposantsScreen() {
  return (
    <AppScreen>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>COOPECA · COMPOSANTS UI</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Bibliothèque de composants
        </Text>
        <Text style={styles.subtitle}>
          Exemples d'usage des composants d'interface COOPECA.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Champs de saisie</Text>
        <Text style={styles.sectionCaption}>
          InputTexte, InputNumerique, InputRecherche, Sélecteur.
        </Text>
      </View>

      <View style={styles.exampleCard}>
        <InputTexte
          label="Nom complet"
          placeholder="Ex. Jean Dupont"
          accessibilityLabel="Nom complet du client"
        />
      </View>

      <View style={styles.exampleCard}>
        <InputNumerique
          label="Âge"
          placeholder="Ex. 35"
          integer
          min={18}
          max={120}
          accessibilityLabel="Âge du client"
        />
      </View>

      <View style={styles.exampleCard}>
        <InputRecherche
          placeholder="Chercher un client…"
          accessibilityLabel="Recherche de client"
        />
      </View>

      <View style={styles.exampleCard}>
        <SelecteurSimple
          label="Agence"
          value={null}
          options={[
            { label: 'Agence Centre', value: 'centre' },
            { label: 'Agence Nord', value: 'nord' },
            { label: 'Agence Sud', value: 'sud' },
          ]}
          onValueChange={() => {}}
          accessibilityLabel="Sélecteur d'agence"
        />
      </View>

      <View style={styles.exampleCard}>
        <SelecteurDossier
          label="Dossier"
          value={null}
          options={[]}
          onValueChange={() => {}}
          accessibilityLabel="Sélecteur de dossier"
        />
      </View>

      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          D'autres composants s'ajouteront ici au fur et à mesure de leur
          implémentation.
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
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    marginTop: 24,
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionCaption: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  empty: {
    marginTop: 32,
    padding: 20,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  exampleCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
  },
});
