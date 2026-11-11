// Checkbox — case à cocher (Mobile)
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, touch } from '../colors';

interface CheckboxProps {
  label: string;
  required?: boolean;
  error?: string | null;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Checkbox({
  label,
  required = false,
  error,
  checked,
  onChange,
}: CheckboxProps) {
  return (
    <View style={[styles.container, { marginBottom: space.md }]}>
      <Pressable
        style={[styles.checkboxRow, checked && styles.checkboxRowChecked]}
        onPress={() => onChange(!checked)}
      >
        <View
          style={[
            styles.checkboxBox,
            checked && styles.checkboxBoxChecked,
          ]}
        />
        <Text style={styles.checkboxLabel}>{label}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: touch.min,
  },
  checkboxRowChecked: {
    opacity: 0.7,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  checkboxBoxChecked: {
    borderColor: colors.action,
    backgroundColor: colors.action,
  },
  checkboxLabel: {
    color: colors.text,
    fontSize: 15,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
});
