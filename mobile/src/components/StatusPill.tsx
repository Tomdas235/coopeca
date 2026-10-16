import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export type StatusKind = 'online' | 'offline' | 'pending' | 'error' | 'unknown';

interface StatusPillProps {
  label: string;
  kind: StatusKind;
}

const appearance: Record<StatusKind, { background: string; foreground: string; marker: string }> = {
  online: {
    background: colors.successSoft,
    foreground: colors.success,
    marker: colors.success,
  },
  offline: {
    background: colors.neutralSoft,
    foreground: colors.neutral,
    marker: colors.neutral,
  },
  pending: {
    background: colors.warningSoft,
    foreground: colors.warning,
    marker: colors.warning,
  },
  error: {
    background: colors.dangerSoft,
    foreground: colors.danger,
    marker: colors.danger,
  },
  unknown: {
    background: colors.accentSoft,
    foreground: colors.accent,
    marker: colors.accent,
  },
};

export function StatusPill({ label, kind }: StatusPillProps) {
  const style = appearance[kind];

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="text"
      style={[styles.container, { backgroundColor: style.background }]}
    >
      <View style={[styles.marker, { backgroundColor: style.marker }]} />
      <Text style={[styles.label, { color: style.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 30,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  marker: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
