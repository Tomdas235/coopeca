// Radio — bouton radio groupé (Mobile)
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '../colors';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioProps {
  label: string;
  required?: boolean;
  error?: string | null;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
}

export function Radio({
  label,
  required = false,
  error,
  name,
  value,
  onChange,
  options,
}: RadioProps) {
  return (
    <View style={[styles.container, { marginBottom: space.md }]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.required}>*</Text> : null}
      </View>
      <View style={styles.radioGroup}>
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            style={[
              styles.radioRow,
              value === opt.value && styles.radioRowSelected,
            ]}
            onPress={() => onChange(opt.value)}
          >
            <View
              style={[
                styles.radioCircle,
                value === opt.value && styles.radioCircleSelected,
              ]}
            />
            <Text style={styles.radioLabel}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
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
  radioGroup: {
    gap: 4,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  radioRowSelected: {
    opacity: 0.9,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  radioCircleSelected: {
    borderColor: colors.action,
    backgroundColor: colors.action,
  },
  radioLabel: {
    color: colors.text,
    fontSize: 15,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
});
