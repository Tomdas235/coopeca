import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

interface ActionCardProps {
  title: string;
  description: string;
  onPress: () => void;
  /** Decorative vector icon; the parent button provides the accessible label. */
  icon?: ReactNode;
  /** Text fallback kept for existing call sites. */
  symbol?: string;
}

export function ActionCard({ title, description, icon, symbol, onPress }: ActionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.symbolBox}
      >
        {icon ?? <Text style={styles.symbol}>{symbol}</Text>}
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Text accessibilityElementsHidden style={styles.chevron}>
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pressed: {
    backgroundColor: colors.accentSoft,
    opacity: 0.9,
  },
  symbolBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  symbol: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '700',
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  chevron: {
    color: colors.muted,
    fontSize: 25,
  },
});
