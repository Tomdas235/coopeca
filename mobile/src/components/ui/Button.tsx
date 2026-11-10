// ============================================================================
// Design System COOPECA — Bouton unifié (mobile)
// Source : docs/uiux/Design_System.md §5
// Règles : hauteur min 48 px, variantes primary/secondary/ghost/danger/loading,
// états pressé/focus/disabled, contraste texte sur fond.
// ============================================================================

import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, space, shadow, touch } from './colors';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const variantStyles: Record<ButtonVariant, { background: string; border: string; color: string }> = {
  primary: { background: colors.action, border: colors.action, color: '#FFFFFF' },
  secondary: { background: colors.surface, border: colors.border, color: colors.primary },
  ghost: { background: 'transparent', border: 'transparent', color: colors.action },
  danger: { background: colors.danger, border: colors.danger, color: '#FFFFFF' },
};

const sizeStyles: Record<ButtonSize, { height: number; paddingVertical: number }> = {
  md: { height: 48, paddingVertical: 12 },
  lg: { height: 56, paddingVertical: 16 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const handlePress = isDisabled ? undefined : onPress;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <Text style={[styles.label, { color: v.color }]}>
          Chargement…
        </Text>
      ) : (
        <Text style={[styles.label, { color: v.color }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: touch.min,
    paddingHorizontal: space.md,
    ...shadow.sm,
  },
  primary: {
    backgroundColor: colors.action,
    borderColor: colors.action,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  md: {
    minHeight: 48,
    paddingVertical: 12,
  },
  lg: {
    minHeight: 56,
    paddingVertical: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
    borderColor: colors.muted,
    backgroundColor: colors.neutralSoft,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
});