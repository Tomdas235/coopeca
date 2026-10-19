import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from './theme';
import { exigerEntier, formatMontantXAF } from '../utils/montants';
import type { MontantXAF } from '../types';

/**
 * Champ de saisie dédié aux montants financiers COOPECA.
 *
 * Règle non négociable : les montants sont des nombres ENTIERS en XAF,
 * jamais des flottants. Toute saisie non entière est rejetée avec un
 * message d'erreur explicite sans effacer la saisie de l'utilisateur.
 *
 * Le composant est contrôlé : le parent gère `value` et `onChangeText`.
 */
export interface InputMontantXAFProps {
  /** Libellé affiché au-dessus du champ. */
  label: string;
  /** Valeur brute saisie (chaîne de caractères). */
  value: string;
  /** Callback appelé à chaque modification du texte. */
  onChangeText: (text: string) => void;
  /** Message d'erreur personnalisé optionnel (remplace le défaut). */
  error?: string;
  /** Désactive la saisie. */
  disabled?: boolean;
  /** Texte placeholder quand le champ est vide. */
  placeholder?: string;
}

export function InputMontantXAF({
  label,
  value,
  onChangeText,
  error: errorProp,
  disabled = false,
  placeholder,
}: InputMontantXAFProps) {
  // Normaliser : retirer les espaces séparateurs de milliers avant validation.
  const valeurBrute = value.replace(/\s/g, '');
  let montant: MontantXAF | null = null;
  let erreurCalculee: string | null = null;

  if (valeurBrute !== '') {
    const parsed = Number(valeurBrute);
    try {
      exigerEntier(parsed, 'InputMontantXAF');
      montant = parsed;
    } catch {
      erreurCalculee =
        errorProp ?? 'Le montant doit être un nombre entier de XAF.';
    }
  }

  const estValide = erreurCalculee === null;
  const erreurAffichee = errorProp ?? erreurCalculee;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !estValide && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        disabled={disabled}
        placeholder={placeholder}
        accessibilityLabel={label}
      />
      {!estValide && erreurAffichee ? (
        <Text style={styles.error}>{erreurAffichee}</Text>
      ) : montant !== null ? (
        <Text style={styles.hint}>{formatMontantXAF(montant)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    marginBottom: 16,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    fontSize: 16,
    padding: 12,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
  },
});
