// DatePicker — sélecteur de date (Mobile)
// Utilise TextInput avec type date via keyboardType et affichage de la valeur sélectionnée.
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, space, touch } from '../colors';

interface DatePickerProps {
  label: string;
  required?: boolean;
  error?: string | null;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}

export function DatePicker({
  label,
  required = false,
  error,
  value,
  onChange,
  min,
  max,
}: DatePickerProps) {
  const displayValue = value || 'Sélectionner une date';

  return (
    <View style={[styles.container, { marginBottom: space.md }]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.required}>*</Text> : null}
      </View>
      <TouchableOpacity
        style={[styles.input, error ? styles.inputError : {}]}
        onPress={() => {
          // Sélection simplifiée : incrémente la date d'un jour à chaque appui (démo)
          const now = new Date();
          const iso = now.toISOString().slice(0, 10);
          onChange(iso);
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
