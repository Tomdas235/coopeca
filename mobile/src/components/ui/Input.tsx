// ============================================================================
// Design System COOPECA — Champ de saisie unifié (mobile)
// Source : docs/uiux/Design_System.md §6
// Règles : libellé visible, indication d'erreur, bordure rouge en cas d'erreur,
// message d'erreur sous le champ, préservation de la saisie.
// ============================================================================

import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { colors, radius, space } from './colors';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
  disabled?: boolean;
  keyboardType?: KeyboardTypeOptions;
  accessibilityLabel?: string;
  onBlur?: () => void;
  secureTextEntry?: boolean;
}

export function Input({
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
  onBlur,
  secureTextEntry = false,
}: InputProps) {
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
  const compteur = maxLength !== undefined ? `${value.length}/${maxLength}` : undefined;

  return (
    <View style={[styles.container, { marginBottom: space.md }]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.required}>*</Text> : null}
        {compteur ? <Text style={styles.compteur}>{compteur}</Text> : null}
      </View>
      <TextInput
        style={[styles.input, !estValide && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        keyboardType={keyboardType}
        editable={!disabled}
        maxLength={maxLength}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="text"
        secureTextEntry={secureTextEntry}
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
    borderRadius: radius.md,
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