import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from './theme';

/**
 * Champ de saisie numérique COOPECA.
 *
 * Composant contrôlé : le parent gère `value` et `onChangeText`.
 * Valide : champ requis, borne min/max, et mode entier uniquement (rejette
 * les décimaux sans effacer la saisie).
 *
 * Pour les montants financiers XAF entiers, préférer `InputMontantXAF`.
 */
export interface InputNumeriqueProps {
  /** Libellé affiché au-dessus du champ. */
  label: string;
  /** Valeur actuelle du champ (chaîne de caractères). */
  value: string;
  /** Callback appelé à chaque modification du texte. */
  onChangeText: (text: string) => void;
  /** Texte placeholder quand le champ est vide. */
  placeholder?: string;
  /** Message d'erreur personnalisé optionnel. */
  error?: string;
  /** Si vrai, le champ ne peut pas être vide. */
  required?: boolean;
  /** Valeur minimale autorisée. */
  min?: number;
  /** Valeur maximale autorisée. */
  max?: number;
  /** Si vrai, n'accepte que les nombres entiers (pas de virgule/point). */
  integer?: boolean;
  /** Désactive la saisie. */
  disabled?: boolean;
  /** Libellé d'accessibilité pour le champ. */
  accessibilityLabel?: string;
}

export function InputNumerique({
  label,
  value,
  onChangeText,
  placeholder,
  error: errorProp,
  required = false,
  min,
  max,
  integer = false,
  disabled = false,
  accessibilityLabel,
}: InputNumeriqueProps) {
  const estVide = value.trim() === '';
  const parsed = Number(value);
  const estUnNombre = !estVide && !Number.isNaN(parsed);

  let erreurCalculee: string | null = null;

  if (required && estVide) {
    erreurCalculee = 'Ce champ est requis.';
  } else if (!estVide && !estUnNombre) {
    erreurCalculee = 'Valeur numérique invalide.';
  } else if (estUnNombre) {
    if (integer && !Number.isInteger(parsed)) {
      erreurCalculee = 'Nombre entier attendu.';
    } else if (min !== undefined && parsed < min) {
      erreurCalculee = `Minimum ${min}.`;
    } else if (max !== undefined && parsed > max) {
      erreurCalculee = `Maximum ${max}.`;
    }
  }

  const estValide = erreurCalculee === null;
  const erreurAffichee = errorProp ?? erreurCalculee;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.required}>*</Text> : null}
      </View>
      <TextInput
        style={[styles.input, !estValide && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={integer ? 'numeric' : 'decimal-pad'}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="text"
      />
      {!estValide && erreurAffichee ? (
        <Text style={styles.error}>{erreurAffichee}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 6,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  required: {
    color: colors.danger,
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
});
