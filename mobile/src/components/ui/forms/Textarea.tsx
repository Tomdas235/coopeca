// Textarea — zone de texte multiligne (Mobile)
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, space } from '../colors';

interface TextareaProps {
  label: string;
  required?: boolean;
  error?: string | null;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

export function Textarea({
  label,
  required = false,
  error,
  value,
  onChangeText,
  placeholder,
  rows = 3,
  maxLength,
}: TextareaProps) {
  const compteur = maxLength !== undefined ? `${value.length}/${maxLength}` : null;

  return (
    <View style={[styles.container, { marginBottom: space.md }]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.required}>*</Text> : null}
        {compteur ? <Text style={styles.counter}>{compteur}</Text> : null}
      </View>
      <TextInput
        style={[styles.input, error ? styles.inputError : {}]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline
        numberOfLines={rows}
        maxLength={maxLength}
      />
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
  counter: {
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
});
