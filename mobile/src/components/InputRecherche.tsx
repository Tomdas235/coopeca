import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from './theme';

/**
 * Champ de recherche COOPECA.
 *
 * Affiche une icône de recherche à gauche et un bouton « effacer » (X) à
 * droite dès qu'il y a du texte. Composant contrôlé : le parent gère
 * `value` et `onChangeText`.
 */
export interface InputRechercheProps {
  /** Valeur actuelle de la recherche. */
  value: string;
  /** Callback appelé à chaque modification du texte. */
  onChangeText: (text: string) => void;
  /** Texte placeholder quand le champ est vide. */
  placeholder?: string;
  /** Libellé d'accessibilité pour le champ. */
  accessibilityLabel?: string;
  /** Désactive la saisie. */
  disabled?: boolean;
}

export function InputRecherche({
  value,
  onChangeText,
  placeholder = 'Rechercher…',
  accessibilityLabel = 'Champ de recherche',
  disabled = false,
}: InputRechercheProps) {
  const estVide = value.trim() === '';

  return (
    <View style={styles.container}>
      <Text style={styles.icone}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType="default"
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="search"
        returnKeyType="search"
      />
      {!estVide && !disabled ? (
        <TouchableOpacity
          style={styles.boutonEffacer}
          onPress={() => onChangeText('')}
          accessibilityLabel="Effacer la recherche"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.texteEffacer}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 48,
    marginBottom: 16,
  },
  icone: {
    color: colors.muted,
    fontSize: 18,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 10,
    paddingRight: 4,
  },
  boutonEffacer: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  texteEffacer: {
    color: colors.muted,
    fontSize: 18,
  },
});
