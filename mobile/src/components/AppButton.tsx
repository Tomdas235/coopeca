import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from './theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

/**
 * Bouton COOPECA (Lot 1, fondation visuelle).
 *
 * Trois variantes : primaire (action principale), secondaire
 * (action alternative), danger (action sensible, toujours
 * accompagnée d'une confirmation explicite à l'usage).
 */
interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({ label, onPress, variant = 'primary', disabled = false, style }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, variant === 'secondary' ? styles.labelSecondary : styles.labelOnDark]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  labelOnDark: {
    color: '#FFFFFF',
  },
  labelSecondary: {
    color: colors.accent,
  },
});
