// Select — sélecteur avec affichage texte + zone tactile (Mobile)
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, space, touch } from '../colors';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  required?: boolean;
  error?: string | null;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  required = false,
  error,
  value,
  onChange,
  options,
  placeholder = 'Sélectionner',
}: SelectProps) {
  const selected = options.find((o) => o.value === value);
  const displayValue = selected ? selected.label : placeholder;

  return (
    <View style={[styles.container, { marginBottom: space.md }]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.required}>*</Text> : null}
      </View>
      <TouchableOpacity
        style={[styles.input, error ? styles.inputError : {}]}
        onPress={() => {
          // Sélection simplifiée : prend la première option différente de la valeur actuelle
          const next = options.find((o) => o.value !== value);
          if (next) onChange(next.value);
        }}
      >
        <Text style={[styles.inputText, error ? styles.inputErrorText : {}]}>
          {displayValue}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 16,
    padding: 12,
    minHeight: touch.min,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputText: {
    color: colors.text,
  },
  inputErrorText: {
    color: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
});
