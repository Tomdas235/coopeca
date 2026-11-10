// ============================================================================
// Design System COOPECA — Carte unifiée (mobile)
// Source : docs/uiux/Design_System.md §7
// Règles : contour léger, fond blanc, ombre discrète, marges intérieures 14 px.
// Accepte optionnellement onPress pour devenir une carte cliquable.
// ============================================================================

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, touch } from './colors';

interface CardProps {
  children: ReactNode;
  elevation?: 'sm' | 'md' | 'lg';
  padding?: number;
  onPress?: () => void;
}

export function Card({
  children,
  elevation = 'sm',
  padding = 14,
  onPress,
}: CardProps) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={[{ padding }, styles.pressable]}
      >
        <View style={[styles.card, styles[elevation], { padding }]}>
          {children}
        </View>
      </Pressable>
    );
  }
  return <View style={[styles.card, styles[elevation], { padding }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: touch.min,
  },
  pressable: {
    minHeight: touch.min,
  },
  sm: shadow.sm,
  md: shadow.md,
  lg: shadow.lg,
});