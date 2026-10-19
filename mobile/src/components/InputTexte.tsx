import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from './theme';

/**
 * Champ de saisie texte COOPECA.
 *
 * Composant contrôlé : le parent gère `value` et `onChangeText`.
 * Gère la validation basique (champ requis, longueur maximale) sans effacer
 * la saisie de l'utilisateur.
 */
export interface InputTexteProps {
  /** Libellé affiché au-dessus du champ. */
  label: string;
  /** Valeur actuelle du champ. */
  value: string;
  /** Callback appelé à chaque modification du texte. */
  onChangeText: (text: string) => void;
  /** Texte placeholder quand le champ est vide. */
  placeholder?: string;
  /** Message d'erreur personnalisé optionnel. */
  error?: string;
  /** Si vrai, le champ ne peut pas être vide. */
  required?: boolean;
  /** Nombre maximal de caractères autorisés. */
  maxLength?: number;
  /** Désactive la saisie. */
  disabled?: boolean;
  /** Type de clavier (ex. 'email-address', 'phone-pad'). */
  keyboardType?: string;
  /** Libellé d'accessibilité pour le champ. */
  accessibilityLabel?: string;
}

export function InputTexte({
  label,
  value,
  onChangeText,
  placeholder,
  error: errorProp,
  required = false,
  maxLength,
  disabled = false,
  keyboardType = 'default',
  accessibilityLabel,
}: InputTexteProps) {
  const estVide = value.trim() === '';
  const depasseLongueur = maxLength !== undefined && value.length > maxLength;

  let erreurCalculee: string | null = null;

  if (required && estVide) {
    erreurCalculee = 'Ce champ est requis.';
  } else if (depasseLongueur && maxLength !== undefined) {
    erreurCalculee = `Maximum ${maxLength} caractères.`;
  }

  const estValide = erreurCalculee === null;
  const erreurAffichee = errorProp ?? erreurCalculee;
  const compteur =
    maxLength !== undefined ? `${value.length}/${maxLength}` : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.required}>*</Text> : null}
        {compteur ? <Text style={styles.compteur}>{compteur}</Text> : null}
      </View>
      <TextInput
        style={[styles.input, !estValide && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType as any}
        disabled={disabled}
        maxLength={maxLength}
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
  compteur: {
    color: colors.muted,
    fontSize: 12,
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
