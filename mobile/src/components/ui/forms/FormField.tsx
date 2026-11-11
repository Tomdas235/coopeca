// FormField — composant de base label + champ + message d'erreur (Mobile)
import { StyleSheet, Text, View } from 'react-native';
import { colors, space, radius } from '../colors';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string | null;
  helper?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  required = false,
  error,
  helper,
  children,
}: FormFieldProps) {
  return (
    <View style={[styles.container, { marginBottom: space.md }]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.required}>*</Text> : null}
      </View>
      {children}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
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
  error: {
    color: colors.danger,
    fontSize: 12,
  },
  helper: {
    color: colors.muted,
    fontSize: 12,
  },
});
